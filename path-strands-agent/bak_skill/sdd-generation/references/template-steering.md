# Prompt Template: Generate Agent Steering Documents from PATH Specification

## Role
You are a technical documentation specialist responsible for extracting and organizing key project information into steering documents that guide AI assistants and development teams throughout the AI Agent implementation process.

## Task
Convert the provided PATH specification, requirements, and design documents into three comprehensive steering documents:
1. **structure.md**: Project structure, file organization, and Strands Agent patterns
2. **tech.md**: Technology stack details, development tools, and technical guidelines
3. **product.md**: Product overview, agent capabilities, and business rules

These steering documents serve as persistent knowledge that helps maintain consistency across the entire development lifecycle.

## Input Format
You will receive:
1. **spec.md**: PATH Agent Specification (located at `.kiro/path-spec/spec.md`)
2. **requirements.md**: Requirements document (located at `.kiro/specs/requirements.md`)
3. **design.md**: Design document (located at `.kiro/specs/design.md`)

## Output Format

Generate **three separate files** with the following structures:

---

### 1. structure.md

```markdown
# Project Structure

## Current Organization

```
my-agent/
├── .kiro/
│   ├── path-spec/
│   │   └── spec.md              # PATH Agent 명세서
│   ├── specs/
│   │   ├── requirements.md      # 요구사항 문서
│   │   ├── design.md            # 설계 문서
│   │   └── tasks.md             # 구현 태스크
│   └── steering/
│       ├── structure.md         # 프로젝트 구조
│       ├── tech.md              # 기술 스택
│       └── product.md           # 제품 개요
```

## Expected Strands Agent Project Structure

```
my-agent/
├── .kiro/                        # SDD 문서
├── src/
│   ├── __init__.py
│   ├── agents/                   # Agent 정의
│   │   ├── __init__.py
│   │   ├── [agent1].py          # [Agent1 설명]
│   │   ├── [agent2].py          # [Agent2 설명]
│   │   └── ...
│   ├── graph/                    # Graph 정의
│   │   ├── __init__.py
│   │   ├── builder.py           # Graph 빌더
│   │   ├── conditions.py        # 조건부 라우팅 함수
│   │   └── nodes.py             # 노드 등록
│   ├── tools/                    # Custom Tool 정의
│   │   ├── __init__.py
│   │   └── [tool].py
│   ├── state/                    # State 관리
│   │   ├── __init__.py
│   │   ├── invocation_state.py  # Invocation State 스키마
│   │   └── schemas.py           # 입출력 스키마
│   ├── services/                 # 외부 서비스 연동
│   │   ├── __init__.py
│   │   └── [service].py
│   ├── config/                   # 설정
│   │   ├── __init__.py
│   │   └── settings.py
│   └── main.py                   # 진입점
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # pytest fixtures
│   ├── unit/                     # Unit 테스트
│   │   ├── __init__.py
│   │   └── test_[agent].py
│   ├── integration/              # Integration 테스트
│   │   ├── __init__.py
│   │   └── test_graph.py
│   └── e2e/                      # E2E 테스트
│       ├── __init__.py
│       └── test_workflow.py
├── scripts/                      # 유틸리티 스크립트
├── .env.example                  # 환경 변수 예시
├── .gitignore
├── pyproject.toml               # 프로젝트 설정
├── requirements.txt             # 의존성
└── README.md
```

## Directory Conventions

### `/src/agents` - Agent 정의
- 각 Agent는 별도 파일로 분리
- 파일명: `[agent_name].py` (snake_case)
- 클래스명: `[AgentName]Agent` (PascalCase)
- 각 Agent 파일에는 해당 Agent의 입출력 스키마도 포함 가능

### `/src/graph` - Graph 정의
- `builder.py`: GraphBuilder를 사용한 Graph 구성
- `conditions.py`: 조건부 라우팅 함수 정의
- `nodes.py`: 모든 Agent 인스턴스를 노드로 등록

### `/src/tools` - Custom Tool 정의
- MCP 서버가 아닌 직접 구현하는 도구
- 각 도구는 `@tool` 데코레이터 사용

### `/src/state` - State 관리
- `invocation_state.py`: Invocation State 스키마 (TypedDict)
- `schemas.py`: 공통 입출력 스키마

### `/src/services` - 외부 서비스 연동
- AWS SDK (boto3) 직접 호출 서비스
- MCP 서버 래퍼 (필요시)

### `/tests` - 테스트
- `unit/`: Mock LLM을 사용한 개별 Agent 테스트
- `integration/`: Graph 실행, MCP 연동 테스트
- `e2e/`: 실제 LLM을 사용한 전체 워크플로우 테스트

## File Naming Conventions

- **Agent 파일**: `[agent_name].py` (예: `analyzer.py`, `researcher.py`)
- **테스트 파일**: `test_[target].py` (예: `test_analyzer.py`, `test_graph.py`)
- **스키마 파일**: `schemas.py` 또는 `[domain]_schemas.py`
- **설정 파일**: `settings.py`, `config.py`

## Module Organization

### Agent Pattern
```python
# src/agents/analyzer.py
from typing import TypedDict
from strands import Agent
from strands.models import BedrockModel

class AnalyzerInput(TypedDict):
    """분석 입력 스키마"""
    text: str

class AnalyzerOutput(TypedDict):
    """분석 출력 스키마"""
    result: dict

class AnalyzerAgent:
    """
    [Agent 역할 설명]
    """

    def __init__(self):
        self.agent = Agent(
            model=BedrockModel("claude-sonnet-4.5"),
            system_prompt="...",
            tools=[]
        )

    def process(self, input_data: AnalyzerInput) -> AnalyzerOutput:
        result = self.agent(input_data)
        return {"result": result.message}
```

### Graph Pattern
```python
# src/graph/builder.py
from strands.multiagent import GraphBuilder
from src.agents import AnalyzerAgent, ResearcherAgent
from src.graph.conditions import needs_retry

def build_graph():
    # Agent 인스턴스
    analyzer = AnalyzerAgent()
    researcher = ResearcherAgent()

    # Graph 빌더
    builder = GraphBuilder()

    # 노드 추가
    builder.add_node(analyzer.agent, "analyzer")
    builder.add_node(researcher.agent, "researcher")

    # 엣지 추가
    builder.add_edge("analyzer", "researcher")

    # 설정
    builder.set_entry_point("analyzer")
    builder.set_max_node_executions(5)

    return builder.build()
```

## Best Practices

- **관심사 분리**: Agent, Graph, State, Service를 명확히 분리
- **타입 안전성**: TypedDict로 입출력 스키마 정의
- **테스트 가능성**: Agent를 독립적으로 테스트 가능하게 설계
- **설정 외부화**: 환경 변수로 민감 정보 관리
- **명확한 명명**: Agent 역할이 명확히 드러나는 이름 사용
```

---

### 2. tech.md

```markdown
# Technology Stack

## Agent Framework
- **Framework**: Strands Agents SDK
- **Language**: Python 3.11+
- **Runtime**: AWS Lambda / AgentCore Runtime

## LLM Provider
- **Provider**: AWS Bedrock
- **Models**:
  - Claude Sonnet 4.5: [사용 Agent 목록]
  - Claude Haiku 4.5: [사용 Agent 목록]

## Infrastructure (AgentCore)
- **Runtime**: BedrockAgentCoreApp
  - Protocol: HTTP (8080)
  - Max Execution: [시간]
  - Max Payload: [크기]

- **Memory**:
  - STM: [설정 상세]
  - LTM: [설정 상세] (필요시)

- **Gateway**: [Lambda MCP 목록]

- **Identity**: [인증 설정 목록]

## External Integrations
- **MCP Servers**:
  - [mcp_server1]: [용도]
  - [mcp_server2]: [용도]
  - ...

- **AWS Services**:
  - [service1]: [용도]
  - ...

## Testing
- **Unit Testing**: pytest, pytest-mock
- **Integration Testing**: pytest, httpx
- **E2E Testing**: pytest (real LLM)
- **Test Data**: faker
- **Coverage**: pytest-cov

## Common Commands

### Development
```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 의존성 설치
pip install -r requirements.txt

# 로컬 실행
python src/main.py

# 개발 모드 실행 (자동 재시작)
watchmedo auto-restart --patterns="*.py" python src/main.py
```

### Testing
```bash
# 모든 테스트 실행
pytest

# Unit 테스트만 실행
pytest tests/unit

# Integration 테스트만 실행
pytest tests/integration

# E2E 테스트 실행 (실제 LLM 사용)
pytest tests/e2e -m e2e

# 커버리지 포함 실행
pytest --cov=src --cov-report=html

# 특정 Agent 테스트
pytest tests/unit/test_[agent].py -v
```

### AgentCore
```bash
# AgentCore 로컬 실행
agentcore local

# AgentCore 배포
agentcore deploy

# 로그 확인
agentcore logs -f

# 상태 확인
agentcore status
```

### Linting & Formatting
```bash
# 코드 포맷팅
black src tests

# import 정렬
isort src tests

# 타입 체크
mypy src

# 린팅
ruff check src tests
```

## Development Guidelines

### Strands SDK Conventions
- Agent 생성 시 `BedrockModel` 사용
- Tool은 `@tool` 데코레이터로 정의
- Graph는 `GraphBuilder`로 구성
- 조건부 라우팅은 함수로 정의

### Python
- Type hints 필수 사용
- TypedDict로 스키마 정의
- async/await 지원 (필요시)
- PEP 8 스타일 준수

### LLM Interaction
- System prompt는 명확하고 구체적으로
- 출력 형식을 prompt에 명시
- Temperature는 기본값 사용 (deterministic 필요시 0)
- Retry 로직 구현

### Error Handling
- 예외는 구체적 타입으로 정의
- LLM 오류는 재시도 후 실패 처리
- Tool 오류는 로깅 후 대체 처리
- 사용자 친화적 에러 메시지

### Testing
- Unit 테스트: Mock LLM 사용 (빠름)
- Integration 테스트: 실제 MCP 연동 (중간)
- E2E 테스트: 실제 LLM 사용 (느림, 선택적)
- 테스트 데이터는 fixture로 관리

### Security
- API 키는 환경 변수로 관리
- AgentCore Identity로 토큰 관리
- 민감 데이터는 Invocation State에서 관리 (LLM 노출 방지)
- 입력 검증 필수

### Performance
- 불필요한 LLM 호출 최소화
- 캐싱 활용 (Memory 서비스)
- 비동기 처리 (I/O 바운드 작업)
- Graph 실행 제한 설정

## Environment Variables

```bash
# AWS 설정
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# LLM 설정
BEDROCK_MODEL_ID=claude-sonnet-4.5

# MCP 서버 설정
MCP_[SERVER]_ENDPOINT=...
MCP_[SERVER]_API_KEY=...

# AgentCore 설정 (필요시)
AGENTCORE_MEMORY_ID=...
AGENTCORE_GATEWAY_ID=...

# 기타
LOG_LEVEL=INFO
```

## Deployment

- **Platform**: AWS AgentCore Runtime
- **Region**: [region]
- **Scaling**: Managed by AgentCore
- **Monitoring**: CloudWatch Logs
- **Alerts**: CloudWatch Alarms
```

---

### 3. product.md

```markdown
# Product Overview

## [Agent 시스템 이름]

[PATH Executive Summary의 Problem/Solution 기반 1-2문장 설명]

**Feasibility Score**: [점수]/50
**Recommendation**: [권장사항]

## Core Features

### Agent Capabilities

[Agent Components 테이블 기반]

#### 1. [Agent1 Name]
- **역할**: [Role]
- **입력**: [Input]
- **출력**: [Output]
- **특징**: [특이사항]

#### 2. [Agent2 Name]
- **역할**: [Role]
- **입력**: [Input]
- **출력**: [Output]
- **특징**: [특이사항]

[각 Agent에 대해 반복]

### Workflow

[Problem Decomposition 기반]

**트리거**: [INPUT 유형]

**처리 단계**:
1. [PROCESS 1단계]
2. [PROCESS 2단계]
3. [PROCESS N단계]

**결과물**: [OUTPUT 유형]

### Patterns Used

[패턴 분석 기반]

- **[Pattern 1]**: [설명]
- **[Pattern 2]**: [설명]
- **[Pattern 3]**: [설명]

## Business Rules

### Agent Decision Rules
[requirements.md의 Agent Behavior Requirements 기반]

- **[규칙1]**: [설명]
- **[규칙2]**: [설명]

### Error Handling Rules
[Risks 섹션 기반]

- **[상황1]**: [대응 방법]
- **[상황2]**: [대응 방법]

### Human Intervention Rules
[Human-in-Loop 모드 기반]

- **모드**: [Autonomous / Supervised / Collaborate]
- **개입 시점**: [설명]
- **개입 방법**: [설명]

## Target Users

- **Agent Operator**: Agent를 배포하고 모니터링하는 운영자
  - 시스템 설정 및 배포
  - 성능 모니터링
  - 에러 대응

- **End User**: [해당시] Agent와 직접 상호작용하는 사용자
  - [사용 방법]
  - [기대 결과]

- **External System**: [해당시] Agent를 호출하는 시스템
  - [연동 방법]
  - [API 사용]

## User Scenarios

### Agent Operator 시나리오

1. Agent 시스템 배포
   - 환경 설정 및 의존성 설치
   - AgentCore 배포
   - 모니터링 대시보드 확인

2. 일상 운영
   - 로그 모니터링
   - 성능 지표 확인
   - 필요시 스케일링

3. 에러 대응
   - 알림 수신
   - 로그 분석
   - 문제 해결 및 재배포

### End User 시나리오 (해당시)

1. [시나리오 제목]
   - [단계 1]
   - [단계 2]
   - [단계 N]

## Risk Mitigation

[PATH Risks 섹션 기반]

### [리스크 1]
- **상황**: [리스크 설명]
- **완화**: [완화 방안]
- **대응**: [발생 시 대응]

### [리스크 2]
- **상황**: [리스크 설명]
- **완화**: [완화 방안]
- **대응**: [발생 시 대응]

## Success Metrics

[Next Steps 및 Feasibility 기반]

- **처리 시간**: [목표]
- **정확도**: [목표]
- **가용성**: [목표]
- **사용자 만족도**: [목표]
```

---

## Guidelines

### Overall Principles

1. **Language**: All steering documents must be written in **Korean (한글)**
2. **Code Examples**: Keep code, commands, and technical syntax in English
3. **Comments**: Write comments in Korean
4. **Tech Stack Specificity**: All content must be for Strands Agents SDK + Python
5. **Consistency**: Maintain consistent terminology across all three documents
6. **Practicality**: Focus on actionable information

### structure.md Generation Guide

**Content Sources**:
- design.md: Agent Components → 디렉토리 구조
- design.md: Graph Structure → graph/ 디렉토리
- spec.md: Tools → tools/ 디렉토리
- spec.md: Invocation State → state/ 디렉토리

**Key Elements**:
- Strands SDK 프로젝트 구조
- Agent/Graph/State 패턴 예시
- 파일 명명 규칙
- 모듈 조직 패턴

### tech.md Generation Guide

**Content Sources**:
- spec.md: Agent Components → LLM 모델 목록
- spec.md: AgentCore → 인프라 설정
- spec.md: Tools → MCP 서버 목록
- design.md: Testing Strategy → 테스트 도구

**Key Elements**:
- Strands SDK 명령어
- AgentCore 명령어
- 환경 변수 목록
- 개발 가이드라인

### product.md Generation Guide

**Content Sources**:
- spec.md: Executive Summary → 제품 개요
- spec.md: Agent Components → Agent Capabilities
- spec.md: Problem Decomposition → Workflow
- spec.md: Risks → Risk Mitigation
- requirements.md: Business Rules

**Key Elements**:
- 제품 목적과 가치
- Agent별 역할 설명
- 비즈니스 규칙
- 사용자 시나리오

## Quality Checklist

### structure.md:
- [ ] Strands SDK 프로젝트 구조 포함
- [ ] 모든 Agent 디렉토리 반영
- [ ] Graph 패턴 예시 포함
- [ ] State 관리 패턴 포함
- [ ] 테스트 디렉토리 구조 포함

### tech.md:
- [ ] Strands SDK + Bedrock 스택 명시
- [ ] AgentCore 설정 포함
- [ ] 모든 MCP 서버 목록
- [ ] 개발/테스트/배포 명령어
- [ ] 환경 변수 목록

### product.md:
- [ ] Executive Summary 반영
- [ ] 모든 Agent 역할 설명
- [ ] Workflow 명확히 기술
- [ ] Human-in-Loop 모드 반영
- [ ] Risk Mitigation 포함

## Now Generate

Please read:
1. The PATH Agent Specification at `.kiro/path-spec/spec.md`
2. The Requirements document at `.kiro/specs/requirements.md`
3. The Design document at `.kiro/specs/design.md`

And generate three comprehensive steering documents following this template:
- `structure.md`
- `tech.md`
- `product.md`

**Important Requirements:**
- All three documents must be written in **Korean (한글)**
- Code examples and commands should remain in English
- Comments in code should be in Korean
- All content must be specific to Strands Agents SDK + Python
- Save the generated files as:
  - `.kiro/steering/structure.md`
  - `.kiro/steering/tech.md`
  - `.kiro/steering/product.md`
