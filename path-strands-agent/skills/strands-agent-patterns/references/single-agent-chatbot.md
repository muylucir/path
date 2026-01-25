# Single Agent Chatbot Pattern

가장 기본적인 Agent 패턴입니다. 복잡한 Graph 없이 단일 Agent로 대화를 처리하며, 도구 연동으로 기능을 확장할 수 있습니다.

## 개념

- **단일 Agent**: 하나의 Agent가 모든 대화를 처리
- **System Prompt 중심**: 역할, 톤, 제약사항을 프롬프트로 정의
- **도구 연동 (선택)**: MCP, API, RAG 등으로 기능 확장
- **Multi-turn 지원**: 대화 히스토리 자동 관리

## Use Cases

| 유형 | 예시 |
|------|------|
| FAQ 챗봇 | 회사 FAQ, 제품 안내 |
| 고객 지원 | 문의 응대, 문제 해결 |
| 도메인 전문가 | 법률, 의료, 기술 상담 |
| 작업 보조 | 일정 관리, 메모, 검색 |
| 정보 검색 | RAG 기반 문서 검색 |

## 기본 구현

```python
from strands import Agent
from strands.models.bedrock import BedrockModel

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

chatbot = Agent(
    name="chatbot",
    model=model,
    system_prompt="""당신은 고객 지원 전문가입니다.

주요 임무:
- 고객 질문에 친절하게 답변
- 제품 정보 안내
- 문제 해결 지원

응답 규칙:
- 간결하고 명확하게 답변
- 존댓말 사용
- 모르는 내용은 "확인 후 답변드리겠습니다" 응답
""",
    tools=[]  # 필요시 도구 추가
)

# 단일 응답
response = chatbot("환불 정책이 어떻게 되나요?")
print(response)
```

## 스트리밍 응답

```python
# 동기 스트리밍
for event in chatbot.stream("사용자 질문"):
    print(event, end="", flush=True)

# 비동기 스트리밍
async for event in chatbot.stream_async("사용자 질문"):
    print(event, end="", flush=True)
```

## 도구 연동

### MCP 도구 연동
```python
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

mcp_client = MCPClient(lambda: streamablehttp_client(url="https://mcp-server.example.com"))
with mcp_client:
    tools = mcp_client.list_tools_sync()
    chatbot = Agent(
        name="tool_chatbot",
        model=model,
        system_prompt="...",
        tools=tools
    )
    response = chatbot("날씨 정보 알려줘")
```

### 커스텀 도구 연동
```python
from strands import tool

@tool
def search_documents(query: str) -> str:
    """문서를 검색합니다."""
    # RAG 검색 로직
    return f"검색 결과: {query}"

chatbot = Agent(
    name="rag_chatbot",
    model=model,
    system_prompt="문서 검색 도구를 활용하여 답변하세요.",
    tools=[search_documents]
)
```

## AgentCore 배포 패턴

```python
import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from bedrock_agentcore.runtime import BedrockAgentCoreApp

_agent = None
_initialized = False

def _initialize():
    global _agent, _initialized
    if _initialized:
        return _agent

    from strands import Agent
    from strands.models.bedrock import BedrockModel

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2",
        streaming=True
    )

    _agent = Agent(
        name="chatbot",
        model=model,
        system_prompt="""당신은 고객 지원 전문가입니다.
친절하고 정확하게 답변합니다.""",
        tools=[]
    )
    _initialized = True
    return _agent

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent = _initialize()
    prompt = payload.get("prompt", "")

    # 스트리밍 응답
    for event in agent.stream(prompt):
        yield {"chunk": str(event)}

    yield {"status": "complete"}

if __name__ == "__main__":
    app.run()
```

## System Prompt 템플릿

### FAQ 봇
```
당신은 [회사명] FAQ 챗봇입니다.
고객 질문에 친절하고 정확하게 답변합니다.

응답 규칙:
- 간결하고 명확하게 답변
- 모르는 내용은 "확인 후 답변드리겠습니다" 응답
- 민감한 정보 요청 시 거절
```

### 도메인 전문가
```
당신은 [분야] 전문가입니다.
사용자의 질문에 전문적으로 답변합니다.

전문 분야:
- [분야 1]
- [분야 2]

응답 스타일:
- 기술적 정확성 우선
- 필요시 예시 포함
- 복잡한 개념은 단계별 설명
```

### 작업 보조
```
당신은 개인 비서입니다.
사용자의 작업을 효율적으로 도와줍니다.

주요 기능:
- 일정 관리
- 메모 작성
- 정보 검색

규칙:
- 작업 완료 후 확인 메시지
- 중요 정보는 강조 표시
```

## 패턴 선택 가이드

| 요구사항 | 선택 |
|---------|------|
| 단순 Q&A | Single Agent (tools=[]) |
| 외부 데이터 필요 | Single Agent + RAG/MCP |
| 품질 검증 필요 | Reflection Pattern 사용 |
| 복잡한 워크플로우 | Graph Pattern 사용 |
| 여러 전문가 협업 | Multi-Agent Pattern 사용 |

## Multi-turn 대화

Strands Agent는 자동으로 대화 히스토리를 관리합니다:

```python
# 연속 대화
response1 = chatbot("안녕하세요")
response2 = chatbot("방금 인사한 내용 기억나세요?")  # 이전 대화 참조 가능

# 새 세션 시작
chatbot.messages.clear()  # 히스토리 초기화
```

## Best Practices

1. **명확한 System Prompt**: 역할, 제약사항, 응답 형식 명시
2. **도구 최소화**: 필요한 도구만 연동 (불필요한 도구는 혼란 유발)
3. **스트리밍 활용**: 긴 응답은 스트리밍으로 UX 개선
4. **에러 처리**: 도구 실패 시 fallback 응답 준비
5. **히스토리 관리**: 긴 대화는 주기적으로 요약 또는 초기화
