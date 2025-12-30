---
name: agentcore-services
description: Amazon Bedrock AgentCore 서비스 가이드 - Runtime, Memory, Gateway, Browser, Code Interpreter, Identity 서비스의 사용법과 제약사항. AgentCore 기반 명세서 작성 시 정확한 정보 제공.
---

# Amazon Bedrock AgentCore Services Guide

AgentCore는 AI Agent 개발, 배포, 관리를 가속화하는 관리형 서비스 모음입니다.

**중요: 테이블에 HTML 태그 금지.**

## Multi-Agent 배포 모범 사례

### ⚠️ 중요: 1개의 Runtime으로 Multi-Agent 호스팅

**모범 사례**: Strands로 만든 Multi-Agent 시스템은 **Agent별로 Runtime을 분리하지 않고**, **1개의 Runtime에서 전체 Multi-Agent Graph를 호스팅**하는 것이 권장됩니다.

#### 왜 1개의 Runtime을 사용해야 하는가?

| 측면 | 1개 Runtime (권장) | Agent별 Runtime (비권장) |
|------|-------------------|------------------------|
| **비용** | 1개 Runtime 요금만 발생 | Agent 개수만큼 Runtime 요금 발생 (N배) |
| **레이턴시** | Agent 간 메모리 내 통신 (밀리초) | HTTP 호출 오버헤드 (수백 밀리초) |
| **관리** | 단일 배포, 단일 버전 관리 | 여러 배포, 버전 동기화 필요 |
| **상태 공유** | Invocation State로 즉시 공유 | 외부 저장소 필요 (Memory, DynamoDB 등) |
| **트랜잭션** | Graph 전체가 하나의 실행 단위 | Agent 간 실패 처리 복잡 |

#### 올바른 구현 예제

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.multiagent import GraphBuilder

app = BedrockAgentCoreApp()

# Multi-Agent Graph 구성 (Runtime 외부에서 1회 생성)
github_collector = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    name="github_collector",
    system_prompt="Collect GitHub data...",
    tools=[mcp_github]
)

resume_parser = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    name="resume_parser",
    system_prompt="Parse resume PDF...",
    tools=[pdf_tool]
)

analyzer = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    name="analyzer",
    system_prompt="Analyze all collected data..."
)

# Graph 빌드
builder = GraphBuilder()
builder.add_node(github_collector, "github")
builder.add_node(resume_parser, "resume")
builder.add_node(analyzer, "analyzer")

builder.add_edge("github", "analyzer")
builder.add_edge("resume", "analyzer")

builder.set_entry_point("github")
multi_agent_graph = builder.build()

# 1개의 Runtime Entrypoint로 전체 Graph 실행
@app.entrypoint
def invoke(payload, context):
    """
    전체 Multi-Agent Graph를 1개의 Runtime에서 실행
    """
    user_input = payload.get("prompt", "")
    session_id = context.session_id

    # Invocation State로 공유 컨텍스트 전달
    invocation_state = {
        "session_id": session_id,
        "user_id": payload.get("user_id"),
        "config": payload.get("config", {})
    }

    # Graph 실행 (모든 Agent가 메모리 내에서 협업)
    result = multi_agent_graph(user_input, invocation_state=invocation_state)

    # 최종 결과 반환
    return result.results["analyzer"].message['content'][0]['text']

if __name__ == "__main__":
    app.run()
```

#### ❌ 안티패턴: Agent별 Runtime 분리

```python
# ❌ 비효율적 - Agent마다 별도 Runtime 배포
# runtime1.py - GitHub Collector만 배포
app1 = BedrockAgentCoreApp()
@app1.entrypoint
def invoke(payload, context):
    result = github_collector(payload["prompt"])
    return result

# runtime2.py - Resume Parser만 배포
app2 = BedrockAgentCoreApp()
@app2.entrypoint
def invoke(payload, context):
    result = resume_parser(payload["prompt"])
    return result

# runtime3.py - Analyzer가 다른 Agent를 HTTP로 호출
app3 = BedrockAgentCoreApp()
@app3.entrypoint
def invoke(payload, context):
    # ❌ HTTP 호출로 레이턴시 증가, 비용 N배
    github_result = agentcore_client.invoke("runtime1", ...)
    resume_result = agentcore_client.invoke("runtime2", ...)
    # ...
```

**문제점:**
- 3개 Runtime 요금 (비용 3배)
- HTTP 호출 오버헤드 (레이턴시 증가)
- 3번의 개별 배포 필요
- Agent 간 실패 처리 복잡
- 버전 동기화 어려움

#### Agent별 Runtime 분리가 필요한 경우

다음과 같은 **예외적인 상황**에서만 Agent별 Runtime 분리를 고려하세요:

1. **독립적인 서비스**: Agent가 완전히 다른 도메인/팀/서비스
2. **스케일링 요구사항**: 특정 Agent만 극도로 높은 트래픽
3. **격리 필요**: 보안/규정상 Agent 간 격리 필수
4. **기술 스택 차이**: Agent마다 Python 버전, 의존성이 완전히 다름

대부분의 경우 **1개 Runtime으로 충분**합니다.

#### 배포 예시

```bash
# Graph 전체를 1개 Runtime으로 배포
agentcore configure -e multi_agent_app.py
agentcore deploy

# 호출 (전체 Graph 실행)
agentcore invoke '{"prompt": "Analyze candidate profile", "user_id": "123"}'
```

## 1. AgentCore Runtime (필수)

### 개념
- **서버리스 Agent 호스팅**: 인프라 관리 없이 Agent 배포
- **자동 스케일링**: 트래픽에 따라 자동 확장
- **세션 관리**: 세션 ID 기반 격리
- **보안 환경**: IAM 기반 권한 관리

### 사용 방법
```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent

# Runtime 앱 초기화
app = BedrockAgentCoreApp()

# Strands Agent 생성
agent = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    system_prompt="You're a helpful assistant."
)

# Entrypoint 정의
@app.entrypoint
def invoke(payload, context):
    """
    payload: 사용자 입력 {"prompt": "..."}
    context: Runtime 컨텍스트 (session_id 등)
    """
    response = agent(payload.get("prompt", "Hello"))
    return response.message['content'][0]['text']

if __name__ == "__main__":
    app.run()  # 로컬 테스트
```

### 배포
```bash
# Agent 설정
agentcore configure -e agent.py

# 배포
agentcore deploy

# 호출
agentcore invoke '{"prompt": "Hello"}'
agentcore invoke '{"prompt": "Hello"}' --session-id "session-123"
```

### 제약사항
- Python 3.11 이상 필요
- 컨테이너 이미지 크기 제한: 10GB
- 실행 타임아웃: 최대 15분
- 동시 실행 제한: 계정당 1000개

## 2. AgentCore Memory

### 개념
LLM의 본질적 한계인 Statelessness를 해결하는 완전 관리형 메모리 서비스입니다.

**핵심 가치:**
- **Context Rot 방지**: 무작정 긴 Context Window 대신 선별적 기억으로 모델 성능 유지
- **자동 추출**: 방대한 대화에서 핵심 정보만 의미론적으로 추출
- **3계층 격리**: Memory → Actor → Session 구조로 데이터 보안 보장
- **비용 효율**: 구조화된 메모리로 비용 90% 절감 (vs. 전체 대화 주입)

### 3계층 데이터 격리 구조

AgentCore Memory는 엔터프라이즈급 보안을 위해 3단계 계층 구조를 사용합니다.

```
memory_id (AWS 리소스 수준)
  └─ actor_id (사용자 수준)
      └─ session_id (대화 세션 수준)
```

**각 계층의 역할:**

| 계층 | 설명 | 예시 |
|------|------|------|
| memory_id | AWS 리소스 ARN, 비용/관리 단위 | `arn:aws:bedrock-agentcore:us-west-2:123456789012:memory/customer-support-bot` |
| actor_id | 개별 사용자 식별자 | `customer-12345`, `user@example.com` |
| session_id | 대화 세션 식별자 | `chat-2025-12-30-140000` |

**보안 특징:**
- **논리적 격리**: `actor_id` 간 물리적 접근 차단
- **암호화**: 모든 데이터 Encryption at Rest
- **자동 생명주기**: `event_expiry_days`로 GDPR 준수

```python
# 실제 구현 예시
memory_id = "customer-support-bot-production"
actor_id = "customer-12345"
session_id = "chat-2025-12-30-140000"

# customer-12345와 customer-67890은 완전히 분리된 메모리 공간
```

### 메모리 타입

#### Short-Term Memory (STM) - 원본 대화 저장

대화 내용을 있는 그대로 저장하는 공간입니다. 세션 내에서만 기억하며 즉시 조회 가능합니다.

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

**특징:**
- 원본 대화 그대로 저장 (턴 단위 원자적 저장)
- 세션 내에서만 기억
- 동기 처리 (저장 즉시 조회 가능)
- TTL 필수 (1-365일)

#### Long-Term Memory (LTM) - 자동 정보 추출

STM에서 의미 있는 정보만 추출하여 세션 간 공유하는 공간입니다.

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
    event_expiry_days=30  # 원본 이벤트 30일 보관
)
```

**4가지 메모리 전략 상세:**

대화 예시:
```
USER: 오늘 뭐 먹지?
ASSISTANT: 치킨, 피자, 족발을 추천 드립니다!
USER: 오 나 치킨 좋아하긴 해.
ASSISTANT: 탁월한 선택이십니다. 치킨을 주문해드릴까요?
USER: 응.
ASSISTANT: 치킨을 주문했습니다! 30분 후에 도착 예정입니다.
```

| 전략 | 추출 내용 | 예시 |
|------|----------|------|
| **Semantic Memory** | 사실(Fact)과 지식 | "사용자는 치킨을 주문했습니다." |
| **User Preference Memory** | 명시적/암묵적 선호도 | `{"context":"사용자가 치킨을 좋아한다고 명시적으로 언급함", "preference":"치킨을 좋아함","categories":["음식"]}` |
| **Summary Memory** | 대화 세션 요약 | `<topic name="식사 선택">사용자가 무엇을 먹을지 질문하자 치킨, 피자, 족발이 추천됨. 사용자는 치킨을 좋아한다고 하여 치킨을 선택함...</topic>` |
| **Episodic Memory** | 구조화된 에피소드 (맥락, 추론, 행동, 결과) | 과거 경험에서 학습하여 의사결정 패턴 개선 |

**LTM 처리 프로세스:**
1. **추출 (Extraction)**: 백그라운드에서 LLM이 대화 분석 (비동기, 5-10초 소요)
2. **통합 (Consolidation)**: 기존 기억과 대조
   - Skip: 중복 정보
   - Add: 새로운 정보
   - Update: 변경된 정보 (예: 취향 변화)
3. **저장**: 추출된 정보는 TTL 없음 (영구 저장)

**Namespace 구조화:**

파일 시스템처럼 Namespace로 데이터를 논리적으로 분류합니다. `{actorId}`, `{sessionId}` 템플릿 변수 사용 가능.

```python
# Namespace 예시
"/facts/{actorId}"                    # 사용자별 사실 정보
"/preferences/{actorId}"              # 사용자별 선호도
"/summaries/{actorId}/{sessionId}"    # 세션별 요약
"/episodes/{actorId}"                 # 사용자별 에피소드
```

### 기본 사용법

#### 1. 이벤트 저장

```python
# 대화 내용 저장 (턴 단위)
messages = [
    ("오늘 뭐 먹지?", "USER"),
    ("치킨, 피자, 족발을 추천 드립니다!", "ASSISTANT"),
    ("오 나 치킨 좋아하긴 해.", "USER"),
    ("탁월한 선택이십니다. 치킨을 주문해드릴까요?", "ASSISTANT"),
    ("응.", "USER"),
    ("치킨을 주문했습니다! 30분 후에 도착 예정입니다.", "ASSISTANT")
]

client.create_event(
    memory_id=ltm['id'],
    actor_id="minsukim",
    session_id="session-123",
    messages=messages  # 리스트 전체가 순서대로 저장
)
```

**이벤트 저장 5단계 파이프라인:**
1. 요청 접수
2. 검증 (actor_id, session_id 유효성, 권한 확인)
3. 이벤트 생성 (고유 eventId 발급, 타임스탬프 기록)
4. 저장소 기록 (암호화 저장, 인덱스 업데이트)
5. 완료 반환 (동기 처리, 즉시 조회 가능)

#### 2. 단기 기억 조회

```python
# 최근 k개 턴 조회
conversation = client.get_last_k_turns(
    memory_id=ltm['id'],
    actor_id="minsukim",
    session_id="session-123",
    k=2  # 최근 2턴
)

# 출력 예시:
# [
#     [
#         {'content': {'text': '오 나 치킨 좋아하긴 해'}, 'role': 'USER'}, 
#         {'content': {'text': '탁월한 선택이십니다. 치킨을 주문해드릴까요?'}, 'role': 'ASSISTANT'}
#     ], 
#     [
#         {'content': {'text': '응.'}, 'role': 'USER'}, 
#         {'content': {'text': '치킨을 주문했습니다! 30분 후에 도착 예정입니다.'}, 'role': 'ASSISTANT'}
#     ]
# ]
```

#### 3. 장기 기억 조회

**중요**: 장기 기억은 비동기 추출이므로 저장 후 120초 대기 필요.

```python
import time
time.sleep(120)  # 추출 대기

# 사실 정보 검색 (Semantic Search)
facts = client.retrieve_memories(
    memory_id=ltm['id'],
    namespace=f"/facts/minsukim",
    query="사용자 정보",
    top_k=5
)
# 출력: [{'content': {'text': '사용자는 치킨을 주문했다.'}, 'score': 0.37856376, ...}]

# 선호도 검색
prefs = client.retrieve_memories(
    memory_id=ltm['id'],
    namespace=f"/preferences/minsukim",
    query="선호도",
    top_k=5
)
# 출력: [{'content': {'text': '{"context":"사용자가 치킨을 좋아한다고 명시적으로 언급함", ...}'}]

# 요약 검색
summaries = client.retrieve_memories(
    memory_id=ltm['id'],
    namespace=f"/summaries/minsukim/session-123",
    query="요약",
    top_k=5
)
# 출력: [{'content': {'text': '<topic name="식사 선택">사용자가 무엇을 먹을지 질문하자...</topic>'}]
```

### Strands Agents 자동 통합

수동 SDK 호출 대신 `AgentCoreMemorySessionManager`로 자동화합니다.

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
        "/preferences/{actorId}": RetrievalConfig(
            top_k=5,
            relevance_score=0.6  # 유사도 컷오프 점수
        ),
        "/facts/{actorId}": RetrievalConfig(
            top_k=10,
            relevance_score=0.3
        )
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

# 4. 대화 (자동 저장/로드)
agent("안녕 내 이름은 찬호야")
agent("나는 서울에서 일하는 개발자야")
agent("나는 Python이랑 Rust를 좋아해")

# 동일 세션 내 질문 (STM 활용)
agent("내 직업이 뭐라고 그랬지?")

# 새로운 세션 (LTM 활용)
time.sleep(120)  # 추출 대기
new_session_manager = AgentCoreMemorySessionManager(
    agentcore_memory_config=AgentCoreMemoryConfig(
        memory_id="my-memory-id",
        session_id="session-2",  # 새 세션
        actor_id="chanhosoh",
        retrieval_config=config.retrieval_config
    ),
    region_name="us-west-2"
)
agent = Agent(session_manager=new_session_manager)
agent("내 이름이 뭐야?")  # LTM에서 자동 검색
```

**자동화 기능:**
- `create_event()` 자동 호출 (메시지 추가 시)
- `get_last_k_turns()` 자동 호출 (Agent 초기화 시)
- `retrieve_memories()` 자동 호출 (RAG, 프롬프트 주입)
- 세션 생명주기 관리 (메모리 누수 방지)

**로그 예시:**
```
INFO: bedrock_agentcore.memory.client: Created event: 0000001764903427355#5d6b9f20
INFO: bedrock_agentcore.memory.client: Retrieved memories from namespace: /preferences/chanhosoh
INFO: bedrock_agentcore.memory.client: Retrieved memories from namespace: /facts/chanhosoh
```

### 심화 기능: Memory Forking

대화의 특정 시점에서 가지치기(Branching)하여 여러 가능성을 탐색합니다.

**사용 사례:**
1. **Undo/Redo**: 잘못된 코드 생성 시점으로 롤백 (컨텍스트 오염 방지)
2. **A/B 테스팅**: 메인 브랜치는 안정 프롬프트, 실험 브랜치는 새 프롬프트
3. **타임 머신 디버깅**: 오류 발생 시점으로 돌아가 수정 후 재실행

```python
# 1. 초기 대화 (Main Branch)
event1 = client.create_event(
    memory_id=memory['id'],
    actor_id="user-003",
    session_id="session-003",
    messages=[
        ("오늘 날씨가 어때?", "USER"),
        ("오늘은 맑고 화창합니다.", "ASSISTANT")
    ]
)
root_event_id = event1.get('eventId')  # 분기점

# 2. 메인 대화 계속
client.create_event(
    memory_id=memory['id'],
    actor_id="user-003",
    session_id="session-003",
    messages=[("내일은?", "USER"), ("내일은 비가 옵니다.", "ASSISTANT")]
)

# 3. Memory Forking - 다른 가능성 탐색
forked_event = client.fork_conversation(
    memory_id=memory['id'],
    actor_id="user-003",
    session_id="session-003",
    root_event_id=root_event_id,       # 1번 시점으로 돌아가서
    branch_name="weather-alternative", # 새 브랜치 생성
    new_messages=[                     # 새로운 대화 흐름
        ("다음 주는 어떨까?", "USER"),
        ("다음 주는 대체로 흐릴 것으로 예상됩니다.", "ASSISTANT")
    ]
)

# 4. 대화 트리 구조 조회
conversation_tree = client.get_conversation_tree(
    memory_id=memory['id'],
    actor_id="user-003",
    session_id="session-003"
)
# 출력: main 브랜치와 weather-alternative 브랜치가 root_event_id에서 분기
```

**Forking의 가치:**
- **컨텍스트 오염 방지**: 실패한 시도가 메모리에서 완전히 소멸
- **리스크 없는 실험**: 사용자는 안정 버전 사용, 백그라운드에서 새 프롬프트 테스트
- **완벽한 재현**: 특정 시점으로 돌아가 다른 선택지 탐색

### 제약사항
- **STM**: 원본 이벤트만 저장, TTL 필수 (1-365일), 동기 처리
- **LTM**: 추출 5-10초 소요 (비동기), 추출된 정보는 TTL 없음 (영구 저장)
- 메모리 크기: 세션당 최대 100MB
- 추출 전략: 최대 5개
- Namespace 깊이: 최대 10단계

## 3. AgentCore Gateway

### 개념
- **MCP 서버 변환**: Lambda, API, Smithy 모델을 MCP 도구로 변환
- **OAuth 인증**: Cognito 기반 보안
- **도구 디스커버리**: Agent가 자동으로 도구 발견

### Gateway 생성
```python
from bedrock_agentcore_starter_toolkit.operations.gateway.client import GatewayClient

client = GatewayClient(region_name="us-west-2")

# OAuth 인증 서버 생성
cognito_response = client.create_oauth_authorizer_with_cognito("MyGateway")

# Gateway 생성
gateway = client.create_mcp_gateway(
    name="MyGateway",
    role_arn=None,  # 자동 생성
    authorizer_config=cognito_response["authorizer_config"],
    enable_semantic_search=True
)

# Lambda 도구 추가
calculator_schema = {
    "inlinePayload": [{
        "name": "calculate",
        "description": "Perform mathematical calculation",
        "inputSchema": {
            "type": "object",
            "properties": {
                "operation": {"type": "string", "enum": ["add", "subtract"]},
                "a": {"type": "number"},
                "b": {"type": "number"}
            },
            "required": ["operation", "a", "b"]
        }
    }]
}

client.create_mcp_gateway_target(
    gateway=gateway,
    name="CalculatorTool",
    target_type="lambda",
    target_payload={"toolSchema": calculator_schema}
)
```

### Agent 통합
```python
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async def get_gateway_tools():
    gateway_url = "https://..."
    access_token = "..."
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with streamablehttp_client(gateway_url, headers=headers) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools_result = await session.list_tools()
            return tools_result.tools

# Agent에 도구 추가
gateway_tools = asyncio.run(get_gateway_tools())
agent.tools = gateway_tools
```

### 제약사항
- Gateway당 최대 50개 도구
- Lambda 타임아웃: 최대 15분
- OAuth 토큰 유효기간: 1시간 (자동 갱신 필요)
- API 호출 제한: 초당 100 TPS

## 4. AgentCore Browser

### 개념
- **관리형 Chrome 브라우저**: 웹 페이지 자동화
- **보안 환경**: 격리된 브라우저 인스턴스
- **웹 스크래핑**: 콘텐츠 추출 및 상호작용

### 사용 방법
```python
from bedrock_agentcore.browser import BrowserTool

# Browser 도구 생성
browser_tool = BrowserTool(
    region_name="us-west-2",
    timeout=30  # 30초 타임아웃
)

# Agent에 추가
agent = Agent(
    model="...",
    tools=[browser_tool]
)

# 사용 예시
response = agent("Go to https://example.com and extract the main heading")
```

### 지원 기능
- 페이지 탐색 (navigate)
- 요소 클릭 (click)
- 텍스트 입력 (type)
- 스크린샷 (screenshot)
- 콘텐츠 추출 (extract)

### 제약사항
- 세션당 최대 10분
- JavaScript 실행 지원
- 파일 다운로드 제한: 100MB
- 동시 브라우저 세션: 계정당 10개

## 5. AgentCore Code Interpreter

### 개념
- **안전한 코드 실행**: 격리된 샌드박스 환경
- **Python 코드 실행**: 데이터 분석, 계산 등
- **파일 처리**: CSV, JSON 등 파일 읽기/쓰기

### 사용 방법
```python
from bedrock_agentcore.code_interpreter import CodeInterpreterTool

# Code Interpreter 도구 생성
code_tool = CodeInterpreterTool(
    region_name="us-west-2"
)

# Agent에 추가
agent = Agent(
    model="...",
    tools=[code_tool]
)

# 사용 예시
response = agent("Calculate the mean of [1, 2, 3, 4, 5] using Python")
```

### 제약사항
- Python 3.10 환경
- 실행 타임아웃: 최대 5분
- 메모리 제한: 2GB
- 파일 크기 제한: 100MB
- 네트워크 접근 불가

## 6. AgentCore Identity

### 개념
Amazon Cognito 기반의 AI Agent 전용 신원 및 자격증명 관리 서비스입니다.

**핵심 기능:**
- **중앙화된 Agent 신원 관리**: 모든 Agent에 고유 ARN 부여, 단일 디렉토리로 관리
- **Token Vault**: OAuth 2.0 토큰, API 키, 클라이언트 시크릿을 KMS 암호화하여 안전하게 저장
- **OAuth 2.0 플로우 지원**: 2LO (Client Credentials), 3LO (Authorization Code) 자동 처리
- **위임 인증**: Agent가 사용자 대신 리소스 접근, 감사 추적 유지
- **Identity-Aware Authorization**: 사용자 컨텍스트 기반 동적 권한 제어

### 주요 특징

#### 1. 중앙화된 Agent 신원 관리
모든 Agent에 고유한 ARN을 부여하고 중앙 디렉토리에서 관리합니다.

```python
from bedrock_agentcore.identity import IdentityClient

client = IdentityClient(region_name="us-west-2")

# Agent 신원 생성
workload_identity = client.create_workload_identity(
    name="CalendarSchedulerAgent",
    description="Schedules meetings in Google Calendar on behalf of users"
)

# ARN 예시: arn:aws:bedrock-agentcore:us-west-2:123456789012:workload-identity/abc123
print(workload_identity["workloadIdentityArn"])
```

**장점:**
- AWS, Self-hosted, Hybrid 배포 모두 단일 뷰로 관리
- Agent별 고유 식별자로 감사 추적 가능
- 메타데이터 기반 검색 및 필터링

#### 2. Token Vault - 안전한 자격증명 저장소

OAuth 2.0 Access/Refresh 토큰, API 키, 클라이언트 시크릿을 KMS 암호화하여 저장합니다.

**보안 특징:**
- AWS KMS 암호화 (고객 관리형 키 지원)
- Agent별 접근 제어 (최소 권한 원칙)
- 사용자별 토큰 격리 (Agent는 해당 사용자 토큰만 접근)
- 자동 토큰 갱신 (Refresh Token 활용)

```python
# Token Vault는 자동으로 관리됨 (명시적 저장 불필요)
# OAuth 플로우 완료 시 자동으로 Token Vault에 저장
```

**토큰 갱신 플로우:**
1. Agent가 만료된 Access Token으로 리소스 접근 시도
2. 리소스 서버가 401 Unauthorized 반환
3. Agent가 Token Vault에서 Refresh Token 자동 조회
4. 새 Access Token 획득 후 Token Vault에 자동 저장
5. 재시도 성공

#### 3. OAuth 2.0 플로우 지원

##### 3.1 Two-Legged OAuth (2LO) - Client Credentials Grant

Agent가 자체 자격증명으로 리소스 접근 (사용자 개입 없음)

```python
# OAuth 2.0 Credential Provider 생성
provider = client.create_oauth2_credential_provider(
    name="SlackProvider",
    oauth_config={
        "clientId": "slack-client-id",
        "clientSecret": "slack-client-secret",
        "tokenEndpoint": "https://slack.com/api/oauth.v2.access",
        "scopes": ["chat:write", "channels:read"]
    }
)

# Agent가 토큰 획득 (2LO)
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload, context):
    # Agent 자체 Access Token 획득
    agent_token = client.get_workload_access_token(
        workload_identity_id=context.workload_identity_id
    )
    
    # OAuth 리소스 토큰 획득 (2LO)
    resource_token = client.get_resource_oauth2_token(
        workload_access_token=agent_token,
        credential_provider_id=provider["id"],
        grant_type="client_credentials"
    )
    
    # Slack API 호출
    import requests
    response = requests.post(
        "https://slack.com/api/chat.postMessage",
        headers={"Authorization": f"Bearer {resource_token['access_token']}"},
        json={"channel": "#general", "text": "Hello from Agent!"}
    )
    return response.json()
```

**사용 사례:**
- Slack 봇 메시지 전송
- GitHub Actions 트리거
- 내부 API 호출

##### 3.2 Three-Legged OAuth (3LO) - Authorization Code Grant

사용자가 직접 인증하고 Agent에게 권한 위임 (사용자 개입 필요)

```python
# Google Calendar OAuth Provider 생성
google_provider = client.create_oauth2_credential_provider(
    name="GoogleCalendarProvider",
    oauth_config={
        "clientId": "google-client-id.apps.googleusercontent.com",
        "clientSecret": "google-client-secret",
        "authorizationEndpoint": "https://accounts.google.com/o/oauth2/v2/auth",
        "tokenEndpoint": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/calendar.events"],
        "callbackUrl": "https://myapp.example.com/oauth/callback"
    }
)

@app.entrypoint
def invoke(payload, context):
    user_jwt = payload.get("user_access_token")  # 사용자의 Cognito JWT
    
    # Agent Access Token 획득 (사용자 컨텍스트 바인딩)
    agent_token = client.get_workload_access_token_for_jwt(
        workload_identity_id=context.workload_identity_id,
        jwt_token=user_jwt  # 사용자 신원 바인딩
    )
    
    # Google OAuth 토큰 획득 (3LO)
    try:
        resource_token = client.get_resource_oauth2_token(
            workload_access_token=agent_token,
            credential_provider_id=google_provider["id"],
            grant_type="authorization_code"
        )
    except NeedsUserConsentError as e:
        # 최초 인증 시 사용자 동의 필요
        return {
            "status": "needs_consent",
            "authorization_url": e.authorization_url
        }
    
    # Google Calendar API 호출
    import requests
    response = requests.post(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        headers={"Authorization": f"Bearer {resource_token['access_token']}"},
        json={
            "summary": "Team Meeting",
            "start": {"dateTime": "2025-12-30T14:00:00+09:00"},
            "end": {"dateTime": "2025-12-30T15:00:00+09:00"}
        }
    )
    return response.json()
```

**3LO 플로우 상세:**
1. 사용자가 웹 앱에 로그인 (Cognito JWT 획득)
2. Agent가 사용자 대신 Google 접근 시도
3. Token Vault에 토큰 없음 → Authorization URL 반환
4. 사용자가 Google 로그인 및 권한 동의
5. Authorization Code가 AgentCore Identity로 전달
6. Access Token + Refresh Token 획득 후 Token Vault에 저장
7. 이후 요청은 Token Vault에서 자동 조회 (동의 불필요)

#### 4. Identity-Aware Authorization

사용자 컨텍스트를 Agent 코드에 전달하여 동적 권한 제어를 구현합니다.

```python
@app.entrypoint
def invoke(payload, context):
    user_jwt = payload.get("user_access_token")
    
    # JWT 검증 및 사용자 정보 추출
    import jwt
    user_info = jwt.decode(
        user_jwt,
        options={"verify_signature": False}  # AgentCore Identity가 이미 검증
    )
    
    user_id = user_info["sub"]
    user_email = user_info["email"]
    user_groups = user_info.get("cognito:groups", [])
    
    # 동적 권한 제어
    if "admin" in user_groups:
        # 관리자는 모든 캘린더 접근
        calendar_id = payload.get("calendar_id")
    else:
        # 일반 사용자는 본인 캘린더만 접근
        calendar_id = f"{user_id}@example.com"
    
    # 사용자별 리소스 접근
    resource_token = client.get_resource_oauth2_token(...)
    # ...
```

**사용 사례:**
- 사용자 역할 기반 데이터 필터링
- 부서별 리소스 접근 제어
- 개인정보 보호 규정 준수

#### 5. AgentCore SDK 통합

선언적 어노테이션으로 자격증명 자동 주입 (보일러플레이트 코드 제거)

```python
from bedrock_agentcore.decorators import with_oauth_token

@app.entrypoint
@with_oauth_token(provider="GoogleCalendarProvider")
def invoke(payload, context, oauth_token):
    """
    oauth_token이 자동으로 주입됨
    - 토큰 만료 시 자동 갱신
    - 사용자 동의 필요 시 예외 발생
    """
    import requests
    response = requests.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        headers={"Authorization": f"Bearer {oauth_token}"}
    )
    return response.json()
```

### 실전 예제: Google Calendar Agent

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from bedrock_agentcore.identity import IdentityClient
from strands import Agent

app = BedrockAgentCoreApp()
identity_client = IdentityClient(region_name="us-west-2")

# 1. Agent 신원 생성 (배포 전 1회)
workload_identity = identity_client.create_workload_identity(
    name="CalendarAgent",
    description="Manages Google Calendar events"
)

# 2. Google OAuth Provider 생성 (배포 전 1회)
google_provider = identity_client.create_oauth2_credential_provider(
    name="GoogleCalendar",
    oauth_config={
        "clientId": "YOUR_GOOGLE_CLIENT_ID",
        "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET",
        "authorizationEndpoint": "https://accounts.google.com/o/oauth2/v2/auth",
        "tokenEndpoint": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/calendar.events"],
        "callbackUrl": "https://myapp.example.com/oauth/callback"
    }
)

# 3. Agent 정의
calendar_agent = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    system_prompt="You help users manage their Google Calendar."
)

@app.entrypoint
def invoke(payload, context):
    user_jwt = payload["user_access_token"]
    user_prompt = payload["prompt"]
    
    # Agent Access Token 획득 (사용자 바인딩)
    agent_token = identity_client.get_workload_access_token_for_jwt(
        workload_identity_id=workload_identity["id"],
        jwt_token=user_jwt
    )
    
    # Google Access Token 획득
    try:
        google_token = identity_client.get_resource_oauth2_token(
            workload_access_token=agent_token,
            credential_provider_id=google_provider["id"],
            grant_type="authorization_code"
        )
    except Exception as e:
        if "needs_consent" in str(e):
            return {"error": "User consent required", "auth_url": e.authorization_url}
        raise
    
    # Agent에 Google API 도구 제공
    def list_events():
        import requests
        response = requests.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {google_token['access_token']}"}
        )
        return response.json()
    
    def create_event(summary, start_time, end_time):
        import requests
        response = requests.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {google_token['access_token']}"},
            json={
                "summary": summary,
                "start": {"dateTime": start_time},
                "end": {"dateTime": end_time}
            }
        )
        return response.json()
    
    calendar_agent.tools = [list_events, create_event]
    
    # Agent 실행
    response = calendar_agent(user_prompt)
    return response.message['content'][0]['text']
```

### 보안 모범 사례

1. **최소 권한 원칙**
   - OAuth Scope를 필요한 최소한으로 제한
   - Agent별 IAM 역할 분리

2. **토큰 관리**
   - Refresh Token 활용으로 Access Token 수명 단축
   - 고객 관리형 KMS 키 사용 (규정 준수)

3. **감사 추적**
   - CloudTrail로 모든 Token Vault 접근 로깅
   - Agent ARN 기반 사용자 추적

4. **사용자 동의**
   - 3LO 플로우에서 명시적 동의 획득
   - 동의 범위를 사용자에게 명확히 표시

### 제약사항
- Credential Provider당 최대 10개 OAuth 스코프
- Token Vault 토큰 크기: 최대 4KB
- 계정당 최대 100개 Workload Identity
- Refresh Token 유효기간: Provider 설정에 따름 (Google: 6개월)
- Authorization Code 유효기간: 10분

