# AgentCore Gateway

## 개념

Amazon Bedrock AgentCore Gateway는 **AI Agent의 도구 관리 복잡성을 해결하는 완전 관리형 중앙 집중식 허브**입니다.

**핵심 가치:**
- **통합 인터페이스**: 여러 MCP 서버와 도구를 단일 엔드포인트로 통합
- **자동 변환**: REST API, Lambda, Smithy 모델을 MCP 도구로 자동 변환
- **시맨틱 검색**: 자연어 쿼리로 수천 개 도구 중 적합한 도구만 선별
- **엔터프라이즈 보안**: Inbound/Outbound 이중 인증, IAM 및 OAuth 지원
- **서버리스**: 자동 확장, 인프라 관리 불필요

## 도구 관리 복잡성 문제

### 기존 방식의 문제점

**N×M 복잡성**: N개 Agent × M개 도구 = 기하급수적 복잡도 증가

```
Agent 1 → Tool A (API 방식 A, 인증 A)
       → Tool B (API 방식 B, 인증 B)
       → Tool C (API 방식 C, 인증 C)

Agent 2 → Tool A (중복 구현)
       → Tool B (중복 구현)
       → Tool D (새로운 통합)
```

**문제점:**
- 각 도구의 API 방식, 인증 방법을 개별 관리
- 새 도구 추가 시 모든 Agent 코드 수정
- 수백 개 Agent × 수천 개 도구 = 관리 불가능

### MCP 표준의 등장

MCP(Model Context Protocol)는 표준 인터페이스를 제공:
- `list_tools()`: 사용 가능한 도구 목록
- `call_tool()`: 도구 호출

**하지만 여전히 남은 문제:**
- MCP 서버를 직접 구축/관리
- 각 MCP 서버 엔드포인트 개별 관리
- 인증/권한 처리 복잡
- 수백 개 MCP 서버 운영 부담

### AgentCore Gateway의 해결책

```
Before: Agent → MCP Server 1 (endpoint 1, auth 1)
             → MCP Server 2 (endpoint 2, auth 2)
             → MCP Server 3 (endpoint 3, auth 3)

After:  Agent → AgentCore Gateway (단일 endpoint)
                  ├─ MCP Server 1
                  ├─ MCP Server 2
                  ├─ Lambda Functions
                  ├─ REST APIs
                  └─ Integration Templates
```

**이점:**
- 단일 엔드포인트로 모든 도구 접근
- 인증/권한은 Gateway가 처리
- 서버리스 자동 확장
- 도구 추가 시 Agent 코드 변경 불필요

## 주요 기능

### 1. 자동 MCP 도구 변환

기존 리소스를 MCP 도구로 자동 변환:

| 소스 | 필요 정보 | 변환 결과 |
|------|----------|----------|
| **AWS Lambda** | Lambda ARN + JSON 스키마 | MCP 도구 |
| **REST API** | OpenAPI 사양 (S3) | MCP 도구 |
| **Smithy 모델** | Smithy 사양 (S3) | MCP 도구 |
| **MCP 서버** | MCP 서버 URL | 통합 |
| **Integration Templates** | 템플릿 선택 (Slack, Jira 등) | 즉시 사용 가능 |

**장점:**
- MCP 서버 직접 구축 불필요
- 기존 API/Lambda 재사용
- 인프라 관리 없음

### 2. 통합 인터페이스

**Before (1:1 관계):**
```
MCP Client 1 → MCP Server 1
MCP Client 2 → MCP Server 2
MCP Client 3 → MCP Server 3
```

**After (1:N 관계):**
```
MCP Client → AgentCore Gateway → MCP Server 1
                               → MCP Server 2
                               → Lambda Functions
                               → REST APIs
```

**표준 MCP 작업:**
```json
// 도구 목록 조회
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}

// 도구 호출
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {...}
  },
  "id": 2
}
```

### 3. 시맨틱 도구 검색

**문제**: 수천 개 도구를 모두 프롬프트에 포함 시
- 토큰 사용량 폭증
- 지연 시간 증가
- 도구 선택 정확도 저하

**해결**: `x_amz_bedrock_agentcore_search` 빌트인 도구

```python
# 자연어 쿼리로 도구 검색
tools_found = tool_search(
    gateway_endpoint=gateway_url,
    jwt_token=token,
    query="find me 3 credit research tools"
)
# → 가장 관련성 높은 도구만 반환 (오름차순)
```

**활성화 방법:**
```python
search_config = {
    "mcp": {
        "searchType": "SEMANTIC",
        "supportedVersions": ["2025-03-26"]
    }
}

gateway = client.create_gateway(
    name="MyGateway",
    protocolConfiguration=search_config
)
```

**빌트인 도구 스키마:**
```json
{
  "name": "x_amz_bedrock_agentcore_search",
  "description": "Returns a trimmed down list of tools given a context",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "search query to use for finding tools"
      }
    },
    "required": ["query"]
  }
}
```

### 4. 이중 인증 모델

#### Inbound Auth (Gateway 진입)

MCP 클라이언트 → Gateway 요청 검증

**지원 방식:**
- OAuth 2.0 JWT (Bearer Token)
- Amazon Cognito, Okta, Auth0 등 OIDC 제공자

**검증 항목:**
- Discovery URL 기반 JWT 유효성
- `aud`, `client_id` 클레임 검증
- Allowed Clients 확인

```python
auth_config = {
    "customJWTAuthorizer": {
        "discoveryUrl": "https://cognito-idp.us-west-2.amazonaws.com/pool/.well-known/openid-configuration",
        "allowedClients": ["client-id-1", "client-id-2"]
    }
}
```

#### Outbound Auth (Target 접근)

Gateway → Target 리소스 인증

| Target 타입 | 인증 방식 |
|-------------|----------|
| **AWS Lambda** | IAM Role (최소 권한 원칙) |
| **Smithy 모델** | IAM Role |
| **REST API (OpenAPI)** | API Key 또는 OAuth 2LO |
| **MCP 서버** | 서버별 인증 설정 |

**API Key 예시:**
```python
credential_config = {
    "credentialProviderType": "API_KEY",
    "credentialProvider": {
        "apiKeyCredentialProvider": {
            "providerArn": "arn:aws:...:apikeycredentialprovider/abc",
            "credentialLocation": "HEADER",  # or "QUERY"
            "credentialParameterName": "X-API-Key"
        }
    }
}
```

**OAuth 2LO 예시:**
```python
client.create_oauth2_credential_provider(
    name="CustomOAuthTokenCfg",
    credentialProviderVendor="CustomOauth2",
    oauth2ProviderConfigInput={
        "clientId": "...",
        "clientSecret": "...",
        "tokenEndpoint": "https://..."
    }
)
```

## Target 타입

### 1. MCP Server Target

기존 MCP 서버를 Gateway에 연결

**사용 사례:**
- 로컬 도구 제공
- 커스텀 데이터 접근
- 특수 함수 제공

**구성:**
```python
target_config = {
    "mcp": {
        "mcpServer": {
            "url": "https://my-mcp-server.com/mcp"
        }
    }
}
```

### 2. REST API Target (OpenAPI/Smithy)

기존 REST API를 MCP 도구로 변환

**필요 정보:**
- 호스팅 중인 REST API 서버
- OpenAPI 사양 (S3에 업로드)

**구성:**
```python
target_config = {
    "mcp": {
        "openApiSchema": {
            "s3": {
                "uri": "s3://bucket/path/openapi-spec.json",
                "bucketOwnerAccountId": "123456789012"
            }
        }
    }
}

client.create_gateway_target(
    gatewayIdentifier="gateway-id",
    name="SearchAPITarget",
    targetConfiguration=target_config,
    credentialProviderConfigurations=[...]
)
```

**도구 이름 형식**: `${target_name}__${tool_name}`

### 3. AWS Lambda Target

Lambda 함수를 MCP 도구로 직접 사용

**필요 정보:**
- Lambda ARN
- 도구 JSON 스키마

**구성:**
```python
lambda_target_config = {
    "mcp": {
        "lambda": {
            "lambdaArn": "arn:aws:lambda:us-west-2:123456789012:function:my-function",
            "toolSchema": {
                "inlinePayload": [
                    {
                        "name": "create_booking",
                        "description": "Create a new booking",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "restaurant_name": {"type": "string"},
                                "guest_name": {"type": "string"},
                                "num_guests": {"type": "integer"}
                            },
                            "required": ["restaurant_name", "guest_name", "num_guests"]
                        }
                    }
                ]
            }
        }
    }
}
```

**Lambda 함수 구현 규칙:**

```python
def lambda_handler(event, context):
    # context.client_context.custom에서 메타데이터 추출
    tool_name = context.client_context.custom['bedrockAgentCoreToolName']
    gateway_id = context.client_context.custom['bedrockAgentCoreGatewayId']
    target_id = context.client_context.custom['bedrockAgentCoreTargetId']
    session_id = context.client_context.custom['bedrockAgentCoreSessionId']
    
    # 도구 이름에서 prefix 제거
    delimiter = "___"
    if delimiter in tool_name:
        tool_name = tool_name[tool_name.index(delimiter) + len(delimiter):]
    
    # event는 inputSchema와 일치
    if tool_name == "create_booking":
        restaurant_name = event["restaurant_name"]
        guest_name = event["guest_name"]
        num_guests = event["num_guests"]
        
        return {
            "statusCode": 200,
            "body": f"Booking for {num_guests} guests at {restaurant_name} created"
        }
    
    return {"statusCode": 400, "body": "Unknown tool"}
```

**Context 메타데이터:**
- `bedrockAgentCoreGatewayId`: Gateway ID
- `bedrockAgentCoreTargetId`: Target ID
- `bedrockAgentCoreToolName`: 도구 이름 (prefix 포함)
- `bedrockAgentCoreSessionId`: 세션 ID
- `bedrockAgentCoreMessageVersion`: 메시지 버전

### 4. Integration Templates Target

사전 구성된 써드파티 서비스 템플릿

**지원 서비스:**
- Amazon (CloudWatch, DynamoDB, Bedrock)
- Jira, Confluence
- Slack, Zoom
- Tavily
- 기타 엔터프라이즈 서비스

**예시: CloudWatch 템플릿**
- 알람 히스토리 검색
- 대시보드 정보 조회
- 메트릭 리스트 조회

**예시: DynamoDB 템플릿**
- 테이블 생성
- 아이템 조회/업데이트
- 쿼리/스캔

**사용 방법:**
1. 콘솔에서 Integration Provider 선택
2. 템플릿 선택 (예: CloudWatch)
3. 자격 증명 구성
4. 즉시 사용 가능

## Gateway 생성 워크플로우

### 1. Inbound Auth 구성

```python
# Cognito 기반 OAuth 설정
auth_config = {
    "customJWTAuthorizer": {
        "discoveryUrl": "https://cognito-idp.us-west-2.amazonaws.com/pool/.well-known/openid-configuration",
        "allowedClients": ["client-id"]
    }
}
```

### 2. Gateway 생성

**CLI:**
```bash
agentcore create_mcp_gateway \
  --region us-west-2 \
  --name my-gateway \
  --role-arn arn:aws:iam::123456789012:role/gateway-role \
  --authorizer-config '{"customJWTAuthorizer": {...}}' \
  --enable_semantic_search
```

**Boto3:**
```python
import boto3

client = boto3.client('bedrock-agentcore-control')

response = client.create_gateway(
    name='my-gateway',
    roleArn='arn:aws:iam::123456789012:role/gateway-role',
    protocolType='MCP',
    authorizerType='CUSTOM_JWT',
    authorizerConfiguration=auth_config,
    protocolConfiguration={
        "mcp": {
            "searchType": "SEMANTIC",
            "supportedVersions": ["2025-03-26"]
        }
    }
)

gateway_id = response["gatewayId"]
gateway_url = response["gatewayUrl"]  # https://{gateway-id}.gateway.bedrock-agentcore.{region}.amazonaws.com/mcp
```

### 3. Outbound Auth 구성

**API Key:**
```python
client.create_api_key_credential_provider(
    name="CustomAPIKey",
    apiKey="your-api-key"
)
```

**OAuth 2LO:**
```python
client.create_oauth2_credential_provider(
    name="CustomOAuthTokenCfg",
    credentialProviderVendor="CustomOauth2",
    oauth2ProviderConfigInput={
        "clientId": "...",
        "clientSecret": "...",
        "tokenEndpoint": "https://oauth.example.com/token",
        "scopes": ["read", "write"]
    }
)
```

### 4. Target 생성

**Lambda Target:**
```python
client.create_gateway_target(
    gatewayIdentifier=gateway_id,
    name="BookingLambda",
    targetConfiguration={
        "mcp": {
            "lambda": {
                "lambdaArn": "arn:aws:lambda:...:function:booking",
                "toolSchema": {"inlinePayload": [...]}
            }
        }
    },
    credentialProviderConfigurations=[
        {"credentialProviderType": "GATEWAY_IAM_ROLE"}
    ]
)
```

**OpenAPI Target:**
```python
client.create_gateway_target(
    gatewayIdentifier=gateway_id,
    name="SearchAPI",
    targetConfiguration={
        "mcp": {
            "openApiSchema": {
                "s3": {
                    "uri": "s3://bucket/openapi-spec.json",
                    "bucketOwnerAccountId": "123456789012"
                }
            }
        }
    },
    credentialProviderConfigurations=[
        {
            "credentialProviderType": "API_KEY",
            "credentialProvider": {
                "apiKeyCredentialProvider": {
                    "providerArn": "arn:aws:...:apikeycredentialprovider/abc",
                    "credentialLocation": "HEADER",
                    "credentialParameterName": "X-API-Key"
                }
            }
        }
    ]
)
```

## Strands Agent 통합

### 방법 1: MCP Client 사용

```python
from strands import Agent
from strands.tools.mcp.mcp_client import MCPClient
from mcp.client.streamable_http import streamablehttp_client

# MCP Client 생성
mcp_client = MCPClient(
    lambda: streamablehttp_client(
        gateway_url,
        headers={"Authorization": f"Bearer {access_token}"}
    )
)

# 도구 목록 조회 (페이지네이션 처리)
def get_all_tools(client):
    tools = []
    pagination_token = None
    
    while True:
        result = client.list_tools_sync(pagination_token=pagination_token)
        tools.extend(result)
        
        if result.pagination_token is None:
            break
        pagination_token = result.pagination_token
    
    return tools

# Agent에 도구 추가
with mcp_client:
    all_tools = get_all_tools(mcp_client)
    
    agent = Agent(
        model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
        tools=all_tools
    )
    
    result = agent("Create a booking for 4 people at Italian Restaurant")
```

### 방법 2: 시맨틱 검색 활용

```python
# 시맨틱 검색으로 관련 도구만 로드
def search_tools(gateway_url, token, query):
    response = requests.post(
        gateway_url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "x_amz_bedrock_agentcore_search",
                "arguments": {"query": query}
            }
        }
    )
    return response.json()["result"]["structuredContent"]["tools"]

# 사용자 질문에 맞는 도구만 로드
with mcp_client:
    tools_found = search_tools(
        gateway_url,
        token,
        query="tools for doing addition, subtraction, multiplication"
    )
    
    # 상위 5개 도구만 Agent에 추가
    agent = Agent(
        model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
        tools=tools_to_strands_tools(tools_found[:5], mcp_client)
    )
    
    result = agent("(10*2)/(5-3)")
```

### 방법 3: 직접 도구 호출 (Event Loop 우회)

```python
# Agent 생성
agent = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    tools=all_tools
)

# Event Loop 우회하여 직접 호출
direct_result = agent.tool.Calc2___add_numbers(
    firstNumber=10,
    secondNumber=20
)

print(direct_result)
# {"content": [{"text": "30"}]}
```

## 권한 부여 흐름

### 전체 플로우

```
1. Gateway 초기화
   → AgentCore Identity가 Workload Identity 자동 생성

2. Client 요청
   → OAuth2 JWT (Bearer Token) 포함

3. Inbound Auth
   → Gateway가 JWT 검증 (Discovery URL, aud, client_id)

4. Workload Access Token 획득
   → GetWorkloadAccessTokenForJWT API 호출
   → 단기 토큰 발급

5. Outbound Auth
   → Target 타입에 따라 자격 증명 사용
   → IAM Role / API Key / OAuth 2LO

6. Target 호출
   → Lambda 실행 / REST API 호출 / MCP 서버 호출

7. 응답 반환
   → Gateway → Client
```

## MCP Inspector로 Gateway 테스트

MCP Inspector는 MCP 서버를 테스트하고 디버깅하기 위한 개발자 도구입니다.
AgentCore Gateway도 MCP 서버로 동작하므로 Inspector로 테스트할 수 있습니다.

### 실행 방법

```bash
# 설치 없이 npx로 직접 실행
npx @modelcontextprotocol/inspector node build/index.js
```

**기본 포트:**
- 클라이언트 UI: http://localhost:6274
- 프록시 서버: http://localhost:6277

### 사용 방법

1. 브라우저에서 http://localhost:6274 접속
2. Gateway 엔드포인트 URL 입력
3. Authentication 정보 (Bearer Token) 입력
4. Connect 클릭

**제공 기능:**
- 서버 연결 상태 확인
- 도구/리소스 목록 시각화
- 실시간 도구 호출 테스트
- 응답 결과 확인

**활용 사례:**
- Gateway 연결 디버깅
- 도구 스키마 확인
- 도구 호출 테스트
- 응답 형식 검증

## 도구 호출 예시

### Curl

```bash
# 도구 목록 조회
curl -X POST https://gateway-id.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "list-tools",
    "method": "tools/list"
  }'

# 도구 호출
curl -X POST https://gateway-id.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": "call-tool",
    "method": "tools/call",
    "params": {
      "name": "searchProducts",
      "arguments": {
        "query": "wireless headphones",
        "maxResults": 2
      }
    }
  }'
```

### Python Requests

```python
import requests

# 도구 목록 조회 (페이지네이션)
def get_all_tools(gateway_url, token):
    tools = []
    next_cursor = None
    
    while True:
        payload = {
            "jsonrpc": "2.0",
            "id": "list-tools",
            "method": "tools/list",
            "params": {"cursor": next_cursor} if next_cursor else {}
        }
        
        response = requests.post(
            gateway_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json=payload
        )
        
        result = response.json()["result"]
        tools.extend(result["tools"])
        
        if "nextCursor" not in result:
            break
        next_cursor = result["nextCursor"]
    
    return tools

# 도구 호출
def call_tool(gateway_url, token, tool_name, arguments):
    response = requests.post(
        gateway_url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "jsonrpc": "2.0",
            "id": "call-tool",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
    )
    return response.json()
```

## Best Practices

### 1. 도구 지연 시간 최소화

- Gateway와 같은 리전에 Lambda 배치
- Lambda 콜드 스타트 최적화 (Provisioned Concurrency)
- REST API 저지연/고가용성 확보

### 2. 효율적인 도구 스키마

```python
# ✅ 좋은 스키마
{
    "name": "search_products",
    "description": "Search for products by query and category",
    "inputSchema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query (e.g., 'wireless headphones')"
            },
            "category": {
                "type": "string",
                "enum": ["Electronics", "Books", "Clothing"],
                "description": "Product category"
            }
        },
        "required": ["query"]
    }
}

# ❌ 나쁜 스키마
{
    "name": "search",  # 너무 모호
    "description": "Search",  # 설명 부족
    "inputSchema": {
        "type": "object",
        "properties": {
            "data": {"type": "object"}  # 타입 불명확
        }
    }
}
```

**원칙:**
- 스키마를 단순하게 유지
- 적절한 데이터 타입 사용
- 명확한 설명 포함
- 필수 필드 명시

### 3. API 그룹화 전략

**비즈니스 도메인별:**
```
Gateway 1: E-commerce Tools
  ├─ Product Search API
  ├─ Inventory Lambda
  └─ Order Management API

Gateway 2: Support Tools
  ├─ Ticket System API
  ├─ Knowledge Base Lambda
  └─ Email Notification API
```

**인증 방식별:**
```
Gateway 1: OAuth Tools
  ├─ Google Calendar
  ├─ Slack
  └─ GitHub

Gateway 2: API Key Tools
  ├─ Weather API
  ├─ Translation API
  └─ Analytics API
```

**API 타입별:**
```
Gateway 1: Lambda Functions
Gateway 2: REST APIs
Gateway 3: MCP Servers
```

### 4. 시맨틱 검색 활성화

**언제 사용:**
- 도구가 50개 이상
- 도메인이 다양함
- 도구 선택 정확도가 중요

**효과:**
- 프롬프트 크기 90% 감소
- 지연 시간 50% 단축
- 도구 선택 정확도 향상

### 5. 모니터링 및 최적화

**모니터링 항목:**
- 도구 호출 빈도
- 응답 시간
- 오류율
- 토큰 사용량

**최적화:**
- 자주 사용하는 도구는 Lambda Provisioned Concurrency
- 느린 API는 캐싱 레이어 추가
- 사용하지 않는 도구 제거

## 제약사항

- Gateway당 최대 Target: 50개
- Target당 최대 도구: 제한 없음 (단, 시맨틱 검색 권장)
- Lambda 타임아웃: 최대 15분
- OAuth 토큰 유효기간: 제공자 설정에 따름
- API 호출 제한: 계정당 TPS 제한 적용
- Namespace 깊이: 제한 없음 (단, 간결하게 유지 권장)

## 비교: 기존 방식 vs Gateway

| 측면 | 기존 방식 | AgentCore Gateway |
|------|----------|-------------------|
| **프로토콜 구현** | 직접 MCP 서버 구축/유지 | 자동 MCP 도구 변환 |
| **API 연동** | 수작업 API 래핑 | OpenAPI/Lambda → 즉시 도구화 |
| **인프라 운영** | 서버 관리, 스케일링 직접 처리 | 서버리스 자동 확장 |
| **보안/인증** | 복잡한 보안 로직 구현 | Inbound/Outbound 인증 내장 |
| **도구 탐색** | 도구 많아질수록 선택 어려움 | 시맨틱 검색으로 정확한 선택 |
| **비용** | 서버 운영 비용 | 사용량 기반 과금 |
| **확장성** | N×M 복잡도 | 선형 복잡도 |
