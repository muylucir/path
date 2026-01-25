# MCP Client 패턴

Strands Agent SDK에서 MCP (Model Context Protocol) 서버의 도구를 사용하는 올바른 패턴입니다.

> ⚠️ **AgentCore Runtime 사용자 주의**
> - `stdio_client` 패턴은 **로컬 개발 전용**입니다
> - AgentCore Runtime 샌드박스에서는 외부 프로세스 실행이 불가합니다
> - AgentCore 배포 시 `streamablehttp_client`만 사용 가능
> - stdio MCP가 필요하면 Gateway Target 또는 Standalone MCP로 대체

## 잘못된 패턴 (절대 사용 금지!)

```python
# ⚠️ TypeError 발생! - MCPClient는 이런 인자를 받지 않습니다
MCPClient(name="slack", transport="http", url="https://...")
MCPClient(transport="sse", url="https://...")
MCPClient(url="https://mcp.example.com")

# ⚠️ 잘못된 패턴 - lambda 없이 직접 호출
MCPClient(streamablehttp_client(url="https://..."))  # 즉시 실행됨!

# ⚠️ 구버전 API - MCP SDK 1.x에서는 작동하지 않음
from mcp import sse_client  # ImportError!
```

## 올바른 패턴 요약

| Transport | 패턴 | AgentCore 지원 |
|-----------|------|--------------|
| streamablehttp (Gateway/Standalone) | `MCPClient(lambda: streamablehttp_client(url="..."))` | ✅ |
| stdio (로컬 전용) | `MCPClient(lambda: stdio_client(StdioServerParameters(...)))` | ❌ |

**핵심**: 반드시 `lambda`로 감싸서 지연 실행!

---

## 1. SSE/HTTP Transport (가장 일반적)

AgentCore Gateway나 원격 MCP 서버에 연결할 때 사용합니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
import os

# ✅ 올바른 Streamable HTTP 클라이언트 생성
def get_gateway_mcp():
    return MCPClient(lambda: streamablehttp_client(
        url=os.environ.get("MCP_GATEWAY_URL", "https://mcp-gateway.example.com/mcp")
    ))

# Agent에서 사용
model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

mcp_client = get_gateway_mcp()

# Context manager로 도구 가져오기
with mcp_client:
    tools = mcp_client.list_tools_sync()

agent = Agent(
    model=model,
    tools=tools,
    system_prompt="You are a helpful assistant."
)

# Agent 실행 시에도 context manager 필요
with mcp_client:
    result = agent("Use the tools to help me")
```

## 2. stdio Transport (로컬 개발 전용 - AgentCore 미지원)

> ⚠️ **AgentCore Runtime에서 실행 불가**: stdio 기반 MCP 서버는 npx/uvx 프로세스를 실행해야 하므로
> AgentCore Runtime의 샌드박스 환경에서 사용할 수 없습니다. 로컬 개발/테스트 용도로만 사용하세요.

로컬에서 실행되는 MCP 서버 (npx로 실행하는 공식 MCP 서버 등)에 연결할 때 사용합니다.

### Slack MCP Server

```python
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters
import os

def get_slack_mcp():
    """Slack MCP Server 클라이언트 생성"""
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="npx",
            args=["-y", "@anthropic/slack-mcp-server"],
            env={
                "SLACK_BOT_TOKEN": os.environ.get("SLACK_BOT_TOKEN"),
                "SLACK_TEAM_ID": os.environ.get("SLACK_TEAM_ID")
            }
        )
    ))
```

### GitHub MCP Server

```python
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters
import os

def get_github_mcp():
    """GitHub MCP Server 클라이언트 생성"""
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="npx",
            args=["-y", "@modelcontextprotocol/server-github"],
            env={
                "GITHUB_PERSONAL_ACCESS_TOKEN": os.environ.get("GITHUB_TOKEN")
            }
        )
    ))
```

### Brave Search MCP Server

```python
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters
import os

def get_brave_search_mcp():
    """Brave Search MCP Server 클라이언트 생성"""
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="npx",
            args=["-y", "@anthropic/brave-search-mcp-server"],
            env={
                "BRAVE_API_KEY": os.environ.get("BRAVE_API_KEY")
            }
        )
    ))
```

### PostgreSQL MCP Server

```python
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters
import os

def get_postgres_mcp():
    """PostgreSQL MCP Server 클라이언트 생성"""
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="npx",
            args=[
                "-y",
                "@modelcontextprotocol/server-postgres",
                os.environ.get("DATABASE_URL")
            ]
        )
    ))
```

## 3. 여러 MCP 서버 사용

여러 MCP 서버의 도구를 하나의 Agent에서 사용할 수 있습니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
from mcp import stdio_client, StdioServerParameters
import os

# 여러 MCP 클라이언트 생성
def get_all_mcp_clients():
    return [
        # Gateway (Streamable HTTP)
        MCPClient(lambda: streamablehttp_client(
            url=os.environ.get("MCP_GATEWAY_URL")
        )),
        # Slack (stdio)
        MCPClient(lambda: stdio_client(
            StdioServerParameters(
                command="npx",
                args=["-y", "@anthropic/slack-mcp-server"],
                env={"SLACK_BOT_TOKEN": os.environ.get("SLACK_BOT_TOKEN")}
            )
        )),
        # GitHub (stdio)
        MCPClient(lambda: stdio_client(
            StdioServerParameters(
                command="npx",
                args=["-y", "@modelcontextprotocol/server-github"],
                env={"GITHUB_PERSONAL_ACCESS_TOKEN": os.environ.get("GITHUB_TOKEN")}
            )
        ))
    ]

# 모든 도구 수집
all_tools = []
mcp_clients = get_all_mcp_clients()

for client in mcp_clients:
    with client:
        tools = client.list_tools_sync()
        all_tools.extend(tools)

# Agent 생성
model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

agent = Agent(
    model=model,
    tools=all_tools,
    system_prompt="You have access to multiple services including Slack and GitHub."
)

# 실행 시 모든 클라이언트의 context manager 사용
from contextlib import ExitStack

with ExitStack() as stack:
    for client in mcp_clients:
        stack.enter_context(client)
    result = agent("Send a Slack message and create a GitHub issue")
```

## 4. AgentCore Gateway 연결

AgentCore Gateway로 배포된 MCP 서버에 연결하는 패턴입니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
import os

# AgentCore Gateway URL 형식
# https://<gateway-id>.gateway.bedrock-agentcore.<region>.amazonaws.com/mcp

def get_agentcore_gateway_mcp():
    """AgentCore Gateway MCP 클라이언트"""
    gateway_url = os.environ.get(
        "AGENTCORE_GATEWAY_URL",
        "https://abc123.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp"
    )
    return MCPClient(lambda: streamablehttp_client(url=gateway_url))

# 사용 예시
model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

mcp_client = get_agentcore_gateway_mcp()

with mcp_client:
    tools = mcp_client.list_tools_sync()
    print(f"Available tools: {[t.name for t in tools]}")

agent = Agent(model=model, tools=tools)

with mcp_client:
    result = agent("Use the available tools")
```

## 5. AgentCore 배포용 전체 예시

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
import os

# ===== Global State =====
_agent = None
_mcp_clients = []
_initialized = False

def _initialize():
    global _agent, _mcp_clients, _initialized
    if _initialized:
        return _agent, _mcp_clients

    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.tools.mcp import MCPClient
    from mcp.client.streamable_http import streamablehttp_client

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )

    # MCP 클라이언트 설정
    gateway_url = os.environ.get("MCP_GATEWAY_URL")
    if gateway_url:
        _mcp_clients.append(MCPClient(lambda url=gateway_url: streamablehttp_client(url=url)))

    # 모든 도구 수집
    all_tools = []
    for client in _mcp_clients:
        with client:
            tools = client.list_tools_sync()
            all_tools.extend(tools)

    _agent = Agent(
        model=model,
        tools=all_tools if all_tools else None,
        system_prompt="You are a helpful assistant with MCP tool access."
    )

    _initialized = True
    return _agent, _mcp_clients

# ===== App Entry Point =====
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    from contextlib import ExitStack

    agent, mcp_clients = _initialize()
    message = payload.get("prompt", "Hello!")

    with ExitStack() as stack:
        for client in mcp_clients:
            stack.enter_context(client)
        result = agent(message)

    return {"response": str(result)}
```

## Context Manager 중요성

MCP 클라이언트는 반드시 context manager (`with` 문)와 함께 사용해야 합니다.

```python
# ✅ 올바른 사용
with mcp_client:
    tools = mcp_client.list_tools_sync()
    result = agent(message)

# ⚠️ 잘못된 사용 - 연결이 제대로 관리되지 않음
tools = mcp_client.list_tools_sync()  # 에러 발생 가능
```

## 환경 변수 설정

MCP 서버 연결에 필요한 환경 변수들:

```bash
# AgentCore Gateway
export MCP_GATEWAY_URL="https://abc123.execute-api.us-west-2.amazonaws.com/sse"

# Slack
export SLACK_BOT_TOKEN="xoxb-..."
export SLACK_TEAM_ID="T..."

# GitHub
export GITHUB_TOKEN="ghp_..."

# Brave Search
export BRAVE_API_KEY="BSA..."

# PostgreSQL
export DATABASE_URL="postgresql://user:pass@host:5432/db"
```

## 6. stdio MCP → Gateway 대체 패턴

stdio 기반 MCP 서버를 AgentCore에서 사용해야 한다면 다음 대안을 사용하세요:

### 방법 1: Gateway API Target으로 변환

외부 API를 OpenAPI 스펙으로 등록하여 Gateway를 통해 접근:

```python
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
import os

# Gateway를 통해 외부 API 호출 (예: Slack API)
def get_gateway_client():
    return MCPClient(lambda: streamablehttp_client(
        url=os.environ.get("GATEWAY_URL"),
        headers={"Authorization": f"Bearer {os.environ.get('ACCESS_TOKEN', '')}"}
    ))
```

### 방법 2: Lambda Target으로 구현

Lambda 함수로 동일 기능 구현 후 Gateway에 등록:

```python
# Lambda 함수에서 외부 서비스 호출 로직 구현
# Gateway는 Lambda를 MCP 도구로 노출
def get_lambda_mcp_client():
    gateway_url = os.environ.get("GATEWAY_URL")
    return MCPClient(lambda: streamablehttp_client(url=gateway_url))
```

### 방법 3: Standalone MCP로 재구현

FastMCP로 동일 도구를 구현하여 별도 Runtime에 배포:

```python
# Standalone MCP Runtime URL 사용
def get_standalone_mcp_client():
    mcp_endpoint = os.environ.get("MCP_ENDPOINT")
    return MCPClient(lambda: streamablehttp_client(url=mcp_endpoint))
```

---

## 주의사항

1. **lambda 필수**: `MCPClient(lambda: ...)` 형태로 지연 실행
2. **Context Manager 필수**: 도구 목록 조회 및 Agent 실행 시 `with` 문 사용
3. **환경 변수 관리**: API 키와 토큰은 환경 변수로 관리
4. **에러 처리**: MCP 서버 연결 실패에 대한 예외 처리 추가
5. **AgentCore 배포 시**: stdio transport는 사용 불가, streamablehttp만 사용
