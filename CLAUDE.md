# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

P.A.T.H Agent Designer is a web application that validates AI Agent ideas using the **P.A.T.H Framework** (Problem → Agent → Technical → Handoff). It analyzes user input, evaluates feasibility with a 50-point scoring system, and generates Strands Agent implementation specifications.

**Architecture**: Three-tier application
- **Frontend**: Next.js 15 (TypeScript, React 19) on port 3009
- **Backend**: FastAPI (Python) on port 8001
- **LLM**: AWS Bedrock Claude Sonnet 4.5 via Strands Agents SDK

## Common Commands

### Frontend (path-web)
```bash
cd path-web
npm install              # Install dependencies
npm run dev              # Start dev server on port 3009
npm run build            # Production build
npm run lint             # Run ESLint
```

### Backend (path-strands-agent)
```bash
cd path-strands-agent
pip install -r requirements.txt    # Install dependencies
python api_server.py               # Start FastAPI on port 8001
```

### DynamoDB Setup
```bash
aws dynamodb create-table \
  --table-name path-agent-sessions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2
```

## Architecture Deep Dive

### Application Flow

The application follows a 3-step user journey:

**Step 1** (`/` → `Step1Form.tsx`):
- User enters Pain Point and selects:
  - INPUT type (Event-Driven, Scheduled, On-Demand, Streaming, Conditional)
  - PROCESS steps (Data Collection, Analysis, Decision, Content Generation, Validation, Integration)
  - OUTPUT types (Decision, Content, Notification, Action, Insight)
  - Human-in-Loop level (None, Review, Exception, Collaborate)
  - Data Sources (MCP, RAG, API, Database, File, Web Scraping)
  - Error Tolerance
- Form data stored in sessionStorage → redirects to `/analyze`

**Step 2** (`/analyze` → `Step2Analysis.tsx`):
- Fetches form data from sessionStorage
- Calls `/api/bedrock/analyze` (streaming) for initial analysis
- Supports multi-turn conversation via `/api/bedrock/chat` (streaming)
- User clicks "분석 완료" (Analysis Complete) → redirects to `/results`

**Step 3** (`/results` → `Step3Results.tsx`):
- Calls `/api/bedrock/finalize` for feasibility evaluation
- Displays 4 tabs:
  - 📊 상세 분석: Feasibility breakdown
  - 💬 대화 내역: Chat history (MDX-rendered)
  - 📋 명세서: Generate Strands Agent spec via `/api/bedrock/spec`
  - 🚀 다음 단계: Session save to DynamoDB

### Streaming Architecture

All backend communication uses **Server-Sent Events (SSE)**:

**Frontend Pattern** (used in all API routes):
```typescript
const response = await fetch('/api/bedrock/analyze', { method: 'POST', body: JSON.stringify(data) })
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value)
  // Parse "data: {...}\n\n" format
}
```

**Backend Pattern** (FastAPI):
```python
async def generate():
  async for chunk in agent.stream_async(prompt):
    yield f"data: {json.dumps({'text': chunk})}\n\n"
  yield "data: [DONE]\n\n"

return StreamingResponse(generate(), media_type="text/event-stream")
```

### Strands Agent Orchestration

The backend uses 4 specialized Strands Agents:

1. **AnalyzerAgent** (`chat_agent.py`):
   - Initial problem analysis
   - Endpoint: `POST /analyze`
   - Streaming: Yes

2. **ChatAgent** (`chat_agent.py`):
   - Multi-turn conversation with history
   - Endpoint: `POST /chat`
   - Streaming: Yes
   - Session management: Stored in `chat_sessions` dict

3. **EvaluatorAgent** (`chat_agent.py`):
   - Final feasibility scoring (50-point scale)
   - Endpoint: `POST /finalize`
   - Streaming: No (returns JSON)

4. **MultiStageSpecAgent** (`multi_stage_spec_agent.py`):
   - 4-stage pipeline: PatternAgent → AgentCoreAgent → ArchitectureAgent → AssemblerAgent
   - Generates Strands Agent implementation spec
   - Endpoint: `POST /spec`
   - Streaming: Yes

### API Gateway Pattern

Next.js API routes proxy to FastAPI:
- `/app/api/bedrock/analyze/route.ts` → `http://localhost:8001/analyze`
- `/app/api/bedrock/chat/route.ts` → `http://localhost:8001/chat`
- `/app/api/bedrock/finalize/route.ts` → `http://localhost:8001/finalize`
- `/app/api/bedrock/spec/route.ts` → `http://localhost:8001/spec`

All routes pass through SSE streaming unchanged.

### Feasibility Scoring System

5-dimensional evaluation (10 points each, 50 total):

| Criterion | 10 pts | 5 pts | 0 pts |
|-----------|--------|-------|-------|
| Data Access | MCP/API available | Direct DB | Offline only |
| Decision Clarity | Clear rules | Implicit patterns | Unexplainable |
| Error Tolerance | Errors OK | 90%+ accuracy | 100% required |
| Latency | Hours OK | <1 minute | <3 seconds |
| Integration Complexity | Standalone | 3-5 systems | Legacy |

**Decision Matrix**:
- 40-50: ✅ Immediate prototype
- 30-40: ⚠️ Conditional proceed
- 20-30: 🔄 Improve & re-evaluate
- <20: ❌ Explore alternatives

### DynamoDB Schema

**Table**: `path-agent-sessions`

```python
{
  "session_id": "UUID",              # Primary Key
  "timestamp": "ISO8601",            # Sort key
  "pain_point": str,
  "input_type": str,
  "process_steps": List[str],
  "output_type": str,
  "human_loop": str,
  "data_source": str,
  "error_tolerance": str,
  "additional_context": str,
  "pattern": str,
  "pattern_reason": str,
  "feasibility_breakdown": {
    "data_access": 0-10,
    "decision_clarity": 0-10,
    "error_tolerance": 0-10,
    "latency": 0-10,
    "integration": 0-10
  },
  "feasibility_score": 0-50,
  "recommendation": str,
  "risks": List[str],
  "next_steps": List[str],
  "chat_history": List[{"role": "user|assistant", "content": str}],
  "specification": str  # Markdown
}
```

Operations in `/app/api/sessions/route.ts`:
- `POST /api/sessions` - Save session
- `GET /api/sessions` - List sessions (pagination: limit=15)
- `GET /api/sessions/[id]` - Load session
- `DELETE /api/sessions/[id]` - Delete session

## Key Design Patterns

### 1. Skill System Integration

The `strands-skill-system/` provides reusable agent capabilities:
- Skill discovery and loading
- Dynamic skill prompting via `skill_tool`
- Knowledge base integration

Strands Agents invoke skills for domain-specific guidance.

### 2. Multi-Hosting Support

Specification generation supports two deployment models:
- **Self-hosted** (EC2/ECS/EKS): Direct infrastructure management
- **AgentCore**: Serverless managed environment with Runtime, Memory, Gateway, Identity, Browser, Code Interpreter services

Controlled by `useAgentCore` boolean in Step 1 form.

### 3. Strands Agent Patterns

P.A.T.H maps traditional agent patterns to Strands constructs:

| Pattern | Strands Implementation | Use Case |
|---------|----------------------|----------|
| Reflection | Graph with cycles | Code generation → review → improve |
| Tool Use | Agent-as-Tool | Web search, DB queries, calculations |
| Planning | Graph with sequential nodes | Travel planning, report writing |
| Multi-Agent | Graph + Agent-as-Tool | Market research, code review |

## Component Hierarchy

### Frontend Components

**Layout**:
- `components/layout/Header.tsx` - Navigation header
- `components/layout/StepIndicator.tsx` - Progress indicator

**Step Components**:
- `components/steps/Step1Form.tsx` - Input form (react-hook-form + Zod)
- `components/steps/Step2Analysis.tsx` - Streaming analysis UI
- `components/steps/Step3Results.tsx` - Results dashboard with tabs

**Result Sub-components**:
- `DetailedAnalysis.tsx` - Feasibility breakdown display
- `ChatHistory.tsx` - Chat message list
- `Specification.tsx` - Spec generation & download
- `MDXRenderer.tsx` - Markdown/MDX rendering with Mermaid diagrams
- `NextSteps.tsx` - Next actions display
- `Risks.tsx` - Risk summary

### Backend Structure

```
path-strands-agent/
├── api_server.py              # FastAPI entry point (port 8001)
├── chat_agent.py              # AnalyzerAgent, ChatAgent, EvaluatorAgent
├── multi_stage_spec_agent.py  # 4-stage spec generation pipeline
└── requirements.txt
```

## Configuration

### Frontend (.env.local)
```bash
AWS_REGION=ap-northeast-2
STRANDS_API_URL=http://localhost:8001  # Optional override
```

### Backend (api_server.py)
```python
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3009"]
BEDROCK_MODEL = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"
```

### Required AWS Permissions
```json
{
  "bedrock:InvokeModel",
  "bedrock:InvokeModelWithResponseStream",
  "dynamodb:PutItem",
  "dynamodb:GetItem",
  "dynamodb:Scan",
  "dynamodb:DeleteItem"
}
```

## Critical Paths

### Adding a New Agent

1. Create agent class in `path-strands-agent/` extending Strands Agent SDK
2. Add endpoint in `api_server.py` with streaming support
3. Create Next.js API route in `path-web/app/api/bedrock/[name]/route.ts`
4. Add frontend component with SSE streaming logic
5. Update Step indicator if adding new step

### Modifying Feasibility Criteria

1. Update scoring logic in `EvaluatorAgent.evaluate()` (chat_agent.py)
2. Update frontend display in `DetailedAnalysis.tsx`
3. Update documentation in `PATH.md` and `README.md`

### Adding Strands Agent Pattern

1. Update pattern mapping in `PatternAgent` (multi_stage_spec_agent.py)
2. Add pattern template in `AssemblerAgent`
3. Update P.A.T.H framework documentation in `PATH.md`
4. Update frontend pattern selection if needed

## Development Notes

- Frontend runs on port 3009 (not 3000) - see `package.json`
- All LLM interactions stream for real-time UX
- Chat history is append-only - never modify past messages
- Mermaid diagrams render client-side via `mermaid` library
- MDX rendering uses `react-markdown` with `remark-gfm`
- Session IDs are UUIDs generated client-side
- Backend agents are singleton instances (reused across requests)
- ChatAgent sessions are stored in-memory (not persisted to DynamoDB)

## Testing

The `path-test-agent/` directory contains test scenarios for validating agent behavior. No automated test suite is currently configured.
