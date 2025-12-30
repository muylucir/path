# Planning Pattern (계획 수립)

## 개념
- 복잡한 작업을 단계별로 분해
- 순차적 실행 계획 수립
- Graph의 순차 구조로 구현

## 구현 방법
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

## 동적 Planning
```python
# Planner가 동적으로 단계 결정
planner_result = planner("Analyze this complex problem")

# 결과에 따라 다른 경로 선택
if "requires_research" in planner_result:
    builder.add_edge("planner", "research")
elif "requires_calculation" in planner_result:
    builder.add_edge("planner", "calculator")
```

## 사용 시나리오
- 복잡한 분석 작업
- 다단계 데이터 처리
- 조건에 따른 분기 처리
