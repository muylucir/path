# AgentCore Memory

## 개념
LLM의 본질적 한계인 Statelessness를 해결하는 완전 관리형 메모리 서비스입니다.

**핵심 가치:**
- **Context Rot 방지**: 무작정 긴 Context Window 대신 선별적 기억으로 모델 성능 유지
- **자동 추출**: 방대한 대화에서 핵심 정보만 의미론적으로 추출
- **3계층 격리**: Memory → Actor → Session 구조로 데이터 보안 보장
- **비용 효율**: 구조화된 메모리로 비용 90% 절감 (vs. 전체 대화 주입)

## 3계층 데이터 격리 구조

```
memory_id (AWS 리소스 수준)
  └─ actor_id (사용자 수준)
      └─ session_id (대화 세션 수준)
```

| 계층 | 설명 | 예시 |
|------|------|------|
| memory_id | AWS 리소스 ARN, 비용/관리 단위 | `arn:aws:bedrock-agentcore:us-west-2:123456789012:memory/customer-support-bot` |
| actor_id | 개별 사용자 식별자 | `customer-12345`, `user@example.com` |
| session_id | 대화 세션 식별자 | `chat-2025-12-30-140000` |

## 메모리 타입

### Short-Term Memory (STM) - 원본 대화 저장

```python
from bedrock_agentcore.memory import MemoryClient

client = MemoryClient(region_name='us-west-2')

# STM 생성 (strategies 빈 배열)
stm = client.create_memory_and_wait(
    name="MyAgent_STM",
    strategies=[],  # 빈 배열 = STM만 활성화
    event_expiry_days=7  # 7일 후 자동 삭제
)
```

### Long-Term Memory (LTM) - 자동 정보 추출

```python
# LTM 생성 (4가지 전략 조합)
ltm = client.create_memory_and_wait(
    name="MyAgent_LTM",
    strategies=[
        # 1. Semantic Memory - 사실 정보 추출
        {
            "semanticMemoryStrategy": {
                "name": "facts",
                "namespaces": ["/facts/{actorId}"]
            }
        },
        # 2. User Preference Memory - 선호도 추출
        {
            "userPreferenceMemoryStrategy": {
                "name": "preferences",
                "namespaces": ["/preferences/{actorId}"]
            }
        },
        # 3. Summary Memory - 대화 요약
        {
            "summaryMemoryStrategy": {
                "name": "summaries",
                "namespaces": ["/summaries/{actorId}/{sessionId}"]
            }
        },
        # 4. Episodic Memory - 구조화된 에피소드 학습
        {
            "episodicMemoryStrategy": {
                "name": "episodes",
                "namespaces": ["/episodes/{actorId}"]
            }
        }
    ],
    event_expiry_days=30
)
```

## 4가지 메모리 전략

| 전략 | 추출 내용 | 예시 |
|------|----------|------|
| **Semantic Memory** | 사실(Fact)과 지식 | "사용자는 치킨을 주문했습니다." |
| **User Preference Memory** | 명시적/암묵적 선호도 | `{"preference":"치킨을 좋아함"}` |
| **Summary Memory** | 대화 세션 요약 | `<topic name="식사 선택">...</topic>` |
| **Episodic Memory** | 구조화된 에피소드 | 맥락, 추론, 행동, 결과 |

## Strands Agents 자동 통합

```python
from bedrock_agentcore.memory.integrations.strands.config import (
    AgentCoreMemoryConfig,
    RetrievalConfig
)
from bedrock_agentcore.memory.integrations.strands.session_manager import (
    AgentCoreMemorySessionManager
)
from strands import Agent

# 1. 메모리 설정
config = AgentCoreMemoryConfig(
    memory_id="my-memory-id",
    session_id="session-1",
    actor_id="chanhosoh",
    retrieval_config={
        "/preferences/{actorId}": RetrievalConfig(top_k=5, relevance_score=0.6),
        "/facts/{actorId}": RetrievalConfig(top_k=10, relevance_score=0.3)
    }
)

# 2. 세션 매니저 생성
session_manager = AgentCoreMemorySessionManager(
    agentcore_memory_config=config,
    region_name="us-west-2"
)

# 3. Agent에 주입
agent = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    session_manager=session_manager
)
```

## 제약사항
- **STM**: TTL 필수 (1-365일), 동기 처리
- **LTM**: 추출 5-10초 소요 (비동기), 추출된 정보는 영구 저장
- 메모리 크기: 세션당 최대 100MB
- 추출 전략: 최대 5개
- Namespace 깊이: 최대 10단계
