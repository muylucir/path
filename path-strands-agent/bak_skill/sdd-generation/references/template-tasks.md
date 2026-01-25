# Prompt Template: Generate Agent Implementation Tasks from PATH Specification

## Role
You are a technical project manager and lead AI agent developer responsible for breaking down architectural designs into concrete, actionable implementation tasks with clear dependencies and validation points.

## Task
Convert the provided PATH specification, requirements, and design documents into a detailed Implementation Plan (tasks.md) that organizes all implementation work into a logical sequence of tasks with checkboxes, subtasks, requirements traceability, and comprehensive testing.

## Input Format
You will receive:
1. **spec.md**: PATH Agent Specification (located at `.kiro/path-spec/spec.md`)
2. **requirements.md**: Requirements document (located at `.kiro/specs/requirements.md`)
3. **design.md**: Design document (located at `.kiro/specs/design.md`)

## Output Format

Generate a `tasks.md` file with the following structure:

```markdown
# Agent Implementation Plan

## Phase 1: 프로젝트 기반 설정

- [ ] 1. 프로젝트 초기화 및 의존성 설치
- [ ] 1.1 Python 프로젝트 구조 생성
  - pyproject.toml 또는 requirements.txt 설정
  - 디렉토리 구조 생성 (src/agents, src/graph, src/tools, tests)
  - _Requirements: None (Setup)_

- [ ] 1.2 Strands Agents SDK 설치 및 설정
  - strands-agents 패키지 설치
  - AWS Bedrock 자격 증명 설정
  - 환경 변수 설정 (.env)
  - _Requirements: None (Setup)_

- [ ] 1.3 MCP 서버 설정 (필요시)
  - [MCP 서버 목록] 연동 설정
  - 연결 테스트
  - _Requirements: Integration Requirements_

- [ ] 1.4 Checkpoint - 환경 설정 검증
  - Strands SDK import 확인
  - AWS Bedrock 연결 테스트
  - MCP 서버 연결 테스트
  - 모든 설정이 올바르게 동작하는지 확인

## Phase 2: Agent 구현

- [ ] 2. [첫 번째 Agent Name] Agent 구현
- [ ] 2.1 [Agent Name] Agent 클래스 생성
  - System prompt 정의
  - 입력/출력 스키마 정의 (TypedDict)
  - Tool 바인딩 (있는 경우)
  - _Requirements: [관련 요구사항 번호]_

- [ ] 2.2 [Agent Name] Unit 테스트 작성
  - Mock LLM으로 정상 처리 테스트
  - 입력 검증 테스트
  - 에러 케이스 테스트
  - _Requirements: [관련 요구사항 번호]_

[각 Agent에 대해 반복]

- [ ] N. Checkpoint - Agent 구현 검증
  - 모든 Agent Unit 테스트 통과 확인
  - 각 Agent 개별 실행 테스트
  - 문제 발생 시 수정 후 진행

## Phase 3: Graph 구현

- [ ] N+1. Graph 구조 구현
- [ ] N+1.1 노드 정의
  - 모든 Agent를 Graph 노드로 등록
  - 엔트리 포인트 설정
  - _Requirements: Graph Flow Requirements_

- [ ] N+1.2 엣지 정의
  - 순차 실행 엣지 추가
  - 조건부 라우팅 함수 구현 (Reflection 등)
  - max_node_executions 설정
  - _Requirements: Graph Flow Requirements_

- [ ] N+1.3 Invocation State 구현
  - State 스키마 정의
  - State 초기화 로직
  - State 업데이트 포인트 구현
  - _Requirements: State Management Requirements_

- [ ] N+1.4 Graph Integration 테스트 작성
  - 순차 실행 흐름 테스트
  - 조건부 라우팅 테스트
  - Reflection 루프 종료 테스트
  - _Requirements: Graph Flow Requirements_

- [ ] N+2. Checkpoint - Graph 통합 검증
  - 전체 Graph 실행 테스트
  - 모든 경로 커버리지 확인
  - Integration 테스트 통과 확인

## Phase 4: AgentCore 배포 설정

- [ ] N+3. AgentCore Runtime 설정
- [ ] N+3.1 Runtime 엔트리포인트 구현
  - BedrockAgentCoreApp 설정
  - invoke 핸들러 구현
  - 프로토콜 설정 (HTTP/MCP)
  - _Requirements: Infrastructure Requirements_

- [ ] N+3.2 AgentCore Memory 설정
  - STM 설정 (memory_id, actor_id, session_id)
  - LTM 설정 (필요시)
  - Memory 통합 테스트
  - _Requirements: State Management Requirements_

- [ ] N+3.3 AgentCore Gateway 설정
  - Lambda MCP 도구 등록
  - Identity 연결 설정
  - Gateway 통합 테스트
  - _Requirements: Integration Requirements_

- [ ] N+3.4 AgentCore Identity 설정
  - API Key 저장 (Secrets Manager)
  - OAuth 토큰 설정 (필요시)
  - Identity 연결 테스트
  - _Requirements: Integration Requirements_

- [ ] N+4. Checkpoint - AgentCore 배포 검증
  - 로컬 AgentCore 실행 테스트
  - Memory 연동 확인
  - Gateway 도구 호출 확인

## Phase 5: 테스트 및 검증

- [ ] N+5. E2E 테스트 작성
- [ ] N+5.1 핵심 워크플로우 E2E 테스트
  - 전체 성공 시나리오 테스트
  - 에러 복구 시나리오 테스트
  - _Requirements: All Requirements_

- [ ] N+5.2 Human-in-Loop 테스트 (필요시)
  - 승인 대기 플로우 테스트
  - 거부/재시도 플로우 테스트
  - _Requirements: Human-in-Loop Requirements_

- [ ] N+6. 성능 및 안정성 검증
  - 응답 시간 측정
  - 메모리 사용량 확인
  - 동시 요청 처리 테스트 (필요시)
  - _Requirements: Non-functional Requirements_

- [ ] N+7. Checkpoint - 최종 검증
  - 모든 Unit 테스트 통과
  - 모든 Integration 테스트 통과
  - E2E 테스트 통과
  - 성능 기준 충족

## Phase 6: Human-in-Loop 구현 (해당시)

- [ ] N+8. Human-in-Loop 인터페이스 구현
- [ ] N+8.1 승인 요청 메커니즘
  - 알림 전송 로직
  - 승인 대기 상태 관리
  - _Requirements: Human-in-Loop Requirements_

- [ ] N+8.2 승인/거부 처리
  - 승인 콜백 처리
  - 거부 시 재시도 로직
  - _Requirements: Human-in-Loop Requirements_

## Phase 7: 문서화 및 배포

- [ ] N+9. 문서화
- [ ] N+9.1 README.md 작성
  - 설치 방법
  - 실행 방법
  - 환경 변수 설명
  - _Requirements: None (Documentation)_

- [ ] N+9.2 API 문서 작성 (필요시)
  - 입력/출력 스키마 문서화
  - 에러 코드 문서화
  - _Requirements: None (Documentation)_

- [ ] N+10. 프로덕션 배포
  - AgentCore 프로덕션 배포
  - 모니터링 설정
  - 알림 설정
  - _Requirements: None (Deployment)_
```

## Guidelines

### 1. Phase Structure

#### Phase 1: 프로젝트 기반 설정
- 프로젝트 초기화
- 의존성 설치 (Strands SDK, AWS SDK)
- MCP 서버 설정
- 환경 변수 설정

#### Phase 2: Agent 구현
- 각 Agent별로:
  - Agent 클래스 구현
  - Unit 테스트 작성
- PATH spec의 Agent Components 테이블 순서대로 구현

#### Phase 3: Graph 구현
- 노드 등록
- 엣지 정의 (순차 + 조건부)
- Invocation State 구현
- Graph Integration 테스트

#### Phase 4: AgentCore 배포 설정
- Runtime 설정
- Memory 설정 (STM/LTM)
- Gateway 설정
- Identity 설정
- **Note**: 항상 포함 (AgentCore 섹션 없어도 기본 배포 태스크 생성)

#### Phase 5: 테스트 및 검증
- E2E 테스트
- Human-in-Loop 테스트 (필요시)
- 성능 검증

#### Phase 6: Human-in-Loop (해당시)
- Problem Decomposition의 Human-in-Loop 모드가 "Collaborate" 또는 "Supervised"인 경우에만 포함

#### Phase 7: 문서화 및 배포
- README 작성
- 프로덕션 배포

### 2. Task Numbering

```markdown
- [ ] N. [Major Task]
- [ ] N.1 [Subtask 1]
- [ ] N.2 [Subtask 2]
```

Major tasks should be numbered sequentially across all phases.

### 3. Checkpoint Tasks

각 Phase 끝에 Checkpoint 태스크 추가:

```markdown
- [ ] N. Checkpoint - [Phase] 검증
  - [검증 항목 1]
  - [검증 항목 2]
  - 문제 발생 시 수정 후 진행
```

### 4. Requirements Traceability

모든 구현 태스크는 요구사항 참조 포함:

```markdown
- [ ] N.M [Task description]
  - [Detail 1]
  - [Detail 2]
  - _Requirements: [requirement numbers or category]_
```

### 5. Agent Task Pattern

각 Agent에 대해:

```markdown
- [ ] N. [Agent Name] Agent 구현
- [ ] N.1 [Agent Name] Agent 클래스 생성
  - System prompt 정의
  - 입력/출력 스키마 정의 (TypedDict)
  - Tool 바인딩: [tool names]
  - LLM 설정: [model name]
  - _Requirements: [관련 요구사항]_

- [ ] N.2 [Agent Name] Unit 테스트 작성
  - Mock LLM으로 정상 처리 테스트
  - 입력 검증 테스트 (빈 입력, 잘못된 형식)
  - 출력 스키마 준수 테스트
  - Tool 호출 검증 테스트 (있는 경우)
  - 에러 케이스 테스트
  - _Requirements: [관련 요구사항]_
```

### 6. PATH Next Steps Integration

PATH spec의 "Next Steps" 섹션을 참고하여:
- Phase 분류에 반영
- 우선순위 결정에 활용
- 선택적 기능 식별에 활용

### 7. Extracting Tasks from PATH Spec

| PATH Section | Tasks to Generate |
|--------------|-------------------|
| Agent Components | Phase 2: 각 Agent 구현 |
| Graph 구조 | Phase 3: Graph 구현 |
| AgentCore 서비스 | Phase 4: AgentCore 설정 |
| Problem Decomposition | Phase 1 (INPUT), Phase 5 (PROCESS 검증) |
| Human-in-Loop | Phase 6: Human-in-Loop 구현 |
| Risks | 각 Phase에 완화 태스크 포함 |
| Next Steps | 전체 Phase 우선순위 |

### 8. Testing Task Pattern

**Unit 테스트** (각 Agent 직후):
```markdown
- [ ] N.2 [Agent Name] Unit 테스트 작성
  - Mock LLM으로 정상 처리 테스트
  - 입력 검증 테스트
  - 에러 케이스 테스트
  - _Requirements: [관련 요구사항]_
```

**Integration 테스트** (Graph 구현 후):
```markdown
- [ ] N.4 Graph Integration 테스트 작성
  - 순차 실행 흐름 테스트
  - 조건부 라우팅 테스트
  - State 전파 테스트
  - _Requirements: Graph Flow Requirements_
```

**E2E 테스트** (Phase 5):
```markdown
- [ ] N.1 핵심 워크플로우 E2E 테스트
  - 전체 성공 시나리오 테스트 (실제 LLM)
  - 에러 복구 시나리오 테스트
  - _Requirements: All Requirements_
```

### 9. Quality Checklist

Before finalizing, verify:
- [ ] 모든 Agent가 구현 태스크를 가짐
- [ ] 모든 Agent가 Unit 테스트 태스크를 가짐
- [ ] Graph 구현 및 Integration 테스트 태스크 있음
- [ ] AgentCore 설정 태스크 포함됨 (항상)
- [ ] E2E 테스트 태스크 있음
- [ ] Human-in-Loop 태스크 (해당시)
- [ ] 각 Phase 끝에 Checkpoint 있음
- [ ] 모든 태스크에 Requirements 참조 있음
- [ ] 태스크 순서가 의존성을 존중함

## Example Conversion

**From PATH spec:**
```markdown
### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|
| analyzer | 상담 분석 | 텍스트 | JSON | Claude Sonnet | None |
| researcher | 법률 검색 | 쟁점 | 법령/판례 | Claude Sonnet | mcp_rag |
| writer | 초안 작성 | 분석+검색 | 문서 | Claude Sonnet | mcp_template |

# 5. Problem Decomposition
- **Human-in-Loop**: Collaborate
```

**To tasks.md:**
```markdown
## Phase 2: Agent 구현

- [ ] 2. analyzer Agent 구현
- [ ] 2.1 analyzer Agent 클래스 생성
  - System prompt: 상담 내용 분석 및 구조화
  - 입력 스키마: AnalyzerInput (text: str)
  - 출력 스키마: AnalyzerOutput (client_info, legal_issues, facts, requirements)
  - LLM: Claude Sonnet 4.5
  - Tools: 없음
  - _Requirements: Requirement 1 (analyzer Agent)_

- [ ] 2.2 analyzer Unit 테스트 작성
  - Mock LLM으로 정상 분석 테스트
  - 빈 텍스트 입력 처리 테스트
  - 출력 JSON 스키마 검증 테스트
  - 에러 케이스 테스트
  - _Requirements: Requirement 1_

- [ ] 3. researcher Agent 구현
- [ ] 3.1 researcher Agent 클래스 생성
  - System prompt: 법령 및 판례 검색
  - 입력 스키마: ResearcherInput (legal_issues: List[str])
  - 출력 스키마: ResearcherOutput (laws, precedents, interpretations)
  - LLM: Claude Sonnet 4.5
  - Tools: mcp_rag
  - _Requirements: Requirement 2 (researcher Agent)_

- [ ] 3.2 researcher Unit 테스트 작성
  - Mock LLM + Mock mcp_rag로 정상 검색 테스트
  - 검색 결과 없음 처리 테스트
  - mcp_rag 호출 검증 테스트
  - _Requirements: Requirement 2_

- [ ] 4. writer Agent 구현
- [ ] 4.1 writer Agent 클래스 생성
  - System prompt: 법률 의견서 초안 작성
  - 입력 스키마: WriterInput (analysis, research)
  - 출력 스키마: WriterOutput (draft_document)
  - LLM: Claude Sonnet 4.5
  - Tools: mcp_template
  - _Requirements: Requirement 3 (writer Agent)_

- [ ] 4.2 writer Unit 테스트 작성
  - Mock LLM + Mock mcp_template로 초안 생성 테스트
  - 템플릿 필드 매핑 테스트
  - _Requirements: Requirement 3_

- [ ] 5. Checkpoint - Agent 구현 검증
  - 모든 Agent Unit 테스트 통과 확인
  - 각 Agent 개별 실행 테스트
  - 문제 발생 시 수정 후 진행

## Phase 6: Human-in-Loop 구현

- [ ] 12. Human-in-Loop 인터페이스 구현
- [ ] 12.1 승인 요청 메커니즘
  - 초안 완료 시 담당자 알림 전송
  - 승인 대기 상태 관리
  - _Requirements: Human Collaboration Requirements_

- [ ] 12.2 승인/거부 처리
  - 승인 시 최종 저장 및 전달
  - 거부 시 피드백과 함께 writer로 재라우팅
  - _Requirements: Human Collaboration Requirements_
```

## Important Notes
- Tasks should be actionable and specific
- Every Agent must have implementation + unit test tasks
- AgentCore tasks are always included (per user preference)
- Human-in-Loop tasks only if mode is "Collaborate" or "Supervised"
- Checkpoints ensure quality gates are met
- Task order should respect dependencies
- Integration tests after Graph implementation
- E2E tests in Phase 5 (selective, expensive)

## Now Generate

Please read:
1. The PATH Agent Specification at `.kiro/path-spec/spec.md`
2. The Requirements document at `.kiro/specs/requirements.md`
3. The Design document at `.kiro/specs/design.md`

And generate a comprehensive `tasks.md` implementation plan following this template.

**Important Requirements:**
- The generated document must be written in **Korean (한글)**
- Task descriptions should be in Korean
- Technical terms and code references can remain in English
- Save the generated file as `.kiro/specs/tasks.md`
