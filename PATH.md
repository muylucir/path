# P.A.T.H Agent Designer 소개

> AI Agent 아이디어를 검증하고 프로토타입 명세서를 자동 생성하는 3-Tier 웹 애플리케이션

**Architecture**: Frontend (Next.js 15) + Backend (FastAPI + Strands Agents SDK) + LLM (AWS Bedrock Claude Sonnet 4.5)

---

## 🎯 P.A.T.H가 무엇인가요?

**P.A.T.H** = **P**roblem → **A**gent Pattern → **T**echnical → **H**andoff

고객의 막연한 AI Agent 아이디어를 **구조화된 프로토타입 계획**으로 변환하는 체계적인 프레임워크입니다.

**4단계 Agent 파이프라인**으로 고품질 명세서를 자동 생성:
1. **PatternAgent** - Strands Agent 패턴 분석
2. **AgentCoreAgent** - AgentCore 서비스 구성 (조건부)
3. **ArchitectureAgent** - Mermaid 다이어그램 생성
4. **AssemblerAgent** - 최종 Markdown 조합

### 간단히 말하면

```
"AI로 뭔가 할 수 있을 것 같은데..."
              ↓
    4단계 Agent 파이프라인 실행
    (PatternAgent → AgentCoreAgent → ArchitectureAgent → AssemblerAgent)
              ↓
"Planning + Multi-Agent 패턴, Feasibility 42점,
 1개 Runtime으로 9개 Agent 호스팅,
 Mermaid 다이어그램 3개 포함 명세서"
```

---

## 🤔 왜 필요한가요?

### 우리가 자주 겪는 문제들

**문제 1: 막연한 고민으로 시간 낭비**
```
고객: "AI Agent로 이메일 자동화하고 싶어요"
우리: "음... 될 것 같긴 한데... 한번 해볼까요?"
→ 2주 후: "이거 생각보다 복잡하네요. 데이터 접근이 안 돼요."
```

**문제 2: 구조 없이 시작해서 방향 상실**
```
1일차: "일단 코딩 시작!"
3일차: "이게 Single Agent인가 Multi-Agent인가?"
5일차: "처음부터 다시..."
```

**문제 3: 실패를 너무 늦게 발견**
```
2주 개발 → 데모 → "이거 정확도가 60%밖에 안 나오네요?"
→ 처음부터 Feasibility 평가했으면 조기 발견 가능
```

### P.A.T.H가 해결하는 것

✅ **아이디어 구조화** - INPUT/PROCESS/OUTPUT/Human-in-Loop 명확화
✅ **실현 가능성 정량 평가** - 50점 척도로 Go/No-Go 의사결정 지원
✅ **구현 패턴 추천** - PatternAgent가 Strands Agent 패턴 자동 분석
✅ **명세서 자동 생성** - 4단계 Agent 파이프라인으로 고품질 명세서 생성 (시퀀스 다이어그램 3개 포함)
✅ **베스트 프랙티스 자동 반영** - Skill Tool System으로 검증된 구현 패턴 적용
✅ **리스크 조기 발견** - 코딩 전 잠재적 문제 파악  

---

## 💡 어떻게 활용하나요?

### 활용 시나리오 1: 고객 미팅 

**상황**: 고객이 "AI로 계약서 검토 자동화하고 싶다"고 요청

**Before P.A.T.H:**
```
우리: "네, 가능할 것 같습니다. 2주 후에 데모 보여드릴게요."
→ 2주 개발 → 데모 → "법무팀 승인이 필요하네요?" (처음 알게 됨)
```

**After P.A.T.H:**
```
1. 미팅 중 P.A.T.H 실행 (Frontend + Backend)
2. Feasibility 38점 → "조건부 진행"
3. 리스크 발견: "법무팀 리뷰 필수 (Human-in-Loop: Review)"
4. 4단계 파이프라인으로 명세서 자동 생성 (Mermaid 다이어그램 포함)
5. 고객에게 공유: "가능하지만 법무팀 승인 프로세스 필요합니다"
6. 범위 조정 후 프로토타입 계획 수립
```

### 활용 시나리오 2: 해커톤/워크샵

**상황**: 고객과 함께 AI Agent 아이디어 발굴 워크샵

**Before P.A.T.H:**
```
- 아이디어 브레인스토밍
- "이것도 해보고 저것도 해보고..."
- 결과: 3개 아이디어 중 어느 것도 완성 못함
```

**After P.A.T.H:**
```
- 5개 아이디어 도출
- 각 아이디어 P.A.T.H 분석 (FastAPI Backend로 실시간 스트리밍)
- 결과: Feasibility 점수로 정렬 → 최고 점수 1개 선택
- 4단계 파이프라인으로 구현 명세서 자동 생성 (Graph 구조 + Agent Components 포함)
- 선택된 아이디어 프로토타입 구현
- 결과: 구현 가능성이 검증된 프로토타입
```

### 활용 시나리오 3: 제안서 작성

**상황**: PoC 제안서에 AI Agent 솔루션 포함

**Before P.A.T.H:**
```
- 막연한 설명: "AI가 자동으로 분석합니다"
- 고객: "구체적으로 어떻게요?"
- 우리: "음... 그건 개발하면서 정해집니다"
```

**After P.A.T.H:**
```
- P.A.T.H로 분석 (Frontend에서 입력 → Backend로 처리)
- 4단계 Agent 파이프라인으로 명세서 자동 생성
  - PatternAgent: Strands Agent 패턴 분석
  - AgentCoreAgent: 호스팅 환경 구성 (1개 Runtime)
  - ArchitectureAgent: Mermaid 다이어그램 3개 생성
  - AssemblerAgent: 최종 Markdown 조합
- 제안서에 첨부:
  - Graph Structure 다이어그램
  - Sequence Diagram (activate/deactivate 포함)
  - Architecture Flowchart
  - Agent Components 테이블 (TypedDict 포함)
  - Feasibility 42점 (높은 성공 가능성)
```

---

## 🚀 실제 사용 예시

### Case 1: 고객 이메일 자동 응답

**입력:**
```
Pain Point: 하루 100건 고객 이메일 답변에 2시간 소요
INPUT: Event-Driven (이메일 도착)
PROCESS: 데이터 수집, 분석/분류, 콘텐츠 생성, 실행/연동
OUTPUT: Content (이메일 답변)
Human-in-Loop: Exception (불확실할 때만)
```

**Claude 분석:**
```
- 추천 패턴: Planning (분류 → 검색 → 생성)
- Strands 구현: Graph의 순차 노드 구조
- Feasibility: 42/50
  - 데이터 접근성: 9/10 (Gmail API)
  - 판단 명확성: 9/10 (1000+ 과거 이메일)
  - 오류 허용도: 8/10 (리뷰 후 발송)
  - 지연: 9/10 (5분 OK)
  - 통합: 7/10 (Gmail + DynamoDB)
- 판정: ✅ 즉시 프로토타입 시작
```

**명세서 생성 (4단계 파이프라인):**
1. **PatternAgent**: Planning 패턴 분석, Agent Components 테이블 생성
2. **AgentCoreAgent**: Runtime 1개로 3개 Agent 호스팅 (조건부)
3. **ArchitectureAgent**: Graph Structure, Sequence Diagram, Flowchart 생성
4. **AssemblerAgent**: 최종 Markdown 조합 (실시간 스트리밍)

**결과:**
- 구현 가능 여부 확인
- Strands Agent 구현 가이드 (Graph 구조, MCP 서버 연동)
- 명세서를 개발팀에 전달하여 구현 계획 수립

### Case 2: 계약서 검토 자동화

**입력:**
```
Pain Point: 법무팀 계약서 검토에 2-3일 소요
INPUT: On-Demand (S3 업로드)
PROCESS: 데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성
OUTPUT: Content (검토 보고서)
Human-in-Loop: Review (법무팀 최종 검토)
```

**Claude 분석:**
```
- 추천 패턴: Planning (파싱 → 분석 → 보고서)
- Strands 구현: Graph의 순차 노드 구조
- Feasibility: 35/50
  - 데이터 접근성: 9/10 (PDF)
  - 판단 명확성: 5/10 (법률 전문 지식 필요) ⚠️
  - 오류 허용도: 7/10 (법무팀 리뷰)
  - 지연: 9/10 (30분 OK)
  - 통합: 5/10 (법률 KB 구축 필요) ⚠️
- 판정: ⚠️ 조건부 진행
- 리스크: 법률 Knowledge Base 구축 필요 (3개월)
```

**의사결정:**
- 즉시 시작하지 않고 법률 KB 구축 계획 수립
- 3개월 후 재평가
- 시간/비용 낭비 방지!

---

## 📊 P.A.T.H 프레임워크 상세

### Phase 1: Problem Decomposition

Pain Point를 4가지 요소로 분해:

| 요소 | 질문 | 선택지 |
|------|------|--------|
| **INPUT** | 무엇이 트리거인가? | Event-Driven, Scheduled, On-Demand, Streaming, Conditional |
| **PROCESS** | 무슨 작업이 필요한가? | 데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성, 검증/개선, 실행/연동 |
| **OUTPUT** | 결과물은 무엇인가? | Decision, Content, Notification, Action, Insight |
| **Human-in-Loop** | 사람 개입 시점은? | None, Review, Exception, Collaborate |

### Phase 2: Strands Agent 구현 전략

**PatternAgent**가 `<skill_tool>strands-agent-patterns</skill_tool>`을 사용하여 4가지 패턴을 분석:

| 패턴 | Strands 구현 | 예시 | 구현 방법 |
|------|-------------|------|----------|
| **Reflection** | Graph의 순환 구조 | 코드 생성 → 검토 → 개선 | self-review loop |
| **Tool Use** | Agent-as-Tool 직접 활용 | 웹 검색, DB 조회, 계산 | MCP 서버 연동 |
| **Planning** | Graph의 순차 노드 구조 | 여행 계획, 보고서 작성 | 단계별 노드 체인 |
| **Multi-Agent** | Graph + Agent-as-Tool 조합 | 시장 조사, 코드 리뷰 | 여러 Agent 협업 |

**출력**: Agent Components 테이블, Invocation State (TypedDict), Graph 구조 설명

### Phase 3: Feasibility Check

5개 항목 평가 (총 50점):

| 항목 | 10점 | 5점 | 0점 |
|------|------|-----|-----|
| **데이터 접근성** | MCP/API 존재 | DB 직접 | 오프라인만 |
| **판단 명확성** | 명확한 규칙 | 암묵적 패턴 | 설명 불가 |
| **오류 허용도** | 틀려도 OK | 90%+ 필요 | 100% 필수 |
| **지연 요구사항** | 몇 시간 OK | 1분 이내 | 실시간 (<3초) |
| **통합 복잡도** | 독립 실행 | 3-5개 시스템 | 레거시 |

**판정:**
- 40-50점: ✅ 즉시 프로토타입 시작
- 30-40점: ⚠️ 조건부 진행 (리스크 관리)
- 20-30점: 🔄 개선 후 재평가
- 20점 미만: ❌ 대안 모색

### Phase 4: Handoff Specification

**MultiStageSpecAgent**가 4단계 파이프라인으로 명세서 자동 생성:

#### 1. PatternAgent (0-25% 진행률)
- `<skill_tool>strands-agent-patterns</skill_tool>` 참조
- Strands Agent 패턴 분석 (Reflection, Tool Use, Planning, Multi-Agent)
- Agent Components 테이블 생성
- Invocation State (TypedDict) 정의

#### 2. AgentCoreAgent (25-50%, 조건부)
- `<skill_tool>agentcore-services</skill_tool>` 참조
- **핵심 원칙**: 1개 Runtime으로 전체 Multi-Agent Graph 호스팅
- Runtime, Memory, Gateway, Identity, Browser, Code Interpreter 서비스 구성
- useAgentCore=true일 때만 실행

#### 3. ArchitectureAgent (50-75%)
- `<skill_tool>mermaid-diagrams</skill_tool>` 참조
- Graph Structure (subgraph, classDef)
- Sequence Diagram (activate/deactivate)
- Architecture Flowchart

#### 4. AssemblerAgent (75-100%)
- 위 3개 Agent 결과를 최종 Markdown으로 조합
- 실시간 스트리밍 출력 (100자 단위 청크)
- 진행률 75% → 95% → 100%

**최종 명세서 구성**:
1. Executive Summary
2. Strands Agent 구현 가이드 (Graph 구조, Agent-as-Tool, MCP 서버)
3. Architecture (Mermaid 다이어그램 3개)
4. Problem Decomposition

---

## 🛠️ 어떻게 사용하나요?

### 1. 웹 애플리케이션 실행

**Terminal 1 - Backend (FastAPI) 시작:**
```bash
cd path-strands-agent
python api_server.py
# FastAPI 서버가 포트 8001에서 실행됩니다
```

**Terminal 2 - Frontend (Next.js) 시작:**
```bash
cd path-web
npm run dev
# Next.js 개발 서버가 포트 3009에서 실행됩니다
```

브라우저에서 http://localhost:3009 접속

### 2. 3단계 프로세스

#### Step 1: 기본 정보 입력
- Pain Point 입력
- INPUT/PROCESS/OUTPUT/Human-in-Loop 선택
- 데이터 소스, 오류 허용도 입력

#### Step 2: Claude 분석
- Claude가 초기 분석 수행
- 추가 질문에 답변 (최대 3턴)
- "분석 완료" 클릭

#### Step 3: 결과 확인
- 📊 **상세 분석**: Feasibility 점수 (50점 만점), 패턴 추천
- 💬 **대화 내역**: Claude와의 전체 대화 (MDX 렌더링)
- 📋 **명세서**: 4단계 Agent 파이프라인으로 명세서 자동 생성
  - PatternAgent → AgentCoreAgent → ArchitectureAgent → AssemblerAgent
  - 실시간 스트리밍 (0% → 25% → 50% → 75% → 100%)
  - Mermaid 다이어그램 3개 포함
- 🚀 **다음 단계**: 세션 저장 (DynamoDB)

### 3. 결과물

**즉시 얻을 수 있는 것:**
- ✅ Go/No-Go 의사결정 근거 (Feasibility 50점 만점)
- ✅ Strands Agent 패턴 추천 (PatternAgent 분석)
- ✅ 구현 명세서 (Markdown, 다운로드 가능)
- ✅ Graph Structure + Sequence Diagram + Flowchart (Mermaid)
- ✅ Agent Components 테이블 + Invocation State (TypedDict)
- ✅ AgentCore 서비스 구성 (1개 Runtime으로 Multi-Agent 호스팅)