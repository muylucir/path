# P.A.T.H Agent Designer

AI Agent 아이디어를 **검증**하고 **명세서를 자동 생성**하는 웹 애플리케이션

## P.A.T.H란?

**P**roblem → **A**ssessment → **T**echnical Review → **H**andoff

| Step | 약자 | 한글명 | 설명 |
|------|------|--------|------|
| 1 | **P** | 기본 정보 입력 | Problem - Pain Point, 입력/처리/출력 유형 정의 |
| 2 | **A** | 준비도 점검 | Assessment - 5개 항목 Feasibility 평가 (50점 만점) + 자율성 요구도 |
| 3 | **T** | 기술 점검 | Technical Review - 대화형 분석 + Agent 패턴 추천 |
| 4 | **H** | 명세서 생성 | Handoff - 5단계 파이프라인으로 명세서 생성 |

## 아키텍처

```
Browser → Next.js (port 3009) → AWS SDK → AgentCore Runtime → AWS Bedrock Claude Opus 4.6
                              ↘ DynamoDB (sessions)
                              ↘ Cognito (인증, 선택)
```

- **Frontend**: Next.js API Routes에서 `@aws-sdk/client-bedrock-agentcore`로 AgentCore Runtime 직접 호출
- **Backend**: Bedrock AgentCore Runtime에서 Strands Agents SDK 기반 Agent 실행 (서버리스)
- **세션 관리**: DynamoDB (Next.js API Routes) + AgentCore `runtimeSessionId` (Agent 상태 유지)
- **인증**: NextAuth + Amazon Cognito (선택 — 미설정 시 인증 없이 동작)

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16.1.0, React 19.2.3, TypeScript 5, Cloudscape Design System |
| **Backend** | Python 3.11+, Strands Agents SDK (>= 1.26.0), Bedrock AgentCore Runtime |
| **LLM** | AWS Bedrock Claude Opus 4.6 (`global.anthropic.claude-opus-4-6-v1`) |
| **Storage** | AWS DynamoDB |
| **Auth** | NextAuth 5 + Amazon Cognito (선택) |
| **Infra** | AWS CloudFormation, CodeBuild, ECR |

## 실행

### 사전 요구사항

- Node.js 22+
- Python 3.11+
- AWS 자격 증명 (Bedrock, DynamoDB, AgentCore)
- AgentCore Runtime 배포 완료 (ARN 필요)

### Backend (AgentCore Runtime 배포)

```bash
cd path-strands-agent
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 배포 패키지 빌드
bash build-agent.sh
# → deployment_package.zip 생성 → S3 업로드 → CloudFormation 배포
```

### Frontend

```bash
cd path-web
npm install
npm run dev  # http://localhost:3009
```

### Frontend Docker

```bash
cd path-web
docker build -t path-web .
docker run -p 3009:3009 path-web
```

### 헬스 체크

```bash
# Frontend
curl http://localhost:3009/api/health

# AgentCore Runtime (ping action)
# Frontend API Route를 통해 자동 확인됨
```

## 프로젝트 구조

```
path/
├── path-web/                          # Frontend (Next.js 16.1.0 + Cloudscape)
│   ├── app/                           # Pages & API Routes
│   │   ├── page.tsx                   # 소개 (내러티브)
│   │   ├── design/                    # 메인 Wizard (Step 1-4 통합)
│   │   ├── guide/                     # P.A.T.H 가이드
│   │   ├── sessions/                  # 세션 이력
│   │   ├── auth/                      # 인증 (Cognito)
│   │   └── api/                       # API Routes (AgentCore 프록시, 세션, 인증)
│   ├── components/                    # React Components (Cloudscape)
│   ├── lib/                           # Types, Constants, Utils, Hooks
│   ├── auth.ts                        # NextAuth + Cognito 설정
│   ├── middleware.ts                  # 인증 미들웨어
│   ├── Dockerfile                     # Frontend Docker 빌드
│   └── buildspec.yml                  # CodeBuild 스펙 (ECR 푸시)
├── path-strands-agent/                # Backend (Strands Agents + AgentCore)
│   ├── agentcore_entrypoint.py        # AgentCore Runtime 엔트리포인트 (6개 액션 dispatch)
│   ├── chat_agent.py                  # FeasibilityAgent, PatternAnalyzerAgent
│   ├── multi_stage_spec_agent.py      # 5단계 Spec Pipeline (DesignAgent, DiagramAgent, PromptAgent, ToolAgent, AssemblerAgent)
│   ├── prompts.py                     # 시스템 프롬프트 및 템플릿
│   ├── strands_utils.py               # Strands Agent 유틸리티 (BedrockModel 생성)
│   ├── safe_tools.py                  # skills/ 디렉토리 접근 제한 file_read 래퍼
│   ├── token_tracker.py               # 토큰 사용량 추적 및 비용 추산
│   ├── build-agent.sh                 # 배포 패키지 빌더 (ARM64 ZIP)
│   ├── agentskills/                   # Skill 로딩 라이브러리
│   └── skills/                        # Agent Skills
│       ├── universal-agent-patterns/  # 프레임워크 독립적 Agent 패턴
│       ├── mermaid-diagrams/          # Mermaid 다이어그램 템플릿
│       ├── ascii-diagram/             # ASCII 다이어그램 템플릿
│       ├── prompt-engineering/        # 프롬프트 설계 가이드
│       ├── tool-schema/               # 도구 정의 가이드
│       ├── feasibility-evaluation/    # Feasibility 평가 기준
│       └── ai-assisted-workflow/      # AI-Assisted Workflow 가이드
├── docs/                              # 문서
│   ├── PATH-customer-narrative.md     # 고객용 소개 (내러티브)
│   ├── PATH-customer-guide.md         # 고객용 가이드 (구조화)
│   └── path-standalone-stack.yaml     # 독립 배포용 CloudFormation 템플릿
├── files/                             # 워크샵 자료 (발표, 핸드아웃)
├── PATH.md                            # P.A.T.H 프레임워크 상세 문서
└── README.md                          # 이 파일
```

## 페이지 구성

| 페이지 | 경로 | 설명 |
|-------|------|------|
| 소개 | `/` | P.A.T.H 소개 (내러티브) |
| 가이드 | `/guide` | P.A.T.H 가이드 (구조화) |
| 디자인 | `/design` | 메인 Wizard (Step 1~4 통합) |
| 세션 관리 | `/sessions` | 세션 이력 관리 |
| 인증 | `/auth/signin` | Cognito 로그인 (선택) |

> `/feasibility`, `/analyze`, `/results` 경로는 `/design`으로 리다이렉트됩니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 준비도 점검 | 5개 항목 평가 (50점) + 자율성 요구도 (별도 축 0-10점) + 개선 방안 반영 재평가 |
| 자동화 수준 판단 | 자율성 요구도 기반 AI-Assisted Workflow / Agentic AI 분류 |
| 대화형 분석 | Claude Opus 4.6 기반 패턴 분석 (객관식 선택지 포함) |
| 명세서 생성 | 5단계 파이프라인: DesignAgent → (DiagramAgent ∥ PromptAgent ∥ ToolAgent) → AssemblerAgent |
| 세션 관리 | DynamoDB 기반 이력 저장 + AgentCore 세션 라우팅 |
| 토큰 사용량 | 실시간 토큰 사용량 및 비용 추산 표시 |

## 환경 변수

```bash
# Backend (.env)
AWS_DEFAULT_REGION=ap-northeast-2
BEDROCK_MODEL_ID=global.anthropic.claude-opus-4-6-v1  # 선택

# Frontend (.env.local)
AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:...       # AgentCore Runtime ARN (필수)
AWS_DEFAULT_REGION=ap-northeast-2
DYNAMODB_TABLE_NAME=path-agent-sessions                # 선택 (기본값 동일)

# 인증 (선택 — 미설정 시 인증 없이 동작)
AUTH_SECRET=...                                        # NextAuth secret
COGNITO_CLIENT_ID=...                                  # Cognito App Client ID
COGNITO_CLIENT_SECRET=...                              # Cognito App Client Secret
COGNITO_ISSUER=https://cognito-idp.<region>.amazonaws.com/<pool-id>
```

## 문서

| 문서 | 설명 |
|------|------|
| [PATH.md](PATH.md) | P.A.T.H 프레임워크 상세 문서 |
| [path-web/README.md](path-web/README.md) | Frontend 상세 문서 |
| [path-strands-agent/README.md](path-strands-agent/README.md) | Backend 상세 문서 |

### 고객용 문서 (`docs/`)

| 문서 | 설명 |
|------|------|
| [소개 (내러티브)](docs/PATH-customer-narrative.md) | P.A.T.H가 무엇이고 왜 필요한지를 이야기 형식으로 설명 |
| [가이드 (구조화)](docs/PATH-customer-guide.md) | 각 단계별 입력 항목, 점수 기준, 활용 시나리오를 체계적으로 정리 |
