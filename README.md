# P.A.T.H Agent Designer

AI Agent 아이디어를 **검증**하고 **명세서를 자동 생성**하는 웹 애플리케이션

## P.A.T.H란?

**P**roblem → **T**echnical → **A**gent Pattern → **H**andoff

| Step | 약자 | 한글명 | 경로 | 설명 |
|------|------|--------|------|------|
| 1 | **P** | 기본 정보 | `/` | Pain Point, 입력/처리/출력 유형 정의 |
| 2 | **T** | 준비도 점검 | `/feasibility` | 5개 항목 Feasibility 평가 (50점 만점) |
| 3 | **A** | 패턴 분석 | `/analyze` | 대화형 분석 + Agent 패턴 추천 |
| 4 | **H** | 명세서 | `/results` | 4단계 파이프라인으로 명세서 생성 |

## 아키텍처

```
Browser → Next.js (port 3009) → AWS SDK → AgentCore Runtime → AWS Bedrock Claude Opus 4.6
                              ↘ DynamoDB (sessions)
```

- **Frontend**: Next.js API Routes에서 `@aws-sdk/client-bedrock-agentcore`로 AgentCore Runtime 직접 호출
- **Backend**: Bedrock AgentCore Runtime에서 Strands Agents SDK 기반 Agent 실행 (서버리스)
- **세션 관리**: DynamoDB (Next.js API Routes) + AgentCore `runtimeSessionId` (Agent 상태 유지)

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16.1.0, React 19.2.3, TypeScript 5, Cloudscape Design System |
| **Backend** | Python 3.11+, Strands Agents SDK, Bedrock AgentCore Runtime |
| **LLM** | AWS Bedrock Claude Opus 4.6 (`global.anthropic.claude-opus-4-6-v1`) |
| **Storage** | AWS DynamoDB |
| **Infra** | AWS CloudFormation, CodeBuild, CloudFront, S3 |

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

### 인프라 배포 (CloudFormation)

```bash
aws cloudformation deploy \
  --template-file agent-building-workshop-stack.yaml \
  --stack-name path-agent-designer \
  --capabilities CAPABILITY_NAMED_IAM
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
│   ├── components/                    # React Components (Cloudscape)
│   ├── lib/                           # Types, Constants, Utils, Hooks
│   ├── Dockerfile                     # Frontend Docker 빌드
│   └── buildspec.yml                  # CodeBuild 스펙 (ECR 푸시)
├── path-strands-agent/                # Backend (Strands Agents + AgentCore)
│   ├── agentcore_entrypoint.py        # AgentCore Runtime 엔트리포인트
│   ├── chat_agent.py                  # FeasibilityAgent, PatternAnalyzerAgent
│   ├── multi_stage_spec_agent.py      # 4-stage Spec Pipeline
│   ├── build-agent.sh                 # 배포 패키지 빌더 (ARM64 ZIP)
│   ├── agentskills/                   # Skill 로딩 라이브러리
│   └── skills/                        # Agent Skills
├── agent-building-workshop-stack.yaml # CloudFormation 인프라 템플릿
├── docs/                              # 고객용 문서
├── CLAUDE.md                          # Claude Code 가이드
├── PATH.md                            # P.A.T.H 프레임워크 문서
└── README.md                          # 이 파일
```

## AWS 요구사항

### CloudFormation 리소스

CloudFormation 템플릿 (`agent-building-workshop-stack.yaml`)이 다음 리소스를 자동 생성:

| 리소스 | 설명 |
|--------|------|
| AgentCore Runtime + Endpoint | Backend Agent 서버리스 실행 환경 |
| DynamoDB Table (`path-agent-sessions`) | 세션 저장 (partition key: `session_id`) |
| S3 Bucket | Agent 배포 패키지 저장 |
| CloudFront Distribution | Frontend CDN |
| VPC, Subnets, Security Groups | 네트워크 인프라 |
| IAM Roles & Policies | AgentCore, Lambda, EC2 실행 권한 |

### IAM 권한

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock-agentcore:InvokeAgentRuntime"],
      "Resource": "arn:aws:bedrock-agentcore:*:*:runtime/*"
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Scan", "dynamodb:DeleteItem", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:*:*:table/path-agent-sessions"
    }
  ]
}
```

### 환경 변수

```bash
# Backend (.env)
AWS_DEFAULT_REGION=ap-northeast-2
BEDROCK_MODEL_ID=global.anthropic.claude-opus-4-6-v1  # 선택

# Frontend (.env.local)
AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:...       # AgentCore Runtime ARN (필수)
AWS_DEFAULT_REGION=ap-northeast-2
DYNAMODB_TABLE_NAME=path-agent-sessions                # 선택
```

## 주요 기능

| 기능 | 설명 |
|------|------|
| 준비도 점검 | 5개 항목 평가 + 개선 방안 반영 재평가 |
| 대화형 분석 | Claude Opus 4.6 기반 패턴 분석 |
| 명세서 생성 | 4단계 파이프라인 (DesignAgent → DiagramAgent → DetailAgent → AssemblerAgent) |
| 세션 관리 | DynamoDB 기반 이력 저장 + AgentCore 세션 라우팅 |

## 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | Claude Code 프로젝트 가이드 |
| [PATH.md](PATH.md) | P.A.T.H 프레임워크 상세 문서 |
| [path-web/README.md](path-web/README.md) | Frontend 상세 문서 |
| [path-strands-agent/README.md](path-strands-agent/README.md) | Backend 상세 문서 |

### 고객용 문서 (`docs/`)

| 문서 | 앱 경로 | 설명 |
|------|---------|------|
| [소개 (내러티브)](docs/PATH-customer-narrative.md) | `/intro` | P.A.T.H가 무엇이고 왜 필요한지를 이야기 형식으로 설명 |
| [가이드 (구조화)](docs/PATH-customer-guide.md) | `/guide` | 각 단계별 입력 항목, 점수 기준, 활용 시나리오를 체계적으로 정리 |
