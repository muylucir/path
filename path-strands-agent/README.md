# PATH Strands Agent Backend

FastAPI + Strands Agents SDK 기반 P.A.T.H Agent Designer Backend

## 개요

P.A.T.H Agent Designer의 **Backend 서버**로, Strands Agents SDK를 사용하여 AI Agent 아이디어 분석 및 명세서 생성을 담당합니다.

**주요 역할**:
- 대화형 분석 (AnalyzerAgent, ChatAgent, EvaluatorAgent)
- 4단계 명세서 생성 파이프라인 (MultiStageSpecAgent)
- Skill Tool System 기반 베스트 프랙티스 자동 반영
- Server-Sent Events (SSE) 스트리밍

## 기술 스택

- **Python**: 3.11+
- **Framework**: FastAPI
- **LLM SDK**: Strands Agents SDK 1.20.0+
- **LLM**: AWS Bedrock Claude Sonnet 4.5, Haiku 4.5
- **Skill System**: @tool decorator 기반 동적 스킬 로딩
- **Port**: 8001

## 아키텍처

### Skill Tool System

```
skills/
├── strands-agent-patterns/    # Strands Agent 패턴 가이드
├── agentcore-services/         # AgentCore 서비스 베스트 프랙티스
└── mermaid-diagrams/           # Mermaid 다이어그램 템플릿

skill_tool.py                   # @tool decorator 기반 스킬 로더
strands_utils.py                # Strands SDK 호환 Agent 생성 유틸
```

### Multi-Stage Spec Agent Pipeline

```
PatternAgent (strands-agent-patterns 스킬)
    ↓
AgentCoreAgent (agentcore-services 스킬)
    ↓
ArchitectureAgent (mermaid-diagrams 스킬)
    ↓
AssemblerAgent (최종 조합)
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

### 3. AWS 자격증명 설정

```bash
aws configure
# 또는 환경변수 설정
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=ap-northeast-2
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
├── api_server.py              # FastAPI 엔트리포인트
├── chat_agent.py              # AnalyzerAgent, ChatAgent, EvaluatorAgent
├── multi_stage_spec_agent.py  # MultiStageSpecAgent (4단계 파이프라인)
├── prompts.py                 # 프롬프트 템플릿
├── skill_tool.py              # Skill Tool 로더
├── requirements.txt           # Python 의존성
├── skills/                    # Skill 디렉토리
│   ├── __init__.py
│   ├── discovery.py           # Skill 검색
│   ├── loader.py              # Skill 로드
│   ├── skill_utils.py         # Skill 유틸리티
│   ├── strands-agent-patterns/  # Strands Agent 패턴 가이드
│   │   └── SKILL.md
│   ├── agentcore-services/      # AgentCore 서비스 베스트 프랙티스
│   │   └── SKILL.md
│   └── mermaid-diagrams/        # Mermaid 다이어그램 템플릿
│       └── SKILL.md
├── venv/                      # Python 가상환경
└── README.md                  # 이 파일
```

## Agent 구성

### 1. 대화형 분석 Agent (chat_agent.py)

#### AnalyzerAgent
- **역할**: 초기 분석 수행
- **입력**: Pain Point, INPUT, PROCESS, OUTPUT, Human-in-Loop
- **출력**: 초기 분석 결과 (스트리밍)
- **모델**: Claude Sonnet 4.5

#### ChatAgent
- **역할**: 세션 기반 멀티턴 대화 (최대 3턴)
- **입력**: 사용자 메시지 + 대화 히스토리
- **출력**: 추가 질문 및 답변 (스트리밍)
- **모델**: Claude Sonnet 4.5

#### EvaluatorAgent
- **역할**: 최종 Feasibility 평가 (50점 만점)
- **입력**: 대화 히스토리 + 컨텍스트
- **출력**: JSON (feasibility_score, breakdown, recommendation, risks, next_steps)
- **모델**: Claude Sonnet 4.5

### 2. 명세서 생성 Agent (multi_stage_spec_agent.py)

#### MultiStageSpecAgent
- **역할**: 4단계 파이프라인으로 Strands Agent 구현 명세서 생성
- **파이프라인**:
  1. **PatternAgent (0-25%)**: Strands Agent 패턴 분석
     - Skill: `strands-agent-patterns`
     - 출력: Agent Components, Invocation State (TypedDict)
  2. **AgentCoreAgent (25-50%, 조건부)**: AgentCore 서비스 구성
     - Skill: `agentcore-services`
     - 핵심 원칙: 1개 Runtime으로 Multi-Agent Graph 호스팅
     - 조건: useAgentCore=true
  3. **ArchitectureAgent (50-75%)**: Mermaid 다이어그램 생성
     - Skill: `mermaid-diagrams`
     - 출력: Graph Structure, Sequence Diagram, Architecture Flowchart
  4. **AssemblerAgent (75-100%)**: 최종 Markdown 조합
     - 출력: 실시간 스트리밍 (100자 단위 청크)
- **모델**: Claude Sonnet 4.5 (PatternAgent, ArchitectureAgent, AssemblerAgent), Haiku 4.5 (AgentCoreAgent)

## API 엔드포인트

### POST /analyze
- **설명**: 초기 분석 수행 (AnalyzerAgent)
- **입력**: `{ pain_point, input_type, process_steps, output_type, human_loop, ... }`
- **출력**: SSE 스트리밍 (`data: {"text": "..."}\n\n`)
- **종료**: `data: [DONE]\n\n`

### POST /chat
- **설명**: 대화 수행 (ChatAgent)
- **입력**: `{ session_id, user_message, chat_history }`
- **출력**: SSE 스트리밍
- **세션**: 메모리 내 저장 (chat_sessions dict)

### POST /finalize
- **설명**: 최종 평가 (EvaluatorAgent)
- **입력**: `{ pain_point, ..., chat_history }`
- **출력**: JSON
  ```json
  {
    "pattern": "Planning + Multi-Agent",
    "pattern_reason": "...",
    "feasibility_breakdown": {
      "data_access": 9,
      "decision_clarity": 8,
      "error_tolerance": 7,
      "latency": 10,
      "integration": 8
    },
    "feasibility_score": 42,
    "recommendation": "✅ 즉시 프로토타입 시작",
    "risks": ["..."],
    "next_steps": ["..."]
  }
  ```

### POST /spec
- **설명**: 명세서 생성 (MultiStageSpecAgent)
- **입력**: `{ pain_point, pattern, use_agentcore, ... }`
- **출력**: SSE 스트리밍
  - 진행률: `data: {"progress": 25, "text": "..."}\n\n`
  - 텍스트 청크: `data: {"text": "..."}\n\n`
  - 종료: `data: [DONE]\n\n`

### GET /health
- **설명**: 헬스체크
- **출력**: `{"status": "ok"}`

## Skill Tool System

### 1. strands-agent-patterns
- **파일**: `skills/strands-agent-patterns/SKILL.md`
- **내용**:
  - Strands Agent 4가지 패턴 (Reflection, Tool Use, Planning, Multi-Agent)
  - Graph 구조 설계 가이드
  - 조건부 라우팅 (conditional_edges)
  - Agent-as-Tool 활용법
- **사용처**: PatternAgent

### 2. agentcore-services
- **파일**: `skills/agentcore-services/SKILL.md`
- **내용**:
  - AgentCore 서비스 6가지 (Runtime, Memory, Gateway, Identity, Browser, Code Interpreter)
  - **핵심 원칙**: 1개 Runtime으로 전체 Multi-Agent Graph 호스팅
  - 각 서비스 사용 시나리오
- **사용처**: AgentCoreAgent

### 3. mermaid-diagrams
- **파일**: `skills/mermaid-diagrams/SKILL.md`
- **내용**:
  - Graph Structure (subgraph, classDef, linkStyle)
  - Sequence Diagram (activate/deactivate, alt/loop 블록 처리)
  - Architecture Flowchart
  - 일반적인 오류 방지 가이드
- **사용처**: ArchitectureAgent

## 개발 노트

### CORS 설정
`api_server.py`에서 Frontend 도메인 허용:
```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3009",
    "https://your-frontend.vercel.app"
]
```

### Agent 싱글톤
모든 Agent는 모듈 레벨에서 싱글톤으로 생성되어 요청 간 재사용됩니다:
```python
analyzer_agent = create_analyzer_agent()
chat_agent = create_chat_agent()
# ... 요청마다 동일한 인스턴스 사용
```

### Skill Tool 로딩
`skill_tool.load_skill(skill_name)` 함수로 Skill 내용 로드:
```python
from skill_tool import load_skill

skill_content = load_skill("strands-agent-patterns")
# skills/strands-agent-patterns/SKILL.md 내용 반환
```

### SSE 스트리밍 패턴
```python
from fastapi.responses import StreamingResponse

async def generate():
    async for chunk in agent.stream_async(prompt):
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"

return StreamingResponse(generate(), media_type="text/event-stream")
```

## 테스트

### 1. 초기 분석 테스트

```bash
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "pain_point": "고객 이메일 답변에 하루 2시간 소요",
    "input_type": "Event-Driven",
    "process_steps": ["데이터 수집", "분석/분류", "콘텐츠 생성"],
    "output_type": "Content",
    "human_loop": "Exception"
  }'
```

### 2. 명세서 생성 테스트

```bash
curl -X POST http://localhost:8001/spec \
  -H "Content-Type: application/json" \
  -d '{
    "pain_point": "고객 이메일 답변 자동화",
    "pattern": "Planning + Multi-Agent",
    "use_agentcore": true,
    "feasibility_score": 42
  }'
```

## 라이선스

MIT

## 참고

- [Strands Agents SDK](https://strandsagents.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
