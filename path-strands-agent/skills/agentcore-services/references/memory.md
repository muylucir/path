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
