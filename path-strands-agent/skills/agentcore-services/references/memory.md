# AgentCore Memory

## 개념
LLM의 본질적 한계인 Statelessness를 해결하는 완전 관리형 메모리 서비스입니다.

**핵심 가치:**
- **Context Rot 방지**: 무작정 긴 Context Window 대신 선별적 기억으로 모델 성능 유지
- **자동 추출**: 방대한 대화에서 핵심 정보만 의미론적으로 추출
- **Namespace 기반 격리**: 계층적 구조로 멀티 테넌트 환경 지원
- **비용 효율**: 구조화된 메모리로 비용 90% 절감 (vs. 전체 대화 주입)

## 데이터 구조

AgentCore Memory는 3가지 식별자로 데이터를 구성합니다:

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

## Namespace - 계층적 메모리 구조

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

## 4가지 메모리 전략 상세

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
