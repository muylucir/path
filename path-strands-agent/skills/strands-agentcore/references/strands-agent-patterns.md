# Strands Agent 패턴

Strands Agent SDK를 사용한 에이전트 구현 패턴입니다.

## 1. Basic Agent

가장 기본적인 단일 에이전트 패턴입니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

agent = Agent(
    model=model,
    system_prompt="You are a helpful assistant."
)

# 동기 호출
result = agent("What is the weather today?")

# 비동기 스트리밍
async for event in agent.stream_async("Tell me a story"):
    print(event.content)
```

## 2. Agent with Tools

`@tool` 데코레이터로 커스텀 도구를 정의합니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.tools import tool

@tool
def get_weather(city: str) -> str:
    """지정된 도시의 현재 날씨를 조회합니다.

    Args:
        city: 날씨를 조회할 도시 이름

    Returns:
        날씨 정보 문자열
    """
    # 실제 날씨 API 호출 로직
    return f"The weather in {city} is sunny, 25°C"

@tool
def search_database(query: str, limit: int = 10) -> list:
    """데이터베이스에서 정보를 검색합니다.

    Args:
        query: 검색 쿼리
        limit: 최대 결과 수 (기본값: 10)

    Returns:
        검색 결과 리스트
    """
    return [{"id": 1, "content": f"Result for: {query}"}]

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

agent = Agent(
    model=model,
    tools=[get_weather, search_database],
    system_prompt="You are a helpful assistant with access to weather and database tools."
)
```

## 3. GraphBuilder - Sequential Workflow

순차적으로 실행되는 워크플로우입니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.graph import GraphBuilder

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

# 각 단계별 Agent 정의
researcher = Agent(model=model, system_prompt="You research topics thoroughly.")
writer = Agent(model=model, system_prompt="You write clear, concise content.")
reviewer = Agent(model=model, system_prompt="You review and improve content.")

# Graph 구성
builder = GraphBuilder()
builder.add_node("research", researcher)
builder.add_node("write", writer)
builder.add_node("review", reviewer)

builder.set_entry_point("research")
builder.add_edge("research", "write")
builder.add_edge("write", "review")
builder.set_finish_point("review")

graph = builder.compile()

# 실행
result = graph.invoke({"input": "Write an article about AI agents"})
```

## 4. GraphBuilder - Conditional Edges

조건에 따라 다른 경로로 분기하는 워크플로우입니다.

**중요**: `add_conditional_edge`는 존재하지 않습니다! `add_edge`에 `condition` 파라미터를 사용합니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.graph import GraphBuilder

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

# Agents
classifier = Agent(model=model, system_prompt="Classify the request type: 'simple' or 'complex'")
simple_handler = Agent(model=model, system_prompt="Handle simple requests quickly.")
complex_handler = Agent(model=model, system_prompt="Handle complex requests thoroughly.")
finalizer = Agent(model=model, system_prompt="Finalize the response.")

# 조건 함수 정의
def is_simple(state: dict) -> bool:
    """분류 결과가 'simple'인지 확인"""
    return "simple" in state.get("classification", "").lower()

def is_complex(state: dict) -> bool:
    """분류 결과가 'complex'인지 확인"""
    return "complex" in state.get("classification", "").lower()

# Graph 구성
builder = GraphBuilder()
builder.add_node("classify", classifier)
builder.add_node("simple", simple_handler)
builder.add_node("complex", complex_handler)
builder.add_node("finalize", finalizer)

builder.set_entry_point("classify")

# ✅ 올바른 조건부 엣지 - add_edge에 condition 파라미터 사용
builder.add_edge("classify", "simple", condition=is_simple)
builder.add_edge("classify", "complex", condition=is_complex)

# 두 경로 모두 finalizer로 수렴
builder.add_edge("simple", "finalize")
builder.add_edge("complex", "finalize")

builder.set_finish_point("finalize")

graph = builder.compile()
```

## 5. GraphBuilder - Loop with Exit Condition

반복 작업 후 조건에 따라 종료하는 패턴입니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.graph import GraphBuilder

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

# Agents
executor = Agent(model=model, system_prompt="Execute the task and report progress.")
evaluator = Agent(model=model, system_prompt="Evaluate if the task is complete. Say 'DONE' if complete.")

# 완료 조건 확인
def is_done(state: dict) -> bool:
    return "DONE" in state.get("evaluation", "")

def not_done(state: dict) -> bool:
    return "DONE" not in state.get("evaluation", "")

# Graph 구성
builder = GraphBuilder()
builder.add_node("execute", executor)
builder.add_node("evaluate", evaluator)

builder.set_entry_point("execute")
builder.add_edge("execute", "evaluate")

# 완료 시 종료, 미완료 시 다시 실행
builder.add_edge("evaluate", "execute", condition=not_done)
builder.set_finish_point("evaluate", condition=is_done)

# 무한 루프 방지 - 필수!
builder.set_max_node_executions(10)  # 각 노드 최대 10회 실행
builder.set_execution_timeout(300)    # 전체 실행 5분 제한

graph = builder.compile()
```

## 6. Multi-Agent Collaboration

여러 에이전트가 협업하는 패턴입니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.graph import GraphBuilder

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

# 전문가 에이전트들
planner = Agent(
    model=model,
    system_prompt="""You are a project planner. Break down tasks into subtasks.
    Output format: {"subtasks": ["task1", "task2", ...]}"""
)

developer = Agent(
    model=model,
    system_prompt="You are a developer. Implement the given task."
)

tester = Agent(
    model=model,
    system_prompt="You are a QA tester. Test the implementation and report issues."
)

coordinator = Agent(
    model=model,
    system_prompt="You coordinate the team and compile final results."
)

# Graph 구성
builder = GraphBuilder()
builder.add_node("plan", planner)
builder.add_node("develop", developer)
builder.add_node("test", tester)
builder.add_node("coordinate", coordinator)

builder.set_entry_point("plan")
builder.add_edge("plan", "develop")
builder.add_edge("develop", "test")
builder.add_edge("test", "coordinate")
builder.set_finish_point("coordinate")

graph = builder.compile()
```

## 7. Hierarchical Agent Structure

상위 에이전트가 하위 에이전트를 관리하는 패턴입니다.

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands.tools import tool

model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="us-west-2"
)

# 하위 에이전트들
research_agent = Agent(
    model=model,
    system_prompt="You are a research specialist. Find and summarize information."
)

writing_agent = Agent(
    model=model,
    system_prompt="You are a writing specialist. Create well-structured content."
)

# 하위 에이전트를 도구로 래핑
@tool
def delegate_research(topic: str) -> str:
    """연구 전문 에이전트에게 조사를 위임합니다.

    Args:
        topic: 조사할 주제

    Returns:
        조사 결과
    """
    result = research_agent(f"Research the following topic: {topic}")
    return str(result)

@tool
def delegate_writing(content: str, style: str = "professional") -> str:
    """작문 전문 에이전트에게 글쓰기를 위임합니다.

    Args:
        content: 작성할 내용의 개요
        style: 글쓰기 스타일 (기본값: professional)

    Returns:
        작성된 글
    """
    result = writing_agent(f"Write {style} content about: {content}")
    return str(result)

# 관리자 에이전트
manager_agent = Agent(
    model=model,
    tools=[delegate_research, delegate_writing],
    system_prompt="""You are a manager agent. Coordinate research and writing tasks.
    Use delegate_research for gathering information and delegate_writing for content creation."""
)
```

## 무한 루프 방지

Graph를 사용할 때 반드시 무한 루프 방지 설정을 추가하세요.

```python
builder = GraphBuilder()
# ... 노드 및 엣지 추가 ...

# 방법 1: 노드 실행 횟수 제한
builder.set_max_node_executions(10)

# 방법 2: 전체 실행 시간 제한 (초)
builder.set_execution_timeout(300)

# 방법 3: 둘 다 사용 (권장)
builder.set_max_node_executions(10)
builder.set_execution_timeout(300)

graph = builder.compile()
```

## 주의사항

1. **`add_conditional_edge` 없음**: 조건부 엣지는 `add_edge(..., condition=func)` 사용
2. **조건 함수 시그니처**: `def condition(state: dict) -> bool`
3. **무한 루프 방지 필수**: 루프가 있는 그래프는 반드시 `set_max_node_executions()` 또는 `set_execution_timeout()` 설정
4. **상태 전달**: 노드 간 상태는 dict로 전달됨
