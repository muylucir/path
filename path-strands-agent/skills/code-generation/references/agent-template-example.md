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

## 출력: agent.py

```python
"""
Email Response Agent - Strands Agent SDK Implementation

자동 생성된 코드입니다. PATH 명세서 기반으로 생성되었습니다.
"""

from strands import Agent
from strands.multiagent import GraphBuilder
from tools import bedrock_kb_search

# ===== Agent 정의 =====

classification_agent = Agent(
    name="classification_agent",
    system_prompt="""당신은 이메일 분류 전문가입니다.
받은 이메일을 다음 카테고리로 분류하세요:
- 주문 문의 (order_inquiry)
- 환불 요청 (refund_request)
- 기술 지원 (tech_support)
- 일반 문의 (general)

이메일 내용을 분석하고 가장 적합한 카테고리를 반환하세요.""",
    tools=[]  # LLM 추론만 사용
)

retrieval_agent = Agent(
    name="retrieval_agent",
    system_prompt="""당신은 문서 검색 전문가입니다.
주어진 카테고리에 맞는 관련 문서를 Bedrock Knowledge Base에서 검색하세요.
검색된 문서를 요약하여 답변 작성에 필요한 핵심 정보만 추출하세요.""",
    tools=[bedrock_kb_search]  # Bedrock KB 도구
)

drafting_agent = Agent(
    name="drafting_agent",
    system_prompt="""당신은 고객 서비스 답변 작성 전문가입니다.
검색된 문서를 기반으로 정중하고 명확한 이메일 답변을 작성하세요.

답변 형식:
- 인사말
- 문제 이해 확인
- 해결 방법 설명
- 추가 도움 제안
- 마무리 인사""",
    tools=[]  # LLM 추론만 사용
)

# ===== Graph 구축 =====

builder = GraphBuilder()

# 노드 추가
builder.add_node(classification_agent, "classification")
builder.add_node(retrieval_agent, "retrieval")
builder.add_node(drafting_agent, "drafting")

# 엣지 추가 (순차 실행)
builder.add_edge("classification", "retrieval")
builder.add_edge("retrieval", "drafting")

# 진입점 설정
builder.set_entry_point("classification")

# Graph 생성
graph = builder.build()

# ===== FastAPI 엔드포인트 (AgentCore Runtime용) =====

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class InvocationRequest(BaseModel):
    message: str
    session_id: str = None

@app.post("/invocations")
async def invoke(request: InvocationRequest):
    """
    Agent 호출 엔드포인트

    AgentCore Runtime이 이 엔드포인트를 호출합니다.
    """
    try:
        result = graph(request.message)
        return {
            "result": str(result),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

@app.get("/ping")
async def ping():
    """
    헬스체크 엔드포인트

    AgentCore Runtime이 정기적으로 호출하여 상태 확인합니다.
    """
    return {
        "status": "healthy",
        "agent_count": 3,
        "runtime_mode": "single"
    }

# ===== 로컬 테스트용 메인 함수 =====

if __name__ == "__main__":
    # 로컬 테스트
    test_message = "안녕하세요, 주문한 상품이 아직 도착하지 않았습니다."
    result = graph(test_message)
    print(f"Result: {result}")
```

---

## 주요 변환 규칙

### 1. Agent Components 테이블 → Agent() 객체
- **Agent Name** → `name` 파라미터
- **Role** → `system_prompt`으로 확장 (구체적 지침 추가)
- **LLM** → 모델 지정 (기본: Claude Sonnet 4.5)
- **Tools** → tools 리스트 (boto3, MCP 등)

### 2. Graph 구조 코드 → 그대로 활용
- 명세서의 Python 코드 블록 추출
- GraphBuilder() 코드 그대로 사용
- 조건부 엣지도 함께 포함

### 3. FastAPI 엔드포인트 추가
- `/invocations`: Agent 호출
- `/ping`: 헬스체크
- AgentCore Runtime 호환성

### 4. 코드 구조
```python
# 1. Import
from strands import Agent
from strands.multiagent import GraphBuilder

# 2. Agent 정의
agent1 = Agent(...)
agent2 = Agent(...)

# 3. Graph 구축
builder = GraphBuilder()
builder.add_node(...)
graph = builder.build()

# 4. FastAPI 엔드포인트
app = FastAPI()
@app.post("/invocations")
@app.get("/ping")

# 5. 로컬 테스트 (선택)
if __name__ == "__main__":
    ...
```

---

## Reflection 패턴 예시 (조건부 엣지)

```python
# Reflection 패턴: 품질 검증 및 재생성
review_agent = Agent(
    name="review_agent",
    system_prompt="답변 품질을 0-100점으로 평가하세요. 70점 미만이면 재작성이 필요합니다."
)

builder.add_node(review_agent, "review")
builder.add_edge("drafting", "review")

# 조건부 엣지 함수
def needs_revision(state):
    review_result = state.results.get("review")
    if not review_result:
        return False
    import re
    score_match = re.search(r'(\d+)', str(review_result.result))
    if score_match:
        score = int(score_match.group(1))
        return score < 70
    return False

def is_approved(state):
    return not needs_revision(state)

# Reflection 루프
builder.add_edge("review", "drafting", condition=needs_revision)
builder.add_edge("review", "notification", condition=is_approved)

# 무한 루프 방지
builder.set_max_node_executions(3)
```

---

## 중요 체크리스트

- [ ] 모든 Agent 객체 정의 (Agent Components 테이블 기준)
- [ ] GraphBuilder로 Graph 구조 구현
- [ ] 진입점 설정 (set_entry_point)
- [ ] tools 파라미터 정확히 설정 (boto3 vs MCP)
- [ ] FastAPI 엔드포인트 포함 (/invocations, /ping)
- [ ] Reflection 패턴 시 조건부 엣지 추가
- [ ] 로컬 테스트 코드 포함 (선택)
