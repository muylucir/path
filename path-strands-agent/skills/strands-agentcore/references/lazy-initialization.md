# Lazy Initialization 패턴

AgentCore Runtime은 모듈 로드 시 **30초 타임아웃**이 있습니다. Agent, Model, MCP Client, Memory 등 무거운 객체를 모듈 레벨에서 생성하면 타임아웃으로 배포가 실패합니다.

## 왜 필요한가?

```python
# ⚠️ 잘못된 패턴 - 모듈 로드 시 초기화 (타임아웃 발생!)
from strands import Agent
from strands.models.bedrock import BedrockModel

model = BedrockModel(...)  # 여기서 AWS 연결 시도
agent = Agent(model=model)  # 30초 내에 완료되지 않으면 실패!
```

## Pattern 1: Basic Agent

가장 기본적인 Lazy Initialization 패턴입니다.

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# ===== Global State =====
_agent = None
_initialized = False

def _initialize():
    """첫 호출 시에만 Agent 초기화"""
    global _agent, _initialized
    if _initialized:
        return _agent

    from strands import Agent
    from strands.models.bedrock import BedrockModel

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )
    _agent = Agent(model=model)
    _initialized = True
    return _agent

# ===== App Entry Point =====
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent = _initialize()
    message = payload.get("prompt", "Hello!")
    result = agent(message)
    return {"response": str(result)}
```

## Pattern 2: With Custom Tools

`@tool` 데코레이터로 정의한 도구를 Agent에 추가합니다.

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands.tools import tool

# ===== Custom Tools =====
@tool
def search_database(query: str) -> str:
    """데이터베이스에서 정보를 검색합니다."""
    # 실제 검색 로직
    return f"Results for: {query}"

@tool
def send_notification(message: str, recipient: str) -> str:
    """사용자에게 알림을 전송합니다."""
    # 실제 알림 전송 로직
    return f"Sent '{message}' to {recipient}"

# ===== Lazy Initialization =====
_agent = None
_initialized = False

def _initialize():
    global _agent, _initialized
    if _initialized:
        return _agent

    from strands import Agent
    from strands.models.bedrock import BedrockModel

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )
    _agent = Agent(
        model=model,
        tools=[search_database, send_notification],
        system_prompt="You are a helpful assistant with access to database and notification tools."
    )
    _initialized = True
    return _agent

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent = _initialize()
    message = payload.get("prompt", "Hello!")
    result = agent(message)
    return {"response": str(result)}
```

## Pattern 3: With MCP Client

MCP 서버의 도구를 사용하는 패턴입니다. **반드시 context manager 사용!**

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
import os

# ===== Lazy Initialization with MCP =====
_agent = None
_mcp_client = None
_initialized = False

def _initialize():
    global _agent, _mcp_client, _initialized
    if _initialized:
        return _agent, _mcp_client

    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.tools.mcp import MCPClient
    from mcp.client.streamable_http import streamablehttp_client

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )

    # MCP Client 생성 - lambda 패턴 필수!
    _mcp_client = MCPClient(lambda: streamablehttp_client(
        url=os.environ.get("MCP_SERVER_URL", "https://mcp.example.com/mcp")
    ))

    # Context manager로 도구 가져오기
    with _mcp_client:
        tools = _mcp_client.list_tools_sync()

    _agent = Agent(
        model=model,
        tools=tools,
        system_prompt="You are a helpful assistant."
    )
    _initialized = True
    return _agent, _mcp_client

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent, mcp_client = _initialize()
    message = payload.get("prompt", "Hello!")

    # MCP 도구 사용 시에도 context manager 필요
    with mcp_client:
        result = agent(message)

    return {"response": str(result)}
```

## Pattern 4: With AgentCore Memory

AgentCore Memory 서비스를 사용하는 패턴입니다.

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
    memory_config = AgentCoreMemoryConfig(
        memory_id=os.environ.get("AGENTCORE_MEMORY_ID"),
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

    # Session Manager 생성
    session_manager = AgentCoreMemorySessionManager(
        memory_config=memory_config,
        namespace="/conversations"
    )

    _agent = Agent(
        model=model,
        session_manager=session_manager,
        system_prompt="You are a helpful assistant with memory capabilities."
    )
    _initialized = True
    return _agent

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent = _initialize()
    message = payload.get("prompt", "Hello!")
    session_id = payload.get("session_id", "default")

    result = agent(message, session_id=session_id)
    return {"response": str(result)}
```

## Pattern 5: Async Streaming

비동기 스트리밍 응답을 위한 패턴입니다.

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

_agent = None
_initialized = False

def _initialize():
    global _agent, _initialized
    if _initialized:
        return _agent

    from strands import Agent
    from strands.models.bedrock import BedrockModel

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )
    _agent = Agent(model=model)
    _initialized = True
    return _agent

app = BedrockAgentCoreApp()

@app.entrypoint
async def invoke(payload: dict, context: dict):
    agent = _initialize()
    message = payload.get("prompt", "Hello!")

    # 스트리밍 응답
    response_text = ""
    async for event in agent.stream_async(message):
        if hasattr(event, "content"):
            response_text += event.content
            yield {"chunk": event.content}

    yield {"response": response_text, "done": True}
```

## Pattern 6: Graph with Lazy Init

GraphBuilder를 사용하는 복잡한 워크플로우의 Lazy Initialization입니다.

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

_graph = None
_initialized = False

def _initialize():
    global _graph, _initialized
    if _initialized:
        return _graph

    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.graph import GraphBuilder

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )

    # Agent 정의
    analyzer = Agent(model=model, system_prompt="You analyze user requests.")
    executor = Agent(model=model, system_prompt="You execute tasks.")
    reviewer = Agent(model=model, system_prompt="You review results.")

    # Graph 정의
    builder = GraphBuilder()
    builder.add_node("analyze", analyzer)
    builder.add_node("execute", executor)
    builder.add_node("review", reviewer)

    builder.set_entry_point("analyze")
    builder.add_edge("analyze", "execute")
    builder.add_edge("execute", "review")
    builder.set_finish_point("review")

    _graph = builder.compile()
    _initialized = True
    return _graph

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    graph = _initialize()
    message = payload.get("prompt", "Hello!")

    result = graph.invoke({"input": message})
    return {"response": result}
```

## 주의사항

1. **모듈 레벨 import 최소화**: `strands`, `strands.models` 등 무거운 모듈은 `_initialize()` 함수 내에서 import
2. **전역 변수 사용**: `_initialized` 플래그로 중복 초기화 방지
3. **Context Manager**: MCP Client 사용 시 반드시 `with` 문 사용
4. **환경 변수**: 민감한 설정은 환경 변수로 관리
