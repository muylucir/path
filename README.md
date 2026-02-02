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
Browser → Next.js (port 3009) → FastAPI (port 8001) → AWS Bedrock Claude Opus 4.5
                              ↘ DynamoDB (sessions)
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16.1.0, React 19.2.3, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, Strands Agents SDK, SlowAPI |
| **LLM** | AWS Bedrock Claude Opus 4.5 |
| **Storage** | AWS DynamoDB |

## 실행

### Backend

```bash
cd path-strands-agent
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python api_server.py  # http://localhost:8001
```

### Frontend

```bash
cd path-web
npm install
npm run dev  # http://localhost:3009
```

### Docker (통합)

```bash
docker build -t path-agent-designer .
docker run -p 3009:3009 --name path-agent-designer path-agent-designer
```

### 헬스 체크

```bash
curl http://localhost:8001/health
```

## 프로젝트 구조

```
path/
├── path-web/                  # Frontend (Next.js 16.1.0)
│   ├── app/                   # Pages & API Routes
│   ├── components/            # React Components
│   └── lib/                   # Types, Constants, Utils
├── path-strands-agent/        # Backend (FastAPI)
│   ├── api_server.py          # Main Server
│   ├── chat_agent.py          # FeasibilityAgent, PatternAnalyzerAgent
│   ├── multi_stage_spec_agent.py  # 4-stage Spec Pipeline
│   └── skills/                # Agent Skills
├── CLAUDE.md                  # Claude Code 가이드
├── PATH.md                    # P.A.T.H 프레임워크 문서
├── Dockerfile                 # Docker 통합 빌드
└── README.md                  # 이 파일
```

## AWS 요구사항

### DynamoDB 테이블 생성

```bash
aws dynamodb create-table \
  --table-name path-agent-sessions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2
```

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
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Scan", "dynamodb:DeleteItem", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:*:*:table/path-agent-sessions"
    }
  ]
}
```

### 환경 변수

```bash
AWS_DEFAULT_REGION=ap-northeast-2
PATH_API_KEY=your-api-key  # API 인증 (선택)
```

## 주요 기능

| 기능 | 설명 |
|------|------|
| 준비도 점검 | 5개 항목 평가 + 개선 방안 반영 재평가 |
| 대화형 분석 | Claude Opus 4.5 기반 패턴 분석 |
| 명세서 생성 | 4단계 파이프라인 (DesignAgent → DiagramAgent → DetailAgent → AssemblerAgent) |
| 세션 관리 | DynamoDB 기반 이력 저장 |

## 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | Claude Code 프로젝트 가이드 |
| [PATH.md](PATH.md) | P.A.T.H 프레임워크 상세 문서 |
| [path-web/README.md](path-web/README.md) | Frontend 상세 문서 |
| [path-strands-agent/README.md](path-strands-agent/README.md) | Backend 상세 문서 |
