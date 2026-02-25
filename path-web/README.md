# P.A.T.H Agent Designer — Frontend

Next.js 16.1.0 + Cloudscape Design System 기반 P.A.T.H Agent Designer Frontend

## 개요

P.A.T.H (Problem → Technical → Agent Pattern → Handoff) 프레임워크를 사용하여:
1. **기본 정보 입력** - Pain Point와 요구사항 정의
2. **준비도 점검** - 5가지 기준으로 Feasibility 평가 (50점 만점)
3. **패턴 분석** - Claude Opus 4.6 기반 대화형 분석 및 Agent 패턴 추천
4. **명세서 생성** - 4단계 파이프라인으로 상세 명세서 자동 생성

## 아키텍처

```
Browser → Next.js API Routes (agentcore-client.ts)
            → @aws-sdk/client-bedrock-agentcore → AgentCore Runtime → Bedrock
            → @aws-sdk/lib-dynamodb             → DynamoDB (sessions)
```

- Frontend에서 **AWS SDK로 AgentCore Runtime을 직접 호출** (IAM 인증)
- Backend FastAPI 서버 없이 서버리스 아키텍처로 동작
- SSE 스트리밍은 AgentCore 응답을 브라우저로 릴레이

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 16.1.0 (standalone), React 19.2.3, TypeScript 5 |
| **UI** | Cloudscape Design System (`@cloudscape-design/components`, `chat-components`) |
| **Forms** | react-hook-form, Zod (validation) |
| **Visualization** | Mermaid, react-markdown, react-syntax-highlighter |
| **AWS SDK** | `@aws-sdk/client-bedrock-agentcore`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` |
| **Node.js** | >= 22.0.0 |

## 페이지 구성

| 페이지 | 경로 | 기능 |
|-------|------|------|
| **Step 1** | `/` | 기본 정보 입력 (Pain Point, 입력/처리/출력 유형) |
| **Step 2** | `/feasibility` | 준비도 점검 + 개선 방안 입력 |
| **Step 3** | `/analyze` | 패턴 분석 (대화형) |
| **Step 4** | `/results` | 결과 확인 (분석, 대화 이력, 명세서 탭) |
| **Sessions** | `/sessions` | 세션 이력 관리 |
| **Intro** | `/intro` | P.A.T.H 소개 (내러티브) |
| **Guide** | `/guide` | P.A.T.H 가이드 (구조화) |

## 설치 및 실행

### 사전 요구사항

- Node.js 22+
- AWS 자격 증명 (AgentCore, DynamoDB)
- AgentCore Runtime ARN

### 개발 서버

```bash
npm install
npm run dev  # http://localhost:3009
```

### 환경변수

`.env.local` 파일 생성:

```bash
# 필수
AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:...  # AgentCore Runtime ARN

# AWS 설정
AWS_DEFAULT_REGION=ap-northeast-2

# 선택
DYNAMODB_TABLE_NAME=path-agent-sessions
```

### 프로덕션 빌드

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t path-web .
docker run -p 3009:3009 path-web
```

### CodeBuild (ECR 푸시)

`buildspec.yml`이 포함되어 있으며, CodeBuild에서 ECR로 자동 빌드/푸시:

```bash
# CodeBuild가 자동 수행:
# 1. Docker 이미지 빌드
# 2. ECR 로그인
# 3. ECR 푸시
```

## API 엔드포인트

### Next.js API Routes (AgentCore 프록시)

| 엔드포인트 | 설명 | AgentCore Action |
|----------|------|-----------------|
| `POST /api/bedrock/feasibility` | 초기 Feasibility 평가 (SSE) | `feasibility` |
| `POST /api/bedrock/feasibility/update` | 개선 방안 반영 재평가 (JSON) | `feasibility_update` |
| `POST /api/bedrock/pattern/analyze` | 초기 패턴 분석 (SSE) | `pattern_analyze` |
| `POST /api/bedrock/pattern/chat` | 대화형 분석 (SSE) | `pattern_chat` |
| `POST /api/bedrock/pattern/finalize` | 최종 분석 (JSON) | `pattern_finalize` |
| `POST /api/bedrock/spec` | 명세서 생성 (SSE + 진행률) | `spec` |

### 세션 & 시스템

| 엔드포인트 | 설명 |
|----------|------|
| `/api/sessions` | 세션 CRUD (DynamoDB 직접 연동) |
| `/api/health` | Frontend 헬스 체크 |

## 준비도 점검 (Feasibility)

### 5가지 평가 항목 (각 0-10점, 총 50점)

| 항목 | 한글명 | 평가 기준 |
|-----|--------|----------|
| `data_access` | 데이터 접근성 | API 존재 여부, 인증 방식, 데이터 형식 |
| `decision_clarity` | 판단 명확성 | 규칙화 가능 여부, 예시 데이터, 전문가 지식 문서화 |
| `error_tolerance` | 오류 허용도 | 검토 프로세스, 롤백 가능 여부, 리스크 수준 |
| `latency` | 지연 요구사항 | 실시간 필요 여부, 배치 처리 가능 여부, SLA |
| `integration` | 통합 복잡도 | 연동 시스템 수, API 표준화, 인증 복잡도 |

### 준비도 레벨

| 레벨 | 아이콘 | 최소 점수 | 설명 |
|-----|--------|----------|------|
| READY | ✅ | 8 | 바로 진행 가능 |
| GOOD | 🔵 | 6 | 약간의 보완으로 충분 |
| NEEDS_WORK | 🟡 | 4 | 추가 준비 권장 |
| PREPARE | 🟠 | 0 | 상당한 준비 필요 |

## 프로젝트 구조

```
path-web/
├── app/
│   ├── page.tsx                      # Step 1: 기본 정보 입력
│   ├── feasibility/page.tsx          # Step 2: 준비도 점검
│   ├── analyze/page.tsx              # Step 3: 패턴 분석
│   ├── results/page.tsx              # Step 4: 결과 (명세서)
│   ├── sessions/page.tsx             # 세션 관리
│   ├── intro/                        # P.A.T.H 소개
│   ├── guide/                        # P.A.T.H 가이드
│   ├── error.tsx                     # Error boundary
│   ├── not-found.tsx                 # 404 페이지
│   ├── layout.tsx                    # Root layout
│   └── api/                          # API Routes
│       ├── bedrock/                  # AgentCore 프록시
│       │   ├── _shared/
│       │   │   └── agentcore-client.ts  # AgentCore SDK 클라이언트
│       │   ├── feasibility/          # 준비도 점검 API
│       │   │   ├── route.ts          # POST /feasibility (SSE)
│       │   │   └── update/route.ts   # POST /feasibility/update (JSON)
│       │   ├── pattern/              # 패턴 분석 API
│       │   │   ├── analyze/route.ts  # POST /pattern/analyze (SSE)
│       │   │   ├── chat/route.ts     # POST /pattern/chat (SSE)
│       │   │   └── finalize/route.ts # POST /pattern/finalize (JSON)
│       │   └── spec/route.ts         # POST /spec (SSE)
│       ├── sessions/                 # 세션 CRUD
│       └── health/                   # 헬스 체크
├── components/
│   ├── cloudscape/                   # Cloudscape 프로바이더
│   │   ├── CloudscapeProvider.tsx    # Cloudscape 테마/모드 제공
│   │   └── FlashbarProvider.tsx      # 알림 메시지 제공
│   ├── steps/                        # 단계별 컴포넌트
│   │   ├── Step1Form.tsx             # 기본 정보 입력 폼
│   │   ├── Step2Readiness.tsx        # 준비도 점검 UI
│   │   ├── Step3PatternAnalysis.tsx  # 패턴 분석 + 채팅
│   │   ├── Step3Results.tsx          # 결과 요약
│   │   └── results/                  # 결과 페이지 탭
│   │       ├── AnalysisTab.tsx
│   │       ├── ChatHistoryTab.tsx
│   │       └── SpecificationTab.tsx
│   ├── analysis/
│   │   └── MDXRenderer.tsx           # Markdown/Mermaid 렌더러
│   └── layout/
│       ├── AppLayoutShell.tsx        # Cloudscape AppLayout 셸
│       ├── Header.tsx                # 헤더
│       └── TokenUsageBadge.tsx       # 토큰 사용량 배지
├── lib/
│   ├── types.ts                      # TypeScript 타입 정의
│   ├── schema.ts                     # Zod 유효성 검증 스키마
│   ├── constants.ts                  # 상수 (STEPS, READINESS_LEVELS 등)
│   ├── utils.ts                      # 유틸리티 함수
│   ├── readiness.ts                  # 준비도 레벨 로직
│   ├── hooks/                        # 커스텀 훅
│   │   ├── index.ts
│   │   ├── useSSEStream.ts           # SSE 스트리밍 훅
│   │   └── useTokenUsage.ts          # 토큰 사용량 훅
│   └── aws/
│       └── dynamodb.ts               # DynamoDB 클라이언트 설정
├── Dockerfile                        # Multi-stage Node.js Alpine 빌드
├── buildspec.yml                     # CodeBuild 스펙 (ECR 푸시)
├── .dockerignore
├── .env.example                      # 환경변수 예시
├── next.config.ts                    # Next.js 설정 (standalone, redirects)
├── package.json
├── tsconfig.json
└── README.md                         # 이 파일
```

## 주요 컴포넌트

### AgentCore Client (`app/api/bedrock/_shared/agentcore-client.ts`)

모든 API Route에서 공유하는 AgentCore 호출 클라이언트:

- `invokeAgentCoreSSE()`: SSE 스트리밍 응답 (feasibility, pattern_analyze, pattern_chat, spec)
- `invokeAgentCoreJSON()`: JSON 응답 (feasibility_update, pattern_finalize)
- Zod 스키마 기반 요청 검증
- `runtimeSessionId`로 세션 라우팅

### Cloudscape Provider (`components/cloudscape/`)

- `CloudscapeProvider`: Cloudscape 테마 및 다크/라이트 모드 제공
- `FlashbarProvider`: 전역 알림 메시지 관리

### Custom Hooks (`lib/hooks/`)

- `useSSEStream`: SSE 이벤트 스트림을 React state로 변환
- `useTokenUsage`: LLM 토큰 사용량 추적 및 표시

## 개발

### 코드 린팅

```bash
npm run lint
```

### 환경변수 참조

| 변수 | 필수 | 설명 |
|------|------|------|
| `AGENT_RUNTIME_ARN` | Yes | AgentCore Runtime ARN |
| `AWS_DEFAULT_REGION` | No | AWS 리전 (기본: ap-northeast-2) |
| `DYNAMODB_TABLE_NAME` | No | DynamoDB 테이블명 (기본: path-agent-sessions) |

## 참고

- [P.A.T.H 프레임워크 문서](../PATH.md)
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 가이드
- [Cloudscape Design System](https://cloudscape.design/)
- [Next.js Documentation](https://nextjs.org/docs)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
