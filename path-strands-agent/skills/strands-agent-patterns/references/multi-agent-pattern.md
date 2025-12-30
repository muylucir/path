# Multi-Agent Pattern (다중 에이전트 협업)

## 개념
- 여러 전문 Agent가 협업하여 복잡한 작업 수행
- Graph + Agent-as-Tool 조합
- 병렬 처리 및 역할 분담

## 구현 방법
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

## Nested Multi-Agent (중첩 패턴)
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
