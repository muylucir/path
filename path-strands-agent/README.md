# PATH Strands Agent Backend

FastAPI + Strands Agents SDK 기반 P.A.T.H Agent Designer Backend

## 개요

P.A.T.H Agent Designer의 **Backend 서버**로, Strands Agents SDK를 사용하여 AI Agent 아이디어 분석 및 명세서 생성을 담당합니다.

**주요 역할**:
- Step 2: 준비도 점검 (FeasibilityAgent)
- Step 3: 패턴 분석 (PatternAnalyzerAgent)
- Step 4: 4단계 명세서 생성 파이프라인 (MultiStageSpecAgent)
- Server-Sent Events (SSE) 스트리밍
- API Key 인증 및 Rate Limiting

## 기술 스택

| 항목 | 기술 |
|------|------|
| **Python** | 3.11+ |
| **Framework** | FastAPI |
| **LLM SDK** | Strands Agents SDK (strands-agents, strands-agents-tools) |
| **LLM** | AWS Bedrock Claude Opus 4.5 (global.anthropic.claude-opus-4-5-20251101-v1:0) |
| **Rate Limiting** | SlowAPI |
| **Port** | 8001 |

## 아키텍처

### P.A.T.H 단계별 Agent

```
Step 2: 준비도 점검
├── FeasibilityAgent          # 5개 항목 Feasibility 평가 (SSE)
└── FeasibilityAgent.reevaluate()  # 개선 방안 반영 재평가 (JSON)

Step 3: 패턴 분석
├── PatternAnalyzerAgent.analyze_stream()  # 초기 패턴 분석 (SSE)
├── PatternAnalyzerAgent.chat_stream()     # 대화형 분석 (SSE)
└── PatternAnalyzerAgent.finalize()        # 최종 분석 (JSON)

Step 4: 명세서 생성
└── MultiStageSpecAgent (4단계 파이프라인)
    ├── DesignAgent (0-40%)      # Agent 설계 패턴
    ├── DiagramAgent (40-70%)    # Mermaid/ASCII 다이어그램
    ├── DetailAgent (70-95%)     # 프롬프트 & 도구 정의
    └── AssemblerAgent (95-100%) # 최종 Markdown 조립
```

### Skill System

```
skills/
├── universal-agent-patterns/  # 프레임워크 독립적 Agent 패턴 가이드
├── mermaid-diagrams/          # Mermaid 다이어그램 템플릿
├── ascii-diagram/             # ASCII 다이어그램 템플릿
├── prompt-engineering/        # 프롬프트 설계 가이드
├── tool-schema/               # 도구 정의 가이드
└── feasibility-evaluation/    # Feasibility 평가 기준
```

## 설치

### 1. Python 가상환경 생성

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

**requirements.txt 내용**:
```
strands-agents
strands-agents-tools
boto3
fastapi
uvicorn
pyyaml
strictyaml
httpx
aiohttp
slowapi
```

### 3. AWS 자격증명 설정

```bash
aws configure
# 또는 환경변수 설정
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=ap-northeast-2
```

### 4. API Key 설정 (선택)

```bash
export PATH_API_KEY=your-api-key
```

## 실행

### FastAPI 서버 시작

```bash
python api_server.py
```

서버가 **http://localhost:8001**에서 실행됩니다.

**출력 예시**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### 헬스체크

```bash
curl http://localhost:8001/health
# {"status":"ok"}
```

## 프로젝트 구조

```
path-strands-agent/
├── api_server.py              # FastAPI 엔트리포인트 (모든 엔드포인트, Rate Limiting, Auth)
├── chat_agent.py              # Agent 정의
│                              # - FeasibilityAgent (Step 2)
│                              # - PatternAnalyzerAgent (Step 3)
│                              # - AnalyzerAgent, ChatAgent, EvaluatorAgent (Legacy)
├── multi_stage_spec_agent.py  # MultiStageSpecAgent (4단계 파이프라인)
│                              # - DesignAgent, DiagramAgent, DetailAgent, AssemblerAgent
├── prompts.py                 # 시스템 프롬프트 및 템플릿
├── strands_utils.py           # Strands Agent 유틸리티 함수
├── auth.py                    # API Key 인증 미들웨어
├── rate_limiter.py            # SlowAPI Rate Limiting 설정
├── validators.py              # 입력 검증 및 새니타이징
├── session_manager.py         # SecureSessionManager (세션 관리)
├── session_cleanup.py         # 세션 자동 정리 스케줄러
├── agentskills/               # Skill 로딩 라이브러리
│   ├── __init__.py            # discover_skills, generate_skills_prompt
│   ├── discovery.py           # Skill 검색
│   ├── loader.py              # Skill 로드
│   └── skill_utils.py         # Skill 유틸리티
├── skills/                    # Agent Skill 디렉토리
│   ├── universal-agent-patterns/  # 프레임워크 독립적 패턴
│   │   ├── SKILL.md
│   │   └── references/
│   ├── mermaid-diagrams/          # Mermaid 다이어그램
│   │   ├── SKILL.md
│   │   └── references/
│   ├── ascii-diagram/             # ASCII 다이어그램
│   │   ├── SKILL.md
│   │   └── references/
│   ├── prompt-engineering/        # 프롬프트 설계
│   │   ├── SKILL.md
│   │   └── references/
│   ├── tool-schema/               # 도구 정의
│   │   ├── SKILL.md
│   │   └── references/
│   └── feasibility-evaluation/    # Feasibility 평가
│       ├── SKILL.md
│       └── references/
├── requirements.txt           # Python 의존성
└── README.md                  # 이 파일
```

## Agent 구성

### Step 2: FeasibilityAgent (chat_agent.py)

5가지 기준으로 준비도를 평가합니다:

| 항목 | 한글명 | 평가 기준 |
|-----|--------|----------|
| `data_access` | 데이터 접근성 | API 존재 여부, 인증 방식, 데이터 형식 |
| `decision_clarity` | 판단 명확성 | 규칙화 가능 여부, 예시 데이터 존재 |
| `error_tolerance` | 오류 허용도 | 검토 프로세스, 롤백 가능 여부, 리스크 |
| `latency` | 지연 요구사항 | 실시간 필요 여부, SLA |
| `integration` | 통합 복잡도 | 연동 시스템 수, API 표준화 |

**메서드**:
- `evaluate_stream(form_data)`: 초기 평가 (SSE 스트리밍)
- `reevaluate(form_data, previous, improvements)`: 개선 방안 반영 재평가 (JSON)

### Step 3: PatternAnalyzerAgent (chat_agent.py)

Feasibility 평가 결과를 바탕으로 Agent 패턴을 분석합니다.

**메서드**:
- `analyze_stream(form_data, feasibility, improvements)`: 초기 패턴 분석 (SSE)
- `chat_stream(user_message)`: 대화형 분석 (SSE)
- `finalize(form_data, feasibility, conversation, improvements)`: 최종 분석 (JSON)

**출력 필드**:
- `pattern`: 추천 패턴 (ReAct, Reflection, Tool Use, Planning, Multi-Agent 등)
- `recommended_architecture`: 권장 아키텍처 (single-agent / multi-agent)
- `multi_agent_pattern`: 멀티 에이전트 협업 패턴 (agents-as-tools, swarm, graph, workflow)
- `improved_feasibility`: 개선 방안 반영 점수

### Step 4: MultiStageSpecAgent (multi_stage_spec_agent.py)

4단계 파이프라인으로 프레임워크 독립적 명세서를 생성합니다.

| 단계 | Agent | 진행률 | Skill | 역할 |
|------|-------|--------|-------|------|
| 1 | DesignAgent | 0-40% | universal-agent-patterns | Agent 설계 패턴 분석 |
| 2 | DiagramAgent | 40-70% | mermaid-diagrams, ascii-diagram | 다이어그램 생성 |
| 3 | DetailAgent | 70-95% | prompt-engineering, tool-schema | 프롬프트 & 도구 정의 |
| 4 | AssemblerAgent | 95-100% | - | 최종 Markdown 조립 (LLM 미사용) |

### Legacy Agents (chat_agent.py)

이전 버전 호환을 위한 Agent들:
- `AnalyzerAgent`: 초기 분석 (deprecated)
- `ChatAgent`: 대화형 분석 (deprecated)
- `EvaluatorAgent`: 최종 평가 (deprecated)

## API 엔드포인트

### Step 2: 준비도 점검

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/feasibility` | POST | 초기 Feasibility 평가 | SSE |
| `/feasibility/update` | POST | 개선 방안 반영 재평가 | JSON |

### Step 3: 패턴 분석

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/pattern/analyze` | POST | 초기 패턴 분석 | SSE |
| `/pattern/chat` | POST | 대화형 분석 | SSE |
| `/pattern/finalize` | POST | 최종 분석 | JSON |

### Step 4: 명세서

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/spec` | POST | 명세서 생성 (4단계) | SSE + 진행률 |

### Legacy (deprecated)

| 엔드포인트 | 메서드 | 설명 | 응답 |
|----------|--------|------|------|
| `/analyze` | POST | Legacy 초기 분석 | SSE |
| `/chat` | POST | Legacy 대화 | SSE |
| `/finalize` | POST | Legacy 최종 평가 | JSON |

### System

| 엔드포인트 | 메서드 | 설명 |
|----------|--------|------|
| `/health` | GET | 헬스체크 (인증 불필요) |

## Request/Response 예시

### POST /feasibility

**Request**:
```json
{
  "painPoint": "고객 이메일 답변에 하루 2시간 소요",
  "inputType": "Event-Driven (이벤트 발생 시)",
  "processSteps": ["검색, API 조회, 문서 읽기 (정보 수집)", "문서, 코드, 응답 작성 (생성/작성)"],
  "outputTypes": ["답변, 요약, 설명 (텍스트 응답)"],
  "humanLoop": "실행 전 승인 필요 (Review)",
  "errorTolerance": "사람이 검토 후 실행"
}
```

**Response (SSE)**:
```
data: {"feasibility_breakdown": {"data_access": {"score": 7, "reason": "..."}, ...}}

data: [DONE]
```

### POST /pattern/finalize

**Response (JSON)**:
```json
{
  "pain_point": "고객 이메일 답변 자동화",
  "pattern": "ReAct",
  "pattern_reason": "...",
  "recommended_architecture": "single-agent",
  "multi_agent_pattern": null,
  "feasibility_score": 35,
  "feasibility_breakdown": {
    "data_access": 7,
    "decision_clarity": 7,
    "error_tolerance": 7,
    "latency": 7,
    "integration": 7
  },
  "improved_feasibility": {
    "score": 42,
    "score_change": 7,
    "breakdown": {
      "data_access": {
        "original_score": 7,
        "improved_score": 9,
        "improvement_reason": "S3 연동으로 데이터 접근성 향상"
      }
    },
    "summary": "개선 방안 적용 시 7점 상승 예상"
  },
  "recommendation": "✅ 즉시 진행",
  "risks": ["..."],
  "next_steps": ["..."]
}
```

### POST /spec

**Request**:
```json
{
  "analysis": { "pain_point": "...", "pattern": "ReAct", ... },
  "improvement_plans": { "data_access": "S3 연동 예정" },
  "chat_history": [{ "role": "user", "content": "..." }],
  "additional_context": { "sources": "...", "context": "..." }
}
```

**Response (SSE)**:
```
data: {"progress": 10, "stage": "design"}

data: {"text": "## 2. Agent Design Pattern\n\n..."}

data: {"progress": 45, "stage": "diagram"}

data: {"text": "```mermaid\ngraph TD\n..."}

data: [DONE]
```

## Skill System

### Skill 구조

```
skills/<skill-name>/
├── SKILL.md        # 메인 스킬 문서
└── references/     # 참조 문서들
```

### Skill 로딩

```python
from agentskills import discover_skills, generate_skills_prompt

# 모든 스킬 검색
skills = discover_skills("./skills")

# 스킬 프롬프트 생성
skill_prompt = generate_skills_prompt(skills)
```

### 사용 가능한 Skill

| Skill | 용도 | 사용 Agent |
|-------|------|-----------|
| `universal-agent-patterns` | 프레임워크 독립적 Agent 패턴 | DesignAgent |
| `mermaid-diagrams` | Mermaid 다이어그램 문법 | DiagramAgent |
| `ascii-diagram` | ASCII 다이어그램 템플릿 | DiagramAgent |
| `prompt-engineering` | 프롬프트 설계 가이드 | DetailAgent |
| `tool-schema` | 도구 정의 스키마 | DetailAgent |
| `feasibility-evaluation` | Feasibility 평가 기준 | FeasibilityAgent |

## 보안

### API Key 인증

`auth.py`에서 API Key 인증 미들웨어 설정:
- `PATH_API_KEY` 환경변수로 API Key 설정
- `/health` 엔드포인트는 인증 불필요 (PUBLIC_ENDPOINTS)

### Rate Limiting

`rate_limiter.py`에서 SlowAPI 기반 Rate Limiting:
```python
RATE_LIMITS = {
    "analyze": "10/minute",
    "chat": "30/minute",
    "finalize": "10/minute",
    "spec": "5/minute",
    "feasibility": "10/minute",
    "feasibility_update": "10/minute",
    "pattern_analyze": "10/minute",
    "pattern_chat": "30/minute",
    "pattern_finalize": "10/minute",
}
```

### 입력 검증

`validators.py`에서 입력 새니타이징:
- `sanitize_input()`: XSS, SQL Injection 방지
- `validate_conversation()`: 대화 히스토리 검증
- 길이 제한: `MAX_PAIN_POINT_LENGTH`, `MAX_CONTEXT_LENGTH` 등

### 세션 관리

`session_manager.py`의 `SecureSessionManager`:
- 메모리 내 세션 저장
- 세션 타임아웃 관리
- `session_cleanup.py`로 자동 정리 스케줄

## 개발 노트

### CORS 설정

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3009", "https://d21k0iabhuk0yx.cloudfront.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Agent 싱글톤

모든 Agent는 모듈 레벨에서 생성되어 요청 간 재사용:
```python
analyzer_agent = AnalyzerAgent()
multi_stage_spec_agent = MultiStageSpecAgent()
feasibility_agent = FeasibilityAgent()
```

### SSE 스트리밍 패턴

```python
from fastapi.responses import StreamingResponse

async def generate():
    async for chunk in agent.stream_async(prompt):
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"

return StreamingResponse(
    generate(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
)
```

### Lifespan 이벤트

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시: 세션 정리 스케줄러 시작
    scheduler = get_cleanup_scheduler()
    scheduler.register_manager(chat_sessions)
    scheduler.register_manager(pattern_sessions)
    await scheduler.start()

    yield

    # 종료 시: 스케줄러 정지
    await scheduler.stop()
```

## 테스트

### 헬스체크

```bash
curl http://localhost:8001/health
```

### Feasibility 평가

```bash
curl -X POST http://localhost:8001/feasibility \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "painPoint": "고객 이메일 답변에 하루 2시간 소요",
    "inputType": "Event-Driven (이벤트 발생 시)",
    "processSteps": ["검색, API 조회, 문서 읽기 (정보 수집)"],
    "outputTypes": ["답변, 요약, 설명 (텍스트 응답)"],
    "humanLoop": "실행 전 승인 필요 (Review)",
    "errorTolerance": "사람이 검토 후 실행"
  }'
```

### 명세서 생성

```bash
curl -X POST http://localhost:8001/spec \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "analysis": {
      "pain_point": "고객 이메일 답변 자동화",
      "pattern": "ReAct",
      "feasibility_score": 42
    }
  }'
```

## 참고

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 가이드
- [Strands Agents SDK](https://strandsagents.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
- [SlowAPI Documentation](https://slowapi.readthedocs.io/)
