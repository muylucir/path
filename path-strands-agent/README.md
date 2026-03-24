# PATH Strands Agent Backend

Strands Agents SDK + Bedrock AgentCore Runtime 기반 P.A.T.H Agent Designer Backend

## 개요

P.A.T.H Agent Designer의 **Backend**로, Strands Agents SDK를 사용하여 AI Agent 아이디어 분석 및 명세서 생성을 담당합니다. **Bedrock AgentCore Runtime**에 서버리스로 배포되며, 단일 엔트리포인트에서 7개 액션을 dispatch합니다.

**주요 역할**:
- Step 2: 준비도 점검 (FeasibilityAgent)
- Step 3: 패턴 분석 (PatternAnalyzerAgent)
- Step 4: 명세서 생성 파이프라인 (MultiStageSpecAgent — 5개 서브 에이전트 병렬 실행)
- AgentCore Runtime 기반 서버리스 실행

## 기술 스택

| 항목 | 기술 |
|------|------|
| **Python** | 3.11+ |
| **Runtime** | AWS Bedrock AgentCore Runtime (서버리스) |
| **LLM SDK** | Strands Agents SDK (strands-agents >= 1.26.0, strands-agents-tools) |
| **LLM** | AWS Bedrock Claude Opus 4.6 (`global.anthropic.claude-opus-4-6-v1`) |
| **Entrypoint** | `BedrockAgentCoreApp` (bedrock-agentcore 패키지) |
| **Observability** | OpenTelemetry (strands-agents[otel], aws-opentelemetry-distro) |
| **Prompt Caching** | Bedrock Automatic Cache Strategy (`CacheConfig(strategy="auto")`) |

## 아키텍처

### 요청 흐름

```
Next.js API Route
  → @aws-sdk/client-bedrock-agentcore (InvokeAgentRuntimeCommand)
  → AgentCore Runtime (agentcore_entrypoint.py)
  → payload.type으로 액션 분기
  → Strands Agent 실행
  → yield 기반 SSE 스트리밍 / JSON 응답
```

### 액션 디스패치 (agentcore_entrypoint.py)

| Action Type | Agent | 응답 방식 | 설명 |
|-------------|-------|----------|------|
| `ping` | - | JSON (single yield) | 헬스 체크 |
| `feasibility` | FeasibilityAgent | SSE 스트리밍 | 초기 Feasibility 평가 |
| `feasibility_update` | FeasibilityAgent | SSE 스트리밍 | 개선 방안 반영 재평가 |
| `pattern_analyze` | PatternAnalyzerAgent | SSE 스트리밍 | 초기 패턴 분석 |
| `pattern_chat` | PatternAnalyzerAgent | SSE 스트리밍 | 대화형 분석 |
| `pattern_finalize` | PatternAnalyzerAgent | JSON (single yield) | 최종 분석 |
| `spec` | MultiStageSpecAgent | SSE 스트리밍 | 명세서 생성 (5개 서브 에이전트) |

### 세션 관리

- `PatternAnalyzerAgent` 인스턴스는 모듈 레벨 dict에 캐시
- AgentCore의 `runtimeSessionId`로 동일 컨테이너 라우팅
- 대화 히스토리 복원을 위한 stateless fallback 지원

### Skill System

```
skills/
├── agent-patterns/            # 3계층 Agent 설계 패턴 (Agent Pattern × LLM Workflow × Agentic Workflow)
├── ascii-diagram/             # ASCII 다이어그램 템플릿
├── feasibility-evaluation/    # Feasibility 평가 기준
├── mermaid-diagrams/          # Mermaid 다이어그램 템플릿
├── prompt-engineering/        # 프롬프트 설계 가이드
└── tool-schema/               # 도구 정의 가이드
```

## 설치

### 1. Python 가상환경 생성

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

**주요 의존성**:
```
bedrock-agentcore
strands-agents>=1.26.0
strands-agents-tools
pydantic>=2.0.0
boto3
pyyaml
strictyaml
strands-agents[otel]>=0.1.0
aws-opentelemetry-distro
```

### 3. AWS 자격증명 설정

```bash
aws configure
# 또는 환경변수 설정
export AWS_DEFAULT_REGION=ap-northeast-2
```

### 4. 환경변수 설정

```bash
# .env 파일
AWS_DEFAULT_REGION=ap-northeast-2
BEDROCK_MODEL_ID=global.anthropic.claude-opus-4-6-v1  # 선택 (기본값 동일)
```

## 배포

### AgentCore Runtime 배포

Backend는 더 이상 독립 서버가 아니며, **Bedrock AgentCore Runtime**에 서버리스로 배포됩니다.

#### 1. 배포 패키지 빌드

```bash
bash build-agent.sh
```

이 스크립트가 수행하는 작업:
1. ARM64 종속성을 `deployment_package/`에 설치
2. 핵심 Python 파일 및 agentskills/, skills/ 디렉토리 복사
3. `deployment_package.zip` 생성

#### 2. CDK 배포

```bash
cd ../infra && npx cdk deploy
```

### 로컬 실행

AgentCore Runtime은 로컬에서도 실행 가능:

```bash
python agentcore_entrypoint.py
```

## 프로젝트 구조

```
path-strands-agent/
├── agentcore_entrypoint.py       # AgentCore Runtime 엔트리포인트
│                                 # - BedrockAgentCoreApp 기반 디스패처
│                                 # - 7개 액션 (ping, feasibility, ...)
├── chat_agent.py                 # Agent 정의
│                                 # - FeasibilityAgent (Step 2)
│                                 # - PatternAnalyzerAgent (Step 3)
├── schemas.py                    # Pydantic 출력 모델 (FeasibilityEvaluation, PatternAnalysis)
├── multi_stage_spec_agent.py     # MultiStageSpecAgent (5개 서브 에이전트)
│                                 # - DesignAgent, DiagramAgent, PromptAgent, ToolAgent, AssemblerAgent
│                                 # - MermaidValidator (다이어그램 문법 검증)
├── prompts.py                    # 시스템 프롬프트 및 템플릿
├── strands_utils.py              # Strands Agent 유틸리티 함수
│                                 # - BedrockModel 생성 (prompt caching 포함)
│                                 # - Skill 프롬프트 캐싱
├── safe_tools.py                 # 안전한 도구 정의 (skills/ 디렉토리만 접근 허용)
├── token_tracker.py              # 토큰 사용량 추적 및 비용 추산
├── build-agent.sh                # ARM64 배포 패키지 빌더
├── .env                          # 환경변수 (AWS_DEFAULT_REGION, BEDROCK_MODEL_ID)
├── agentskills/                  # Skill 로딩 라이브러리
│   ├── __init__.py
│   ├── agent_model.py            # Agent 모델 설정
│   ├── discovery.py              # Skill 검색
│   ├── errors.py                 # 에러 정의
│   ├── models.py                 # 데이터 모델
│   ├── parser.py                 # Skill 파싱
│   ├── prompt.py                 # Skill 프롬프트 생성
│   ├── validator.py              # Skill 검증
│   ├── tool_utils.py             # 도구 유틸리티
│   └── tool/                     # Skill-as-Tool 지원
│       ├── __init__.py
│       ├── agent_skill.py
│       └── skill.py
├── skills/                       # Agent Skill 디렉토리
│   ├── agent-patterns/           # 3계층 Agent 설계 패턴
│   ├── ascii-diagram/            # ASCII 다이어그램
│   ├── feasibility-evaluation/   # Feasibility 평가
│   ├── mermaid-diagrams/         # Mermaid 다이어그램
│   ├── prompt-engineering/       # 프롬프트 설계
│   └── tool-schema/              # 도구 정의
├── requirements.txt              # Python 의존성
└── README.md                     # 이 파일
```

## Agent 구성

### Step 2: FeasibilityAgent (chat_agent.py)

5가지 기준으로 준비도를 평가하고, 별도 축으로 자율성 요구도를 측정합니다:

**준비도 항목 (총 50점)**:

| 항목 | 한글명 | 평가 기준 |
|-----|--------|----------|
| `data_access` | 데이터 접근성 | API 존재 여부, 인증 방식, 데이터 형식 |
| `decision_clarity` | 판단 명확성 | 규칙화 가능 여부, 예시 데이터 존재 |
| `error_tolerance` | 오류 허용도 | 검토 프로세스, 롤백 가능 여부, 리스크 |
| `latency` | 지연 요구사항 | 실시간 필요 여부, SLA |
| `integration` | 통합 복잡도 | MCP/SDK 존재 여부, API 문서화 수준, 인터페이스 표준화 |

**별도 평가 축**:

| 항목 | 한글명 | 평가 기준 |
|-----|--------|----------|
| `autonomy_requirement` | 자율성 요구도 (0-10) | 업무의 자율적 판단 필요 정도. 자동화 수준 판단(AI-Assisted Workflow / Agentic AI) 기준으로 활용 |

**메서드**:
- `evaluate_stream(form_data)`: 초기 평가 (async generator, SSE 스트리밍 + progress)
- `reevaluate_stream(form_data, previous, improvements)`: 개선 방안 반영 재평가 (async generator, SSE 스트리밍 + progress)

### Step 3: PatternAnalyzerAgent (chat_agent.py)

Feasibility 평가 결과를 바탕으로 Agent 패턴을 분석합니다.

**메서드**:
- `analyze_stream(form_data, feasibility, improvements)`: 초기 패턴 분석 (SSE)
- `chat_stream(user_message, stateful)`: 대화형 분석 (SSE)
- `finalize(form_data, feasibility, improvements, stateful)`: 최종 분석 (JSON)

**출력 필드**:
- `pattern`: 추천 패턴 (ReAct, Reflection, Tool Use, Planning, Multi-Agent, Human-in-the-Loop 등)
- `recommended_architecture`: 권장 아키텍처 (single-agent / multi-agent)
- `multi_agent_pattern`: 멀티 에이전트 협업 패턴 (agents-as-tools, swarm, graph, workflow)
- `automation_level`: 자동화 수준 (ai-assisted-workflow / agentic-ai)
- `automation_level_reason`: 자동화 수준 판단 근거
- `updated_autonomy`: 대화를 통해 재판단된 자율성 요구도 (score, reason)
- `improved_feasibility`: 개선 방안 반영 점수

### Step 4: MultiStageSpecAgent (multi_stage_spec_agent.py)

5개 서브 에이전트를 통해 프레임워크 독립적 명세서를 생성합니다. DiagramAgent, PromptAgent, ToolAgent는 병렬 실행됩니다.

| 단계 | Agent | 진행률 | Skill | 역할 |
|------|-------|--------|-------|------|
| 1 | DesignAgent | 0-40% | agent-patterns | Agent 설계 패턴 분석 |
| 2a | DiagramAgent | 40-95% (병렬) | mermaid-diagrams, ascii-diagram | 다이어그램 생성 + MermaidValidator 검증 |
| 2b | PromptAgent | 40-95% (병렬) | prompt-engineering | Agent 프롬프트 설계 |
| 2c | ToolAgent | 40-95% (병렬) | tool-schema | 도구 정의 |
| 3 | AssemblerAgent | 95-100% | - | 최종 Markdown 조립 (LLM 미사용) |

> PromptAgent는 DesignAgent 결과에서 3개 이상의 Agent가 감지되면 **Scatter-Gather 패턴**으로 Agent별 프롬프트를 병렬 생성합니다 (ThreadPoolExecutor, 최대 6 워커).

**MermaidValidator**: DiagramAgent가 생성한 Mermaid 다이어그램의 문법을 검증합니다. 검증 항목:
- 다이어그램 타입 선언 확인
- 괄호 짝 검사
- 노드 텍스트 내 특수문자 이스케이프 검사
- Sequence Diagram activate/deactivate 쌍 검증 (명시적 + 인라인 +/- 문법)
- 검증 실패 시 1회 자동 재생성

## Payload 예시

### feasibility

```json
{
  "type": "feasibility",
  "formData": {
    "painPoint": "고객 이메일 답변에 하루 2시간 소요",
    "inputType": "Event-Driven (이벤트 발생 시)",
    "processSteps": ["검색, API 조회, 문서 읽기 (정보 수집)"],
    "outputTypes": ["답변, 요약, 설명 (텍스트 응답)"],
    "humanLoop": "실행 전 승인 필요 (Review)",
    "errorTolerance": "사람이 검토 후 실행"
  }
}
```

### pattern_finalize

```json
{
  "type": "pattern_finalize",
  "formData": { ... },
  "feasibility": { ... },
  "conversation": [{ "role": "user", "content": "..." }],
  "improvementPlans": { "data_access": "S3 연동 예정" }
}
```

### spec

```json
{
  "type": "spec",
  "analysis": { "pain_point": "...", "pattern": "ReAct", ... },
  "improvement_plans": { "data_access": "S3 연동 예정" },
  "chat_history": [{ "role": "user", "content": "..." }],
  "additional_context": { "sources": "...", "context": "..." }
}
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

skills = discover_skills("./skills")
skill_prompt = generate_skills_prompt(skills)
```

### 사용 가능한 Skill

| Skill | 용도 | 사용 Agent |
|-------|------|-----------|
| `agent-patterns` | 3계층 Agent 설계 패턴 가이드 | DesignAgent |
| `mermaid-diagrams` | Mermaid 다이어그램 문법 | DiagramAgent |
| `ascii-diagram` | ASCII 다이어그램 템플릿 | DiagramAgent, PatternAnalyzerAgent (chat) |
| `prompt-engineering` | 프롬프트 설계 가이드 | PromptAgent |
| `tool-schema` | 도구 정의 스키마 | ToolAgent |
| `feasibility-evaluation` | Feasibility 평가 기준 | FeasibilityAgent |

## 개발 노트

### AgentCore 엔트리포인트 패턴

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.entrypoint
async def invoke(payload, context):
    action_type = payload.get("type")
    session_id = getattr(context, "session_id", "")

    if action_type == "feasibility":
        async for event in _handle_feasibility(payload):
            yield event  # SSE 스트리밍
    elif action_type == "pattern_finalize":
        result = await asyncio.to_thread(_run_sync, payload)
        yield result    # JSON 단일 응답

if __name__ == "__main__":
    app.run()
```

### Lazy Import (Cold Start 최적화)

무거운 모듈(strands, boto3 등)은 최초 요청 시 lazy import:
```python
_chat_agent_module = None

def _get_chat_agent_module():
    global _chat_agent_module
    if _chat_agent_module is None:
        import chat_agent as mod
        _chat_agent_module = mod
    return _chat_agent_module
```

AgentCore 초기화 타임아웃(30초) 내에 `app.run()`이 시작되어야 합니다.

### Tool 사용 시 Meta-Commentary 필터링

PatternAnalyzerAgent의 `_stream_filtered()` 헬퍼는 Strands SDK의 `stream_async`를 래핑하여 tool 사용 시 발생하는 meta-commentary(예: "스킬을 읽겠습니다")를 자동으로 필터링합니다. AssemblerAgent의 `_clean_internal_comments()`도 최종 조립 시 잔여 메타 코멘터리를 제거합니다.

### Prompt Caching

`strands_utils.py`에서 `BedrockModel` 생성 시 `CacheConfig(strategy="auto")`를 적용하여 Bedrock 프롬프트 캐싱을 활성화합니다. Skill 프롬프트는 `get_skill_prompt()`에서 모듈 레벨로 캐싱하여 중복 디스크 I/O를 방지합니다.

## 참고

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 가이드
- [Strands Agents SDK](https://strandsagents.com/)
- [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
