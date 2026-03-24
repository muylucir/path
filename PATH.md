# P.A.T.H Agent Designer

> AI Agent 아이디어를 체계적으로 검증하고 구현 명세서를 자동 생성하는 프레임워크

---

## P.A.T.H란?

**P.A.T.H** = **P**roblem → **A**ssessment → **T**echnical Review → **H**andoff

막연한 AI Agent 아이디어를 **구조화된 프로토타입 계획**으로 변환하는 4단계 프레임워크입니다.

```
"AI로 뭔가 할 수 있을 것 같은데..."
              ↓
    Step 1: Problem - 문제 정의
              ↓
    Step 2: Assessment - 준비도 점검
              ↓
    Step 3: Technical Review - 패턴 분석
              ↓
    Step 4: Handoff - 명세서 생성
              ↓
"실현 가능한 Agent 구현 계획서"
```

---

## 앱 페이지 구조

| 페이지 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| **소개** | `/` | P.A.T.H 소개 및 시나리오 안내 | 공개 |
| **가이드** | `/guide` | 각 단계별 상세 사용 가이드 | 공개 |
| **패턴 레퍼런스** | `/patterns` | 3계층 Agent 패턴 택소노미 | 공개 |
| **디자인 위자드** | `/design` | Step 1~4 통합 위자드 (메인 워크플로우) | 필요 |
| **세션 목록** | `/sessions` | 저장된 분석 세션 목록 및 조회 | 필요 |
| **로그인** | `/auth/signin` | Cognito Managed Login 리다이렉트 | - |
| **인증 오류** | `/auth/error` | 인증 오류 안내 | - |

> `/feasibility`, `/analyze`, `/results` 경로는 모두 `/design`으로 리다이렉트됩니다 (하위 호환성).

### 4단계 위자드 플로우 (`/design`)

| Step | 위자드 단계 | P.A.T.H | 설명 |
|------|-------------|---------|------|
| **Step 1** | 기본 정보 | **P**roblem | Pain Point 및 요구사항 입력 |
| **Step 2** | 준비도 점검 | **A**ssessment | 6개 항목 Feasibility 평가 (5개 준비도 + 자율성) |
| **Step 3** | 패턴 분석 | **T**echnical Review | Agent 패턴 분석 대화 |
| **Step 4** | 명세서 | **H**andoff | 최종 결과 및 명세서 생성 |

---

## Step 1: Problem Decomposition

Pain Point를 4가지 요소로 분해합니다.

| 요소 | 질문 | 선택지 |
|------|------|--------|
| **INPUT** | 무엇이 트리거인가? | Event-Driven, Scheduled, On-Demand, Streaming, Conditional |
| **PROCESS** | 무슨 작업이 필요한가? | 정보 수집, 분석/이해, 추론/판단, 생성/작성, 검증/반복 |
| **OUTPUT** | 결과물은 무엇인가? | 텍스트 응답, 문서/보고서, 구조화된 데이터, 외부 시스템 변경 |
| **Human-in-Loop** | 사람 개입 시점은? | 완전 자동, 실행 전 승인, 불확실할 때만 개입, AI와 함께 작업 |

**추가 입력 항목:**
- 오류 허용도 (Error Tolerance): 4단계 선택
- 데이터소스 (Additional Sources): 자유 텍스트
- 추가 컨텍스트 (Additional Context): 자유 텍스트

**입력 검증:**
- Zod 스키마 기반 유효성 검사
- LLM 프롬프트 인젝션 방지 (위험 패턴 필터링)
- 필드별 최대 길이 제한 (Pain Point 2000자, Context 5000자, Sources 2000자)

---

## Step 2: Assessment (준비도 점검)

`FeasibilityAgent`가 5개 준비도 항목 + 1개 자율성 항목을 평가합니다.

### 준비도 평가 항목 (총 50점)

| 항목 | 10점 | 5점 | 0점 |
|------|------|-----|-----|
| **데이터 접근성** | MCP/API 존재 | DB 직접 | 오프라인만 |
| **판단 명확성** | 명확한 규칙 | 암묵적 패턴 | 설명 불가 |
| **오류 허용도** | 틀려도 OK | 90%+ 필요 | 100% 필수 |
| **지연 요구사항** | 몇 시간 OK | 1분 이내 | 실시간 (<3초) |
| **통합 복잡도** | MCP/SDK 존재 | API 문서/품질 부족 | 폐쇄 시스템 |

### 자율성 요구도 (별도 축, 0-10점)

준비도 50점과는 독립된 평가 축으로, "이 업무가 에이전트의 자율적 판단을 얼마나 필요로 하는가"를 측정합니다.

| 점수 | 수준 | 설명 |
|------|------|------|
| 9-10 | 완전 자율 | 예측 불가능한 상황에서 독립적 판단 필수 |
| 7-8 | 높은 자율 | 다양한 경로 중 상황별 최적 경로 선택 |
| 5-6 | 중간 | 일부 판단 필요하나 대부분 정해진 흐름 |
| 3-4 | 낮은 자율 | 거의 결정적 프로세스, AI는 특정 단계만 보조 |
| 0-2 | 자율 불필요 | 완전히 결정적 파이프라인 |

자율성 점수는 Step 3에서 **자동화 수준** 판단의 근거가 됩니다:
- **자율성 ≤5** → AI-Assisted Workflow (결정적 파이프라인 + 특정 단계에서 AI 활용)
- **자율성 ≥6** → Agentic AI (에이전트가 자율적으로 도구 선택, 판단, 반복 수행)

### 준비도 레벨

| 레벨 | 점수 | 아이콘 | 설명 |
|------|------|--------|------|
| **준비됨** | 8-10점 | ✅ | 즉시 구현 가능 |
| **양호** | 6-7점 | 🔵 | 약간의 보완으로 구현 가능 |
| **보완 필요** | 4-5점 | 🟡 | 추가 준비 필요 |
| **준비 필요** | 0-3점 | 🟠 | 상당한 준비 필요 |

### 종합 판정 (총 50점)

| 점수 | 판정 | 권장 조치 |
|------|------|----------|
| 40-50점 | ✅ 즉시 시작 | 프로토타입 진행 |
| 30-39점 | ⚠️ 조건부 진행 | 리스크 관리 필요 |
| 20-29점 | 🔄 개선 후 재평가 | 낮은 항목 개선 계획 수립 |
| 20점 미만 | ❌ 대안 모색 | 다른 접근법 검토 |

### 재평가 기능

낮은 점수 항목에 **개선 계획**을 입력하고 재평가할 수 있습니다:

1. 준비도 점검 결과 확인
2. 낮은 점수 항목 선택
3. 개선 계획 입력
4. "재평가" 버튼 클릭
5. Claude가 개선 계획 반영하여 재평가 (SSE 스트리밍으로 진행 상태 표시)

---

## Step 3: Technical Review (패턴 분석)

`PatternAnalyzerAgent`가 준비도 결과를 기반으로 Agent 패턴을 분석합니다.

### 3계층 Agent 패턴 택소노미

에이전트 시스템은 3개 계층의 조합으로 설계합니다:

| Layer | 질문 | 설명 |
|-------|------|------|
| **Layer 1: Agent Pattern** | 어떤 유형의 에이전트인가? | RAG, Tool-based, Coding, Memory 등 |
| **Layer 2: LLM Workflow** | 어떻게 추론하는가? | ReAct, Reflection, Planning, Routing 등 |
| **Layer 3: Agentic Workflow** | 어떻게 협업하는가? | Agents as Tools, Swarm, Graph, Workflow 등 |

> 상세 패턴 목록은 `/patterns` 페이지 또는 `agent-patterns` 스킬 참조

### 아키텍처 권장

| 아키텍처 | 조건 |
|---------|------|
| 🔵 싱글 에이전트 | PROCESS ≤3개, 도구 1-2개, 순차 처리 |
| 🟣 멀티 에이전트 | PROCESS 4+개, 도구 3+개, 전문성 분리 필요 |

### 멀티 에이전트 협업 패턴

| 패턴 | 설명 | 적합한 경우 |
|------|------|------------|
| **Agents as Tools** | Orchestrator가 전문 Agent를 도구처럼 호출 | 독립적 서브태스크 분해 |
| **Swarm** | 동등한 Agent들이 handoff로 협업 | 브레인스토밍, 반복 개선 |
| **Graph** | 방향성 그래프로 정보 흐름 정의 | 복잡한 계층/조건부 흐름 |
| **Workflow** | 미리 정의된 순서로 태스크 실행 | 명확한 단계별 파이프라인 |

### 자동화 수준

| 수준 | 자율성 점수 | 특징 |
|------|-----------|------|
| **AI-Assisted Workflow** | ≤5 | 결정적 파이프라인 + 특정 단계에서 AI 활용 |
| **Agentic AI** | ≥6 | 에이전트가 자율적으로 도구 선택, 판단, 반복 수행 |

### 대화형 분석

- Claude와 SSE 스트리밍 기반 대화로 패턴 결정
- 첫 응답: Feasibility 요약 + 핵심 질문 (확정적 패턴 추천 없음)
- 이후 턴: 사용자 답변 반영하여 잠정 패턴 분석 구체화
- 질문 시 `<options>` 블록으로 클릭 가능한 선택지 제공 (복수 선택 `multiSelect` 지원)
- 충분한 정보 수집 후 "패턴 확정" 버튼으로 확정
- 확정 시 JSON 형식의 최종 분석 결과 생성 (`updated_autonomy`, `automation_level` 포함)

---

## Step 4: Handoff (명세서 생성)

`MultiStageSpecAgent`가 5개 서브 Agent 파이프라인으로 명세서를 생성합니다.

### 명세서 생성 파이프라인

```
DesignAgent (0-40%)
     │
     ▼
┌────┴────┬────────────┐
│         │            │
DiagramAgent  PromptAgent  ToolAgent   ← 병렬 실행 (40-95%)
│         │            │
└────┬────┴────────────┘
     │
     ▼
AssemblerAgent (95-100%)   ← LLM 없이 문자열 조합
```

| 단계 | Agent | 진행률 | 역할 |
|------|-------|--------|------|
| 1 | **DesignAgent** | 0-40% | 프레임워크 독립적 Agent 설계 패턴 분석 |
| 2a | **DiagramAgent** | 40-95% | Mermaid 다이어그램 생성 (검증 + 재시도) |
| 2b | **PromptAgent** | 40-95% | Agent별 System Prompt 설계 (3+ Agent 시 Scatter-Gather 병렬 생성) |
| 2c | **ToolAgent** | 40-95% | Tool 스키마 정의 (Compact Signature) |
| 3 | **AssemblerAgent** | 95-100% | 최종 Markdown 조합 (LLM 미사용) |

> DiagramAgent, PromptAgent, ToolAgent는 **병렬 실행**으로 속도를 최적화합니다.

### DiagramAgent 검증

`MermaidValidator`가 생성된 다이어그램을 검증합니다:
- 다이어그램 타입 선언 확인
- 괄호 짝 검증 (`{}`, `[]`, `()`)
- 노드 텍스트 내 특수문자 따옴표 미사용 감지
- Sequence Diagram activate/deactivate 쌍 확인 (명시적 + 인라인 문법)
- 검증 실패 시 자동 재시도 1회

### 스킬 시스템

파이프라인에서 사용하는 스킬 (agentskills.io 스펙 기반):

| 스킬명 | 역할 | 사용 Agent |
|--------|------|-----------|
| `agent-patterns` | 3계층 Agent 설계 패턴 가이드 | DesignAgent |
| `feasibility-evaluation` | Feasibility 평가 기준 | FeasibilityAgent |
| `mermaid-diagrams` | Mermaid 다이어그램 생성 가이드 | DiagramAgent |
| `prompt-engineering` | System Prompt 작성 가이드 | PromptAgent |
| `tool-schema` | Tool 스키마 정의 가이드 | ToolAgent |
| `ascii-diagram` | ASCII 다이어그램 가이드 | PatternAnalyzerAgent (채팅) |

각 스킬은 `SKILL.md` (메타데이터 + 지시사항) + `references/` (참조 문서)로 구성되며, Agent가 `file_read` 도구로 런타임에 읽습니다.

### 명세서 구성

1. **Executive Summary** - 요약 (Problem, Solution, Feasibility, Automation Level)
2. **Agent Design Pattern** - 패턴 선택 및 이유, Agent Components, State Management
3. **Visual Design** - Mermaid 다이어그램 (Workflow, Sequence, Architecture Overview)
4. **Agent Prompts** - Agent별 System Prompt, Example Prompt, Expected Output
5. **Tool Definitions** - Compact Signature 형식의 Tool 스키마
6. **Problem Decomposition** - INPUT/PROCESS/OUTPUT/Human-in-Loop 분해
7. **Risks** - 주요 리스크 (있는 경우)
8. **Next Steps** - Phase별 구현 단계 (있는 경우)

---

## 활용 시나리오

### 시나리오 1: 고객 미팅

**상황**: 고객이 "AI로 계약서 검토 자동화하고 싶다"고 요청

**Before P.A.T.H:**
```
우리: "네, 가능할 것 같습니다. 2주 후에 데모 보여드릴게요."
→ 2주 개발 → 데모 → "법무팀 승인이 필요하네요?" (처음 알게 됨)
```

**After P.A.T.H:**
```
1. 미팅 중 P.A.T.H 실행
2. Feasibility 35점 → "조건부 진행"
3. 리스크 발견: "법무팀 리뷰 필수 (Human-in-Loop: Review)"
4. 고객에게 공유: "가능하지만 법무팀 승인 프로세스 필요합니다"
5. 범위 조정 후 계획 수립
```

### 시나리오 2: 해커톤/워크샵

**상황**: AI Agent 아이디어 발굴 워크샵

**Before P.A.T.H:**
```
- 아이디어 브레인스토밍
- "이것도 해보고 저것도 해보고..."
- 결과: 3개 아이디어 중 어느 것도 완성 못함
```

**After P.A.T.H:**
```
- 5개 아이디어 도출
- 각 아이디어 P.A.T.H 분석
- Feasibility 점수로 정렬 → 최고 점수 1개 선택
- 4단계 파이프라인으로 명세서 생성
- 결과: 실현 가능한 구현 계획
```

### 시나리오 3: 제안서 작성

**상황**: PoC 제안서에 AI Agent 솔루션 포함

**Before P.A.T.H:**
```
- 막연한 설명: "AI가 자동으로 분석합니다"
- 고객: "구체적으로 어떻게요?"
- 우리: "음... 그건 개발하면서 정해집니다"
```

**After P.A.T.H:**
```
- P.A.T.H로 분석
- 명세서 자동 생성:
  - Agent Architecture 다이어그램
  - 역할별 Agent 정의
  - Feasibility 42점 (높은 성공 가능성)
- 제안서에 첨부하여 신뢰도 향상
```

---

## 얻을 수 있는 결과물

| 결과물 | 설명 |
|--------|------|
| **Feasibility 점수** | 50점 만점 정량 평가 |
| **자율성 요구도** | 10점 만점 별도 축 |
| **자동화 수준** | AI-Assisted Workflow 또는 Agentic AI |
| **준비도 레벨** | 항목별 준비 상태 |
| **패턴 추천** | 적합한 Agent 패턴 + 아키텍처 + 협업 패턴 |
| **명세서** | Markdown 구현 명세서 (Prompt, Tool, Diagram 포함) |
| **다이어그램** | Mermaid 아키텍처 다이어그램 (검증됨) |
| **의사결정 근거** | Go/No-Go 판단 자료 |

---

## API 엔드포인트 참조

### Step 2: 준비도 점검

| 엔드포인트 | Method | AgentCore Action | 설명 |
|-----------|--------|------------------|------|
| `/api/bedrock/feasibility` | POST | `feasibility` | 초기 평가 (SSE) |
| `/api/bedrock/feasibility/update` | POST | `feasibility_update` | 재평가 (SSE) |

### Step 3: 패턴 분석

| 엔드포인트 | Method | AgentCore Action | 설명 |
|-----------|--------|------------------|------|
| `/api/bedrock/pattern/analyze` | POST | `pattern_analyze` | 초기 패턴 분석 (SSE) |
| `/api/bedrock/pattern/chat` | POST | `pattern_chat` | 대화형 분석 (SSE) |
| `/api/bedrock/pattern/finalize` | POST | `pattern_finalize` | 최종 확정 (JSON) |

### Step 4: 명세서 생성

| 엔드포인트 | Method | AgentCore Action | 설명 |
|-----------|--------|------------------|------|
| `/api/bedrock/spec` | POST | `spec` | 명세서 생성 (SSE + 진행률) |

### 세션 관리

| 엔드포인트 | Method | 설명 |
|-----------|--------|------|
| `/api/sessions` | GET | 세션 목록 조회 (페이지네이션) |
| `/api/sessions` | POST | 세션 저장 |
| `/api/sessions/[id]` | GET | 세션 상세 조회 |
| `/api/sessions/[id]` | PUT | 세션 업데이트 |
| `/api/sessions/[id]` | DELETE | 세션 삭제 |

### 기타

| 엔드포인트 | Method | 설명 |
|-----------|--------|------|
| `/api/health` | GET | 헬스 체크 (Frontend + AgentCore 상태) |
| `/api/auth/*` | - | NextAuth 인증 엔드포인트 |
| `/api/auth/logout` | POST | 로그아웃 |

---

## Backend Agent 구조

```
Next.js API Routes (/api/bedrock/*)
         │
         │  AWS SDK (BedrockAgentCoreClient)
         ▼
┌─────────────────────────────────────────┐
│     AgentCore Runtime (Entrypoint)      │
│     agentcore_entrypoint.py             │
│                                         │
│  action dispatch:                       │
│   feasibility      → FeasibilityAgent   │
│   feasibility_update → FeasibilityAgent │
│   pattern_analyze  → PatternAnalyzerAgent│
│   pattern_chat     → PatternAnalyzerAgent│
│   pattern_finalize → PatternAnalyzerAgent│
│   spec             → MultiStageSpecAgent │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐
│ Feasibility  │ │  Pattern     │ │ MultiStageSpecAgent  │
│ Agent        │ │  Analyzer    │ │                      │
│ (Step 2)     │ │  Agent       │ │  ├── DesignAgent     │
│              │ │  (Step 3)    │ │  ├── DiagramAgent    │
│              │ │              │ │  ├── PromptAgent     │
│              │ │  세션 캐시:   │ │  ├── ToolAgent      │
│              │ │  stateful    │ │  └── AssemblerAgent  │
│              │ │  대화 유지    │ │                      │
└──────────────┘ └──────────────┘ └─────────────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
              ┌─────────────────┐
              │  Strands Agents │
              │  SDK + Skills   │
              │  + safe_file_read│
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  AWS Bedrock    │
              │  Claude Opus 4.6│
              │  (Prompt Cache) │
              └─────────────────┘
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Cloudscape Design System, Zod 4 |
| **Backend** | Python 3.11+, Strands Agents SDK, AWS Bedrock AgentCore Runtime |
| **LLM** | AWS Bedrock Claude Opus 4.6 (`global.anthropic.claude-opus-4-6-v1`) |
| **인증** | NextAuth v5 + Amazon Cognito (OIDC) |
| **세션 저장** | Amazon DynamoDB (`path-agent-sessions` 테이블, GSI: `user-sessions-index`) |
| **통신** | SSE (Server-Sent Events) — AgentCore → Next.js API Route → 브라우저 릴레이 |
| **스킬 시스템** | agentskills.io 스펙 기반 (6개 스킬, file_read 도구로 동적 로딩) |
| **토큰 추적** | Claude Opus 4.6 가격 기준 비용 추산 (input $15/M, output $75/M) |
| **보안** | Zod 스키마 검증, 프롬프트 인젝션 필터링, safe_file_read 경로 제한, Cognito 인증 |
