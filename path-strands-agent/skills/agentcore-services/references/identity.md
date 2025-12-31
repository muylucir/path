# AgentCore Identity

## 개념

Amazon Bedrock AgentCore Identity는 **AI Agent 워크로드를 위한 관리형 아이덴티티 및 자격 증명 관리 서비스**입니다.

**핵심 가치:**
- **중앙화된 자격 증명 관리**: Agent별 인증 정보를 중앙에서 관리
- **자격 증명 격리**: Agent+사용자 조합별로 Token Vault에 격리 저장
- **개발 복잡도 감소**: SDK decorator로 인증 로직 단순화
- **동적 권한 부여**: 필요한 시점에 사용자 인가로 권한 부여 (3LO)
- **기존 IdP 통합**: 사용자 마이그레이션 없이 기존 IdP 활용

## AI Agent 보안 과제

### OWASP Agentic Security 위협

AI Agent의 자율성 증가에 따른 새로운 보안 위협:

| 위협 | 설명 | 예시 |
|------|------|------|
| **권한 침해** | 권한 설정 취약점 악용 | 과도한 권한, 동적 권한 상속 |
| **신원 위장/사칭** | 인증 메커니즘 악용 | Agent/사용자 사칭, 허위 신원 |
| **멀티 Agent 공격** | Agent 간 신뢰 관계 악용 | 권한 위임 체인 악용, 워크플로우 조작 |

### 기존 방식의 문제점

**문제 1: 복잡한 인증/인가 체계**
```
Agent → Tool A (인증 방식 A)
     → Tool B (인증 방식 B)
     → Tool C (인증 방식 C)
→ 각 도구별 인증 로직 개별 구현
```

**문제 2: 인증 정보 분산 관리**
```
Agent 1: API Key 1, OAuth Token 1
Agent 2: API Key 2, OAuth Token 2
Agent 3: API Key 3, OAuth Token 3
→ 관리 리스크 증가, 구현 복잡도 증가
```

**문제 3: 동적 권한 관리 어려움**
```
필요한 시점에 → 필요한 권한만 → 필요한 기간만
→ 직접 구현 시 복잡도 높음
```

### AgentCore Identity의 해결책

```
Before: Agent → 각 도구별 인증 로직 개별 구현
             → 인증 정보 분산 저장
             → 권한 관리 복잡

After:  Agent → AgentCore Identity (중앙 관리)
                  ├─ Credential Provider (자격 증명 공급자)
                  ├─ Token Vault (암호화 저장)
                  ├─ Workload Identity (Agent 식별)
                  └─ SDK Decorator (간편 구현)
```

## 핵심 개념

### 1. Workload Identity (Agent 아이덴티티)

각 Agent의 고유 식별자 및 메타데이터

**ARN 형식:**
```
arn:aws:bedrock-agentcore:{region}:{account-id}:workload-identity/{id}
```

**생성:**
```python
from bedrock_agentcore.services.identity import IdentityClient

client = IdentityClient(region="us-west-2")

workload_identity = client.create_workload_identity(
    name="BizAssistAgent",
    description="Enterprise business assistant agent"
)

print(workload_identity["workloadIdentityArn"])
# arn:aws:bedrock-agentcore:us-west-2:123456789012:workload-identity/abc123
```

**자동 생성:**
- AgentCore Runtime 배포 시 자동 생성
- AgentCore Gateway 생성 시 자동 생성

### 2. Credential Provider (자격 증명 공급자)

IdP 또는 리소스 서버 접근에 필요한 인증 정보를 등록

**지원 타입:**
- OAuth 2.0 (2LO, 3LO)
- API Key

**OAuth Provider 등록:**
```python
# Cognito Provider
cognito_provider = client.create_oauth2_credential_provider(
    name='cognito-cred-provider',
    credentialProviderVendor='CognitoOauth2',
    oauth2ProviderConfigInput={
        "includedOauth2ProviderConfig": {
            "clientId": "cognito-client-id",
            "clientSecret": "cognito-client-secret",
            "issuer": f"https://cognito-idp.us-west-2.amazonaws.com/{user_pool_id}",
            "authorizationEndpoint": f"https://{domain}.auth.us-west-2.amazoncognito.com/oauth2/authorize",
            "tokenEndpoint": f"https://{domain}.auth.us-west-2.amazoncognito.com/oauth2/token"
        }
    }
)

# Atlassian Provider
atlassian_provider = client.create_oauth2_credential_provider(
    name='confluence-cred-provider',
    credentialProviderVendor='AtlassianOauth2',
    oauth2ProviderConfigInput={
        "atlassianOauth2ProviderConfig": {
            "clientId": "atlassian-client-id",
            "clientSecret": "atlassian-client-secret"
        }
    }
)

# Callback URL 확인
print(f"Callback URL: {atlassian_provider['callbackUrl']}")
# https://bedrock-agentcore.{region}.amazonaws.com/identities/oauth2/callback/xxx
```

**API Key Provider:**
```python
client.create_api_key_credential_provider(
    name="CustomAPIKey",
    apiKey="your-api-key"
)
```

**보안:**
- Client Secret은 AWS Secrets Manager에 자동 저장
- KMS 암호화

### 3. Token Vault (토큰 저장소)

OAuth 토큰과 API 키를 암호화하여 저장하는 안전한 저장소

**격리 메커니즘:**
```
Token Vault
  └─ Agent ID (Workload Identity)
      └─ User ID (Actor ID)
          └─ Access Token + Refresh Token
```

**특징:**
- Agent+사용자 조합으로만 접근 가능
- KMS 암호화 (고객 관리형 키 지원)
- 자동 Refresh Token 갱신
- CloudTrail 감사 로깅

### 4. Workload Access Token

Token Vault 접근을 위한 단기 토큰

**구성:**
- Workload Identity (Agent ID)
- User Identity (User ID 또는 JWT)

**획득 방법:**

| API | 사용 시점 | 사용자 정보 |
|-----|----------|------------|
| `GetWorkloadAccessToken` | 사용자 대신 권한 행사 안 함 | 불필요 |
| `GetWorkloadAccessTokenForUserId` | 사용자 ID로 식별 | User ID |
| `GetWorkloadAccessTokenForJWT` | JWT로 식별 | JWT Token |

**예시:**
```python
# JWT 기반
workload_token = client.get_workload_access_token_for_jwt(
    workload_identity_id="workload-123",
    jwt_token=user_jwt
)

# User ID 기반
workload_token = client.get_workload_access_token_for_user_id(
    workload_identity_id="workload-123",
    user_id="user-456"
)
```

**자동 획득:**
- AgentCore Runtime: 자동 획득
- AgentCore Gateway: 자동 획득

## 인증 시나리오

### 시나리오 1: AgentCore Runtime 접근 (Inbound Auth)

**목적**: Runtime 호출 시 사용자 인증

**구성:**
```python
from bedrock_agentcore_starter_toolkit import Runtime

runtime = Runtime()

# Cognito 인증 설정
auth_config = {
    "customJWTAuthorizer": {
        "allowedClients": ["cognito-client-id"],
        "discoveryUrl": "https://cognito-idp.us-west-2.amazonaws.com/pool/.well-known/openid-configuration"
    }
}

# Runtime 배포
runtime.configure(
    entrypoint="main.py",
    authorizer_configuration=auth_config,
    request_header_configuration={
        "requestHeaderAllowlist": ["Authorization"]  # JWT 전달 허용
    }
)

runtime.launch()
```

**호출:**
```python
import boto3
import requests
import urllib.parse

# Cognito 인증
cognito_client = boto3.client('cognito-idp')
auth_response = cognito_client.initiate_auth(
    ClientId=client_id,
    AuthFlow='USER_PASSWORD_AUTH',
    AuthParameters={
        'USERNAME': username,
        'PASSWORD': password
    }
)
bearer_token = auth_response['AuthenticationResult']['AccessToken']

# Runtime 호출
escaped_arn = urllib.parse.quote(agent_arn, safe='')
url = f"https://bedrock-agentcore.us-west-2.amazonaws.com/runtimes/{escaped_arn}/invocations?qualifier=DEFAULT"

response = requests.post(
    url,
    headers={
        "Authorization": f"Bearer {bearer_token}",
        "Content-Type": "application/json",
        "X-Amzn-Bedrock-AgentCore-Runtime-Session-Id": session_id
    },
    json={"prompt": "Hello"}
)
```

**Agent 코드에서 JWT 추출:**
```python
import jwt

@app.entrypoint
def invoke(payload, context):
    # Authorization header에서 JWT 추출
    cognito_auth = context.request_headers.get('Authorization')
    cognito_token = cognito_auth.replace('Bearer ', '')
    
    # JWT 디코딩 (서명 검증은 AgentCore가 이미 수행)
    claims = jwt.decode(cognito_token, options={"verify_signature": False})
    user_id = claims.get('username')
    
    # 사용자별 로직 처리
    return f"Hello {user_id}"
```

### 시나리오 2: AgentCore Gateway 도구 접근 (Identity Propagation)

**목적**: Gateway 도구 호출 시 Runtime 인증 재사용

**구성:**
```python
# Gateway 생성 (Runtime과 동일한 IdP 사용)
gateway = client.create_gateway(
    name='CommonMCPGateway',
    roleArn=gateway_role_arn,
    protocolType='MCP',
    authorizerType='CUSTOM_JWT',
    authorizerConfiguration=auth_config  # Runtime과 동일
)

# Lambda Target 추가
lambda_target = client.create_gateway_target(
    gatewayIdentifier=gateway['gatewayId'],
    name='LambdaToolTarget',
    targetConfiguration={
        "mcp": {
            "lambda": {
                "lambdaArn": "arn:aws:lambda:...",
                "toolSchema": {"inlinePayload": [...]}
            }
        }
    },
    credentialProviderConfigurations=[
        {"credentialProviderType": "GATEWAY_IAM_ROLE"}
    ]
)
```

**Agent 코드:**
```python
from mcp.client.streamable_http import streamablehttp_client
from strands.tools.mcp import MCPClient

@app.entrypoint
async def invoke(payload, context):
    # Runtime 인증 시 사용된 JWT 재사용
    cognito_token = context.request_headers.get('Authorization').replace('Bearer ', '')
    
    # MCP Client 생성 (동일한 JWT 사용)
    mcp_client = MCPClient(
        lambda: streamablehttp_client(
            gateway_url,
            headers={"Authorization": f"Bearer {cognito_token}"}
        )
    )
    
    # Gateway 도구 로드
    with mcp_client:
        gateway_tools = mcp_client.list_tools_sync()
        
        agent = Agent(
            model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
            tools=gateway_tools
        )
        
        return agent(payload.get("prompt"))
```

**Identity Propagation:**
- Runtime 인증 → Gateway 인증 재사용
- 추가 인증 불필요
- 동일한 사용자 컨텍스트 유지

### 시나리오 3: 3LO Outbound Auth (사용자 대신 외부 API 호출)

**목적**: 사용자 권한으로 Confluence API 호출

**3LO 인증 4단계:**

```
1. Agent 호출
   → 3LO 필요한 도구 실행

2. Authorization URL 발급
   → 사용자에게 인증 URL 전달

3. Access Token 발급
   → 사용자 인증/인가 후 Token Vault에 저장

4. 도구 실행
   → Access Token으로 외부 API 호출
```

**전체 플로우:**

```
User → App → Runtime (Cognito JWT)
           → Agent → Confluence Tool
                   → @requires_access_token
                   → Token Vault 확인
                   → 없음 → Authorization URL 발급
                   → User 인증/인가
                   → Callback URL 호출
                   → CompleteResourceTokenAuth
                   → Token Vault 저장
                   → Confluence API 호출
```

**구현:**

```python
from strands import tool
from bedrock_agentcore.identity.auth import requires_access_token
import asyncio
import requests

# 비동기 메시지 큐 (Authorization URL 전달용)
class MessageQueue:
    def __init__(self):
        self._queue = asyncio.Queue()
        self._finished = False
    
    async def put(self, item: dict):
        await self._queue.put(item)
    
    async def finish(self):
        self._finished = True
        await self._queue.put(None)
    
    async def stream(self):
        while True:
            item = await self._queue.get()
            if item is None and self._finished:
                break
            yield item

queue = MessageQueue()

@tool
async def search_confluence_page(search_query: str) -> dict:
    """
    Search Confluence pages with user's permissions
    
    Args:
        search_query: Query to search in Confluence
    """
    # 인증 시작 안내
    await queue.put({"type": "info", "content": "🔐 Confluence 인증을 시작합니다..."})
    
    # Authorization URL 발급 시 callback
    async def on_auth_url(url: str):
        await queue.put({"type": "auth_url", "content": url})
    
    # @requires_access_token decorator로 OAuth 토큰 자동 획득
    @requires_access_token(
        provider_name="confluence-cred-provider",
        scopes=["search:confluence", "read:page:confluence", "offline_access"],
        auth_flow='USER_FEDERATION',  # 3LO
        on_auth_url=on_auth_url,
        into="access_token",
        callback_url="https://myapp.com/oauth/callback",
        force_authentication=False  # Token Vault 재사용
    )
    async def request_confluence_token(access_token: str):
        return access_token
    
    # Token 획득 (Token Vault에 있으면 재사용, 없으면 3LO 수행)
    confluence_token = await request_confluence_token(access_token='')
    
    await queue.put({"type": "info", "content": "✅ Confluence 인증이 완료되었습니다!"})
    
    # Confluence API 호출
    search_url = f"https://api.atlassian.com/ex/confluence/{cloud_id}/wiki/rest/api/search"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {confluence_token}"
    }
    
    cql = f"siteSearch ~ '{search_query}' order by created"
    response = requests.get(
        search_url,
        headers=headers,
        params={'cql': cql, 'limit': 5}
    )
    
    results = response.json().get('results', [])
    
    # 각 페이지 내용 조회
    content_xml = ""
    for idx, result in enumerate(results):
        content_id = result['content']['id']
        page_url = f"https://api.atlassian.com/ex/confluence/{cloud_id}/wiki/api/v2/pages/{content_id}?body-format=storage"
        page_response = requests.get(page_url, headers=headers)
        page_data = page_response.json()
        
        content_xml += f"<Page {idx+1}>"
        content_xml += f"<Title>{page_data['title']}</Title>"
        content_xml += f"<Content>{page_data['body']['storage']['value']}</Content>"
        content_xml += f"</Page {idx+1}>"
    
    return f"<SearchResults>{content_xml}</SearchResults>"
```

**Agent 통합:**
```python
@app.entrypoint
async def agent_entrypoint(payload, context):
    # Gateway 도구 + 커스텀 도구
    tool_list = gateway_tools + [search_confluence_page]
    
    agent = Agent(
        model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
        tools=tool_list
    )
    
    # 스트리밍 처리 (Authorization URL 포함)
    async def process_user_message(user_message: str):
        async for event in agent.stream_async(user_message):
            if "data" in event:
                await queue.put({"type": "generated_text", "content": event["data"]})
    
    task = asyncio.create_task(process_user_message(payload.get("prompt")))
    
    async def stream_with_task():
        async for item in queue.stream():
            yield item
        await task
    
    return stream_with_task()
```

### 시나리오 4: Session Binding (세션 바인딩)

**목적**: Authorization URL 유출 시 악의적 사용자의 인증 대행 방지

**문제 상황:**
```
1. User A가 Agent 호출 → Authorization URL 발급
2. URL이 유출됨
3. Attacker가 URL로 인증 수행
4. Attacker의 자격 증명이 User A의 Token Vault에 저장됨
→ User A가 Attacker의 리소스에 접근하게 됨
```

**해결: Session Binding**

```
1. Authorization URL에 session_id 포함
2. 사용자 인증 완료 후 Callback URL 호출
3. Callback에서 현재 로그인된 사용자 검증
4. CompleteResourceTokenAuth API 호출
5. 사용자 일치 시에만 Token Vault 저장
```

**Callback 구현:**
```python
from bedrock_agentcore.services.identity import IdentityClient, UserTokenIdentifier
from fastapi import Request
from fastapi.responses import JSONResponse

@app.post("/oauth/callback")
def handle_3lo_callback(request: Request):
    # Query parameter에서 session_id 추출
    session_id = request.query_params.get("session_id")
    
    if not session_id:
        return JSONResponse(
            status_code=400,
            content={"message": "session_id 파라미터가 존재하지 않습니다."}
        )
    
    # 현재 로그인된 사용자 세션 검증
    # 브라우저 쿠키에서 사용자 정보 추출
    session_details = validate_session_cookies(request.cookies.get('my-app-cookie'))
    
    # Workload Access Token 획득 시 사용된 사용자 토큰 추출
    user_token = session_details.get('user_token')
    
    if not user_token:
        return JSONResponse(
            status_code=500,
            content={"message": "유효하지 않은 사용자 정보입니다."}
        )
    
    # CompleteResourceTokenAuth API 호출
    identity_client = IdentityClient(region="us-west-2")
    identity_client.complete_resource_token_auth(
        session_uri=session_id,
        user_identifier=UserTokenIdentifier(user_token=user_token)
        # User ID 사용 시: UserIdIdentifier(user_id=user_id)
    )
    
    return JSONResponse(
        status_code=200,
        content={"message": "OAuth2 3LO 인증이 완료되었습니다."}
    )
```

**Allowed Return URLs 등록:**
```python
# Workload Identity에 Callback URL 등록
workload_identity = client.get_workload_identity(name="BizAssistAgent")
allowed_urls = workload_identity.get("allowedResourceOauth2ReturnUrls", [])

client.update_workload_identity(
    name="BizAssistAgent",
    allowed_oauth2_return_urls=[*allowed_urls, "https://myapp.com/oauth/callback"]
)
```

## SDK Decorator

### @requires_access_token

OAuth Access Token 자동 획득

**파라미터:**

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `provider_name` | Credential Provider 이름 | `"confluence-cred-provider"` |
| `scopes` | OAuth 2.0 스코프 | `["read", "write", "offline_access"]` |
| `auth_flow` | 인증 플로우 타입 | `"USER_FEDERATION"` (3LO), `"M2M"` (2LO) |
| `on_auth_url` | Authorization URL 콜백 | `async def on_auth_url(url: str): ...` |
| `into` | 토큰 주입 파라미터명 | `"access_token"` (기본값) |
| `callback_url` | 인증 완료 후 리다이렉트 URL | `"https://myapp.com/callback"` |
| `force_authentication` | 재인증 강제 (1회성 사용) | `False` (기본값) |

**사용 예시:**
```python
@requires_access_token(
    provider_name="google-calendar",
    scopes=["https://www.googleapis.com/auth/calendar.events", "offline_access"],
    auth_flow='USER_FEDERATION',
    on_auth_url=lambda url: print(f"인증 URL: {url}"),
    into="google_token",
    callback_url="https://myapp.com/oauth/callback",
    force_authentication=False
)
async def call_google_api(google_token: str):
    # google_token이 자동으로 주입됨
    response = requests.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        headers={"Authorization": f"Bearer {google_token}"}
    )
    return response.json()
```

### @requires_api_key

API Key 자동 획득

```python
from bedrock_agentcore.identity.auth import requires_api_key

@requires_api_key(
    provider_name="weather-api-key",
    into="api_key"
)
def call_weather_api(city: str, api_key: str):
    # api_key가 자동으로 주입됨
    response = requests.get(
        f"https://api.weather.com/v1/forecast?city={city}",
        headers={"X-API-Key": api_key}
    )
    return response.json()
```

## 사용자별 권한 격리

**시나리오**: 동일한 Agent, 동일한 도구, 다른 사용자

```
User A → Agent → Confluence Tool
                 → Token Vault[Agent+UserA] → Confluence Token A
                 → Confluence API (User A 권한)
                 → Project A 문서만 조회

User B → Agent → Confluence Tool
                 → Token Vault[Agent+UserB] → Confluence Token B
                 → Confluence API (User B 권한)
                 → Project B 문서만 조회
```

**격리 보장:**
- User A의 토큰으로 User B의 리소스 접근 불가
- Agent+사용자 조합으로만 Token Vault 접근
- 사용자별 권한 범위 유지

## Best Practices

### 1. 최소 권한 원칙

```python
# ✅ 좋은 예: 필요한 스코프만
scopes=["read:page:confluence"]

# ❌ 나쁜 예: 과도한 권한
scopes=["admin:confluence"]
```

### 2. Refresh Token 활용

```python
# offline_access 스코프 추가로 Refresh Token 획득
scopes=["read:calendar", "offline_access"]

# Access Token 만료 시 자동 갱신
# AgentCore Identity가 자동 처리
```

### 3. 1회성 자격 증명

```python
# 민감한 작업은 매번 재인증
@requires_access_token(
    provider_name="banking-api",
    force_authentication=True  # Token Vault 재사용 안 함
)
async def transfer_money(amount: float, access_token: str):
    # 매번 사용자 인증 필요
    ...
```

### 4. Session Binding 필수

```python
# Callback URL 반드시 구현
callback_url="https://myapp.com/oauth/callback"

# Callback에서 사용자 검증
def handle_callback(request):
    # 1. 현재 로그인된 사용자 확인
    # 2. CompleteResourceTokenAuth 호출
    # 3. 사용자 일치 시에만 완료
```

### 5. CloudTrail 감사

```python
# Token Vault 접근 로깅 활성화
# CloudTrail에서 다음 이벤트 모니터링:
# - GetWorkloadAccessToken
# - GetResourceOauth2Token
# - CompleteResourceTokenAuth
```

## 제약사항

- Credential Provider당 최대 10개 OAuth 스코프
- Token Vault 토큰 크기: 최대 4KB
- 계정당 최대 100개 Workload Identity
- Authorization Code 유효기간: 10분
- Refresh Token 유효기간: Provider 설정에 따름
- Workload Access Token 유효기간: 1시간

## 비교: 직접 구현 vs AgentCore Identity

| 측면 | 직접 구현 | AgentCore Identity |
|------|----------|-------------------|
| **인증 로직** | 각 도구별 개별 구현 | SDK decorator로 자동화 |
| **자격 증명 저장** | 직접 암호화/저장 | Token Vault 자동 관리 |
| **토큰 갱신** | 수동 Refresh Token 처리 | 자동 갱신 |
| **권한 격리** | 직접 구현 | Agent+사용자 조합 자동 격리 |
| **감사 로깅** | 직접 구현 | CloudTrail 자동 로깅 |
| **IdP 통합** | 각 IdP별 구현 | 표준 OAuth 2.0 지원 |
| **Session Binding** | 직접 구현 | CompleteResourceTokenAuth API |
| **개발 시간** | 수주 | 수일 |
