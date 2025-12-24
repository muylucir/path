---
name: strands-agent-patterns
description: Strands Agent의 핵심 패턴 가이드 - Graph, Agent-as-Tool, Reflection, Planning, Multi-Agent 패턴의 구현 방법과 코드 예제. AI Agent 명세서 작성 시 정확한 Strands 구현 전략을 제시할 때 사용.
---

# Strands Agent Patterns Guide

Strands Agent의 5가지 핵심 패턴과 구현 방법을 제공합니다.

## 1. Graph Pattern (그래프 기반 워크플로우)

### 개념
- **결정론적 실행 순서**: 그래프 구조에 따라 노드 실행
- **출력 전파**: 노드 간 엣지를 따라 결과 전달
- **명확한 의존성 관리**: 노드 간 의존 관계 정의
- **순환 구조 지원**: Feedback Loop 구현 가능

### 기본 구조
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

### 일반적인 Graph 토폴로지

#### 1) Sequential Pipeline (순차 파이프라인)
```
Research → Analysis → Review → Report
```
```python
builder.add_edge("research", "analysis")
builder.add_edge("analysis", "review")
builder.add_edge("review", "report")
```

#### 2) Parallel Processing (병렬 처리)
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

#### 3) Conditional Branching (조건부 분기)
```python
def is_technical(state):
    result = state.results.get("classifier")
    return "technical" in str(result.result).lower()

builder.add_edge("classifier", "tech_specialist", condition=is_technical)
builder.add_edge("classifier", "business_specialist", condition=is_business)
```

#### 4) Feedback Loop (피드백 루프)
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

## 2. Agent-as-Tool Pattern

### 개념
- Agent를 다른 Agent의 도구로 사용
- 전문화된 Agent를 필요할 때 호출
- MCP 서버와 유사한 방식으로 Agent 활용

### 구현 방법
```python
from strands import Agent

# 전문화된 Agent 생성
calculator_agent = Agent(
    name="calculator",
    system_prompt="You are a mathematical calculation specialist...",
    tools=[calculator_tool]
)

# 메인 Agent가 calculator_agent를 도구로 사용
main_agent = Agent(
    name="main",
    system_prompt="You can use the calculator agent for complex calculations...",
    tools=[calculator_agent]  # Agent를 tool로 전달
)

# 실행
result = main_agent("Calculate the compound interest for $10,000 at 5% for 10 years")
```

### Graph 내에서 Agent-as-Tool
```python
# Graph의 노드로 Agent 추가
builder.add_node(calculator_agent, "calculator")
builder.add_node(data_analyzer, "analyzer")

# analyzer가 calculator를 호출할 수 있도록 설정
builder.add_edge("calculator", "analyzer")
```

## 3. Reflection Pattern (자기 검증)

### 개념
- Agent가 자신의 출력을 검증하고 개선
- 품질 보장을 위한 자가 피드백 루프
- Graph의 순환 구조로 구현

### 구현 방법
```python
# 생성 Agent
generator = Agent(
    name="generator",
    system_prompt="Generate high-quality content..."
)

# 검증 Agent
reviewer = Agent(
    name="reviewer",
    system_prompt="Review the content and provide feedback. Score 0-100."
)

# Reflection Graph 구축
builder = GraphBuilder()
builder.add_node(generator, "generator")
builder.add_node(reviewer, "reviewer")

# 순환 구조 생성
builder.add_edge("generator", "reviewer")

def needs_improvement(state):
    review = state.results.get("reviewer")
    if not review:
        return False
    # 점수가 70점 미만이면 재생성
    return "score" in str(review.result).lower() and int(re.search(r'\d+', str(review.result)).group()) < 70

builder.add_edge("reviewer", "generator", condition=needs_improvement)

# 무한 루프 방지
builder.set_max_node_executions(5)  # 최대 2-3회 반복
```

### 사용 시나리오
- 코드 생성 → 코드 리뷰 → 수정
- 문서 작성 → 품질 검증 → 개선
- 답변 생성 → 정확성 확인 → 재생성

## 4. Planning Pattern (계획 수립)

### 개념
- 복잡한 작업을 단계별로 분해
- 순차적 실행 계획 수립
- Graph의 순차 구조로 구현

### 구현 방법
```python
# Planning Agent
planner = Agent(
    name="planner",
    system_prompt="Break down the task into sequential steps..."
)

# Execution Agents
step1_agent = Agent(name="step1", system_prompt="Execute step 1...")
step2_agent = Agent(name="step2", system_prompt="Execute step 2...")
step3_agent = Agent(name="step3", system_prompt="Execute step 3...")

# Aggregator
aggregator = Agent(name="aggregator", system_prompt="Combine all results...")

# Planning Graph
builder = GraphBuilder()
builder.add_node(planner, "planner")
builder.add_node(step1_agent, "step1")
builder.add_node(step2_agent, "step2")
builder.add_node(step3_agent, "step3")
builder.add_node(aggregator, "aggregator")

# 순차 실행
builder.add_edge("planner", "step1")
builder.add_edge("step1", "step2")
builder.add_edge("step2", "step3")
builder.add_edge("step3", "aggregator")
```

### 동적 Planning
```python
# Planner가 동적으로 단계 결정
planner_result = planner("Analyze this complex problem")

# 결과에 따라 다른 경로 선택
if "requires_research" in planner_result:
    builder.add_edge("planner", "research")
elif "requires_calculation" in planner_result:
    builder.add_edge("planner", "calculator")
```

## 5. Multi-Agent Pattern (다중 에이전트 협업)

### 개념
- 여러 전문 Agent가 협업하여 복잡한 작업 수행
- Graph + Agent-as-Tool 조합
- 병렬 처리 및 역할 분담

### 구현 방법
```python
# 전문화된 Agents
github_collector = Agent(
    name="github_collector",
    system_prompt="Collect GitHub data...",
    tools=[mcp_github]
)

resume_parser = Agent(
    name="resume_parser",
    system_prompt="Parse resume PDF...",
    tools=[mcp_file]
)

linkedin_collector = Agent(
    name="linkedin_collector",
    system_prompt="Collect LinkedIn data...",
    tools=[linkedin_scraper]
)

# 통합 분석 Agent
analyzer = Agent(
    name="analyzer",
    system_prompt="Analyze all collected data..."
)

# Multi-Agent Graph
builder = GraphBuilder()
builder.add_node(github_collector, "github")
builder.add_node(resume_parser, "resume")
builder.add_node(linkedin_collector, "linkedin")
builder.add_node(analyzer, "analyzer")

# 병렬 수집 → 통합 분석
builder.add_edge("github", "analyzer")
builder.add_edge("resume", "analyzer")
builder.add_edge("linkedin", "analyzer")

# 모든 데이터 수집 완료 후 분석 실행
def all_data_collected(state):
    return all(
        node_id in state.results
        for node_id in ["github", "resume", "linkedin"]
    )

builder.add_edge("github", "analyzer", condition=all_data_collected)
builder.add_edge("resume", "analyzer", condition=all_data_collected)
builder.add_edge("linkedin", "analyzer", condition=all_data_collected)
```

### Nested Multi-Agent (중첩 패턴)
```python
from strands.multiagent import Swarm

# Swarm을 Graph의 노드로 사용
research_agents = [
    Agent(name="medical_researcher", ...),
    Agent(name="tech_researcher", ...),
    Agent(name="economic_researcher", ...)
]
research_swarm = Swarm(research_agents)

# Graph에 Swarm 추가
builder.add_node(research_swarm, "research_team")
builder.add_node(analyst, "analysis")
builder.add_edge("research_team", "analysis")
```

## Invocation State (공유 상태)

### 개념
- Agent 간 컨텍스트 공유
- LLM에 노출되지 않는 메타데이터 전달

### 사용 방법
```python
# 공유 상태 정의
invocation_state = {
    "user_id": "12345",
    "session_id": "abc-def",
    "config": {"max_retries": 3}
}

# Graph 실행 시 전달
result = graph("Analyze this data", invocation_state=invocation_state)

# Agent 내에서 접근
class CustomAgent(Agent):
    def process(self, task, invocation_state):
        user_id = invocation_state.get("user_id")
        # 사용자별 로직 처리
```

## Best Practices

1. **명확한 노드 ID 사용**: 설명적인 이름 선택
2. **Graph 구조 검증**: Builder가 자동으로 검증하지만 수동 확인도 필요
3. **노드 실패 처리**: 한 노드 실패가 전체 워크플로우에 미치는 영향 고려
4. **조건부 엣지 활용**: 동적 워크플로우 구현
5. **병렬 처리 고려**: 독립적인 작업은 병렬로 실행
6. **중첩 패턴 활용**: Swarm을 Graph 내에서 사용
7. **순환 구조 제한 설정**: `set_max_node_executions()` 사용
8. **실행 타임아웃 설정**: `set_execution_timeout()` 사용

## 패턴 선택 가이드

| 요구사항 | 추천 패턴 |
|---------|----------|
| 순차적 작업 흐름 | Planning Pattern |
| 품질 검증 필요 | Reflection Pattern |
| 병렬 데이터 수집 | Multi-Agent Pattern |
| 조건부 분기 | Graph + Conditional Edges |
| 전문 도구 호출 | Agent-as-Tool Pattern |
| 복합 워크플로우 | Graph + Multi-Agent 조합 |

## 코드 템플릿

### 기본 Graph 템플릿
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

### Reflection 템플릿
```python
# Generator + Reviewer
generator = Agent(name="generator", ...)
reviewer = Agent(name="reviewer", ...)

builder = GraphBuilder()
builder.add_node(generator, "generator")
builder.add_node(reviewer, "reviewer")
builder.add_edge("generator", "reviewer")
builder.add_edge("reviewer", "generator", condition=needs_improvement)
builder.set_max_node_executions(5)

graph = builder.build()
```

### Multi-Agent 템플릿
```python
# Parallel workers + Aggregator
worker1 = Agent(name="worker1", ...)
worker2 = Agent(name="worker2", ...)
aggregator = Agent(name="aggregator", ...)

builder = GraphBuilder()
builder.add_node(worker1, "worker1")
builder.add_node(worker2, "worker2")
builder.add_node(aggregator, "aggregator")
builder.add_edge("worker1", "aggregator")
builder.add_edge("worker2", "aggregator")

graph = builder.build()
```
