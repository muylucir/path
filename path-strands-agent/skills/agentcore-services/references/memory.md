# AgentCore Memory

## 개념
LLM의 본질적 한계인 Statelessness를 해결하는 완전 관리형 메모리 서비스입니다.


**핵심 가치:**
- **Context Rot 방지**: 무작정 긴 Context Window 대신 선별적 기억으로 모델 성능 유지
- **자동 추출**: 방대한 대화에서 핵심 정보만 의미론적으로 추출
- **비용 효율**: 구조화된 메모리로 비용 90% 절감 (vs. 전체 대화 주입)

## 데이터 구조

AgentCore Short-term Memory는 3가지 식별자로 데이터를 구성합니다:

```
memory_id (AWS 리소스 수준)
  └─ actor_id (사용자/Agent 수준)
      └─ session_id (대화 세션 수준)
```

| 식별자 | 설명 | 예시 |
|--------|------|------|
| memory_id | AWS 리소스 ARN, 비용/관리 단위 | `arn:aws:bedrock-agentcore:us-west-2:123456789012:memory/customer-support-bot` |
| actor_id | 개별 사용자/Agent 식별자 | `customer-12345`, `agent-001` |
| session_id | 대화 세션 식별자 | `chat-2025-12-30-140000` |

**보안 특징:**
- **논리적 격리**: `actor_id` 간 물리적 접근 차단
- **암호화**: 모든 데이터 Encryption at Rest
- **자동 생명주기**: `event_expiry_days`로 GDPR 준수

**중요**: STM은 커스텀 Namespace를 지원하지 않습니다. `memory_id/actor_id/session_id` 3계층 구조만 사용합니다.

## STM vs LTM 데이터 격리

| 구분 | 격리 방식 | 커스텀 Namespace |
|------|----------|-----------------|
| **STM** | memory_id/actor_id/session_id 3계층 | ❌ 불가 |
| **LTM** | Namespace 기반 계층 구조 | ✅ 가능 |

**STM 격리 특징**:
- 각 대화 세션(session_id)별로 이벤트 저장
- actor_id 간 논리적 격리
- 커스텀 경로 지정 불가 (예: `/transcript_analysis` 사용 불가)

## Namespace (LTM 전용) - 계층적 메모리 구조

Namespace는 Long-Term Memory 내에서 **파일 시스템처럼 계층적으로 메모리를 구조화**하는 핵심 개념입니다.

### Namespace의 역할

| 역할 | 설명 | 예시 |
|------|------|------|
| **조직 구조** | 메모리 타입별 논리적 분리 | `/preferences`, `/facts`, `/summaries` |
| **접근 제어** | Agent/컨텍스트별 메모리 접근 제한 | Agent A는 `/agent-a/*`만 접근 |
| **멀티 테넌트 격리** | 조직/사용자별 메모리 분리 | `/org-123/user-456/preferences` |
| **집중 검색** | 특정 타입 메모리만 검색 | `/product-knowledge`에서만 검색 |

### Namespace 구조 예시

#### 1. 단일 Agent, 다중 사용자
```python
# 사용자별 선호도 분리
"/retail-agent/customer-123/preferences"
"/retail-agent/customer-456/preferences"

# 공유 지식 (모든 사용자 접근)
"/retail-agent/product-knowledge"
```

#### 2. 다중 Agent, 단일 사용자
```python
# Agent별 메모리 분리
"/support-agent/customer-123/case-summaries"
"/sales-agent/customer-123/purchase-history"
"/recommendation-agent/customer-123/preferences"
```

#### 3. 멀티 테넌트 (조직 + 사용자)
```python
# 조직별 격리
"/org-acme/user-001/preferences"
"/org-acme/user-002/preferences"
"/org-beta/user-001/preferences"  # 완전히 분리됨

# 조직 공유 지식
"/org-acme/shared/policies"
"/org-beta/shared/policies"
```

#### 4. 세션별 요약
```python
# 세션별 대화 요약
"/support-agent/customer-123/case-summaries/session-001"
"/support-agent/customer-123/case-summaries/session-002"
```

### 동적 Namespace 생성

Namespace 정의 시 **플레이스홀더 변수**를 사용하여 동적으로 경로를 생성합니다:

| 변수 | 설명 | 자동 치환 |
|------|------|----------|
| `{actorId}` | 이벤트의 actor_id 사용 | `customer-123` |
| `{sessionId}` | 이벤트의 session_id 사용 | `session-001` |
| `{strategyId}` | 메모리 전략 ID 사용 | `preferences-abc123` |

**예시:**

```python
# 전략 정의 시 플레이스홀더 사용
strategies=[
    {
        "userPreferenceMemoryStrategy": {
            "name": "preferences",
            "namespaces": ["/preferences/{actorId}"]  # 동적 생성
        }
    },
    {
        "summaryMemoryStrategy": {
            "name": "summaries",
            "namespaces": ["/summaries/{actorId}/{sessionId}"]  # 2단계 동적
        }
    }
]

# 이벤트 저장 시 자동 치환
client.create_event(
    memory_id="mem-123",
    actor_id="customer-456",
    session_id="session-789",
    messages=[...]
)
# → Namespace: /preferences/customer-456
# → Namespace: /summaries/customer-456/session-789
```

### Namespace 검색

#### 정확한 경로 검색
```python
# 특정 사용자의 선호도만 검색
memories = client.retrieve_memories(
    memory_id="mem-123",
    namespace="/preferences/customer-456",  # 정확한 경로
    query="좋아하는 음식",
    top_k=5
)
```

#### 프리픽스 매칭 검색
```python
# 특정 사용자의 모든 세션 요약 검색
memories = client.retrieve_memories(
    memory_id="mem-123",
    namespace="/summaries/customer-456",  # 프리픽스 매칭
    query="최근 문의 내역",
    top_k=10
)
# → /summaries/customer-456/session-001
# → /summaries/customer-456/session-002
# → /summaries/customer-456/session-003 모두 검색
```

### 멀티 테넌트 패턴

#### 패턴 1: Agent별 격리
```python
# 각 Agent가 독립적인 메모리 공간 사용
strategies=[
    {
        "semanticMemoryStrategy": {
            "name": "support-facts",
            "namespaces": ["/support-agent/{actorId}/facts"]
        }
    },
    {
        "semanticMemoryStrategy": {
            "name": "sales-facts",
            "namespaces": ["/sales-agent/{actorId}/facts"]
        }
    }
]
```

#### 패턴 2: 공유 지식 + 개인 메모리
```python
strategies=[
    # 모든 사용자가 공유하는 제품 지식
    {
        "semanticMemoryStrategy": {
            "name": "product-knowledge",
            "namespaces": ["/shared/products"]
        }
    },
    # 사용자별 개인 선호도
    {
        "userPreferenceMemoryStrategy": {
            "name": "user-preferences",
            "namespaces": ["/users/{actorId}/preferences"]
        }
    }
]

# 검색 시 두 Namespace 모두 조회
shared_knowledge = client.retrieve_memories(
    memory_id="mem-123",
    namespace="/shared/products",
    query="카메라 추천"
)

user_prefs = client.retrieve_memories(
    memory_id="mem-123",
    namespace=f"/users/{actor_id}/preferences",
    query="선호도"
)
```

#### 패턴 3: 조직 계층 구조
```python
# 조직 → 부서 → 사용자 계층
# 주의: {orgId}, {deptId}는 커스텀 변수이므로 수동 처리 필요
# actorId, sessionId만 자동 치환됨

strategies=[
    {
        "userPreferenceMemoryStrategy": {
            "name": "org-preferences",
            "namespaces": ["/org-acme/dept-sales/user-{actorId}/preferences"]
        }
    }
]
```

### Namespace 베스트 프랙티스

1. **명확한 계층 구조**
   ```
   ✅ /agent-type/user-id/memory-type
   ❌ /random/flat/structure
   ```

2. **일관된 명명 규칙**
   ```
   ✅ /support-agent/customer-123/preferences
   ✅ /support-agent/customer-456/preferences
   ❌ /support/customer-123/prefs
   ```

3. **적절한 깊이**
   ```
   ✅ /org/dept/user/type (4단계)
   ❌ /a/b/c/d/e/f/g/h/i/j (10단계 - 최대 제한)
   ```

4. **검색 효율성**
   ```
   ✅ 좁은 범위: /preferences/{actorId}
   ⚠️ 넓은 범위: /  (전체 검색 - 느림)
   ```
from bedrock_agentcore.memory import MemoryClient

client = MemoryClient(region_name='us-west-2')

## Memory 생성 방식

AgentCore Memory는 생성 시 **메모리 전략 설정 여부**에 따라 동작이 달라집니다:

| 설정 | 생성되는 메모리 | 동작 |
|------|----------------|------|
| `strategies=[]` (빈 배열) | STM만 | 이벤트 저장/조회만 |
| `strategies=[...]` (전략 설정) | STM + LTM | STM에 이벤트 기록 → 추출 → 메모리 전략에 따라 LTM에 저장 |

---

### STM만 사용 (메모리 전략 없음)

```python
# STM만 생성 - 이벤트 저장/조회 용도
memory = client.create_memory_and_wait(
    name="MyAgent_STM_Only",
    strategies=[],  # 빈 배열 = STM만 생성
    event_expiry_days=7  # 7일 후 이벤트 자동 삭제
)
```

**용도**: 대화 기록만 저장하고 조회할 때 (정보 추출 불필요)

---

### STM + LTM 사용 (메모리 전략 설정)

```python
# STM + LTM 생성 - 이벤트 저장 후 자동 추출하여 LTM에 저장
memory = client.create_memory_and_wait(
    name="MyAgent_STM_LTM",
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

**동작 흐름**: STM에 이벤트 기록 → 메모리 전략에 따라 정보 추출 → LTM에 저장

**중요**: LTM은 단독으로 생성/사용 불가능. 반드시 STM을 통해 이벤트가 기록되어야 메모리 전략이 동작합니다.

## 장기 기억 생성 프로세스

### Consolidation Process (기억 통합)

추출된 정보는 무조건 저장되는 것이 아니라 기존 기억과 대조됩니다:

| 결정 | 설명 | 예시 |
|------|------|------|
| **Skip** | 기존 기억과 중복 | "치킨 좋아함" 이미 있으면 건너뜀 |
| **Add** | 완전히 새로운 정보 | "서울에서 일함" 새로 추가 |
| **Update** | 기존 기억 수정 | "치킨 좋아함" → "피자 좋아함"으로 변경 |

이를 통해 에이전트는 **모순 없는 일관된 기억**을 유지합니다.

### LTM 생성 타이밍

| 단계 | 처리 |
|------|------|
| 1. 요청 접수 | `create_event()` API 호출 |
| 2. 검증 | actor_id, session_id 유효성, 메시지 형식, 권한 확인 |
| 3. 이벤트 생성 | 고유 eventId 발급, 타임스탬프 기록 |
| 4. 저장소 기록 | 암호화 저장, 인덱스 업데이트 |
| 5. 완료 및 반환 | eventId 반환 (동기 처리 완료) |
| 6. 비동기 추출 | **5-10초 후** 메모리 전략에 따라 LTM 생성 |

**주의**: STM은 즉시 활용 가능하지만, LTM은 비동기 추출이 완료된 후에 사용 가능합니다.

```python
# 이벤트 저장 직후 - STM만 사용 가능
client.create_event(memory_id=..., messages=...)

# LTM은 비동기 추출 완료 후 사용 가능 (5-10초 소요)
memories = client.retrieve_memories(memory_id=..., namespace="/facts/{actorId}", query="...")
```

## 4가지 메모리 전략 상세 (LTM 전용)

### 1. User Preference Memory Strategy

**용도**: 사용자 선호도, 선택, 스타일을 자동으로 식별하고 추출하여 개인화된 프로필 구축

**처리 단계:**
1. **Extraction**: Short-term Memory에서 유용한 인사이트 식별
2. **Consolidation**: 새 레코드 생성 또는 기존 레코드 업데이트 결정

**출력 형식**: JSON (context, preference, categories)
```json
{
  "context": "사용자가 치킨을 좋아한다고 명시적으로 언급함",
  "preference": "치킨을 좋아함",
  "categories": ["음식"]
}
```

**사용 사례:**
- 고객의 선호 배송사 또는 쇼핑 브랜드
- 개발자의 선호 코딩 스타일 또는 프로그래밍 언어
- 사용자의 커뮤니케이션 선호도 (공식적/비공식적 톤)

**기본 Namespace**: `/strategy/{memoryStrategyId}/actors/{actorId}`

**구현 예시:**
```python
from bedrock_agentcore_starter_toolkit.operations.memory.models.strategies import UserPreferenceStrategy

strategies=[
    UserPreferenceStrategy(
        name="UserPreferenceExtractor",
        namespaces=["/users/{actorId}/preferences"]
    )
]
```

---

### 2. Semantic Memory Strategy

**용도**: 사실 정보와 맥락 지식을 식별하고 추출하여 지속적인 지식 베이스 구축

**처리 단계:**
1. **Extraction**: 대화에서 핵심 사실 정보 추출
2. **Consolidation**: 중복 제거 및 기존 지식 업데이트

**출력 형식**: 텍스트 (사실 진술)
```
"주문 #ABC-123은 특정 지원 티켓과 관련되어 있습니다."
```

**사용 사례:**
- 고객 지원: 주문 번호와 티켓 연결
- 프로젝트 관리: 작업 의존성 및 마일스톤
- 지식 관리: 제품 사양 및 정책

**기본 Namespace**: `/strategy/{memoryStrategyId}/actors/{actorId}`

**구현 예시:**
```python
from bedrock_agentcore_starter_toolkit.operations.memory.models.strategies import SemanticStrategy

strategies=[
    SemanticStrategy(
        name="FactExtractor",
        namespaces=["/support_cases/{sessionId}/facts"]
    )
]
```

---

### 3. Summary Memory Strategy

**용도**: 단일 세션 내 대화의 실시간 요약 생성으로 긴 대화의 맥락 빠르게 파악

**처리 단계:**
1. **Extraction**: 대화 진행 중 주요 토픽과 결정사항 요약
2. **Consolidation**: 세션 내 요약 업데이트

**출력 형식**: XML (topic 기반 구조화)
```xml
<topic name="문제 해결">
사용자가 소프트웨어 v2.1 문제 보고,
재시작 시도,
지식 베이스 문서 링크 제공됨
</topic>
```

**사용 사례:**
- 30분 문제 해결 세션 후 빠른 컨텍스트 복원
- 긴 회의록 요약
- 복잡한 워크플로우 진행 상황 추적

**기본 Namespace**: `/strategy/{memoryStrategyId}/actors/{actorId}/sessions/{sessionId}`

**구현 예시:**
```python
from bedrock_agentcore_starter_toolkit.operations.memory.models.strategies import SummaryStrategy

strategies=[
    SummaryStrategy(
        name="SessionSummarizer",
        namespaces=["/summaries/{actorId}/{sessionId}"]
    )
]
```

---

### 4. Episodic Memory Strategy

**용도**: 구조화된 에피소드로 상호작용을 캡처하여 과거 경험에서 학습하고 패턴 적용

**처리 단계:**
1. **Extraction**: 진행 중인 에피소드 분석 및 완료 여부 판단
2. **Consolidation**: 에피소드 완료 시 단일 에피소드 레코드로 결합
3. **Reflection**: 여러 에피소드에서 인사이트 생성 (백그라운드)

**출력 형식**: XML (situation, intent, assessment, justification, reflection)
```xml
<episode>
  <situation>코드 배포 중 오류 발생</situation>
  <intent>대체 접근법으로 배포 완료</intent>
  <assessment>특정 도구 조합이 성공적</assessment>
  <justification>오류 로그 분석 후 결정</justification>
  <reflection>향후 유사 상황에서 이 패턴 재사용 가능</reflection>
</episode>
```

**Reflection 예시:**
- 특정 작업 유형에서 일관되게 성공하는 도구 조합 식별
- 실패 시도 패턴 및 해결 접근법 인식
- 유사 시나리오의 여러 성공 에피소드에서 베스트 프랙티스 추출

**사용 사례:**
- 코드 배포: 도구 선택, 오류 발생, 대체 접근법으로 해결
- 약속 재조정: 사용자 의도, Agent 결정, 성공적 결과
- 데이터 처리: 특정 데이터 타입에 최적 성능을 낸 파라미터 문서화

**Namespace 패턴:**

Episodes는 다음 중 하나로 저장:
- `/strategy/{memoryStrategyId}` - 전략 레벨 (모든 actor/session)
- `/strategy/{memoryStrategyId}/actor/{actorId}` - Actor 레벨 (모든 session)
- `/strategy/{memoryStrategyId}/actor/{actorId}/session/{sessionId}` - Session 레벨

Reflections는 Episodes보다 덜 중첩 가능:
- Episodes: `/strategy/{memoryStrategyId}/actor/{actorId}`
- Reflections: `/strategy/{memoryStrategyId}` (모든 actor의 인사이트 통합)

**⚠️ 중요**: Reflection이 여러 actor를 포함할 경우 프라이버시 고려 필요

**구현 예시:**
```python
from bedrock_agentcore_starter_toolkit.operations.memory.models.strategies import EpisodicStrategy

strategies=[
    EpisodicStrategy(
        name="EpisodicStrategy",
        namespaces=["strategy/{memoryStrategyId}/actors/{actorId}/sessions/{sessionId}"],
        reflection={
            "namespaces": ["strategy/{memoryStrategyId}/actors/{actorId}/"]  # Actor 레벨 reflection
        }
    )
]
```

**검색 최적화:**
- Episodes는 "intent"로 인덱싱됨
- Reflections는 "use case"로 인덱싱됨
- 새 작업 시작 시 유사 에피소드 및 reflection 쿼리
- 성공한 에피소드는 턴을 선형화하여 Agent에 제공 (주요 단계만 집중)

**주의사항:**
- 에피소드는 완료 감지 후에만 생성됨 (다른 전략보다 시간 소요)
- `CreateEvent` 시 `TOOL` 결과 포함하면 최적 결과

---

## 메모리 전략 선택 가이드

| 요구사항 | 추천 전략 | 이유 |
|---------|----------|------|
| 사용자 맞춤형 경험 | User Preference | 선호도 기반 추천, 톤 적응 |
| 지식 베이스 구축 | Semantic | 사실 정보 누적, 엔티티 관계 |
| 긴 대화 요약 | Summary | 빠른 컨텍스트 복원 |
| 과거 경험 학습 | Episodic | 성공 패턴 재사용, 실패 회피 |
| 복합 요구사항 | 2개 이상 조합 | 최대 5개까지 가능 |

**조합 예시:**
```python
# E-commerce Agent: 선호도 + 사실 + 요약
strategies=[
    UserPreferenceStrategy(name="prefs", namespaces=["/users/{actorId}/preferences"]),
    SemanticStrategy(name="facts", namespaces=["/users/{actorId}/facts"]),
    SummaryStrategy(name="summaries", namespaces=["/summaries/{actorId}/{sessionId}"])
]

# Support Agent: 사실 + 요약 + 에피소드
strategies=[
    SemanticStrategy(name="facts", namespaces=["/cases/{sessionId}/facts"]),
    SummaryStrategy(name="summaries", namespaces=["/summaries/{actorId}/{sessionId}"]),
    EpisodicStrategy(name="episodes", namespaces=["/episodes/{actorId}"])
]
```

### 자동화 기능

`AgentCoreMemorySessionManager`가 자동으로 처리하는 작업:

| 기능 | 설명 |
|------|------|
| **자동 저장/로드** | `create_event()`, `get_last_k_turns()` 자동 호출 |
| **자동 검색 (RAG)** | `retrieve_memories()`로 장기 기억 자동 주입 |
| **생명주기 관리** | 세션 시작/종료 및 리소스 정리 |

**중요**: 장기 기억은 대화 중 활용되지만, 주입된 컨텍스트는 STM에 저장되지 않습니다.

### create_strands_agent() 패턴

```python
from bedrock_agentcore.memory.integrations.strands.config import (
    AgentCoreMemoryConfig,
    RetrievalConfig
)
from bedrock_agentcore.memory.integrations.strands.session_manager import (
    AgentCoreMemorySessionManager
)
from strands import Agent

def create_strands_agent(memory_id, actor_id, session_id):
    """재사용 가능한 Memory 연동 Agent 생성 함수"""
    config = AgentCoreMemoryConfig(
        memory_id=memory_id,
        session_id=session_id,
        actor_id=actor_id,
        retrieval_config={
            "/preferences/{actorId}": RetrievalConfig(top_k=5, relevance_score=0.6),
            "/facts/{actorId}": RetrievalConfig(top_k=10, relevance_score=0.3)
        }
    )

    session_manager = AgentCoreMemorySessionManager(
        agentcore_memory_config=config,
        region_name="us-west-2"
    )

    return Agent(session_manager=session_manager)
```

### 세션 간 기억 유지

```python
memory_id = "test-long-term-memory-..."
actor_id = "chanhosoh"

# 첫 번째 세션 - 사용자 정보 수집
agent = create_strands_agent(memory_id, actor_id, "session-1")
agent("안녕 내 이름은 찬호야")
agent("나는 서울에서 일하는 개발자야")
agent("나는 Python이랑 Rust를 좋아해")

# 동일 세션 내 질문: 단기 기억(STM)으로 즉시 응답
agent("내 직업이 뭐라고 그랬지?")  # → "서울에서 일하는 개발자라고 하셨어요"

# 두 번째 세션 - 새 세션이지만 장기 기억으로 사용자 인식 (LTM 비동기 추출 5-10초 후)
agent = create_strands_agent(memory_id, actor_id, "session-2")
agent("내 이름이 뭐야?")  # → "찬호님이에요!"
agent("나는 무슨 프로그래밍 언어를 좋아해?")  # → "Python과 Rust를 좋아하신다고 하셨어요"
```

**로그 예시:**
```
INFO: bedrock_agentcore.memory.client: Created event: 0000001764903427355#5d6b9f20
INFO: bedrock_agentcore.memory.client: Retrieved memories from namespace: /preferences
INFO: bedrock_agentcore.memory.client: Retrieved memories from namespace: /facts/chanhosoh
```

## Memory Forking (대화 분기)

Memory Forking은 대화의 특정 시점에서 '가지치기(Branching)'를 할 수 있게 해주는 기능입니다.
Git Branch 개념을 대화형 AI에 적용한 것입니다.

### 핵심 API

#### fork_conversation()

분기점(root_event_id)에서 새로운 대화 브랜치를 생성합니다:

```python
# 1. 초기 대화 진행
event1 = memory_client.create_event(
    memory_id=memory['id'],
    actor_id=actor_id,
    session_id=session_id,
    messages=[
        ("오늘 날씨가 어때?", "USER"),
        ("오늘은 맑고 화창합니다.", "ASSISTANT")
    ]
)
root_event_id = event1.get('eventId')  # 분기점이 될 이벤트 ID

# 2. 메인 대화 계속 진행
memory_client.create_event(
    memory_id=memory['id'],
    actor_id=actor_id,
    session_id=session_id,
    messages=[("내일은?", "USER"), ("내일은 비가 옵니다.", "ASSISTANT")]
)

# 3. Memory Forking: 다른 가능성 탐색
forked_event = memory_client.fork_conversation(
    memory_id=memory['id'],
    actor_id=actor_id,
    session_id=session_id,
    root_event_id=root_event_id,       # 1번 이벤트 시점으로 돌아가서
    branch_name="weather-alternative", # 새로운 브랜치 이름 지정
    new_messages=[                     # 새로운 대화 흐름 주입
        ("다음 주는 어떨까?", "USER"),
        ("다음 주는 대체로 흐릴 것으로 예상됩니다.", "ASSISTANT")
    ]
)
```

#### get_conversation_tree()

전체 대화 트리 구조를 조회합니다:

```python
conversation_tree = memory_client.get_conversation_tree(
    memory_id=memory['id'],
    actor_id=actor_id,
    session_id=session_id
)
# 결과: main 브랜치와 weather-alternative 브랜치가 트리 구조로 표시
```

#### list_branches()

생성된 브랜치 목록을 조회합니다:

```python
branches = memory_client.list_branches(
    memory_id=memory['id'],
    actor_id=actor_id,
    session_id=session_id
)
```

### Use Cases

| Use Case | 설명 | 이점 |
|----------|------|------|
| **Undo/Redo** | 잘못된 시점으로 롤백 | 컨텍스트 오염(Context Pollution) 방지 |
| **A/B Testing** | 동일 시점에서 다른 프롬프트 테스트 | Shadow Testing으로 리스크 없이 실험 |
| **Time Travel Debugging** | 오류 발생 시점으로 이동하여 재시도 | What-If 분석 가능 |

### Context Pollution (컨텍스트 오염) 방지

**일반 Undo vs Memory Forking:**

| 방식 | 동작 | 결과 |
|------|------|------|
| 일반 Undo | "이거 취소해줘" → 코드 삭제 | 흔적 남음 (취소 요청/삭제 기록) |
| Memory Forking | 분기점으로 롤백 → 새 브랜치 | 깨끗한 상태에서 재시작 |

**왜 중요한가:**
- 잔여 컨텍스트(Residual Context)는 모델이 이전 실패를 참고하여 비슷한 버그를 반복하게 만들 수 있습니다
- Claude Code 같은 AI 코딩 도구의 "특정 시점으로 롤백" 기능이 핵심인 이유

### Shadow Testing 패턴

```python
# 메인 브랜치: 기존 프롬프트로 사용자에게 응답
# 실험 브랜치: 새 프롬프트로 백그라운드에서 테스트

forked_event = memory_client.fork_conversation(
    memory_id=memory['id'],
    actor_id=actor_id,
    session_id=session_id,
    root_event_id=user_question_event_id,
    branch_name="V2_친근한_말투",
    new_messages=[
        (user_question, "USER"),
        (v2_prompt_response, "ASSISTANT")  # 새 프롬프트 테스트
    ]
)
# 사용자는 변화를 느끼지 못하지만, 개발자는 두 응답 품질 비교 가능
```

## 제약사항

| 구분 | 설명 |
|------|------|
| **STM** | TTL 필수 (1-365일), 동기 처리, 이벤트 저장/조회 |
| **LTM** | STM 이벤트에서 추출 (5-10초 소요, 비동기), 메모리 전략에 따라 추출된 정보 영구 저장 |
| **메모리 전략** | LTM 전용, 최대 5개 조합 가능 |
| 메모리 크기 | 세션당 최대 100MB |
| Namespace 깊이 | 최대 10단계 |

**생성 옵션:**
- `strategies=[]` → STM만 생성
- `strategies=[...]` → STM + LTM 생성 (메모리 전략 적용)
