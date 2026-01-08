# Prompt Template: Generate Agent Design Document from PATH Specification

## Role
You are a senior AI agent architect specializing in translating functional requirements into comprehensive technical designs with clear architectural decisions, agent interfaces, and testing strategies for Strands Agents SDK.

## Task
Convert the provided PATH Agent Specification and Requirements Document into a detailed Design Document that specifies the agent architecture, component interfaces, data models, correctness properties, and comprehensive testing strategy.

## Input Format
You will receive:
1. **spec.md**: PATH Agent Specification (located at `.kiro/path-spec/spec.md`)
2. **requirements.md**: Requirements document with EARS notation (located at `.kiro/specs/requirements.md`)

## Output Format

Generate a `design.md` file with the following structure:

```markdown
# Agent Design Document

## Overview
[2-4 paragraph overview describing the agent system architecture, technology choices, and core design principles]

핵심 설계 원칙:
- **[Principle 1]**: [Description]
- **[Principle 2]**: [Description]
...

## Architecture

### Agent Graph Architecture
[Copy the Graph Structure Mermaid diagram from PATH spec Section 4]

```mermaid
[Graph Structure diagram from PATH spec]
```

### Sequence Flow
[Copy the Sequence Diagram from PATH spec Section 4]

```mermaid
[Sequence Diagram from PATH spec]
```

### System Architecture
[Copy the Architecture Flowchart from PATH spec Section 4]

```mermaid
[Architecture Flowchart from PATH spec]
```

### Technology Stack

- **Agent Framework**: Strands Agents SDK
- **Language**: Python 3.11+
- **LLM Provider**: AWS Bedrock
- **LLM Models**: [From Agent Components table]
- **Infrastructure**: [AgentCore services if present]
- **External Integrations**: [MCP servers and APIs]

## Agent Components

### [N]. [Agent Name] Agent

**역할**: [From Agent Components table - Role]
**LLM**: [From Agent Components table - LLM]

**인터페이스**:
```python
from strands import Agent
from strands.models import BedrockModel

class [AgentName]Agent:
    """
    [Agent description in Korean]

    Input: [Input type from table]
    Output: [Output type from table]
    Tools: [Tools from table]
    """

    def __init__(self):
        self.agent = Agent(
            model=BedrockModel("[model-id]"),
            system_prompt="[System prompt description]",
            tools=[tool_list]
        )

    def process(self, input_data: [InputType]) -> [OutputType]:
        """
        [Processing logic description]
        """
        result = self.agent(input_data)
        return result.message
```

**입력 스키마**:
```python
class [AgentName]Input(TypedDict):
    [field]: [type]  # [description]
    ...
```

**출력 스키마**:
```python
class [AgentName]Output(TypedDict):
    [field]: [type]  # [description]
    ...
```

[Repeat for each Agent in Components table]

## Graph Structure

### Graph Builder
```python
from strands.multiagent import GraphBuilder

# Agent 인스턴스 생성
[agent_var] = [AgentName]Agent()
...

# Graph 빌더 초기화
builder = GraphBuilder()

# 노드 추가
builder.add_node([agent_var], "[node_name]")
...

# 엣지 추가 (순차 실행)
builder.add_edge("[source]", "[target]")
...

# 조건부 엣지 (Reflection 등)
builder.add_edge("[source]", "[target]", condition=[condition_func])
...

# 엔트리 포인트 설정
builder.set_entry_point("[entry_node]")

# 실행 제한 설정
builder.set_max_node_executions([N])

# Graph 빌드
graph = builder.build()
```

### Conditional Routing
```python
def [condition_name](state):
    """
    [Condition description]
    """
    [condition logic from PATH spec]
```

## Invocation State

### State Schema
```python
from typing import TypedDict, Optional

class InvocationState(TypedDict):
    # 세션 식별자
    [session_id_field]: str

    # 사용자/Actor 식별자
    [actor_id_field]: str

    # 설정
    config: ConfigState

    # Agent별 결과 저장
    results: ResultsState

class ConfigState(TypedDict):
    [config_field]: [type]  # [description]
    ...

class ResultsState(TypedDict):
    [agent_name]: Optional[[OutputType]]  # [agent] 결과
    ...
```

### State Update Points
| Agent | Update Action | State Fields |
|-------|--------------|--------------|
| [agent_name] | [When updated] | [Which fields] |
...

## AgentCore Services

### Runtime Configuration
```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload, context):
    """
    [Entry point description]
    Protocol: [HTTP/MCP]
    Max Execution Time: [duration]
    Max Payload: [size]
    """
    result = graph(payload, invocation_state=context.invocation_state)
    return result
```

### Memory Configuration
```python
# Short-term Memory (STM)
stm_config = {
    "memory_id": "[system-id]",
    "memory_type": "SHORT_TERM",
    "ttl_days": [N]
}

# Long-term Memory (LTM) - if needed
ltm_config = {
    "memory_id": "[system-id]",
    "memory_type": "LONG_TERM",
    "namespace": "[namespace_pattern]",
    "strategy": "[Episodic/Semantic]"
}
```

### Gateway Tools
| Tool Name | Type | Purpose | Identity |
|-----------|------|---------|----------|
| [tool] | Lambda MCP | [purpose] | [identity_id] |
...

### Identity Configuration
| Identity ID | Type | Purpose | Storage |
|-------------|------|---------|---------|
| [id] | [API Key/OAuth] | [purpose] | Token Vault |
...

## Error Handling

### Error Categories

1. **Agent Execution Errors**
   - LLM timeout or rate limit
   - Invalid input format
   - Response: Retry with exponential backoff

2. **Tool Invocation Errors**
   - MCP server unavailable
   - External API failure
   - Response: Log error, use fallback or skip

3. **Graph Flow Errors**
   - Max execution limit reached
   - Condition evaluation failure
   - Response: Terminate gracefully with partial results

4. **State Management Errors**
   - Memory service unavailable
   - State corruption
   - Response: Log error, continue with in-memory state

### Error Response Format
```python
class AgentError(TypedDict):
    error_code: str      # 에러 코드 (예: "AGENT_TIMEOUT")
    message: str         # 사용자 친화적 메시지
    agent_name: str      # 발생 Agent
    details: dict        # 추가 정보
    recoverable: bool    # 복구 가능 여부
```

### Retry Strategy
```python
RETRY_CONFIG = {
    "max_retries": 3,
    "backoff_factor": 2,
    "retry_on": ["TIMEOUT", "RATE_LIMIT", "TRANSIENT_ERROR"]
}
```

## Correctness Properties

### Property 1: Agent Input-Output Consistency
*For any* valid input to an Agent, the Agent SHALL produce output matching the defined output schema.
**Validates: Agent Behavior Requirements**

### Property 2: Graph Flow Integrity
*For any* graph execution, nodes SHALL be visited according to defined edges and conditions.
**Validates: Graph Flow Requirements**

### Property 3: State Transition Correctness
*For any* state update, the invocation_state SHALL contain valid values for all required fields.
**Validates: State Management Requirements**

### Property 4: Tool Invocation Safety
*For any* tool call, the System SHALL validate parameters before invocation and handle failures gracefully.
**Validates: Integration Requirements**

### Property 5: Reflection Loop Termination
*For any* reflection loop, the System SHALL terminate within max_node_executions iterations.
**Validates: Graph Flow Requirements (Reflection pattern)**

### Property 6: Human-in-Loop Compliance
*For any* operation requiring human approval (in Collaborate mode), the System SHALL wait for explicit approval before proceeding.
**Validates: Human-in-Loop Requirements**

[Add more properties based on requirements]

## Testing Strategy

### Unit Testing

개별 Agent의 비즈니스 로직을 Mock LLM을 사용하여 테스트합니다.

**Test Coverage by Agent**:
- **[Agent Name]**:
  - 입력 검증 로직
  - 출력 스키마 준수
  - 에러 케이스 처리
  - Edge case 처리

**Example Unit Tests**:
```python
import pytest
from unittest.mock import Mock, patch

class Test[AgentName]Agent:

    @patch('strands.Agent')
    def test_valid_input_processing(self, mock_agent):
        """유효한 입력에 대해 올바른 출력을 생성해야 함"""
        mock_agent.return_value.message = {"expected": "output"}

        agent = [AgentName]Agent()
        result = agent.process({"valid": "input"})

        assert "expected" in result

    @patch('strands.Agent')
    def test_invalid_input_handling(self, mock_agent):
        """잘못된 입력에 대해 적절한 에러를 반환해야 함"""
        agent = [AgentName]Agent()

        with pytest.raises(ValidationError):
            agent.process({"invalid": "input"})

    @patch('strands.Agent')
    def test_empty_input_handling(self, mock_agent):
        """빈 입력에 대해 적절히 처리해야 함"""
        agent = [AgentName]Agent()
        result = agent.process({})

        assert result.get("error") is not None
```

**Key Focus Areas**:
- Mock LLM 응답으로 빠른 테스트
- 입력 검증 및 에러 처리
- 출력 스키마 준수 확인
- 경계 조건 테스트

### Integration Testing

Agent 간 통신과 외부 서비스 연동을 테스트합니다.

**Graph Integration Tests**:
```python
class TestGraphIntegration:

    def test_sequential_agent_flow(self, test_graph):
        """Agent가 순차적으로 실행되어야 함"""
        result = test_graph("test input")

        assert result.visited_nodes == ["agent1", "agent2", "agent3"]

    def test_conditional_routing(self, test_graph):
        """조건에 따라 올바른 경로로 라우팅되어야 함"""
        # Low score → retry
        result = test_graph({"score": 50})
        assert "retry_node" in result.visited_nodes

        # High score → proceed
        result = test_graph({"score": 80})
        assert "next_node" in result.visited_nodes

    def test_reflection_loop_termination(self, test_graph):
        """Reflection 루프가 최대 실행 횟수 내에 종료되어야 함"""
        result = test_graph({"always_fail": True})

        assert result.node_execution_counts["writer"] <= 3
```

**MCP Server Integration Tests**:
```python
class TestMCPIntegration:

    @pytest.fixture
    def mcp_server(self):
        """테스트용 MCP 서버 설정"""
        return TestMCPServer()

    def test_tool_invocation(self, mcp_server):
        """MCP 도구가 올바르게 호출되어야 함"""
        agent = [AgentName]Agent(tools=[mcp_server.tool])
        result = agent.process({"query": "test"})

        assert mcp_server.was_called
        assert result.get("tool_result") is not None
```

**Key Focus Areas**:
- Graph 노드 실행 순서 검증
- 조건부 라우팅 검증
- MCP 서버 연동 테스트
- AgentCore Memory 연동 테스트

### End-to-End Testing

전체 워크플로우를 실제 LLM과 함께 테스트합니다.

**User Scenarios**:
```python
class TestE2EScenarios:

    @pytest.mark.e2e
    def test_complete_workflow(self, production_graph):
        """전체 워크플로우가 성공적으로 완료되어야 함"""
        # Given: 실제 입력 데이터
        input_data = load_test_fixture("sample_input.json")

        # When: Graph 실행
        result = production_graph(input_data)

        # Then: 최종 출력 검증
        assert result.status == "completed"
        assert result.output is not None
        validate_output_schema(result.output)

    @pytest.mark.e2e
    def test_error_recovery(self, production_graph):
        """에러 발생 시 적절히 복구되어야 함"""
        input_data = load_test_fixture("error_case.json")

        result = production_graph(input_data)

        assert result.status in ["completed", "partial"]
        assert result.errors_handled > 0
```

**Key Focus Areas**:
- 실제 LLM 응답으로 전체 플로우 검증
- 에러 복구 시나리오 검증
- Human-in-Loop 워크플로우 검증 (해당시)
- 성능 및 응답 시간 확인

### Test Data Management

```python
# tests/fixtures/factory.py
from dataclasses import dataclass
import faker

fake = faker.Faker('ko_KR')

@dataclass
class TestDataFactory:
    """테스트 데이터 생성 팩토리"""

    @staticmethod
    def create_[agent]_input(**overrides):
        """[Agent] 입력 테스트 데이터 생성"""
        defaults = {
            "field1": fake.text(),
            "field2": fake.random_int(),
        }
        return {**defaults, **overrides}

    @staticmethod
    def create_invocation_state(**overrides):
        """Invocation State 테스트 데이터 생성"""
        defaults = {
            "session_id": fake.uuid4(),
            "config": {},
            "results": {}
        }
        return {**defaults, **overrides}
```

### Testing Tools

- **Unit Testing**: pytest, pytest-mock
- **Integration Testing**: pytest, httpx (for MCP), testcontainers
- **E2E Testing**: pytest with real LLM
- **Test Data**: faker, factory_boy
- **Mocking**: unittest.mock, pytest-mock
- **Coverage**: pytest-cov

### Continuous Testing

- **On Every Commit**: Unit tests (< 30 seconds)
- **On Pull Request**: Unit + Integration tests (< 5 minutes)
- **Before Deployment**: Full suite including E2E (< 15 minutes)
- **Scheduled**: E2E tests on staging (daily)
```

## Guidelines

### 1. Overview Section
- Include the Problem and Solution from PATH Executive Summary
- Mention Feasibility score and what it implies for design decisions
- List the agent patterns being used and why
- State core design principles (usually 3-5)

### 2. Architecture Section
**Critical**: Copy the Mermaid diagrams directly from PATH spec Section 4:
- Graph Structure diagram (Multi-Agent Graph)
- Sequence Diagram (호출 흐름)
- Architecture Flowchart (AgentCore 통합)

These diagrams are already well-designed; do not recreate them.

### 3. Agent Components Section
For each Agent in the Components table:
- Create a class definition following Strands SDK patterns
- Define input/output TypedDict schemas
- Include system_prompt description
- List tools if any

### 4. Graph Structure Section
Transform the Python Graph code from PATH spec into:
- Complete working code
- Condition functions with clear logic
- Proper error handling

### 5. AgentCore Services Section
If PATH spec includes AgentCore section:
- Extract Runtime configuration
- Extract Memory configuration (STM/LTM)
- Extract Gateway tool registrations
- Extract Identity configurations

If no AgentCore section, include basic deployment setup.

### 6. Correctness Properties
Create properties that validate:
- Each Agent's behavior
- Graph flow integrity
- State management correctness
- Tool invocation safety
- Pattern-specific properties (Reflection termination, etc.)

### 7. Testing Strategy
Focus on:
- Mock LLM for unit tests (fast feedback)
- Real integrations for integration tests
- Real LLM for E2E tests (expensive, selective)

## Important Notes
- This document bridges requirements (WHAT) and implementation (HOW)
- Copy PATH spec diagrams directly - they are already optimized
- Use Strands SDK patterns consistently
- Include AgentCore configuration even if optional (always include per user preference)
- Testing strategy should enable confident agent deployment

## Now Generate

Please read:
1. The PATH Agent Specification at `.kiro/path-spec/spec.md`
2. The Requirements document at `.kiro/specs/requirements.md`

And generate a comprehensive `design.md` document following this template.

**Important Requirements:**
- The generated document must be written in **Korean (한글)**
- Code examples, interfaces, and technical syntax should remain in Python
- Comments in code should be in Korean
- Copy Mermaid diagrams from PATH spec Section 4 directly
- Save the generated file as `.kiro/specs/design.md`
