# P.A.T.H Agent Designer — Frontend

Next.js 16.1.0 + Cloudscape Design System 기반 P.A.T.H Agent Designer Frontend

## 개요

P.A.T.H (Problem → Assessment → Technical Review → Handoff) 프레임워크를 사용하여:
1. **기본 정보 입력** - Pain Point와 요구사항 정의
2. **준비도 점검** - 5가지 기준으로 Feasibility 평가 (50점 만점) + 자율성 요구도 (10점 만점)
3. **패턴 분석** - Claude Opus 4.6 기반 대화형 분석 및 Agent 패턴 추천
4. **명세서 생성** - 4단계 파이프라인으로 상세 명세서 자동 생성

## 아키텍처

```
Browser → Next.js API Routes (agentcore-client.ts)
            → @aws-sdk/client-bedrock-agentcore → AgentCore Runtime → Bedrock
            → @aws-sdk/lib-dynamodb             → DynamoDB (sessions)
            → next-auth (Cognito)               → 인증/인가
```

- Frontend에서 **AWS SDK로 AgentCore Runtime을 직접 호출** (IAM 인증)
- Backend FastAPI 서버 없이 서버리스 아키텍처로 동작
- SSE 스트리밍은 AgentCore 응답을 브라우저로 릴레이
- **NextAuth.js + Cognito** 기반 인증 (미설정 시 인증 없이 동작)

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 16.1.0 (standalone), React 19.2.3, TypeScript 5 |
| **UI** | Cloudscape Design System (`@cloudscape-design/components`, `chat-components`, `collection-hooks`, `design-tokens`) |
| **Forms** | react-hook-form, Zod (validation, 입력 새니타이징) |
| **Auth** | NextAuth.js v5 (beta), Amazon Cognito |
| **Visualization** | Mermaid, react-markdown, remark-gfm, react-syntax-highlighter |
| **Icons** | lucide-react |
| **AWS SDK** | `@aws-sdk/client-bedrock-agentcore`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` |
| **Node.js** | >= 22.0.0 |

## 페이지 구성

| 페이지 | 경로 | 기능 |
|-------|------|------|
| **소개 (Intro)** | `/` | P.A.T.H 소개 (내러티브) |
| **가이드 (Guide)** | `/guide` | P.A.T.H 가이드 (구조화) |
| **에이전트 디자인** | `/design` | Wizard UI (Step 1~4 통합) |
| **세션 목록** | `/sessions` | 세션 이력 관리 |
| **로그인** | `/auth/signin` | Cognito 로그인 (자동 리다이렉트) |
| **인증 오류** | `/auth/error` | 인증 오류 표시 |

> `/feasibility`, `/analyze`, `/results` 경로는 `/design`으로 리다이렉트됩니다.
> `/intro` 경로는 `/`로 리다이렉트됩니다.

### 에이전트 디자인 Wizard (`/design`)

4단계가 Cloudscape Wizard 컴포넌트로 통합되어 있으며, `sessionStorage`를 통해 상태를 유지합니다:

| 단계 | 제목 | 컴포넌트 |
|------|------|----------|
| Step 1 | 기본 정보 입력 | `Step1Form` |
| Step 2 | 준비도 점검 | `Step2Readiness` |
| Step 3 | 패턴 분석 | `Step3PatternAnalysis` |
| Step 4 | 결과 및 명세서 | `Step3Results` |

## 설치 및 실행

### 사전 요구사항

- Node.js 22+
- AWS 자격 증명 (AgentCore, DynamoDB)
- AgentCore Runtime ARN
- (선택) Amazon Cognito User Pool

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

# 인증 (Cognito + NextAuth.js) — 미설정 시 인증 없이 동작
AUTH_SECRET=               # openssl rand -base64 32
AUTH_TRUST_HOST=true
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=            # https://cognito-idp.{region}.amazonaws.com/{userPoolId}
COGNITO_DOMAIN=            # Cognito Hosted UI 도메인 (로그아웃용)
AUTH_URL=                  # 배포 URL (예: https://path.workloom.net)
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

### Standalone 배포 (`deploy.sh`)

```bash
./deploy.sh
# 1. npm ci && npm run build
# 2. .next/standalone → /opt/path-web 복사
# 3. systemctl restart path-web
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
| `/api/sessions` | 세션 목록 조회 (GET), 세션 생성 (POST) |
| `/api/sessions/[id]` | 세션 조회 (GET), 세션 업데이트 (PUT) |
| `/api/health` | Frontend 헬스 체크 |

### 인증

| 엔드포인트 | 설명 |
|----------|------|
| `/api/auth/[...nextauth]` | NextAuth.js 핸들러 (GET, POST) |
| `/api/auth/logout` | Cognito 페더레이션 로그아웃 (쿠키 정리 + Cognito 리다이렉트) |

## 인증 (Authentication)

NextAuth.js v5 + Amazon Cognito를 사용한 인증:

- **Cognito 환경변수 미설정 시**: 인증 없이 동작 (`anonymous` 사용자)
- **Cognito 설정 시**: Cognito Managed Login으로 자동 리다이렉트

### 미들웨어 (`middleware.ts`)

- **공개 경로** (인증 불필요): `/`, `/guide`, `/auth/*`, `/api/health`, `/api/auth/*`
- **보호 경로**: 그 외 모든 경로 (미인증 시 `/auth/signin`으로 리다이렉트)
- API 요청은 미인증 시 `401` 응답

## 준비도 점검 (Feasibility)

### 5가지 평가 항목 (각 0-10점, 총 50점)

| 항목 | 한글명 | 평가 기준 |
|-----|--------|----------|
| `data_access` | 데이터 접근성 | API 존재 여부, 인증 방식, 데이터 형식 |
| `decision_clarity` | 판단 명확성 | 규칙화 가능 여부, 예시 데이터, 전문가 지식 문서화 |
| `error_tolerance` | 오류 허용도 | 검토 프로세스, 롤백 가능 여부, 리스크 수준 |
| `latency` | 지연 요구사항 | 실시간 필요 여부, 배치 처리 가능 여부, SLA |
| `integration` | 통합 복잡도 | MCP/SDK 존재 여부, API 문서화 수준, 인터페이스 표준화 |

### 자율성 요구도 (별도 축, 10점 만점)

준비도 50점과 독립적인 평가 축으로, "이 작업에 AI가 얼마나 자율적으로 판단해야 하는가"를 평가합니다. 자율성 점수에 따라 자동화 수준이 결정됩니다:

| 자동화 수준 | 자율성 기준 | 설명 |
|------------|-----------|------|
| AI-Assisted Workflow | 5점 이하 | 결정적 파이프라인 + 특정 단계에서 AI 활용 |
| Agentic AI | 6점 이상 | 에이전트가 자율적으로 도구 선택, 판단, 반복 수행 |

### 준비도 레벨

| 레벨 | 아이콘 | 최소 점수 | 설명 |
|-----|--------|----------|------|
| READY | ✅ | 8 | 바로 진행 가능 |
| GOOD | 🔵 | 6 | 약간의 보완으로 충분 |
| NEEDS_WORK | 🟡 | 4 | 추가 준비 권장 |
| PREPARE | 🟠 | 0 | 상당한 준비 필요 |

### 판정 기준 (총점 기반)

| 판정 | 최소 점수 | 설명 |
|------|----------|------|
| 즉시 진행 | 40 | 바로 시작 가능 |
| 조건부 진행 | 30 | 보완 후 진행 |
| 재평가 필요 | 20 | 재검토 권장 |
| 대안 모색 | 0 | 준비 필요 |

## 프로젝트 구조

```
path-web/
├── app/
│   ├── page.tsx                      # 소개 (Intro) 페이지
│   ├── design/                       # 에이전트 디자인 (Wizard)
│   │   ├── layout.tsx                # Design 레이아웃 (메타데이터)
│   │   └── page.tsx                  # Step 1~4 Wizard
│   ├── guide/page.tsx                # P.A.T.H 가이드
│   ├── sessions/page.tsx             # 세션 관리
│   ├── auth/                         # 인증 페이지
│   │   ├── signin/
│   │   │   ├── page.tsx              # 로그인 (Cognito 자동 리다이렉트)
│   │   │   └── auto-submit.tsx       # 자동 폼 제출 컴포넌트
│   │   └── error/page.tsx            # 인증 오류
│   ├── feasibility/page.tsx          # /design 리다이렉트
│   ├── analyze/page.tsx              # /design 리다이렉트
│   ├── results/page.tsx              # /design 리다이렉트
│   ├── error.tsx                     # Error boundary
│   ├── not-found.tsx                 # 404 페이지
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # 글로벌 스타일
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
│       │   ├── route.ts              # GET (목록), POST (생성)
│       │   └── [id]/route.ts         # GET (조회), PUT (업데이트)
│       ├── auth/                     # 인증 API
│       │   ├── [...nextauth]/route.ts  # NextAuth.js 핸들러
│       │   └── logout/route.ts       # Cognito 페더레이션 로그아웃
│       └── health/                   # 헬스 체크
├── components/
│   ├── cloudscape/                   # Cloudscape 프로바이더
│   │   ├── CloudscapeProvider.tsx    # Cloudscape 테마/모드 제공
│   │   ├── FlashbarProvider.tsx      # 알림 메시지 제공
│   │   └── GlossaryTerm.tsx          # 기술 용어 팝오버 (비전문가용)
│   ├── auth/
│   │   └── AuthProvider.tsx          # NextAuth SessionProvider 래퍼
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
│       ├── AppLayoutShell.tsx        # Cloudscape AppLayout + TopNavigation + SideNavigation
│       ├── Header.tsx                # (deprecated, AppLayoutShell에 통합)
│       └── TokenUsageBadge.tsx       # 토큰 사용량 배지
├── lib/
│   ├── types.ts                      # TypeScript 타입 정의
│   ├── schema.ts                     # Zod 유효성 검증 스키마 (입력 새니타이징 포함)
│   ├── constants.ts                  # 상수 (STEPS, READINESS_LEVELS, GLOSSARY 등)
│   ├── utils.ts                      # 유틸리티 함수 (formatKST)
│   ├── readiness.ts                  # 준비도 레벨 로직
│   ├── auth-helpers.ts               # 인증 헬퍼 (getAuthUserId)
│   ├── hooks/                        # 커스텀 훅
│   │   ├── index.ts
│   │   ├── useSSEStream.ts           # SSE 스트리밍 훅
│   │   └── useTokenUsage.ts          # 토큰 사용량 훅
│   └── aws/
│       └── dynamodb.ts               # DynamoDB 클라이언트 설정
├── types/
│   └── next-auth.d.ts                # NextAuth 타입 확장
├── auth.ts                           # NextAuth.js 설정 (Cognito provider)
├── middleware.ts                     # 인증 미들웨어 (공개/보호 경로)
├── Dockerfile                        # Multi-stage Node.js Alpine 빌드
├── buildspec.yml                     # CodeBuild 스펙 (ECR 푸시)
├── deploy.sh                         # Standalone 배포 스크립트
├── .dockerignore
├── .env.example                      # 환경변수 예시
├── .env.local.example                # 환경변수 예시 (상세)
├── next.config.ts                    # Next.js 설정 (standalone, redirects, 보안 헤더)
├── eslint.config.mjs                 # ESLint 설정
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

### AppLayoutShell (`components/layout/AppLayoutShell.tsx`)

Cloudscape 기반 공통 레이아웃:

- `TopNavigation`: 상단 네비게이션 바 (로고, 토큰 사용량, 사용자 메뉴)
- `SideNavigation`: 좌측 사이드 메뉴 (소개, 가이드, 에이전트 디자인, 세션 목록)
- `SplitPanel`: 하단 토큰 사용량 상세 패널
- `BreadcrumbGroup`: 브레드크럼 네비게이션
- 인증 상태에 따른 사용자 정보/로그아웃 메뉴 표시

### Cloudscape Provider (`components/cloudscape/`)

- `CloudscapeProvider`: Cloudscape 테마 및 다크/라이트 모드 제공
- `FlashbarProvider`: 전역 알림 메시지 관리
- `GlossaryTerm`: 기술 용어 팝오버 (비전문가 사용자를 위한 용어 해설)

### Auth (`auth.ts`, `middleware.ts`)

- NextAuth.js v5 + Amazon Cognito 인증
- Cognito 환경변수 미설정 시 인증 없이 동작 (`authConfigured` 플래그)
- JWT 기반 세션 전략
- 이메일 인증 필수 (`email_verified`)
- 미들웨어에서 공개/보호 경로 분리

### Custom Hooks (`lib/hooks/`)

- `useSSEStream`: SSE 이벤트 스트림을 React state로 변환 (AbortController, 진행률, 에러 처리)
- `useTokenUsage`: LLM 토큰 사용량 추적 및 표시 (sessionStorage 기반)

## 보안

### 입력 새니타이징 (`lib/schema.ts`)

- Zod 스키마 기반 유효성 검증
- LLM 프롬프트 인젝션 방지를 위한 위험 패턴 필터링 (`SYSTEM:`, `ignore previous instructions` 등)
- 입력 길이 제한 (Pain Point: 2000자, 컨텍스트: 5000자)

### 보안 헤더 (`next.config.ts`)

- `Content-Security-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security` 등 설정
- `poweredByHeader: false`

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
| `AUTH_SECRET` | No | NextAuth.js 비밀키 (Cognito 사용 시 필수) |
| `AUTH_TRUST_HOST` | No | NextAuth.js trustHost (기본: true) |
| `COGNITO_CLIENT_ID` | No | Cognito 앱 클라이언트 ID |
| `COGNITO_CLIENT_SECRET` | No | Cognito 앱 클라이언트 시크릿 |
| `COGNITO_ISSUER` | No | Cognito 발급자 URL |
| `COGNITO_DOMAIN` | No | Cognito Hosted UI 도메인 (로그아웃용) |
| `AUTH_URL` | No | 배포 URL (로그아웃 리다이렉트용) |

## 참고

- [P.A.T.H 프레임워크 문서](../PATH.md)
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 가이드
- [Cloudscape Design System](https://cloudscape.design/)
- [Next.js Documentation](https://nextjs.org/docs)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [NextAuth.js Documentation](https://authjs.dev/)
