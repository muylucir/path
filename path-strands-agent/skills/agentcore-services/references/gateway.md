# AgentCore Gateway

## 개념
- **MCP 서버 변환**: Lambda, API, Smithy 모델을 MCP 도구로 변환
- **OAuth 인증**: Cognito 기반 보안
- **도구 디스커버리**: Agent가 자동으로 도구 발견

## Gateway 생성
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

## Agent 통합
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

## 제약사항
- Gateway당 최대 50개 도구
- Lambda 타임아웃: 최대 15분
- OAuth 토큰 유효기간: 1시간 (자동 갱신 필요)
- API 호출 제한: 초당 100 TPS
