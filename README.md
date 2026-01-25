# P.A.T.H Agent Designer

AI Agent 아이디어를 **검증, 코드 생성, 배포**까지 한 번에 처리하는 3-tier 웹 애플리케이션

## 개요

P.A.T.H (Problem → Agent Pattern → Technical → Handoff) 프레임워크를 사용하여:
1. **AI Agent 아이디어 검증** - Claude Opus 4.5 기반 대화형 분석
2. **Strands Agent SDK 코드 자동 생성** - 명세서 기반 코드 생성
3. **Amazon Bedrock AgentCore Runtime 배포** - 원클릭 서버리스 배포

## 아키텍처

```
Browser → Next.js (port 3009) → FastAPI (port 8001) → AWS Bedrock Claude Opus 4.5
                               ↘ DynamoDB (sessions, integrations, deployments)
                               ↘ AgentCore (Runtime, Gateway, Identity)
                               ↘ ECR (container images)
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16.1, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, Strands Agents SDK, uvicorn |
| **LLM** | AWS Bedrock Claude Opus 4.5 (primary), Sonnet/Haiku 4.5 |
| **Storage** | AWS DynamoDB, S3, ECR |
| **Deployment** | AWS Bedrock AgentCore Runtime |
| **Visualization** | Mermaid, react-markdown, @xyflow/react |

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🤖 **AI 분석** | Claude Opus 4.5로 아이디어 검증 및 대화형 분석 |
| 📊 **Feasibility 평가** | 5개 항목 50점 만점 평가 |
| 📋 **명세서 생성** | 4단계 파이프라인으로 Strands Agent 명세서 자동 생성 |
| 💻 **코드 생성** | PATH 명세서를 Strands SDK 코드로 변환 (비동기 작업) |
| 🚀 **배포 관리** | AgentCore Runtime 배포, 버전 관리, 롤백 |
| 🔌 **통합 관리** | Gateway, MCP Server, Identity, RAG, S3 통합 설정 |
| 🎮 **Playground** | 배포된 Agent 및 MCP Server 테스트 |
| 💾 **세션 관리** | DynamoDB 기반 이력 관리 |
| 🛠️ **Skill Tool System** | strands-agent-patterns, agentcore-services, mermaid-diagrams 스킬로 베스트 프랙티스 자동 반영 |

## 페이지 구성

| 페이지 | 경로 | 기능 |
|-------|------|------|
| **Step 1** | `/` | 아이디어 입력 + 통합(Integration) 선택 |
| **Step 2** | `/analyze` | Claude 분석 및 대화 (최대 3턴) |
| **Step 3** | `/results` | 결과 확인 + 명세서/코드 생성 |
| **Sessions** | `/sessions` | 세션 이력 관리 |
| **Settings** | `/settings` | 5탭 통합 관리 (Gateway, MCP, Identity, RAG, S3) |
| **Code Jobs** | `/code-jobs` | 코드 생성 작업 모니터링 |
| **Deployments** | `/deployments` | 배포 관리 (로그, 버전, Playground 링크) |
| **Framework** | `/framework` | P.A.T.H 문서 |

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- AWS 자격 증명 (bedrock, dynamodb, s3, ecr, bedrock-agentcore)

### 1. 저장소 클론

```bash
git clone <repository-url>
cd path
```

### 2. Backend 설정 (path-strands-agent/)

```bash
cd path-strands-agent

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 3. Frontend 설정 (path-web/)

```bash
cd path-web
npm install
```

### 4. DynamoDB 테이블 생성

```bash
# 세션 테이블
aws dynamodb create-table \
  --table-name path-agent-sessions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2

# 통합 설정 테이블
aws dynamodb create-table \
  --table-name path-agent-integrations \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2

# 배포 테이블
aws dynamodb create-table \
  --table-name path-agent-deployments \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

### 5. AWS 자격증명 설정

```bash
aws configure
# 또는 환경변수 설정
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-west-2
```

### 6. 개발 서버 실행

**Terminal 1 - Backend (FastAPI)**:
```bash
cd path-strands-agent
source venv/bin/activate
python api_server.py
# http://localhost:8001
```

**Terminal 2 - Frontend (Next.js)**:
```bash
cd path-web
npm run dev
# http://localhost:3009
```

브라우저에서 http://localhost:3009 접속

### 헬스 체크

```bash
# Backend
curl http://localhost:8001/health

# Frontend
curl http://localhost:3009
```

## 사용 방법

### Step 1: 기본 정보 입력

1. **호스팅 환경** 선택 - EC2/ECS/EKS ↔ AgentCore (토글 스위치)
2. **Pain Point** 입력 - 해결하고 싶은 문제
3. **INPUT** 선택 - 트리거 타입 (Event-Driven, Scheduled, On-Demand, Streaming, Conditional)
4. **PROCESS** 선택 - 필요한 작업 (복수 선택 가능)
5. **OUTPUT** 선택 - 결과물 타입 (복수 선택 가능)
6. **Human-in-Loop** 선택 - 사람 개입 시점
7. **Integrations** 선택 - Gateway, MCP, RAG, S3 통합
8. **Error Tolerance** 선택

### Step 2: Claude 분석

1. Claude가 초기 분석 수행
2. 추가 질문에 답변 (최대 3턴)
3. "분석 완료" 클릭

### Step 3: 결과 확인

4개 탭으로 구성:
- **📊 상세 분석** - Feasibility 점수, Strands Agent 구현 전략
- **💬 대화 내역** - Step 2의 전체 대화
- **📋 명세서** - Strands Agent 구현 명세서 생성 및 다운로드
- **🚀 다음 단계** - 코드 생성, 배포, 세션 저장

## API 엔드포인트

### FastAPI Backend (port 8001)

#### 분석 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/analyze` | POST | 초기 분석 | SSE 스트리밍 |
| `/chat` | POST | 멀티턴 대화 | SSE 스트리밍 |
| `/finalize` | POST | 최종 Feasibility 평가 | JSON |
| `/spec` | POST | 명세서 생성 (4단계 파이프라인) | SSE 스트리밍 + 진행률 |
| `/health` | GET | 헬스체크 | JSON |

#### 코드 생성 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/code/generate` | POST | 직접 코드 생성 | SSE 스트리밍 |
| `/code/jobs` | POST | 비동기 코드 생성 작업 생성 | JSON |
| `/code/jobs` | GET | 최근 작업 목록 | JSON |
| `/code/jobs/{job_id}` | GET | 작업 상태 조회 | JSON |
| `/code/jobs/{job_id}` | DELETE | 작업 삭제 | JSON |
| `/code/jobs/{job_id}/download` | GET | 완료된 작업 ZIP 다운로드 | ZIP |

#### 배포 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/deployments` | POST | 새 배포 생성 | JSON |
| `/deployments` | GET | 배포 목록 | JSON |
| `/deployments/{id}` | GET | 배포 상태 조회 | JSON |
| `/deployments/{id}` | DELETE | 배포 삭제 | JSON |
| `/deployments/{id}/invoke` | POST | 배포된 Agent 호출 | JSON |
| `/deployments/{id}/metrics` | GET | 메트릭스 (호출 수, 레이턴시, 토큰) | JSON |
| `/deployments/{id}/versions` | GET | 버전 이력 | JSON |
| `/deployments/{id}/logs` | GET | 배포 로그 | JSON |
| `/deployments/{id}/logs/stream` | GET | 실시간 로그 스트리밍 | SSE |
| `/deployments/{id}/rollback` | POST | 이전 버전으로 롤백 | JSON |

### Next.js API Routes (port 3009)

| 엔드포인트 | 설명 |
|----------|------|
| `/api/bedrock/*` | FastAPI 백엔드 프록시 |
| `/api/sessions` | 세션 CRUD (DynamoDB) |
| `/api/integrations` | 통합 설정 CRUD |
| `/api/gateways` | Gateway 관리 |
| `/api/identity-providers` | Identity Provider 관리 |
| `/api/mcp-servers` | MCP Server 관리 |

## 통합 설정 (Settings)

Settings 페이지에서 5가지 통합을 관리할 수 있습니다:

### Gateway

외부 API를 MCP 도구로 변환하여 Agent가 사용할 수 있게 합니다.

| 타입 | 설명 |
|------|------|
| **API** | REST API (OpenAPI 스펙) |
| **MCP** | 기존 MCP Server 연결 |
| **Lambda** | AWS Lambda 함수 연결 |
| **API Gateway** | AWS API Gateway 연결 |
| **Smithy** | Smithy 모델 기반 |

### MCP Server Registry

MCP Server를 등록하고 관리합니다.

| 카테고리 | 설명 |
|---------|------|
| **Self-hosted** | FastMCP 코드 작성 및 AgentCore 배포 |
| **Templates** | 기본 제공 템플릿 (Weather, DynamoDB, Calculator 등) |
| **External** | mcp.so 레지스트리 연동 |
| **AWS** | AWS 제공 MCP Server |

### Identity Provider

Agent가 외부 서비스 인증에 사용하는 자격 증명을 관리합니다.

| 타입 | 설명 |
|------|------|
| **API Key** | 단순 API 키 인증 |
| **OAuth2** | OAuth2 인증 플로우 |

### RAG

검색 증강 생성을 위한 지식 베이스 설정입니다.

| 타입 | 설명 |
|------|------|
| **Bedrock KB** | Amazon Bedrock Knowledge Base |
| **Pinecone** | Pinecone 벡터 DB |
| **OpenSearch** | Amazon OpenSearch |

### S3

파일 저장 및 배포 아티팩트용 S3 버킷 설정입니다.

## 코드 생성 파이프라인

PATH 명세서에서 Strands SDK 코드를 자동 생성합니다.

### 생성되는 파일

```
generated-agent/
├── main.py              # 메인 Agent 코드
├── tools.py             # 커스텀 도구 정의
├── agentcore_config.py  # AgentCore 설정 (선택)
├── agentcore.yaml       # 배포 설정
└── requirements.txt     # Python 의존성
```

### 비동기 작업 시스템

대용량 코드 생성은 비동기 작업으로 처리됩니다:

1. `/code/jobs` POST로 작업 생성
2. `/code/jobs/{job_id}` GET으로 진행률 확인
3. 완료 시 `/code/jobs/{job_id}/download`로 ZIP 다운로드

## 배포 파이프라인

생성된 코드를 AgentCore Runtime에 배포합니다.

### 배포 단계

1. **Code Save** - 생성된 코드 저장
2. **Docker Build** - ARM64 타겟 이미지 빌드
3. **ECR Push** - 컨테이너 레지스트리 업로드
4. **Runtime Create** - AgentCore Runtime 생성
5. **Status Poll** - READY 상태 대기

### 배포 관리 기능

- **실시간 로그 스트리밍** - SSE로 배포 로그 확인
- **버전 관리** - 버전 이력 조회
- **롤백** - 이전 버전으로 롤백
- **메트릭스** - 호출 수, 레이턴시, 토큰 사용량
- **Playground** - 배포된 Agent 즉시 테스트

## P.A.T.H 프레임워크

### Phase 1: Problem Decomposition

Pain Point를 4가지 요소로 분해:
- **INPUT**: 무엇이 트리거인가? (Event, Scheduled, On-Demand, Streaming, Conditional)
- **PROCESS**: 무슨 작업이 필요한가? (수집, 분석, 판단, 생성, 검증, 실행)
- **OUTPUT**: 결과물은 무엇인가? (Decision, Content, Notification, Action, Insight)
- **HUMAN-IN-LOOP**: 사람 개입 시점은? (None, Review, Exception, Collaborate)

### Phase 2: Agent Pattern 선택

Strands Agent 구현 패턴:
- **Reflection** → Graph의 순환 구조 (self-review loop)
- **Tool Use** → Agent-as-Tool 직접 활용
- **Planning** → Graph의 순차 노드 구조
- **Multi-Agent** → Graph + Agent-as-Tool 조합

### Phase 3: Feasibility Check

5개 항목 평가 (총 50점):

| 항목 | 점수 | 기준 |
|-----|------|------|
| 데이터 접근성 | 10점 | MCP/RAG: 10점, API: 9점 |
| 판단 기준 명확성 | 10점 | 명확한 규칙 여부 |
| 오류 허용도 | 10점 | 실패 시 영향도 |
| 지연 요구사항 | 10점 | 실시간/배치 여부 |
| 통합 복잡도 | 10점 | 외부 시스템 연동 수 |

**판정 기준:**
- 40-50점: ✅ 즉시 프로토타입 시작
- 30-40점: ⚠️ 조건부 진행
- 20-30점: 🔄 개선 후 재평가
- 20점 미만: ❌ 대안 모색

### Phase 4: Handoff Specification

4단계 파이프라인으로 명세서 생성:

1. **PatternAgent** (0-25%): `strands-agent-patterns` 스킬로 Agent 패턴 분석
2. **AgentCoreAgent** (25-50%): `agentcore-services` 스킬로 AgentCore 서비스 구성 (선택)
3. **ArchitectureAgent** (50-75%): `mermaid-diagrams` 스킬로 다이어그램 생성
4. **AssemblerAgent** (75-100%): 최종 명세서 조립

## Amazon Bedrock AgentCore

AgentCore를 선택하면 명세서에 다음 서비스 활용 가이드가 추가됩니다:

- **AgentCore Runtime** (필수): 서버리스 에이전트 호스팅 - **1개 Runtime으로 Multi-Agent 호스팅**
- **AgentCore Memory** (필요시): 단기/장기 메모리 관리
- **AgentCore Gateway** (필요시): API/Lambda를 MCP 도구로 변환
- **AgentCore Identity** (필요시): OAuth 연동 및 API 키 관리
- **AgentCore Browser** (필요시): 웹 자동화
- **AgentCore Code Interpreter** (필요시): 코드 실행

## 프로젝트 구조

```
path/
├── path-web/                          # Frontend (Next.js 16.1, Port 3009)
│   ├── app/
│   │   ├── page.tsx                   # Step 1: 입력
│   │   ├── analyze/                   # Step 2: 분석
│   │   ├── results/                   # Step 3: 결과
│   │   ├── sessions/                  # 세션 관리
│   │   ├── settings/                  # 통합 설정 (5탭)
│   │   ├── code-jobs/                 # 코드 생성 작업
│   │   ├── deployments/               # 배포 관리
│   │   ├── playground/[id]/           # Agent Playground
│   │   ├── mcp-playground/[id]/       # MCP Playground
│   │   ├── framework/                 # P.A.T.H 문서
│   │   └── api/                       # API Routes
│   │       ├── bedrock/               # Backend 프록시
│   │       ├── sessions/              # 세션 CRUD
│   │       ├── integrations/          # 통합 CRUD
│   │       ├── gateways/              # Gateway 관리
│   │       ├── identity-providers/    # Identity 관리
│   │       └── mcp-servers/           # MCP Server 관리
│   ├── components/
│   │   ├── steps/                     # Step 1-3 컴포넌트
│   │   ├── analysis/                  # 분석 결과 컴포넌트
│   │   ├── settings/                  # 통합 설정 폼
│   │   ├── deployments/               # 로그, Playground
│   │   └── ui/                        # shadcn/ui
│   └── lib/
│       ├── types.ts                   # TypeScript 타입
│       ├── schema.ts                  # Zod 스키마
│       ├── constants.ts               # 상수
│       ├── utils.ts                   # 유틸리티
│       ├── prompts.ts                 # 프롬프트
│       ├── mcp-templates.ts           # MCP 템플릿
│       └── aws/                       # AWS SDK 유틸리티
│
├── path-strands-agent/                # Backend (FastAPI, Port 8001)
│   ├── api_server.py                  # 메인 서버
│   ├── chat_agent.py                  # AnalyzerAgent, ChatAgent, EvaluatorAgent
│   ├── multi_stage_spec_agent.py      # 4단계 명세서 생성 파이프라인
│   ├── code_generator_agent.py        # 코드 생성 에이전트
│   ├── job_manager.py                 # 비동기 작업 관리
│   ├── background_worker.py           # 백그라운드 워커
│   ├── deployment_manager.py          # 배포 상태 관리
│   ├── deployment_service.py          # AgentCore 배포 서비스
│   ├── deployment_log_manager.py      # 로그 스트리밍
│   ├── gateway_manager.py             # Gateway 관리
│   ├── identity_manager.py            # Identity 관리
│   ├── mcp_deployment_manager.py      # MCP Server 배포
│   ├── strands_utils.py               # Strands 유틸리티
│   ├── prompts.py                     # 시스템 프롬프트
│   ├── skill_tool.py                  # Skill Tool 시스템
│   ├── agentskills/                   # 스킬 로딩 라이브러리
│   └── skills/                        # 에이전트 스킬
│       ├── strands-agent-patterns/    # Agent 패턴 분석
│       ├── agentcore-services/        # AgentCore 서비스 가이드
│       ├── mermaid-diagrams/          # 다이어그램 템플릿
│       └── code-generation/           # 코드 생성 템플릿
│
├── CLAUDE.md                          # Claude Code 가이드
├── PATH.md                            # P.A.T.H 프레임워크 문서
└── README.md                          # 이 파일
```

## AWS 요구사항

### 권한

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:DeleteItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/path-agent-*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["ecr:*"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock-agentcore:*"],
      "Resource": "*"
    }
  ]
}
```

### DynamoDB 테이블

| 테이블명 | Partition Key | 설명 |
|---------|---------------|------|
| `path-agent-sessions` | `id` (String) | 세션 저장 |
| `path-agent-integrations` | `id` (String) | 통합 설정 (Gateway, MCP, RAG, S3) |
| `path-agent-deployments` | `id` (String) | 배포 상태 관리 |

### 환경 변수

```bash
# Backend
AWS_DEFAULT_REGION=us-west-2
AGENTCORE_S3_BUCKET=my-bucket        # (선택) 배포 아티팩트 버킷
AGENTCORE_ROLE_ARN=arn:aws:iam::...  # (선택) AgentCore IAM 역할
```

## 개발

### 코드 포맷팅

```bash
# Frontend
cd path-web
npm run lint

# Backend
cd path-strands-agent
ruff check .
```

### 프로덕션 빌드

```bash
# Frontend
cd path-web
npm run build
npm start

# Backend (Docker)
docker build -t path-agent-backend .
docker run -p 8001:8001 path-agent-backend
```

## 라이선스

MIT

## 기여

이슈 및 PR 환영합니다!

## 참고

- [P.A.T.H 프레임워크 문서](PATH.md)
- [Strands Agents SDK](https://strandsagents.com/)
- [Amazon Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
