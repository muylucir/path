# AgentCore Identity

## 개념
Amazon Cognito 기반의 AI Agent 전용 신원 및 자격증명 관리 서비스입니다.

**핵심 기능:**
- **중앙화된 Agent 신원 관리**: 모든 Agent에 고유 ARN 부여
- **Token Vault**: OAuth 토큰, API 키를 KMS 암호화하여 저장
- **OAuth 2.0 플로우 지원**: 2LO, 3LO 자동 처리
- **위임 인증**: Agent가 사용자 대신 리소스 접근

## Agent 신원 생성

```python
from bedrock_agentcore.identity import IdentityClient

client = IdentityClient(region_name="us-west-2")

# Agent 신원 생성
workload_identity = client.create_workload_identity(
    name="CalendarSchedulerAgent",
    description="Schedules meetings in Google Calendar"
)

# ARN 예시: arn:aws:bedrock-agentcore:us-west-2:123456789012:workload-identity/abc123
```

## OAuth 2.0 플로우

### 2LO (Client Credentials) - 사용자 개입 없음

```python
# OAuth Provider 생성
provider = client.create_oauth2_credential_provider(
    name="SlackProvider",
    oauth_config={
        "clientId": "slack-client-id",
        "clientSecret": "slack-client-secret",
        "tokenEndpoint": "https://slack.com/api/oauth.v2.access",
        "scopes": ["chat:write", "channels:read"]
    }
)

@app.entrypoint
def invoke(payload, context):
    # Agent 토큰 획득
    agent_token = client.get_workload_access_token(
        workload_identity_id=context.workload_identity_id
    )

    # OAuth 리소스 토큰 획득
    resource_token = client.get_resource_oauth2_token(
        workload_access_token=agent_token,
        credential_provider_id=provider["id"],
        grant_type="client_credentials"
    )
```

### 3LO (Authorization Code) - 사용자 동의 필요

```python
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
    user_jwt = payload.get("user_access_token")

    agent_token = client.get_workload_access_token_for_jwt(
        workload_identity_id=context.workload_identity_id,
        jwt_token=user_jwt
    )

    try:
        resource_token = client.get_resource_oauth2_token(
            workload_access_token=agent_token,
            credential_provider_id=google_provider["id"],
            grant_type="authorization_code"
        )
    except NeedsUserConsentError as e:
        return {"status": "needs_consent", "authorization_url": e.authorization_url}
```

## 보안 모범 사례

1. **최소 권한 원칙**: OAuth Scope를 최소한으로 제한
2. **토큰 관리**: Refresh Token 활용, 고객 관리형 KMS 키 사용
3. **감사 추적**: CloudTrail로 Token Vault 접근 로깅
4. **사용자 동의**: 3LO 플로우에서 명시적 동의 획득

## 제약사항
- Credential Provider당 최대 10개 OAuth 스코프
- Token Vault 토큰 크기: 최대 4KB
- 계정당 최대 100개 Workload Identity
- Authorization Code 유효기간: 10분
