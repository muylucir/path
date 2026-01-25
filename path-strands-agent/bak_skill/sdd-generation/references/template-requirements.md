# Prompt Template: Generate Agent Requirements from PATH Specification

## Role
You are a technical requirements analyst specializing in converting AI Agent design specifications into structured, testable requirements using the EARS (Easy Approach to Requirements Syntax) notation.

## Task
Convert the provided PATH Agent Specification into a comprehensive Requirements Document that follows the EARS notation pattern: "WHEN [condition/event] THE SYSTEM SHALL [expected behavior]"

## Input Format
You will receive a PATH Agent Specification file located at `.kiro/path-spec/spec.md` with the following structure:

```markdown
# AI Agent Design Specification

# 1. Executive Summary
- **Problem**: [문제 정의]
- **Solution**: [해결책]
- **Reason**: [선택 이유]
- **Feasibility**: [점수/50]
- **Recommendation**: [권장사항]

# 2. Strands Agent 구현
### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
...

### 패턴 분석
### Graph 구조
### Agent-as-Tool
### Invocation State 활용

# 3. Amazon Bedrock AgentCore (선택적)
## 서비스 구성 테이블
...

# 4. Architecture
## Mermaid 다이어그램 3개
...

# 5. Problem Decomposition
- **INPUT**: [트리거 유형]
- **PROCESS**: [처리 단계들]
- **OUTPUT**: [결과물 유형]
- **Human-in-Loop**: [협업 모드]

# 6. Risks
- [리스크 및 완화 방안]

# 7. Next Steps
- [Phase별 실행 계획]
```

## Output Format

Generate a `requirements.md` file with the following structure:

```markdown
# Agent Requirements Document

## Introduction
[2-3 paragraph overview describing the AI Agent's purpose, the problem it solves, and how it addresses the business need. Include Feasibility score and Recommendation from PATH spec.]

## Glossary
[Define all key terms including Agent names, Tools, Patterns, and domain-specific terminology]

- **System**: [Agent 시스템 정의]
- **Agent Operator**: [Agent를 운영하는 관리자]
- **[Agent Name]**: [각 Agent의 역할 정의]
- **[Tool Name]**: [각 Tool의 역할 정의]
- **[Domain Term]**: [도메인 용어 정의]
...

## Requirements

### Requirement [N]: [Agent Name] Agent

**User Story:** As [Agent Operator / External System / Agent Name], I want to [action], so that [benefit/value].

#### Acceptance Criteria

1. WHEN [condition/event], THEN the System SHALL [expected behavior]
2. WHEN [condition/event], THEN the System SHALL [expected behavior]
...

[Repeat for each Agent and system-level requirement]
```

## Guidelines

### 1. Introduction Section
- Write a comprehensive introduction (2-3 paragraphs minimum)
- Include the **Problem** and **Solution** from Executive Summary
- Mention the **Feasibility** score and what it implies
- State the **Recommendation** from PATH spec
- Explain the agent patterns being used (Reflection, Tool Use, Planning, Multi-Agent)

### 2. Glossary Section
From PATH spec, extract and define:
- All **Agent Names** from Agent Components table
- All **Tool Names** (MCP servers, custom tools)
- **Patterns** used (Reflection, Planning, Multi-Agent, etc.)
- **AgentCore Services** if present (Runtime, Memory, Gateway, Identity)
- **Domain-specific terms** from the problem domain
- **Human-in-Loop modes** (Autonomous, Supervised, Collaborate)

### 3. Requirements Section

#### User Story Subjects for AI Agents
Use these subjects instead of traditional web app users:
- **Agent Operator**: Person who deploys, monitors, and manages the agent
- **External System**: System that triggers or receives output from the agent
- **[Agent Name] Agent**: When one agent needs something from another
- **End User**: When a human directly interacts with the agent (if applicable)

#### Requirement Categories

**A. Agent Behavior Requirements** (from Agent Components table)
For each Agent in the table, create requirements for:
- Input processing and validation
- Core processing logic (what the Agent does)
- Output format and delivery
- LLM selection and configuration
- Tool invocation patterns

**B. Integration Requirements** (from Tools column and AgentCore)
- MCP server connections
- External API integrations
- AgentCore service integrations (Runtime, Memory, Gateway, Identity)
- boto3/AWS SDK direct calls (if specified)

**C. State Management Requirements** (from Invocation State)
- State initialization
- State updates at each stage
- State access patterns
- State persistence (STM/LTM if AgentCore Memory used)

**D. Graph Flow Requirements** (from Graph 구조)
- Node execution order
- Edge conditions
- Conditional routing (Reflection loops, etc.)
- Entry point and termination conditions

**E. Error Handling Requirements** (from Risks section)
- Each risk should have corresponding error handling requirements
- Include mitigation strategies as acceptance criteria

**F. Human-in-Loop Requirements** (from Problem Decomposition)
Based on Human-in-Loop mode:
- **Autonomous**: No human intervention requirements
- **Supervised**: Monitoring and override requirements
- **Collaborate**: Approval workflow requirements

### 4. Acceptance Criteria Patterns for AI Agents

#### For Agent Input Processing:
```
WHEN [Agent Name] receives [input type], THEN the System SHALL validate [fields/format]
WHEN input validation fails, THEN the System SHALL [error handling behavior]
WHEN input is valid, THEN the System SHALL pass data to [next component]
```

#### For Agent Processing:
```
WHEN [Agent Name] processes [input], THEN the System SHALL invoke [LLM model]
WHEN [Agent Name] requires external data, THEN the System SHALL call [Tool Name]
WHEN [Tool Name] returns [response type], THEN the System SHALL [process response]
```

#### For Agent Output:
```
WHEN [Agent Name] completes processing, THEN the System SHALL output [format]
WHEN output is generated, THEN the System SHALL update invocation_state with [fields]
WHEN [Agent Name] completes, THEN the System SHALL transition to [next node]
```

#### For Graph Flow:
```
WHEN [condition from Graph edge], THEN the System SHALL route to [target node]
WHEN [Agent Name] execution fails, THEN the System SHALL [retry/fallback behavior]
WHEN max_node_executions is reached, THEN the System SHALL terminate with [status]
```

#### For Reflection Pattern:
```
WHEN [Reviewer Agent] scores below [threshold], THEN the System SHALL retry [target Agent]
WHEN retry count exceeds [max_retries], THEN the System SHALL proceed with [fallback]
WHEN score meets threshold, THEN the System SHALL proceed to [next stage]
```

#### For Tool Invocation:
```
WHEN [Agent Name] needs [capability], THEN the System SHALL invoke [Tool Name]
WHEN [Tool Name] requires authentication, THEN the System SHALL use Identity [id]
WHEN [Tool Name] call fails, THEN the System SHALL [retry/error handling]
```

#### For AgentCore Services:
```
WHEN [Agent Name] needs to persist state, THEN the System SHALL write to Memory [type]
WHEN [Agent Name] retrieves history, THEN the System SHALL query Memory with [identifiers]
WHEN external tool is invoked, THEN the System SHALL route through Gateway [id]
```

### 5. Mapping PATH Sections to Requirements

| PATH Section | Requirement Category | What to Extract |
|--------------|---------------------|-----------------|
| Executive Summary | Introduction | Problem, Solution, Feasibility |
| Agent Components | Agent Behavior Reqs | Each row → Agent requirement |
| 패턴 분석 | Graph Flow Reqs | Pattern-specific behaviors |
| Graph 구조 | Graph Flow Reqs | Node/Edge definitions |
| Agent-as-Tool | Integration Reqs | Tool invocation patterns |
| Invocation State | State Management Reqs | State fields and updates |
| AgentCore 서비스 | Integration Reqs | Service configurations |
| Problem Decomposition | Functional Reqs | INPUT/PROCESS/OUTPUT |
| Risks | Error Handling Reqs | Risk → Mitigation requirement |

### 6. Quality Checklist

Before finalizing, verify:
- [ ] Every Agent from the Components table has at least one requirement
- [ ] Every Tool has integration requirements
- [ ] Every edge in the Graph has flow requirements
- [ ] Every Risk has corresponding error handling requirements
- [ ] Invocation State fields have state management requirements
- [ ] Human-in-Loop mode is reflected in requirements
- [ ] All acceptance criteria use EARS notation correctly
- [ ] AgentCore services (if present) have infrastructure requirements

### 7. Language and Style
- Use clear, precise language
- Write in Korean (한글) for descriptions
- Keep code/technical terms in English
- Use active voice
- Be consistent with Agent names and Tool names from PATH spec

## Example Conversion

**From PATH spec:**
```markdown
### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|
| analyzer | 상담 내용 분석 | 전사 텍스트 | 구조화된 JSON | Claude Sonnet | None |
| researcher | 법률 검색 | 법적 쟁점 | 법령/판례 | Claude Sonnet | mcp_rag |

# 5. Problem Decomposition
- **Human-in-Loop**: Collaborate
```

**To requirements.md:**
```markdown
### Requirement 1: analyzer Agent

**User Story:** As an Agent Operator, I want the analyzer Agent to extract structured legal information from consultation transcripts, so that downstream agents can process the information efficiently.

#### Acceptance Criteria

1. WHEN analyzer Agent receives transcribed text, THEN the System SHALL validate that the text is not empty and contains Korean language content
2. WHEN text is valid, THEN the System SHALL invoke Claude Sonnet to analyze the consultation content
3. WHEN analysis is complete, THEN the System SHALL output a JSON object containing: client_info, legal_issues, fact_timeline, requirements
4. WHEN analyzer completes processing, THEN the System SHALL update invocation_state with extracted legal_issues
5. WHEN analyzer completes successfully, THEN the System SHALL transition to researcher node

### Requirement 2: researcher Agent

**User Story:** As the analyzer Agent, I want the researcher Agent to find relevant laws and precedents, so that the draft can include accurate legal references.

#### Acceptance Criteria

1. WHEN researcher Agent receives legal issues JSON, THEN the System SHALL extract search keywords from each issue
2. WHEN search is required, THEN the System SHALL invoke mcp_rag tool with extracted keywords
3. WHEN mcp_rag returns results, THEN the System SHALL filter and rank by relevance score
4. WHEN no results found, THEN the System SHALL log warning and proceed with empty legal_references
5. WHEN researcher completes, THEN the System SHALL output laws, precedents, and legal interpretations

### Requirement 10: Human Collaboration

**User Story:** As an Agent Operator, I want the system to require human review before finalizing output, so that legal accuracy is ensured.

#### Acceptance Criteria

1. WHEN final draft is generated, THEN the System SHALL notify assigned human reviewer
2. WHEN human reviewer is notified, THEN the System SHALL wait for approval before delivery
3. WHEN human reviewer requests changes, THEN the System SHALL route back to draft_writer with feedback
4. WHEN human reviewer approves, THEN the System SHALL proceed to final delivery
```

## Important Notes
- Do NOT include implementation details (those belong in the design document)
- Focus on WHAT the agent system should do, not HOW it will do it internally
- Ensure every requirement is independently verifiable
- Make sure requirements cover both happy paths and error cases
- Always trace back to the PATH specification for accuracy

## Now Generate

Please read the PATH Agent Specification at `.kiro/path-spec/spec.md` and generate a comprehensive `requirements.md` document following this template.

**Important Requirements:**
- The generated document must be written in **Korean (한글)**
- Agent names, Tool names, and code should remain in English
- Save the generated file as `.kiro/specs/requirements.md`
