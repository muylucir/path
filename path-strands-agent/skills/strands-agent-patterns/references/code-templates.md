# 코드 템플릿

복사해서 바로 사용할 수 있는 Strands Agent 코드 템플릿입니다.

## 기본 Graph 템플릿
```python
from strands import Agent
from strands.multiagent import GraphBuilder

# Agents
agent1 = Agent(name="agent1", system_prompt="...")
agent2 = Agent(name="agent2", system_prompt="...")

# Graph
builder = GraphBuilder()
builder.add_node(agent1, "node1")
builder.add_node(agent2, "node2")
builder.add_edge("node1", "node2")
builder.set_entry_point("node1")

graph = builder.build()
result = graph("Your task here")
```

## Reflection 템플릿
```python
from strands import Agent
from strands.multiagent import GraphBuilder

# Generator + Reviewer
generator = Agent(name="generator", system_prompt="Generate content...")
reviewer = Agent(name="reviewer", system_prompt="Review and score 0-100...")

def needs_improvement(state):
    review = state.results.get("reviewer")
    if not review:
        return False
    # 70점 미만이면 재생성
    return int(re.search(r'\d+', str(review.result)).group()) < 70

builder = GraphBuilder()
builder.add_node(generator, "generator")
builder.add_node(reviewer, "reviewer")
builder.add_edge("generator", "reviewer")
builder.add_edge("reviewer", "generator", condition=needs_improvement)
builder.set_max_node_executions(5)

graph = builder.build()
```

## Multi-Agent 템플릿
```python
from strands import Agent
from strands.multiagent import GraphBuilder

# Parallel workers + Aggregator
worker1 = Agent(name="worker1", system_prompt="Task 1...")
worker2 = Agent(name="worker2", system_prompt="Task 2...")
aggregator = Agent(name="aggregator", system_prompt="Combine results...")

builder = GraphBuilder()
builder.add_node(worker1, "worker1")
builder.add_node(worker2, "worker2")
builder.add_node(aggregator, "aggregator")
builder.add_edge("worker1", "aggregator")
builder.add_edge("worker2", "aggregator")

graph = builder.build()
```

## Agent-as-Tool 템플릿
```python
from strands import Agent

# 전문 Agent
specialist = Agent(
    name="specialist",
    system_prompt="You are a domain specialist...",
    tools=[domain_tool]
)

# 메인 Agent (specialist를 도구로 사용)
main_agent = Agent(
    name="main",
    system_prompt="Coordinate tasks and use specialist when needed...",
    tools=[specialist]
)

result = main_agent("Your task here")
```

## Best Practices 체크리스트
1. **명확한 노드 ID 사용**: 설명적인 이름 선택
2. **Graph 구조 검증**: Builder가 자동으로 검증하지만 수동 확인도 필요
3. **노드 실패 처리**: 한 노드 실패가 전체 워크플로우에 미치는 영향 고려
4. **조건부 엣지 활용**: 동적 워크플로우 구현
5. **병렬 처리 고려**: 독립적인 작업은 병렬로 실행
6. **중첩 패턴 활용**: Swarm을 Graph 내에서 사용
7. **순환 구조 제한 설정**: `set_max_node_executions()` 사용
8. **실행 타임아웃 설정**: `set_execution_timeout()` 사용
