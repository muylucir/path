# AgentCore Memory 통합

Strands Agent SDK에서 AgentCore Memory 서비스를 사용하여 대화 기록과 사용자 선호도를 저장하고 검색하는 패턴입니다.

## Memory 개념

AgentCore Memory는 에이전트가 대화 기록, 사용자 선호도, 사실 정보 등을 저장하고 검색할 수 있게 해주는 서비스입니다.

### 5가지 Memory Strategy

| 전략 | API 이름 | 용도 | 예시 |
|------|----------|------|------|
| `SEMANTIC` | `semanticMemoryStrategy` | 사실 정보 및 맥락 지식 추출 | "이전에 논의한 프로젝트 일정" |
| `USER_PREFERENCE` | `userPreferenceMemoryStrategy` | 사용자 선호도, 선택, 스타일 추출 | "사용자의 선호 프로그래밍 언어" |
| `SUMMARY` | `summaryMemoryStrategy` | 세션 내 대화 요약 생성 | "전체 대화 요약" |
| `EPISODIC` | `episodicMemoryStrategy` | 에피소드 단위 상호작용 캡처, 패턴 학습 | "이전 성공 패턴 적용" |
| `CUSTOM` | `customMemoryStrategy` | 커스텀 추출/통합 알고리즘 | 도메인별 맞춤 추출 |

## 기본 설정

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.multiagent.session_manager import AgentCoreMemorySessionManager
from strands.types.memory import AgentCoreMemoryConfig, RetrievalConfig, MemoryStrategy
import os

# Memory 설정
memory_config = AgentCoreMemoryConfig(
    # Memory ID - AgentCore 콘솔에서 생성
    memory_id=os.environ.get("AGENTCORE_MEMORY_ID", "your-memory-id"),

    # 리전 설정
    region_name="us-west-2",

    # 검색 설정
    retrieval_config=RetrievalConfig(
        top_k=10,              # 최대 10개 결과
        relevance_score=0.7    # 70% 이상 관련성
    ),

    # 사용할 전략들
    strategies=[
        MemoryStrategy.SEMANTIC,         # 의미 기반 검색
        MemoryStrategy.USER_PREFERENCE   # 사용자 선호도
    ]
)

# Session Manager 생성
session_manager = AgentCoreMemorySessionManager(
    memory_config=memory_config,
    namespace="/conversations"  # 저장 경로
)

# Agent 생성
model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

agent = Agent(
    model=model,
    session_manager=session_manager,
    system_prompt="You are a helpful assistant with memory capabilities."
)
```

## Namespace 패턴

Namespace는 메모리를 논리적으로 구분하는 경로입니다.

```python
# 대화 기록
namespace="/conversations"
# → /conversations/{session_id}

# 사용자 선호도
namespace="/preferences/{actor_id}"
# → /preferences/user123

# 사실 정보
namespace="/facts/{actor_id}"
# → /facts/user123

# 프로젝트별 기록
namespace="/projects/{project_id}"
# → /projects/proj001
```

### 동적 Namespace 사용

```python
def create_session_manager(user_id: str, context_type: str = "conversations"):
    """사용자별 Session Manager 생성"""
    memory_config = AgentCoreMemoryConfig(
        memory_id=os.environ.get("AGENTCORE_MEMORY_ID"),
        region_name="us-west-2",
        retrieval_config=RetrievalConfig(top_k=10, relevance_score=0.7),
        strategies=[MemoryStrategy.SEMANTIC, MemoryStrategy.USER_PREFERENCE]
    )

    return AgentCoreMemorySessionManager(
        memory_config=memory_config,
        namespace=f"/{context_type}/{user_id}"
    )
```

## 검색 전략 상세

### 1. SEMANTIC (의미 기반 검색)

```python
memory_config = AgentCoreMemoryConfig(
    memory_id=os.environ.get("AGENTCORE_MEMORY_ID"),
    region_name="us-west-2",
    retrieval_config=RetrievalConfig(
        top_k=5,
        relevance_score=0.8  # 높은 관련성 요구
    ),
    strategies=[MemoryStrategy.SEMANTIC]
)

# 사용 예: "이전에 파이썬 프로젝트에 대해 논의했던 내용"
```

### 2. USER_PREFERENCE (사용자 선호도)

```python
memory_config = AgentCoreMemoryConfig(
    memory_id=os.environ.get("AGENTCORE_MEMORY_ID"),
    region_name="us-west-2",
    retrieval_config=RetrievalConfig(
        top_k=10,
        relevance_score=0.6  # 더 넓은 범위
    ),
    strategies=[MemoryStrategy.USER_PREFERENCE]
)

# 사용 예: 사용자가 선호하는 프로그래밍 언어, 응답 스타일 등
```

### 3. SUMMARY (세션 요약)

```python
memory_config = AgentCoreMemoryConfig(
    memory_id=os.environ.get("AGENTCORE_MEMORY_ID"),
    region_name="us-west-2",
    retrieval_config=RetrievalConfig(
        top_k=3,
        relevance_score=0.7
    ),
    strategies=[MemoryStrategy.SUMMARY]
)

# 사용 예: 긴 대화의 핵심 요약, 세션 컨텍스트 빠른 복원
```

### 4. EPISODIC (에피소드 기반)

에피소드 단위로 상호작용을 캡처하고, 여러 에피소드를 분석하여 패턴과 인사이트를 추출합니다.

```python
memory_config = AgentCoreMemoryConfig(
    memory_id=os.environ.get("AGENTCORE_MEMORY_ID"),
    region_name="us-west-2",
    retrieval_config=RetrievalConfig(
        top_k=10,
        relevance_score=0.6
    ),
    strategies=[MemoryStrategy.EPISODIC]
)

# 사용 예:
# - 이전에 성공한 문제 해결 패턴 적용
# - 반복적인 사용자 행동 패턴 학습
# - 유사한 과거 상호작용에서 인사이트 추출
```

### 5. CUSTOM (커스텀 전략)

커스텀 전략을 사용하면 도메인 특화 추출 로직을 정의할 수 있습니다.

```python
# AWS SDK를 통해 커스텀 전략 정의 (Memory 생성 시)
# 참고: Strands SDK에서는 MemoryStrategy enum에 CUSTOM이 없을 수 있음
# 커스텀 전략은 주로 AWS Console 또는 boto3로 Memory 생성 시 설정

# boto3 예시:
import boto3

client = boto3.client('bedrock-agentcore-control', region_name='us-west-2')
response = client.create_memory(
    name="custom-memory",
    strategies=[{
        "customMemoryStrategy": {
            "name": "domain-specific",
            "extractionPrompt": "Extract domain-specific information...",
            "consolidationPrompt": "Consolidate domain-specific records...",
            "modelId": "global.anthropic.claude-sonnet-4-5-20250929-v1:0"
        }
    }]
)
```

### 복합 전략 사용

```python
# 여러 전략 조합 (권장)
memory_config = AgentCoreMemoryConfig(
    memory_id=os.environ.get("AGENTCORE_MEMORY_ID"),
    region_name="us-west-2",
    retrieval_config=RetrievalConfig(
        top_k=10,
        relevance_score=0.7
    ),
    strategies=[
        MemoryStrategy.SEMANTIC,         # 사실 정보
        MemoryStrategy.USER_PREFERENCE,  # 사용자 선호도
        MemoryStrategy.SUMMARY,          # 세션 요약
        MemoryStrategy.EPISODIC          # 에피소드 패턴
    ]
)
```

## Session 관리

```python
# Session ID로 대화 기록 관리
session_id = "user123-session-001"

# Agent 호출 시 session_id 전달
result = agent(
    "What did we discuss yesterday?",
    session_id=session_id
)

# 새 세션 시작
new_session_id = f"user123-session-{datetime.now().strftime('%Y%m%d%H%M%S')}"
result = agent("Let's start a new project", session_id=new_session_id)
```

## AgentCore 배포용 전체 예시

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
import os

_agent = None
_initialized = False

def _initialize():
    global _agent, _initialized
    if _initialized:
        return _agent

    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.multiagent.session_manager import AgentCoreMemorySessionManager
    from strands.types.memory import AgentCoreMemoryConfig, RetrievalConfig, MemoryStrategy

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )

    # Memory 설정
    memory_id = os.environ.get("AGENTCORE_MEMORY_ID")
    if memory_id:
        memory_config = AgentCoreMemoryConfig(
            memory_id=memory_id,
            region_name="us-west-2",
            retrieval_config=RetrievalConfig(
                top_k=10,
                relevance_score=0.7
            ),
            strategies=[
                MemoryStrategy.SEMANTIC,
                MemoryStrategy.USER_PREFERENCE
            ]
        )

        session_manager = AgentCoreMemorySessionManager(
            memory_config=memory_config,
            namespace="/conversations"
        )

        _agent = Agent(
            model=model,
            session_manager=session_manager,
            system_prompt="""You are a helpful assistant with memory.
            You can recall previous conversations and user preferences."""
        )
    else:
        # Memory 미설정 시 기본 Agent
        _agent = Agent(
            model=model,
            system_prompt="You are a helpful assistant."
        )

    _initialized = True
    return _agent

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent = _initialize()

    message = payload.get("prompt", "Hello!")
    session_id = payload.get("session_id", "default")

    # session_id로 대화 연속성 유지
    result = agent(message, session_id=session_id)

    return {
        "response": str(result),
        "session_id": session_id
    }
```

## 환경 변수 설정

```bash
# Memory ID (AgentCore 콘솔에서 생성)
export AGENTCORE_MEMORY_ID="mem-abc123def456"

# AWS 리전
export AWS_DEFAULT_REGION="us-west-2"
```

## Memory 생성 (CLI)

```bash
# Memory 리소스 생성
agentcore memory create --name "my-agent-memory"

# Memory ID 확인
agentcore memory list

# Memory 삭제
agentcore memory delete --memory-id "mem-abc123"
```

## 주의사항

1. **Memory ID 필수**: AgentCore 콘솔 또는 CLI로 미리 생성 필요
2. **Namespace 설계**: 데이터 구조를 미리 설계하여 효율적인 검색
3. **전략 선택**: 용도에 맞는 전략 조합 선택
4. **Session ID 관리**: 대화 연속성을 위해 일관된 session_id 사용
5. **검색 파라미터 튜닝**: `top_k`와 `relevance_score`를 용도에 맞게 조정
