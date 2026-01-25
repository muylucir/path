# P.A.T.H Agent Designer 소개

> AI Agent 아이디어를 검증하고, 프로토타입 명세서를 자동 생성하며, 실제 배포까지 지원하는 3-Tier 웹 애플리케이션

**Architecture**: Frontend (Next.js 16) + Backend (FastAPI + Strands Agents SDK) + LLM (AWS Bedrock Claude Opus 4.5)

**통합 시스템**: Gateway (API/MCP/Lambda Target) + Identity (Credential Provider) + RAG + S3 + MCP Registry

---

## 🎯 P.A.T.H가 무엇인가요?

**P.A.T.H** = **P**roblem → **A**gent Pattern → **T**echnical → **H**andoff

고객의 막연한 AI Agent 아이디어를 **구조화된 프로토타입 계획**으로 변환하고, **실제 배포 가능한 코드**까지 생성하는 체계적인 프레임워크입니다.

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
              ↓
    코드 생성 + AgentCore 배포
              ↓
"실제 동작하는 Agent를 Playground에서 테스트"
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

- ✅ **아이디어 구조화** - INPUT/PROCESS/OUTPUT/Human-in-Loop 명확화
- ✅ **실현 가능성 정량 평가** - 50점 척도로 Go/No-Go 의사결정 지원
- ✅ **구현 패턴 추천** - PatternAgent가 Strands Agent 패턴 자동 분석
- ✅ **명세서 자동 생성** - 4단계 Agent 파이프라인으로 고품질 명세서 생성 (시퀀스 다이어그램 3개 포함)
- ✅ **코드 자동 생성** - 명세서 기반 Strands SDK 코드 생성
- ✅ **원클릭 배포** - AgentCore Runtime으로 자동 배포
- ✅ **Playground 테스트** - 배포된 Agent를 즉시 테스트
- ✅ **통합 관리** - Gateway, Identity, MCP Registry로 외부 서비스 연동
- ✅ **베스트 프랙티스 자동 반영** - Skill Tool System으로 검증된 구현 패턴 적용
- ✅ **리스크 조기 발견** - 코딩 전 잠재적 문제 파악

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
- 코드 생성 → AgentCore 배포 → Playground 테스트
- 결과: 실제 동작하는 프로토타입
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
- Playground 데모 링크 포함 (실제 동작하는 Agent)
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

**코드 생성 및 배포:**
1. **CodeGeneratorAgent**: 명세서 기반 Strands SDK 코드 생성
   - `main.py` (BedrockAgentCoreApp 패턴)
   - `tools.py` (MCP/API 통합)
   - `agentcore_config.py` (서비스 구성)
   - `requirements.txt`
2. **배포**: AgentCore Runtime으로 원클릭 배포
3. **테스트**: Playground에서 실제 Agent 테스트

**결과:**
- 구현 가능 여부 확인
- Strands Agent 구현 가이드 (Graph 구조, MCP 서버 연동)
- 실제 동작하는 프로토타입 Agent

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

### Phase 5: Code Generation

**CodeGeneratorAgent**가 명세서를 기반으로 실행 가능한 코드 생성:

#### 생성 파일
| 파일 | 설명 |
|------|------|
| `main.py` | BedrockAgentCoreApp 패턴 기반 메인 코드 |
| `tools.py` | MCP/API 통합 도구 정의 |
| `agentcore_config.py` | Runtime/Gateway/Memory 설정 |
| `requirements.txt` | Python 의존성 |
| `agentcore.yaml` | AgentCore CLI 배포 설정 |
| `deploy_guide.md` | 배포 가이드 문서 |

#### 비동기 작업 시스템
- 코드 생성은 비동기 작업으로 처리
- `/code-jobs` 페이지에서 진행 상황 모니터링
- 완료 후 ZIP 다운로드 또는 배포 진행

### Phase 6: Deployment

**DeploymentService**가 AgentCore Runtime으로 자동 배포:

#### 배포 파이프라인
```
코드 생성 완료
      ↓
Docker 빌드 (ARM64)
      ↓
ECR 푸시
      ↓
AgentCore Runtime 생성
      ↓
상태 폴링 (READY 대기)
      ↓
배포 완료 → Playground 테스트
```

#### 배포 상태
| 상태 | 설명 |
|------|------|
| PENDING | 배포 대기 중 |
| BUILDING | Docker 이미지 빌드 중 |
| PUSHING | ECR 푸시 중 |
| DEPLOYING | AgentCore Runtime 배포 중 |
| ACTIVE | 배포 완료, 서비스 중 |
| STOPPED | 중지됨 |
| FAILED | 배포 실패 |

#### 버전 관리
- 배포마다 버전 자동 증가
- 이전 버전으로 롤백 지원
- 버전별 메트릭 추적

---

## 🔗 통합(Integration) 시스템

P.A.T.H는 5가지 통합 카테고리를 지원합니다. `/settings` 페이지에서 관리합니다.

### Gateway 통합

외부 API, MCP Server, Lambda 함수를 AgentCore Gateway를 통해 통합합니다.

#### Target 유형
| Target 유형 | 설명 | 설정 |
|------------|------|------|
| **API (OpenAPI)** | OpenAPI 스펙 기반 REST API | OpenAPI JSON/YAML 업로드 |
| **MCP Server** | MCP 프로토콜 서버 | Server URL |
| **Lambda** | AWS Lambda 함수 | Function ARN |
| **API Gateway** | AWS API Gateway REST API | REST API ID, Stage |
| **Smithy Model** | AWS Smithy 모델 | S3 URI 또는 Inline Payload |

#### Outbound 인증
| 인증 유형 | 설명 | 필요 정보 |
|----------|------|----------|
| **IAM Role** | AWS IAM 역할 기반 인증 | Role ARN (기본값) |
| **API Key** | API Key 헤더 인증 | Credential Provider ARN, 헤더 이름 |
| **OAuth2** | OAuth2 Client Credentials | Credential Provider ARN, Scopes |

### Identity Provider 시스템

외부 서비스 인증을 위한 Credential Provider를 관리합니다.

#### Provider 유형
| Provider | 설명 | 설정 |
|----------|------|------|
| **API Key** | 정적 API Key 인증 | API Key 값, 커스텀 헤더 이름 |
| **OAuth2** | Client Credentials Flow | Client ID, Client Secret, Token Endpoint, Scopes |

#### AgentCore 연동
- Identity Provider 생성 시 AgentCore Credential Provider ARN 자동 생성
- Gateway Target에서 Credential Provider ARN 참조
- 런타임에 자동으로 인증 헤더 주입

### RAG 통합

Knowledge Base 및 벡터 DB를 등록합니다.

| 소스 유형 | 설명 |
|----------|------|
| **Amazon Bedrock Knowledge Base** | Bedrock KB ID |
| **Amazon OpenSearch** | OpenSearch 도메인 |
| **Amazon Kendra** | Kendra Index ID |
| **Custom Vector DB** | 커스텀 벡터 DB 엔드포인트 |

### S3 통합

Amazon S3 버킷을 데이터 소스로 등록합니다.

| 설정 | 설명 |
|------|------|
| **Bucket Name** | S3 버킷 이름 |
| **Prefix** | 객체 접두사 (폴더 경로) |
| **Region** | 버킷 리전 |

### MCP Registry 시스템

MCP 서버를 등록, 배포, 테스트합니다. 2개의 서브 탭으로 구성됩니다.

#### Templates 탭
5개의 내장 MCP 템플릿을 제공합니다:

| 템플릿 | 설명 | 제공 도구 |
|--------|------|----------|
| **Weather** | 날씨 정보 조회 및 예보 | `get_weather`, `get_forecast` |
| **Slack** | Slack 채널 메시지 전송 | `send_message`, `list_channels` |
| **GitHub** | GitHub 저장소 관리 | `create_issue`, `list_repos` |
| **Database** | PostgreSQL 쿼리 실행 | `execute_query`, `list_tables` |
| **S3 Files** | S3 파일 관리 | `upload_file`, `download_file`, `list_files` |

#### Self-hosted 탭
FastMCP 기반 커스텀 MCP 서버를 직접 작성하고 배포합니다.

**워크플로우:**
1. MCP 서버 코드 작성 (main.py)
2. Requirements 정의
3. AgentCore Runtime으로 배포
4. MCP Playground에서 도구 테스트

**MCP Playground** (`/mcp-playground/[id]`):
- 배포된 MCP 서버의 도구 목록 조회
- 개별 도구 테스트 (arguments 입력)
- 실행 결과 및 latency 확인

---

## 🛠️ 어떻게 사용하나요?

### 1. 웹 애플리케이션 실행

**Terminal 1 - Backend (FastAPI) 시작:**
```bash
cd path-strands-agent
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python api_server.py
# FastAPI 서버가 포트 8001에서 실행됩니다
```

**Terminal 2 - Frontend (Next.js) 시작:**
```bash
cd path-web
npm install
npm run dev
# Next.js 개발 서버가 포트 3009에서 실행됩니다
```

브라우저에서 http://localhost:3009 접속

### 2. 주요 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| **홈** | `/` | Step 1: 에이전트 아이디어 입력 |
| **분석** | `/analyze` | Step 2: Claude 실시간 분석 + 채팅 |
| **결과** | `/results` | Step 3: 분석 결과, 명세서, 코드 생성 |
| **세션** | `/sessions` | 저장된 분석 세션 목록 |
| **설정** | `/settings` | 통합 설정 (Gateway, Identity, RAG, S3, MCP Registry) |
| **코드 작업** | `/code-jobs` | 코드 생성 작업 모니터링 |
| **배포** | `/deployments` | AgentCore 배포 관리 |
| **플레이그라운드** | `/playground/[id]` | 배포된 Agent 테스트 |
| **MCP 플레이그라운드** | `/mcp-playground/[id]` | MCP 서버 도구 테스트 |
| **프레임워크** | `/framework` | P.A.T.H 프레임워크 문서 |

### 3. 전체 워크플로우

```
Step 1: 기본 정보 입력
├── Pain Point 입력
├── INPUT/PROCESS/OUTPUT/Human-in-Loop 선택
├── 데이터 소스, 오류 허용도 입력
└── 통합(Integration) 선택

      ↓

Step 2: Claude 분석
├── Claude가 초기 분석 수행 (SSE 스트리밍)
├── 추가 질문에 답변 (대화형)
└── "분석 완료" 클릭

      ↓

Step 3: 결과 확인
├── 📊 상세 분석: Feasibility 점수, 패턴 추천
├── 💬 대화 내역: Claude와의 전체 대화
├── 📋 명세서: 4단계 파이프라인 실행
└── 🚀 다음 단계: 세션 저장, 코드 생성

      ↓

코드 생성 (선택)
├── 명세서 기반 Strands SDK 코드 생성
├── /code-jobs에서 진행 상황 모니터링
└── 완료 후 다운로드 또는 배포

      ↓

배포 (선택)
├── AgentCore Runtime으로 자동 배포
├── /deployments에서 상태 확인
├── 실시간 로그 스트리밍
└── SDK 예제 (Python, TypeScript, curl)

      ↓

테스트
├── /playground/[id]에서 Agent 테스트
├── 실시간 메트릭 확인 (지연시간, 토큰 사용량)
├── 버전 히스토리 및 롤백
└── 대화형 테스트
```

### 4. 결과물

**즉시 얻을 수 있는 것:**
- ✅ Go/No-Go 의사결정 근거 (Feasibility 50점 만점)
- ✅ Strands Agent 패턴 추천 (PatternAgent 분석)
- ✅ 구현 명세서 (Markdown, 다운로드 가능)
- ✅ Graph Structure + Sequence Diagram + Flowchart (Mermaid)
- ✅ Agent Components 테이블 + Invocation State (TypedDict)
- ✅ AgentCore 서비스 구성 (1개 Runtime으로 Multi-Agent 호스팅)
- ✅ 실행 가능한 Strands SDK 코드 (ZIP 다운로드)
- ✅ AgentCore Runtime 배포 (원클릭)
- ✅ Playground 테스트 환경
- ✅ SDK 예제 코드 (Python, TypeScript, curl)

---

## 🏗️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16.1, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, @xyflow/react |
| **Backend** | Python 3.11+, FastAPI, Strands Agents SDK, uvicorn |
| **LLM** | AWS Bedrock Claude Opus 4.5 |
| **저장소** | AWS DynamoDB, File-based (jobs/logs) |
| **배포** | AWS Bedrock AgentCore Runtime, ECR, S3 |
| **통합** | AgentCore Gateway, Credential Provider, MCP Server |

---

## 📡 API 엔드포인트

### FastAPI Backend (포트 8001)

#### 분석 엔드포인트
| 엔드포인트 | Method | 설명 | 응답 |
|-----------|--------|------|------|
| `/analyze` | POST | 초기 분석 | SSE 스트리밍 |
| `/chat` | POST | 대화 | SSE 스트리밍 |
| `/finalize` | POST | 최종 평가 | JSON |
| `/spec` | POST | 명세서 생성 (4단계) | SSE 스트리밍 + 진행률 |
| `/health` | GET | 헬스체크 | JSON |

#### 코드 생성 엔드포인트
| 엔드포인트 | Method | 설명 | 응답 |
|-----------|--------|------|------|
| `/code/generate` | POST | 직접 코드 생성 | SSE 스트리밍 |
| `/code/download` | POST | ZIP 다운로드 | ZIP 파일 |
| `/code/jobs` | POST | 비동기 작업 생성 | JSON |
| `/code/jobs` | GET | 작업 목록 | JSON |
| `/code/jobs/{id}` | GET | 작업 상태 | JSON |
| `/code/jobs/{id}` | DELETE | 작업 삭제 | JSON |
| `/code/jobs/{id}/download` | GET | 완료된 작업 다운로드 | ZIP 파일 |

#### 배포 엔드포인트
| 엔드포인트 | Method | 설명 | 응답 |
|-----------|--------|------|------|
| `/deployments` | POST | 배포 생성 | JSON |
| `/deployments` | GET | 배포 목록 | JSON |
| `/deployments/{id}` | GET | 배포 상태 | JSON |
| `/deployments/{id}` | DELETE | 배포 삭제 | JSON |
| `/deployments/{id}/invoke` | POST | Agent 호출 | JSON |
| `/deployments/{id}/invoke/stream` | POST | Agent 스트리밍 호출 | SSE 스트리밍 |
| `/deployments/{id}/metrics` | GET | 메트릭 조회 | JSON |
| `/deployments/{id}/versions` | GET | 버전 히스토리 | JSON |
| `/deployments/{id}/logs` | GET | 로그 조회 | JSON |
| `/deployments/{id}/logs/stream` | GET | 로그 스트리밍 | SSE 스트리밍 |
| `/deployments/{id}/rollback` | POST | 롤백 | JSON |

#### Gateway 엔드포인트
| 엔드포인트 | Method | 설명 | 응답 |
|-----------|--------|------|------|
| `/gateways` | POST | Gateway 생성 | JSON |
| `/gateways/{id}` | DELETE | Gateway 삭제 | JSON |

#### Identity Provider 엔드포인트
| 엔드포인트 | Method | 설명 | 응답 |
|-----------|--------|------|------|
| `/identity-providers` | POST | Provider 생성 | JSON |
| `/identity-providers/{arn}` | DELETE | Provider 삭제 | JSON |

#### MCP Server 엔드포인트
| 엔드포인트 | Method | 설명 | 응답 |
|-----------|--------|------|------|
| `/mcp-servers/deploy` | POST | MCP 서버 배포 | JSON |
| `/mcp-servers/{id}/deployment` | GET | 배포 상태 | JSON |
| `/mcp-servers/{id}/logs` | GET | 배포 로그 | JSON |
| `/mcp-servers/{id}/logs/stream` | GET | 로그 스트리밍 | SSE 스트리밍 |
| `/mcp-servers/{id}/versions` | GET | 버전 히스토리 | JSON |
| `/mcp-servers/{id}/tools` | GET | 도구 목록 (MCP tools/list) | JSON |
| `/mcp-servers/{id}/invoke` | POST | 도구 호출 (MCP tools/call) | JSON |
| `/mcp-servers/{id}/rollback` | POST | 롤백 | JSON |
| `/mcp-servers/{id}/runtime` | DELETE | Runtime 삭제 | JSON |

### Next.js API Routes (포트 3009)
- `/api/bedrock/*` - FastAPI 백엔드 프록시
- `/api/sessions` - DynamoDB 세션 CRUD
- `/api/integrations` - Integration CRUD (Gateway, Identity, RAG, S3)
- `/api/mcp-servers` - MCP Server CRUD
- `/api/gateways/{id}/create` - Gateway 생성 (AgentCore API)
- `/api/identity-providers/{id}/create` - Identity Provider 생성 (AgentCore API)

---

## 📁 프로젝트 구조

```
path/
├── path-web/                          # Next.js Frontend
│   ├── app/                           # App Router 페이지
│   │   ├── page.tsx                   # Step 1: 입력 폼
│   │   ├── analyze/                   # Step 2: Claude 분석
│   │   ├── results/                   # Step 3: 결과
│   │   ├── sessions/                  # 세션 목록
│   │   ├── settings/                  # 통합 설정 (5개 탭)
│   │   ├── code-jobs/                 # 코드 생성 작업
│   │   ├── deployments/               # 배포 관리
│   │   ├── playground/                # Agent 테스트
│   │   ├── mcp-playground/            # MCP 도구 테스트
│   │   ├── framework/                 # P.A.T.H 문서
│   │   └── api/                       # API Routes
│   │       ├── bedrock/               # 백엔드 프록시
│   │       │   ├── analyze/
│   │       │   ├── chat/
│   │       │   ├── finalize/
│   │       │   ├── spec/
│   │       │   ├── code-generate/
│   │       │   ├── code-download/
│   │       │   ├── code-jobs/
│   │       │   └── deployments/
│   │       ├── sessions/
│   │       ├── integrations/
│   │       ├── gateways/
│   │       ├── identity-providers/
│   │       └── mcp-servers/
│   ├── components/
│   │   ├── steps/                     # Step 1-3 컴포넌트
│   │   ├── analysis/                  # MDXRenderer, ChatHistory, Specification
│   │   ├── settings/                  # 통합 설정 컴포넌트
│   │   │   ├── IntegrationList.tsx
│   │   │   ├── IntegrationCard.tsx
│   │   │   ├── GatewayIntegrationForm.tsx
│   │   │   ├── IdentityIntegrationForm.tsx
│   │   │   ├── RAGIntegrationForm.tsx
│   │   │   ├── S3IntegrationForm.tsx
│   │   │   ├── MCPRegistryTab.tsx
│   │   │   ├── MCPServerForm.tsx
│   │   │   └── MCPPlaygroundDrawer.tsx
│   │   ├── deployments/               # 배포 관련 컴포넌트
│   │   │   ├── LogViewer.tsx
│   │   │   ├── PlaygroundChat.tsx
│   │   │   └── SdkExamples.tsx
│   │   └── ui/                        # shadcn/ui 컴포넌트
│   └── lib/
│       ├── types.ts                   # TypeScript 타입
│       ├── schema.ts                  # Zod 스키마
│       ├── constants.ts               # 상수
│       ├── utils.ts                   # 유틸리티
│       ├── mcp-templates.ts           # MCP 템플릿 정의
│       └── aws/                       # AWS SDK 유틸리티
│
└── path-strands-agent/                # FastAPI Backend
    ├── api_server.py                  # FastAPI 엔트리포인트
    ├── chat_agent.py                  # 분석/채팅 에이전트
    ├── multi_stage_spec_agent.py      # 명세서 생성 파이프라인
    ├── code_generator_agent.py        # 코드 생성 에이전트
    ├── strands_utils.py               # Strands 유틸리티
    ├── prompts.py                     # 시스템 프롬프트
    │
    ├── job_manager.py                 # 비동기 작업 관리
    ├── background_worker.py           # 백그라운드 워커
    │
    ├── deployment_manager.py          # 배포 상태 관리
    ├── deployment_service.py          # AgentCore CLI 래퍼
    ├── deployment_log_manager.py      # 배포 로그 관리
    │
    ├── gateway_manager.py             # AgentCore Gateway 관리
    ├── identity_manager.py            # Credential Provider 관리
    ├── mcp_deployment_manager.py      # MCP Server 배포 관리
    ├── integration_validator.py       # 통합 검증
    │
    ├── agentskills/                   # Skill 로딩 시스템
    │   ├── discovery.py               # Skill 디렉토리 스캔
    │   ├── parser.py                  # SKILL.md 파싱
    │   ├── prompt.py                  # XML 프롬프트 생성
    │   └── models.py                  # SkillProperties 모델
    │
    └── skills/                        # Agent Skills
        ├── strands-agent-patterns/    # Agent 패턴 분석
        ├── agentcore-services/        # AgentCore 서비스 가이드
        │   └── references/
        │       ├── runtime.md
        │       ├── gateway.md
        │       ├── identity.md
        │       ├── browser.md
        │       ├── code-interpreter.md
        │       ├── multi-agent-deployment.md
        │       └── observability.md
        ├── strands-agentcore/         # Strands AgentCore 통합
        ├── mermaid-diagrams/          # 다이어그램 템플릿
        └── code-generation/           # 코드 생성 템플릿
```

---

## 🔧 AWS 요구사항

### 필요 권한
- `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`
- `dynamodb:PutItem`, `GetItem`, `Scan`, `DeleteItem`, `UpdateItem`
- `s3:PutObject`, `GetObject` (배포 아티팩트용)
- `ecr:*` (컨테이너 이미지 관리)
- `bedrock-agentcore:*` (AgentCore Runtime, Gateway, Identity)

### DynamoDB 테이블
| 테이블 | Partition Key | 설명 |
|--------|---------------|------|
| `path-agent-sessions` | `id` | 세션 저장 |
| `path-agent-integrations` | `id` | 통합 설정 (Gateway, Identity, RAG, S3) |
| `path-agent-deployments` | `id` | 배포 상태 관리 |
| `path-agent-mcp-servers` | `id` | MCP 서버 관리 |

### 환경 변수
```bash
# Backend
AWS_DEFAULT_REGION=us-west-2
AGENTCORE_S3_BUCKET=<custom-bucket>        # 배포 아티팩트 버킷
AGENTCORE_ROLE_ARN=<role-arn>              # AgentCore IAM 역할
```
