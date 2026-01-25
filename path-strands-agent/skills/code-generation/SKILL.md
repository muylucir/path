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
| LLM | model | Claude Sonnet 4.5 or Haiku 4.5 |
| Tools | tools | boto3 직접 호출 or MCP 연결 |

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

| Tools 값 | 구현 방법 | 파일 위치 |
|---------|----------|----------|
| **boto3 S3** | boto3 직접 호출 | tools.py |
| **boto3 Bedrock KB** | boto3 직접 호출 | tools.py |
| **Lambda MCP (xxx)** | strands_tools.mcp_server | tools.py |
| **Self-hosted MCP (xxx)** | strands_tools.mcp_server | tools.py |
| **없음** | tools=[] | agent.py |

**규칙** (aws-mcp-servers 스킬 참조):
- S3 읽기/쓰기 → boto3 직접 호출 (Lambda MCP 금지)
- Bedrock KB → boto3 직접 호출 (Gateway 불필요)
- Transcribe, 복잡한 AI/ML → Lambda + MCP
- 외부 API (Slack, Gmail) → MCP Server

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
| **MCP** | strands_tools.mcp_server(url=...) |
| **RAG** | boto3 Bedrock KB 직접 호출 |
| **S3** | boto3 S3 직접 호출 |

**예시**:
```python
# [API] Gmail API
import requests

def send_gmail(to, subject, body):
    url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    # ...

# [MCP] Slack MCP Server
from strands_tools import mcp_server
slack_mcp = mcp_server(url="http://localhost:3000/mcp/slack")

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

### 6. FastAPI 엔드포인트 (/invocations, /ping)

AgentCore Runtime은 HTTP 프로토콜로 `/invocations`, `/ping` 엔드포인트가 필요합니다.

**agent.py에 포함**:
```python
from fastapi import FastAPI

app = FastAPI()

@app.post("/invocations")
async def invoke(request: dict):
    """Agent 호출 엔드포인트"""
    message = request.get("message", "")
    result = graph(message)
    return {"result": str(result)}

@app.get("/ping")
async def ping():
    """헬스체크"""
    return {"status": "healthy"}
```

---

## 파일 구조

생성할 6개 파일:

```
agent-code/
├── agent.py              # Agent 정의 + GraphBuilder + FastAPI
├── tools.py              # MCP/boto3 도구 구현
├── agentcore_config.py   # Runtime/Gateway/Memory 설정
├── requirements.txt      # 의존성
├── Dockerfile            # AgentCore Runtime용
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
