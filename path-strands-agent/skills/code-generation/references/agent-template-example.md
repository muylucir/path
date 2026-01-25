# agent.py 템플릿 예시

PATH 명세서 → agent.py 변환 예시입니다.

## 입력: PATH 명세서 (Agent Components 테이블 + Graph 구조)

```markdown
### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|
| classification_agent | 이메일 카테고리 분류 | 이메일 텍스트 | 카테고리 | Claude Sonnet 4.5 | 없음 |
| retrieval_agent | RAG 검색 | 카테고리 | 관련 문서 | Claude Sonnet 4.5 | boto3 Bedrock KB |
| drafting_agent | 답변 작성 | 문서 | 이메일 답변 | Claude Sonnet 4.5 | 없음 |

### Graph 구조
```python
from strands import Agent
from strands.multiagent import GraphBuilder

builder = GraphBuilder()
builder.add_node(classification_agent, "classification")
builder.add_node(retrieval_agent, "retrieval")
builder.add_node(drafting_agent, "drafting")

builder.add_edge("classification", "retrieval")
builder.add_edge("retrieval", "drafting")

builder.set_entry_point("classification")
graph = builder.build()
```
```

---

## 출력: main.py (BedrockAgentCoreApp + Lazy Initialization)

**중요**: AgentCore Runtime은 30초 내에 초기화를 완료해야 합니다.
Agent, Model, Graph 생성을 모듈 레벨에서 하면 타임아웃이 발생합니다.
반드시 **Lazy Initialization 패턴**을 사용하세요!

```python
"""
Email Response Agent - Strands Agent SDK Implementation

자동 생성된 코드입니다. PATH 명세서 기반으로 생성되었습니다.
"""

import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from bedrock_agentcore.runtime import BedrockAgentCoreApp

# ===== 전역 변수 (초기화는 첫 호출 시) =====
_graph = None
_initialized = False

def _initialize():
    """
    Lazy Initialization - 첫 호출 시에만 실행

    AgentCore Runtime 30초 타임아웃을 우회하기 위해
    무거운 초기화를 첫 invoke 호출 시점으로 지연합니다.
    """
    global _graph, _initialized
    if _initialized:
        return _graph

    # ===== 무거운 import는 여기서 =====
    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.multiagent import GraphBuilder
    from tools import bedrock_kb_search

    # ===== LLM 모델 정의 =====
    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )

    # ===== Agent 정의 =====
    classification_agent = Agent(
        name="classification_agent",
        model=model,
        system_prompt="""당신은 이메일 분류 전문가입니다.
받은 이메일을 다음 카테고리로 분류하세요:
- 주문 문의 (order_inquiry)
- 환불 요청 (refund_request)
- 기술 지원 (tech_support)
- 일반 문의 (general)

이메일 내용을 분석하고 가장 적합한 카테고리를 반환하세요.""",
        tools=[]
    )

    retrieval_agent = Agent(
        name="retrieval_agent",
        model=model,
        system_prompt="""당신은 문서 검색 전문가입니다.
주어진 카테고리에 맞는 관련 문서를 Bedrock Knowledge Base에서 검색하세요.
검색된 문서를 요약하여 답변 작성에 필요한 핵심 정보만 추출하세요.""",
        tools=[bedrock_kb_search]
    )

    drafting_agent = Agent(
        name="drafting_agent",
        model=model,
        system_prompt="""당신은 고객 서비스 답변 작성 전문가입니다.
검색된 문서를 기반으로 정중하고 명확한 이메일 답변을 작성하세요.

답변 형식:
- 인사말
- 문제 이해 확인
- 해결 방법 설명
- 추가 도움 제안
- 마무리 인사""",
        tools=[]
    )

    # ===== Graph 구축 =====
    builder = GraphBuilder()

    builder.add_node(classification_agent, "classification")
    builder.add_node(retrieval_agent, "retrieval")
    builder.add_node(drafting_agent, "drafting")

    builder.add_edge("classification", "retrieval")
    builder.add_edge("retrieval", "drafting")

    builder.set_entry_point("classification")

    _graph = builder.build()
    _initialized = True
    return _graph

# ===== BedrockAgentCoreApp (가볍게 유지) =====
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload, context):
    """
    AgentCore 엔트리포인트

    첫 호출 시에만 Agent/Graph 초기화가 실행됩니다.
    이후 호출은 캐시된 Graph를 재사용합니다.
    """
    graph = _initialize()  # Lazy initialization

    message = payload.get("prompt", payload.get("message", ""))
    session_id = context.get("session_id", "default")

    try:
        result = graph(message)
        return {
            "result": str(result.message) if hasattr(result, 'message') else str(result),
            "session_id": session_id,
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "session_id": session_id,
            "status": "error"
        }

# ===== 로컬 테스트 =====
if __name__ == "__main__":
    app.run()
```

---

## 주요 변환 규칙

### 1. Agent Components 테이블 → Agent() 객체
- **Agent Name** → `name` 파라미터
- **Role** → `system_prompt`으로 확장 (구체적 지침 추가)
- **LLM** → 모델 지정 (아래 허용된 모델 ID만 사용!)
- **Tools** → tools 리스트 (boto3, MCP 등)

**⚠️ 허용된 모델 ID (필수!)**:
| 명세서 LLM 값 | model_id |
|--------------|----------|
| Claude Sonnet 4.5 | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| Claude Haiku 4.5 | `global.anthropic.claude-haiku-4-5-20251001-v1:0` |

**❌ 사용 금지**: `us.anthropic.*`, `anthropic.claude-3-*` 등 다른 모델 ID

### 2. Graph 구조 코드 → 그대로 활용
- 명세서의 Python 코드 블록 추출
- GraphBuilder() 코드 그대로 사용
- 조건부 엣지도 함께 포함

### 3. BedrockAgentCoreApp + Lazy Initialization
- `@app.entrypoint`: Agent 호출 데코레이터
- `_initialize()`: 첫 호출 시에만 Agent/Graph 생성
- 30초 타임아웃 우회

### 4. 코드 구조 (Lazy Initialization 패턴)
```python
# 1. 가벼운 Import만
import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# 2. 전역 변수 선언 (초기화 X)
_graph = None
_initialized = False

# 3. Lazy Initialization 함수
def _initialize():
    global _graph, _initialized
    if _initialized:
        return _graph

    # 무거운 import와 초기화는 여기서
    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.multiagent import GraphBuilder

    model = BedrockModel(...)
    agent1 = Agent(...)
    agent2 = Agent(...)

    builder = GraphBuilder()
    builder.add_node(...)
    _graph = builder.build()
    _initialized = True
    return _graph

# 4. BedrockAgentCoreApp
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload, context):
    graph = _initialize()  # 첫 호출 시에만 초기화
    ...

# 5. 로컬 테스트
if __name__ == "__main__":
    app.run()
```

---

## Reflection 패턴 예시 (조건부 엣지)

**주의**: `add_conditional_edge` 메서드는 존재하지 않습니다!
조건부 엣지는 반드시 `add_edge(..., condition=func)` 형태로 사용하세요.

```python
# Reflection 패턴: 품질 검증 및 재생성
review_agent = Agent(
    name="review_agent",
    model=model,
    system_prompt="답변 품질을 0-100점으로 평가하세요. 70점 미만이면 재작성이 필요합니다."
)

builder.add_node(review_agent, "review")
builder.add_edge("drafting", "review")

# 조건부 엣지 함수 (state를 받아 bool 또는 다음 노드 이름 반환)
def check_quality(state):
    # state.results에서 review 결과 확인
    review_result = state.results.get("review")
    if review_result:
        result_text = str(review_result.result).lower()
        # 품질 통과 시 다음 노드로
        if "passed" in result_text or "approved" in result_text:
            return "notification"  # 다음 노드 이름 반환
    # 품질 미달 시 재작성
    return "drafting"  # 다시 drafting으로

# 조건부 엣지 - add_edge에 condition 파라미터 사용
# 주의: add_conditional_edge() 메서드는 없음!
builder.add_edge("review", "drafting", condition=lambda s: check_quality(s) == "drafting")
builder.add_edge("review", "notification", condition=lambda s: check_quality(s) == "notification")

# 무한 루프 방지
builder.set_max_node_executions(3)
```

**올바른 API**:
- `builder.add_edge("from", "to")` - 무조건 연결
- `builder.add_edge("from", "to", condition=func)` - 조건부 연결

**잘못된 API** (존재하지 않음):
- ~~`builder.add_conditional_edge()`~~ - 사용 금지!

---

## 중요 체크리스트

- [ ] **Lazy Initialization 패턴 적용** (30초 타임아웃 우회)
- [ ] `_initialize()` 함수에서 Agent/Model/Graph 생성
- [ ] 모듈 레벨에서는 `BedrockAgentCoreApp()`만 생성
- [ ] 모든 Agent 객체 정의 (Agent Components 테이블 기준)
- [ ] GraphBuilder로 Graph 구조 구현
- [ ] 진입점 설정 (set_entry_point)
- [ ] tools 파라미터 정확히 설정 (boto3 vs MCP)
- [ ] `@app.entrypoint` 데코레이터 사용 (FastAPI 금지!)
- [ ] Reflection 패턴 시 조건부 엣지 추가
- [ ] 로컬 테스트: `app.run()` (uvicorn 금지!)
