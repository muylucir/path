# P.A.T.H Agent Designer

AI Agent 아이디어를 **검증**하고 **명세서를 자동 생성**하는 웹 애플리케이션

## 개요

P.A.T.H (Problem → Technical → Agent Pattern → Handoff) 프레임워크를 사용하여:
1. **기본 정보 입력** - Pain Point와 요구사항 정의
2. **준비도 점검** - 5가지 기준으로 Feasibility 평가 (50점 만점)
3. **패턴 분석** - Claude Opus 4.6 기반 대화형 분석 및 Agent 패턴 추천
4. **명세서 생성** - 4단계 파이프라인으로 상세 명세서 자동 생성

## 아키텍처

```
Browser → Next.js (port 3009) → FastAPI (port 8001) → AWS Bedrock Claude Opus 4.6
                              ↘ DynamoDB (sessions)
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16.1.0, React 19.2.3, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| **Backend** | Python 3.11+, FastAPI, Strands Agents SDK, uvicorn, SlowAPI |
| **LLM** | AWS Bedrock Claude Opus 4.6 (global.anthropic.claude-opus-4-6-v1) |
| **Storage** | AWS DynamoDB |
| **Visualization** | Mermaid, react-markdown, react-syntax-highlighter |

## P.A.T.H 단계

| 단계 | 약자 | 한글명 | 설명 |
|------|------|--------|------|
| Step 1 | **P** (Problem) | 기본 정보 | Pain Point, 입력/처리/출력 유형, Human Loop, 오류 허용도 입력 |
| Step 2 | **T** (Technical) | 준비도 점검 | 5개 항목 Feasibility 평가 + 개선 방안 입력 |
| Step 3 | **A** (Agent Pattern) | 패턴 분석 | 대화형 분석 + Agent 패턴/아키텍처 추천 |
| Step 4 | **H** (Handoff) | 명세서 | 4단계 파이프라인으로 상세 명세서 생성 |

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🤖 **AI 분석** | Claude Opus 4.6로 아이디어 검증 및 대화형 분석 |
| 📊 **준비도 점검** | 5개 항목 50점 만점 평가 + 개선 방안 반영 재평가 |
| 💬 **대화형 분석** | 패턴 분석 단계에서 채팅으로 요구사항 구체화 |
| 📋 **명세서 생성** | 4단계 파이프라인으로 프레임워크 독립적 명세서 자동 생성 |
| 💾 **세션 관리** | DynamoDB 기반 이력 관리 |

## 페이지 구성

| 페이지 | 경로 | 기능 |
|-------|------|------|
| **Step 1** | `/` | 기본 정보 입력 (Pain Point, 입력/처리/출력 유형) |
| **Step 2** | `/feasibility` | 준비도 점검 + 개선 방안 입력 |
| **Step 3** | `/analyze` | 패턴 분석 (대화형) |
| **Step 4** | `/results` | 결과 확인 (분석, 대화 이력, 명세서 탭) |
| **Sessions** | `/sessions` | 세션 이력 관리 |
| **Framework** | `/framework` | P.A.T.H 프레임워크 문서 |

## 설치 및 실행

### 사전 요구사항

- Node.js 22+
- Python 3.11+
- AWS 자격 증명 (bedrock, dynamodb)

### Frontend (path-web/)

```bash
cd path-web
npm install
npm run dev  # http://localhost:3009
```

### Backend (path-strands-agent/)

```bash
cd path-strands-agent
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python api_server.py  # http://localhost:8001
```

### Docker (통합 실행)

```bash
docker build -t path-agent-designer .
docker run -p 3009:3009 --name path-agent-designer path-agent-designer
```

### 헬스 체크

```bash
curl http://localhost:8001/health
```

## API 엔드포인트

### FastAPI Backend (port 8001)

#### Step 2: 준비도 점검

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/feasibility` | POST | 초기 Feasibility 평가 | SSE 스트리밍 |
| `/feasibility/update` | POST | 개선 방안 반영 재평가 | JSON |

#### Step 3: 패턴 분석

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/pattern/analyze` | POST | 초기 패턴 분석 | SSE 스트리밍 |
| `/pattern/chat` | POST | 대화형 분석 | SSE 스트리밍 |
| `/pattern/finalize` | POST | 최종 분석 (improved_feasibility 포함) | JSON |

#### Step 4: 명세서

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/spec` | POST | 명세서 생성 (4단계 파이프라인) | SSE 스트리밍 + 진행률 |

#### Legacy (deprecated)

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/analyze` | POST | Legacy 초기 분석 | SSE |
| `/chat` | POST | Legacy 대화 | SSE |
| `/finalize` | POST | Legacy 최종 평가 | JSON |

#### System

| 엔드포인트 | 메서드 | 설명 |
|----------|--------|------|
| `/health` | GET | 헬스 체크 (인증 불필요) |

### Next.js API Routes (port 3009)

| 엔드포인트 | 설명 |
|----------|------|
| `/api/bedrock/*` | FastAPI 백엔드 프록시 |
| `/api/sessions` | 세션 CRUD (DynamoDB) |
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

### 판정 기준 (총점 기준)

| 점수 | 판정 | 권장 액션 |
|------|------|----------|
| 40-50점 | ✅ 즉시 진행 | 바로 프로토타입 시작 |
| 30-40점 | ⚠️ 조건부 진행 | 취약 항목 보완 후 진행 |
| 20-30점 | 🔄 재평가 필요 | 개선 방안 수립 후 재평가 |
| 20점 미만 | ❌ 대안 모색 | 근본적 재검토 필요 |

## 명세서 생성 파이프라인

4단계 Multi-Agent 파이프라인으로 프레임워크 독립적 명세서 생성:

```
DesignAgent (0-40%)      → Agent 설계 패턴 분석 (universal-agent-patterns 스킬)
DiagramAgent (40-70%)    → Mermaid/ASCII 다이어그램 (mermaid-diagrams, ascii-diagram 스킬)
DetailAgent (70-95%)     → 프롬프트 & 도구 정의 (prompt-engineering, tool-schema 스킬)
AssemblerAgent (95-100%) → 최종 Markdown 조립 (LLM 미사용)
```

## 프로젝트 구조

```
path-web/                          # Frontend (Next.js 16.1.0)
├── app/
│   ├── page.tsx                   # Step 1: 기본 정보 입력
│   ├── feasibility/               # Step 2: 준비도 점검
│   ├── analyze/                   # Step 3: 패턴 분석
│   ├── results/                   # Step 4: 결과 (명세서)
│   ├── sessions/                  # 세션 관리
│   ├── framework/                 # P.A.T.H 문서
│   └── api/                       # API Routes
│       ├── bedrock/               # Backend 프록시
│       │   ├── feasibility/       # 준비도 점검 API
│       │   ├── pattern/           # 패턴 분석 API
│       │   └── spec/              # 명세서 생성 API
│       ├── sessions/              # 세션 CRUD
│       └── health/                # 헬스 체크
├── components/
│   ├── steps/                     # Step1Form, Step2Readiness, Step3PatternAnalysis, Step3Results
│   ├── analysis/                  # MDXRenderer
│   ├── layout/                    # 레이아웃 컴포넌트
│   └── ui/                        # shadcn/ui
└── lib/
    ├── types.ts                   # TypeScript 타입
    ├── schema.ts                  # Zod 스키마
    ├── constants.ts               # 상수 (STEPS, READINESS_LEVELS 등)
    ├── utils.ts                   # 유틸리티
    └── aws/                       # AWS SDK 설정

path-strands-agent/                # Backend (FastAPI)
├── api_server.py                  # 메인 서버 (port 8001)
├── chat_agent.py                  # Agent 정의 (Feasibility, PatternAnalyzer)
├── multi_stage_spec_agent.py      # 명세서 생성 파이프라인
├── prompts.py                     # 시스템 프롬프트
├── strands_utils.py               # Strands 유틸리티
├── auth.py                        # API Key 인증
├── rate_limiter.py                # Rate Limiting (SlowAPI)
├── validators.py                  # 입력 검증
├── session_manager.py             # 세션 관리
├── session_cleanup.py             # 세션 정리 스케줄러
└── skills/                        # Agent 스킬
    ├── universal-agent-patterns/  # 프레임워크 독립적 패턴 분석
    ├── mermaid-diagrams/          # Mermaid 다이어그램 템플릿
    ├── ascii-diagram/             # ASCII 다이어그램 템플릿
    ├── prompt-engineering/        # 프롬프트 설계 가이드
    ├── tool-schema/               # 도구 정의 가이드
    └── feasibility-evaluation/    # Feasibility 평가 기준
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
      "Resource": "arn:aws:dynamodb:*:*:table/path-agent-sessions"
    }
  ]
}
```

### DynamoDB 테이블

| 테이블명 | Partition Key | 설명 |
|---------|---------------|------|
| `path-agent-sessions` | `id` (String) | 세션 저장 |

### 환경 변수

```bash
# Backend
AWS_DEFAULT_REGION=ap-northeast-2
PATH_API_KEY=your-api-key          # API 인증 키
```

### CORS 설정

```python
allow_origins=["http://localhost:3009", "https://d21k0iabhuk0yx.cloudfront.net"]
```

## 개발

### 코드 린팅

```bash
# Frontend
cd path-web
npm run lint
```

### 프로덕션 빌드

```bash
# Frontend (standalone)
cd path-web
npm run build
npm start

# Docker (통합)
docker build -t path-agent-designer .
docker run -p 3009:3009 path-agent-designer
```

## 참고

- [P.A.T.H 프레임워크 문서](../PATH.md)
- [CLAUDE.md](../CLAUDE.md) - 프로젝트 가이드
- [Strands Agents SDK](https://strandsagents.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
