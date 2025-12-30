# Graph Pattern (그래프 기반 워크플로우)

## 개념
- **결정론적 실행 순서**: 그래프 구조에 따라 노드 실행
- **출력 전파**: 노드 간 엣지를 따라 결과 전달
- **명확한 의존성 관리**: 노드 간 의존 관계 정의
- **순환 구조 지원**: Feedback Loop 구현 가능

## 기본 구조
```python
from strands import Agent
from strands.multiagent import GraphBuilder

# 1. Agent 생성
researcher = Agent(name="researcher", system_prompt="You are a research specialist...")
analyst = Agent(name="analyst", system_prompt="You are a data analysis specialist...")
report_writer = Agent(name="report_writer", system_prompt="You are a report writing specialist...")

# 2. Graph 구축
builder = GraphBuilder()

# 노드 추가
builder.add_node(researcher, "research")
builder.add_node(analyst, "analysis")
builder.add_node(report_writer, "report")

# 엣지 추가 (의존성 정의)
builder.add_edge("research", "analysis")
builder.add_edge("analysis", "report")

# 진입점 설정
builder.set_entry_point("research")

# Graph 생성
graph = builder.build()

# 실행
result = graph("Research the impact of AI on healthcare")
```

## 일반적인 Graph 토폴로지

### 1) Sequential Pipeline (순차 파이프라인)
```
Research → Analysis → Review → Report
```
```python
builder.add_edge("research", "analysis")
builder.add_edge("analysis", "review")
builder.add_edge("review", "report")
```

### 2) Parallel Processing (병렬 처리)
```
Coordinator → Worker1 → Aggregator
           → Worker2 →
           → Worker3 →
```
```python
builder.add_edge("coordinator", "worker1")
builder.add_edge("coordinator", "worker2")
builder.add_edge("coordinator", "worker3")
builder.add_edge("worker1", "aggregator")
builder.add_edge("worker2", "aggregator")
builder.add_edge("worker3", "aggregator")
```

### 3) Conditional Branching (조건부 분기)
```python
def is_technical(state):
    result = state.results.get("classifier")
    return "technical" in str(result.result).lower()

builder.add_edge("classifier", "tech_specialist", condition=is_technical)
builder.add_edge("classifier", "business_specialist", condition=is_business)
```

### 4) Feedback Loop (피드백 루프)
```
Draft Writer → Reviewer → Quality Check
     ↑                         ↓
     └─────── (revision) ──────┘
```
```python
def needs_revision(state):
    review_result = state.results.get("reviewer")
    return "revision needed" in str(review_result.result).lower()

builder.add_edge("draft_writer", "reviewer")
builder.add_edge("reviewer", "draft_writer", condition=needs_revision)
builder.add_edge("reviewer", "publisher", condition=is_approved)

# 무한 루프 방지
builder.set_max_node_executions(10)
builder.set_execution_timeout(300)
```
