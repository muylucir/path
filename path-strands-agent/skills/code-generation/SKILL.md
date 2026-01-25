---
name: code-generation
description: PATH 명세서를 Strands Agent SDK 코드로 변환하는 가이드. Agent Components → Agent 정의, Graph 구조 → GraphBuilder, AgentCore 구성 → 설정 파일 생성.
license: Apache-2.0
metadata:
  version: "1.0"
  author: path-team
---

# Code Generation Guide

PATH 명세서를 Strands Agent SDK 코드로 직접 변환하는 가이드입니다.

## 변환 규칙

### 1. Agent Components 테이블 → Agent() 정의

PATH 명세서의 "Agent Components" 테이블을 Agent 객체로 변환합니다.

| 테이블 컬럼 | Agent 파라미터 | 변환 규칙 |
|-----------|---------------|----------|
| Agent Name | name | 그대로 사용 |
| Role | system_prompt | Role을 상세한 system_prompt로 확장 |
| LLM | model | 아래 허용된 모델만 사용 |
| Tools | tools | boto3 직접 호출 or MCP 연결 |

**⚠️ 허용된 LLM 모델 ID (필수!)**:
| 명세서 LLM 값 | model_id | 용도 |
|--------------|----------|------|
| Claude Sonnet 4.5 | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | 주요 에이전트 (권장) |
| Claude Haiku 4.5 | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | 빠른 응답, 간단한 작업 |

**❌ 사용 금지 모델 ID**:
- `us.anthropic.*` - 지역 제한 모델
- `anthropic.claude-3-*` - 구버전 모델
- `claude-sonnet-4-20250514` 등 다른 버전

**예시**:
```
테이블:
| Agent Name | Role | LLM | Tools |
| classification_agent | 이메일 분류 | Claude Sonnet 4.5 | 없음 |

변환 →

classification_agent = Agent(
    name="classification_agent",
    system_prompt="받은 이메일을 카테고리별로 분류합니다. 주문 문의, 환불 요청, 기술 지원 등으로 분류하세요.",
    tools=[]
)
```

상세: `agent-template-example.md`

---

### 2. Graph 구조 → GraphBuilder

PATH 명세서의 "Graph 구조" Python 코드를 활용합니다.

**명세서에 이미 GraphBuilder 코드가 포함**되어 있으므로:
- 해당 코드 블록을 그대로 추출
- 조건부 엣지 함수도 함께 추출
- 진입점 설정 확인 (set_entry_point)

**예시**:
```python
builder = GraphBuilder()
builder.add_node(classification_agent, "classification")
builder.add_node(retrieval_agent, "retrieval")
builder.add_edge("classification", "retrieval")
builder.set_entry_point("classification")

graph = builder.build()
```

상세: `agent-template-example.md`

---

### 3. Tools 컬럼 → tools.py 구현

Agent Components 테이블의 "Tools" 컬럼에 따라 도구 구현 방식 결정:

| Tools 값 | 구현 방법 | AgentCore 지원 |
|---------|----------|--------------|
| **boto3 S3** | boto3 직접 호출 | ✅ |
| **boto3 Bedrock KB** | boto3 직접 호출 | ✅ |
| **Gateway Target** | streamablehttp_client | ✅ |
| **Standalone MCP (배포됨)** | streamablehttp_client | ✅ |
| **stdio MCP (npx/uvx)** | ⚠️ AgentCore 미지원 | ❌ |
| **없음** | tools=[] | ✅ |

**규칙** (agentcore-services 스킬 참조):
- S3, DynamoDB, Bedrock KB → boto3 직접 호출
- Transcribe, 복잡한 AI/ML → Gateway Target (Lambda)
- 외부 API (Slack, Gmail) → Gateway Target (API) 또는 Standalone MCP
- stdio MCP (uvx, npx 기반) → AgentCore Runtime에서 실행 불가

상세: `tools-template-example.md`

---

### 4. AgentCore 구성 테이블 → agentcore_config.py

PATH 명세서의 "Amazon Bedrock AgentCore" 섹션의 테이블을 Python dict로 변환합니다.

| 서비스 | 사용 여부 | → Python 설정 |
|--------|-----------|---------------|
| **Runtime** | ✅ | runtime.enabled = True, agent_count 설정 |
| **Memory** | ✅/❌ | memory.enabled, type (STM/LTM), namespace |
| **Gateway** | ✅/❌ | gateway.enabled, targets 목록 |
| **Identity** | ✅/❌ | identity.enabled, oauth2_providers |

**중요 원칙**:
- **1개 Runtime으로 전체 Multi-Agent Graph 호스팅** (Agent별 Runtime 분리 금지)
- Runtime.agent_count = Agent Components 테이블의 Agent 개수
- Memory Namespace 전략: 테이블의 "설정" 컬럼 참조

상세: `agentcore-config-example.md`

---

### 5. Integration Details → tools.py 통합

등록된 Integration 정보를 tools.py에 반영합니다.

| Integration 타입 | tools.py 구현 |
|-----------------|--------------|
| **API** | requests 라이브러리 사용 |
| **MCP** | strands.tools.mcp.MCPClient |
| **RAG** | boto3 Bedrock KB 직접 호출 |
| **S3** | boto3 S3 직접 호출 |

**예시**:
```python
# [API] Gmail API
import requests

def send_gmail(to, subject, body):
    url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    # ...

# [MCP] Slack MCP Server (stdio transport)
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters

slack_mcp_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(
        command="npx",
        args=["-y", "@anthropic/slack-mcp-server"]
    )
))
# main.py에서 with slack_mcp_client: 컨텍스트 내에서 사용

# [RAG] Bedrock Knowledge Base
import boto3
kb_client = boto3.client('bedrock-agent-runtime')

def search_kb(query):
    response = kb_client.retrieve(
        knowledgeBaseId='KB_ID',
        retrievalQuery={'text': query}
    )
    return response
```

상세: `tools-template-example.md`

---

### 6. BedrockAgentCoreApp + Lazy Initialization (필수!)

**중요**: AgentCore Runtime은 30초 내에 초기화를 완료해야 합니다.
Agent, Model, Graph 생성은 시간이 오래 걸리므로 모듈 레벨에서 하면 타임아웃됩니다.
반드시 **Lazy Initialization 패턴**을 사용하세요!

**main.py 패턴**:
```python
import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from bedrock_agentcore.runtime import BedrockAgentCoreApp

# 전역 변수 선언만 (초기화 X)
_graph = None
_initialized = False

def _initialize():
    """첫 호출 시에만 실행 - 30초 타임아웃 우회"""
    global _graph, _initialized
    if _initialized:
        return _graph

    # 무거운 import와 초기화는 여기서
    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.multiagent import GraphBuilder

    model = BedrockModel(...)
    agent1 = Agent(...)
    builder = GraphBuilder()
    ...
    _graph = builder.build()
    _initialized = True
    return _graph

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload, context):
    graph = _initialize()  # 첫 호출 시에만 초기화
    message = payload.get("prompt", "")
    result = graph(message)
    return {"result": str(result)}

if __name__ == "__main__":
    app.run()
```

**주의**: FastAPI 사용 금지! BedrockAgentCoreApp만 사용하세요.

---

## 파일 구조

생성할 6개 파일:

```
agent-code/
├── main.py               # BedrockAgentCoreApp + Lazy Initialization
├── tools.py              # MCP/boto3 도구 구현
├── agentcore_config.py   # Runtime/Gateway/Memory 설정
├── requirements.txt      # 의존성 (bedrock-agentcore 포함!)
├── agentcore.yaml        # AgentCore CLI 배포 설정
└── deploy_guide.md       # 배포 가이드
```

---

## 출력 형식

반드시 `### 파일명` 구분자로 시작:

```
### agent.py
(코드)

### tools.py
(코드)

### agentcore_config.py
(코드)

### requirements.txt
(의존성)

### Dockerfile
(Dockerfile)

### deploy_guide.md
(배포 가이드)
```

---

## 참고 스킬

- `strands-agent-patterns`: Graph, Reflection, Planning 패턴
- `agentcore-services`: Runtime, Gateway, Memory, Identity
- `aws-mcp-servers`: boto3 vs Lambda MCP 결정 규칙
