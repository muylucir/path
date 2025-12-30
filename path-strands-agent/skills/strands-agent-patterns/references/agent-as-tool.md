# Agent-as-Tool Pattern

## 개념
- Agent를 다른 Agent의 도구로 사용
- 전문화된 Agent를 필요할 때 호출
- MCP 서버와 유사한 방식으로 Agent 활용

## 구현 방법
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

## Graph 내에서 Agent-as-Tool
```python
# Graph의 노드로 Agent 추가
builder.add_node(calculator_agent, "calculator")
builder.add_node(data_analyzer, "analyzer")

# analyzer가 calculator를 호출할 수 있도록 설정
builder.add_edge("calculator", "analyzer")
```

## 사용 시나리오
- 복잡한 계산이 필요한 경우
- 전문 도메인 지식이 필요한 경우
- 외부 API/도구 연동이 필요한 경우
