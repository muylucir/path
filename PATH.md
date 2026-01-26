# P.A.T.H Framework

> AI Agent 아이디어를 체계적으로 검증하고 구현 명세서를 자동 생성하는 프레임워크

---

## P.A.T.H란?

**P.A.T.H** = **P**roblem → **T**echnical → **A**gent Pattern → **H**andoff

막연한 AI Agent 아이디어를 **구조화된 프로토타입 계획**으로 변환하는 4단계 프레임워크입니다.

```
"AI로 뭔가 할 수 있을 것 같은데..."
              ↓
    Step 1: Problem - 문제 정의
              ↓
    Step 2: Technical - 준비도 점검
              ↓
    Step 3: Agent Pattern - 패턴 분석
              ↓
    Step 4: Handoff - 명세서 생성
              ↓
"실현 가능한 Agent 구현 계획서"
```

---

## 4단계 앱 플로우

| Step | 페이지 | 경로 | P.A.T.H | 설명 |
|------|--------|------|---------|------|
| **Step 1** | 기본 정보 | `/` | **P**roblem | Pain Point 및 요구사항 입력 |
| **Step 2** | 준비도 점검 | `/feasibility` | **T**echnical | 5개 항목 Feasibility 평가 |
| **Step 3** | 패턴 분석 | `/analyze` | **A**gent Pattern | Agent 패턴 분석 대화 |
| **Step 4** | 명세서 | `/results` | **H**andoff | 최종 결과 및 명세서 생성 |

---

## Step 1: Problem Decomposition

Pain Point를 4가지 요소로 분해합니다.

| 요소 | 질문 | 선택지 |
|------|------|--------|
| **INPUT** | 무엇이 트리거인가? | Event-Driven, Scheduled, On-Demand, Streaming, Conditional |
| **PROCESS** | 무슨 작업이 필요한가? | 데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성, 검증/개선, 실행/연동 |
| **OUTPUT** | 결과물은 무엇인가? | Decision, Content, Notification, Action, Insight |
| **Human-in-Loop** | 사람 개입 시점은? | None, Review, Exception, Collaborate |

**추가 입력 항목:**
- 오류 허용도 (Error Tolerance)
- 데이터 소스 (Additional Sources)
- 추가 컨텍스트 (Additional Context)

---

## Step 2: Technical Readiness (준비도 점검)

`FeasibilityAgent`가 5개 항목을 평가합니다.

### 평가 항목

| 항목 | 10점 | 5점 | 0점 |
|------|------|-----|-----|
| **데이터 접근성** | MCP/API 존재 | DB 직접 | 오프라인만 |
| **판단 명확성** | 명확한 규칙 | 암묵적 패턴 | 설명 불가 |
| **오류 허용도** | 틀려도 OK | 90%+ 필요 | 100% 필수 |
| **지연 요구사항** | 몇 시간 OK | 1분 이내 | 실시간 (<3초) |
| **통합 복잡도** | 독립 실행 | 3-5개 시스템 | 레거시 |

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
| 30-40점 | ⚠️ 조건부 진행 | 리스크 관리 필요 |
| 20-30점 | 🔄 개선 후 재평가 | 낮은 항목 개선 계획 수립 |
| 20점 미만 | ❌ 대안 모색 | 다른 접근법 검토 |

### 재평가 기능

낮은 점수 항목에 **개선 계획**을 입력하고 재평가할 수 있습니다:

1. 준비도 점검 결과 확인
2. 낮은 점수 항목 선택
3. 개선 계획 입력
4. "재평가" 버튼 클릭
5. Claude가 개선 계획 반영하여 재평가

---

## Step 3: Agent Pattern (패턴 분석)

`PatternAnalyzerAgent`가 준비도 결과를 기반으로 Agent 패턴을 분석합니다.

### Agent 패턴

| 패턴 | 설명 | 적합한 경우 |
|------|------|------------|
| **ReAct** | Reasoning + Acting 반복 | 단계적 추론 필요 |
| **Reflection** | 자가 검토 및 개선 | 품질 향상 필요 |
| **Tool Use** | 외부 도구 활용 | 외부 연동 필요 |
| **Planning** | 계획 수립 후 실행 | 복잡한 워크플로우 |
| **Multi-Agent** | 여러 Agent 협업 | 역할 분담 필요 |
| **Human-in-Loop** | 사람 검토 포함 | 검증 필수 |

### 대화형 분석

- Claude와 대화하며 패턴 결정 (최대 3턴)
- 추가 질문에 답변
- "분석 완료" 클릭으로 확정

---

## Step 4: Handoff (명세서 생성)

`MultiStageSpecAgent`가 4단계 파이프라인으로 명세서를 생성합니다.

### 명세서 생성 파이프라인

| 단계 | Agent | 진행률 | 역할 |
|------|-------|--------|------|
| 1 | **DesignAgent** | 0-25% | Agent 설계 패턴 분석 |
| 2 | **DiagramAgent** | 25-50% | Mermaid 다이어그램 생성 |
| 3 | **DetailAgent** | 50-75% | 구현 세부사항 정의 |
| 4 | **AssemblerAgent** | 75-100% | 최종 Markdown 조합 |

### 스킬 시스템

파이프라인에서 사용하는 스킬:

| 스킬명 | 역할 |
|--------|------|
| `universal-agent-patterns` | Agent 설계 패턴 가이드 |
| `feasibility-evaluation` | Feasibility 평가 기준 |
| `mermaid-diagrams` | Mermaid 다이어그램 생성 |
| `prompt-engineering` | System Prompt 작성 가이드 |
| `tool-schema` | Tool 스키마 정의 가이드 |

### 명세서 구성

1. **Executive Summary** - 요약
2. **Agent Design Pattern** - 패턴 선택 및 이유
3. **Agent Components** - 역할별 Agent 정의
4. **State Management** - 상태 관리 방안
5. **Architecture Diagrams** - Mermaid 다이어그램
6. **Implementation Guide** - 구현 가이드

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
| **준비도 레벨** | 항목별 준비 상태 |
| **패턴 추천** | 적합한 Agent 패턴 |
| **명세서** | Markdown 구현 명세서 |
| **다이어그램** | Mermaid 아키텍처 다이어그램 |
| **의사결정 근거** | Go/No-Go 판단 자료 |

---

## API 엔드포인트 참조

### Step 2: 준비도 점검

| 엔드포인트 | Method | 설명 |
|-----------|--------|------|
| `/feasibility` | POST | 초기 평가 |
| `/feasibility/update` | POST | 재평가 (개선 계획 반영) |

### Step 3: 패턴 분석

| 엔드포인트 | Method | 설명 |
|-----------|--------|------|
| `/pattern/analyze` | POST | 초기 패턴 분석 (SSE) |
| `/pattern/chat` | POST | 대화형 분석 (SSE) |
| `/pattern/finalize` | POST | 최종 확정 |

### Step 4: 명세서 생성

| 엔드포인트 | Method | 설명 |
|-----------|--------|------|
| `/spec` | POST | 명세서 생성 (SSE + 진행률) |

---

## Backend Agent 구조

```
                    ┌─────────────────────────────┐
                    │      FeasibilityAgent       │
                    │   (Step 2 - 준비도 점검)     │
                    └─────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │   PatternAnalyzerAgent      │
                    │   (Step 3 - 패턴 분석)       │
                    └─────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │   MultiStageSpecAgent       │
                    │   (Step 4 - 명세서 생성)     │
                    │                             │
                    │  ├── DesignAgent            │
                    │  ├── DiagramAgent           │
                    │  ├── DetailAgent            │
                    │  └── AssemblerAgent         │
                    └─────────────────────────────┘
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, Strands Agents SDK |
| **LLM** | AWS Bedrock Claude Opus 4.5 |
| **스킬 시스템** | agentskills.io 스펙 기반 동적 로딩 |
