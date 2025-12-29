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
- **Short-Term Memory (STM)**: 세션 내 대화 저장
- **Long-Term Memory (LTM)**: 세션 간 정보 추출 및 저장
- **메모리 전략략**: 
    - Semantic memory strategy: The semantic memory strategy is designed to identify and extract key pieces of factual information and contextual knowledge from conversational data
    - User preference strategy: designed to automatically identify and extract user preferences, choices, and styles from conversational data
    - Summary strategy: responsible for generating condensed, real-time summaries of conversations within a single session

### 메모리 타입

#### Short-Term Memory (STM)
```python
from bedrock_agentcore.memory import MemoryClient

client = MemoryClient(region_name='us-west-2')

# STM 생성
stm = client.create_memory_and_wait(
    name="MyAgent_STM",
    strategies=[],  # 빈 배열 = STM
    event_expiry_days=7  # 7일 후 자동 삭제
)
```

**특징:**
- 원본 대화 그대로 저장
- 세션 내에서만 기억
- 즉시 조회 가능
- TTL 설정 가능 (1-365일)

#### Long-Term Memory (LTM)
```python
# LTM 생성
ltm = client.create_memory_and_wait(
    name="MyAgent_LTM",
    strategies=[
        # 사용자 선호도 추출
        {"userPreferenceMemoryStrategy": {
            "name": "preferences",
            "namespaces": ["/user/preferences"]
        }},
        # 사실 정보 추출
        {"semanticMemoryStrategy": {
            "name": "facts",
            "namespaces": ["/user/facts"]
        }}
    ],
    event_expiry_days=30  # 원본 이벤트 30일 보관
)
```

**특징:**
- STM 기능 + 자동 추출
- 세션 간 정보 공유
- 추출 처리 시간: 5-10초
- **중요**: 추출된 정보는 TTL 없음 (영구 저장)

### Agent 통합
```python
from strands.hooks import AgentInitializedEvent, MessageAddedEvent, HookProvider

class MemoryHook(HookProvider):
    def on_agent_initialized(self, event):
        """Agent 시작 시 이전 대화 로드"""
        turns = memory_client.get_last_k_turns(
            memory_id=MEMORY_ID,
            actor_id="user",
            session_id=event.agent.state.get("session_id"),
            k=3  # 최근 3턴
        )
        if turns:
            context = "\n".join([f"{m['role']}: {m['content']['text']}"
                               for t in turns for m in t])
            event.agent.system_prompt += f"\n\nPrevious:\n{context}"
    
    def on_message_added(self, event):
        """메시지 추가 시 Memory에 저장"""
        msg = event.agent.messages[-1]
        memory_client.create_event(
            memory_id=MEMORY_ID,
            actor_id="user",
            session_id=event.agent.state.get("session_id"),
            messages=[(str(msg["content"]), msg["role"])]
        )
    
    def register_hooks(self, registry):
        registry.add_callback(AgentInitializedEvent, self.on_agent_initialized)
        registry.add_callback(MessageAddedEvent, self.on_message_added)

# Agent에 Hook 추가
agent = Agent(
    model="...",
    hooks=[MemoryHook()]
)
```

### 제약사항
- **STM**: 원본 이벤트만 저장, TTL 필수 (1-365일)
- **LTM**: 추출된 정보는 TTL 없음 (영구 저장), 원본 이벤트는 TTL 적용
- 메모리 크기: 세션당 최대 100MB
- 추출 전략: 최대 5개
- 조회 성능: STM 즉시, LTM 추출 5-10초

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
- **OAuth 연동**: 외부 서비스 인증
- **API 키 관리**: 안전한 자격증명 저장
- **권한 관리**: IAM 기반 접근 제어

### 사용 방법
```python
# OAuth 토큰 저장
from bedrock_agentcore.identity import IdentityClient

identity_client = IdentityClient(region_name="us-west-2")

# API 키 저장
identity_client.store_credential(
    name="github_token",
    credential_type="api_key",
    value="ghp_..."
)

# Agent에서 사용
credential = identity_client.get_credential("github_token")
```

### 제약사항
- 자격증명당 최대 4KB
- 계정당 최대 100개 자격증명
- 자동 만료 지원 (선택)

## 서비스 조합 가이드

### 기본 구성 (필수)
```
AgentCore Runtime
```

### 대화형 Agent
```
AgentCore Runtime + Memory (STM)
```

### 크로스 세션 Agent
```
AgentCore Runtime + Memory (LTM)
```

### 도구 통합 Agent
```
AgentCore Runtime + Gateway + (선택) Identity
```

### 웹 자동화 Agent
```
AgentCore Runtime + Browser
```

### 데이터 분석 Agent
```
AgentCore Runtime + Code Interpreter
```

### 완전한 구성
```
AgentCore Runtime
  + Memory (STM/LTM)
  + Gateway
  + Browser
  + Code Interpreter
  + Identity
```

## 비용 최적화

1. **Memory**: STM은 LTM보다 저렴, 필요한 경우만 LTM 사용
2. **Gateway**: 도구 수 최소화, 캐싱 활용, 시멘틱 검색 활용
3. **Browser**: 세션 시간 최소화, 필요한 경우만 사용
4. **Code Interpreter**: 간단한 계산은 LLM으로 처리

## 배포 체크리스트

- [ ] Runtime 설정 완료
- [ ] Memory ID 환경 변수 설정 (필요 시)
- [ ] Gateway 생성 및 도구 추가 (필요 시)
- [ ] IAM 권한 설정
- [ ] VPC 설정 (프라이빗 리소스 접근 시)
- [ ] 환경 변수 설정
- [ ] 로컬 테스트 완료
- [ ] 배포 및 검증