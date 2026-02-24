"""
AgentCore Runtime 엔트리포인트 - PATH Agent Designer

6개 액션을 단일 BedrockAgentCoreApp 엔드포인트에서 dispatch:
  feasibility       → FeasibilityAgent SSE 스트리밍
  feasibility_update → FeasibilityAgent JSON (단일 yield)
  pattern_analyze   → PatternAnalyzerAgent SSE 스트리밍
  pattern_chat      → PatternAnalyzerAgent SSE 스트리밍
  pattern_finalize  → PatternAnalyzerAgent JSON (단일 yield)
  spec              → MultiStageSpecAgent SSE 스트리밍

PatternAnalyzerAgent 세션은 module-level dict에 저장하고,
AgentCore의 runtimeSessionId로 동일 컨테이너 라우팅됨.

NOTE: 무거운 모듈(strands, boto3 등)은 lazy import로 처리.
AgentCore 초기화 타임아웃(30초) 내에 app.run()이 시작되어야 한다.
"""

import json
import logging
import asyncio
from bedrock_agentcore.runtime import BedrockAgentCoreApp

logger = logging.getLogger(__name__)

app = BedrockAgentCoreApp()

# PatternAnalyzerAgent 세션 캐시 (runtimeSessionId → agent)
_pattern_sessions: dict = {}

# Lazy-loaded 모듈 캐시
_chat_agent_module = None
_spec_agent_module = None


def _get_chat_agent_module():
    """chat_agent 모듈을 최초 요청 시 임포트 (cold start 회피)"""
    global _chat_agent_module
    if _chat_agent_module is None:
        import chat_agent as mod
        _chat_agent_module = mod
    return _chat_agent_module


def _get_spec_agent_module():
    """multi_stage_spec_agent 모듈을 최초 요청 시 임포트"""
    global _spec_agent_module
    if _spec_agent_module is None:
        import multi_stage_spec_agent as mod
        _spec_agent_module = mod
    return _spec_agent_module


def _get_or_create_pattern_agent(
    session_id: str,
    conversation: list = None,
) -> tuple:
    """세션에서 PatternAnalyzerAgent 조회 또는 새로 생성.

    Returns:
        (agent, is_stateful) tuple
    """
    if session_id and session_id in _pattern_sessions:
        return _pattern_sessions[session_id], True

    mod = _get_chat_agent_module()
    agent = mod.PatternAnalyzerAgent()

    # 대화 히스토리 복원 (stateless fallback)
    if conversation:
        for msg in conversation:
            agent.add_message(msg.get("role", "user"), msg.get("content", ""))

    if session_id:
        _pattern_sessions[session_id] = agent

    return agent, False


@app.entrypoint
async def invoke(payload, context):
    """메인 디스패처 — payload.type으로 액션 분기"""
    action_type = payload.get("type")
    session_id = getattr(context, "session_id", "") or ""

    print(f"[INVOKE] action={action_type} session={session_id}", flush=True)

    try:
        if action_type == "ping":
            yield {"status": "ok", "message": "pong"}
            return

        elif action_type == "feasibility":
            async for event in _handle_feasibility(payload):
                yield event

        elif action_type == "feasibility_update":
            result = await asyncio.to_thread(_run_feasibility_update, payload)
            yield result

        elif action_type == "pattern_analyze":
            async for event in _handle_pattern_analyze(payload, session_id):
                yield event

        elif action_type == "pattern_chat":
            async for event in _handle_pattern_chat(payload, session_id):
                yield event

        elif action_type == "pattern_finalize":
            result = await asyncio.to_thread(
                _run_pattern_finalize, payload, session_id
            )
            yield result

        elif action_type == "spec":
            async for event in _handle_spec(payload):
                yield event

        else:
            yield {"error": f"Unknown action type: {action_type}"}

    except RuntimeError as e:
        if "StopIteration" in str(e):
            # Strands SDK stream_async 종료 시 StopIteration이
            # async generator로 누출되는 현상 — 정상 종료로 처리
            return
        import traceback
        print(f"[ENTRYPOINT ERROR] action={action_type} error={e}\n{traceback.format_exc()}", flush=True)
        yield {"error": f"[{type(e).__name__}] {e}"}
    except Exception as e:
        import traceback
        print(f"[ENTRYPOINT ERROR] action={action_type} error={e}\n{traceback.format_exc()}", flush=True)
        yield {"error": f"[{type(e).__name__}] {e}"}


# ──────────────────────────────────────────────
# Step 2: Feasibility
# ──────────────────────────────────────────────

async def _handle_feasibility(payload: dict):
    """초기 Feasibility 평가 — SSE 스트리밍"""
    form_data = payload.get("formData", {})
    mod = _get_chat_agent_module()
    agent = mod.FeasibilityAgent()

    async for chunk in agent.evaluate_stream(form_data):
        # evaluate_stream yields JSON strings
        try:
            yield json.loads(chunk)
        except (json.JSONDecodeError, TypeError):
            yield {"raw": chunk}


def _run_feasibility_update(payload: dict) -> dict:
    """개선안 반영 재평가 — JSON 응답 (sync)"""
    form_data = payload.get("formData", {})
    previous_evaluation = payload.get("previousEvaluation", {})
    improvement_plans = payload.get("improvementPlans", {})

    mod = _get_chat_agent_module()
    agent = mod.FeasibilityAgent()
    return agent.reevaluate(form_data, previous_evaluation, improvement_plans)


# ──────────────────────────────────────────────
# Step 3: Pattern Analysis
# ──────────────────────────────────────────────

async def _handle_pattern_analyze(payload: dict, session_id: str):
    """Feasibility 기반 패턴 분석 — SSE 스트리밍"""
    form_data = payload.get("formData", {})
    feasibility = payload.get("feasibility", {})
    improvement_plans = payload.get("improvementPlans")

    mod = _get_chat_agent_module()
    agent = mod.PatternAnalyzerAgent()
    if session_id:
        _pattern_sessions[session_id] = agent

    async for chunk in agent.analyze_stream(
        form_data, feasibility, improvement_plans
    ):
        if "text" in chunk:
            yield {"text": chunk["text"], "sessionId": session_id}
        elif "usage" in chunk:
            yield {"usage": chunk["usage"]}


async def _handle_pattern_chat(payload: dict, session_id: str):
    """패턴 관련 대화 — SSE 스트리밍"""
    user_message = payload.get("userMessage", "")
    conversation = payload.get("conversation", [])

    agent, is_stateful = _get_or_create_pattern_agent(session_id, conversation)

    async for chunk in agent.chat_stream(user_message, stateful=is_stateful):
        if "text" in chunk:
            yield {"text": chunk["text"], "sessionId": session_id}
        elif "usage" in chunk:
            yield {"usage": chunk["usage"]}


def _run_pattern_finalize(payload: dict, session_id: str) -> dict:
    """패턴 확정 및 최종 분석 — JSON 응답 (sync)"""
    form_data = payload.get("formData", {})
    feasibility = payload.get("feasibility", {})
    conversation = payload.get("conversation", [])
    improvement_plans = payload.get("improvementPlans")

    agent, is_stateful = _get_or_create_pattern_agent(session_id, conversation)
    return agent.finalize(
        form_data, feasibility, improvement_plans, stateful=is_stateful
    )


# ──────────────────────────────────────────────
# Step 4: Specification
# ──────────────────────────────────────────────

async def _handle_spec(payload: dict):
    """명세서 생성 — SSE 스트리밍"""
    analysis = payload.get("analysis", {})
    improvement_plans = payload.get("improvement_plans")
    chat_history = payload.get("chat_history")
    additional_context = payload.get("additional_context")

    mod = _get_spec_agent_module()
    spec_agent = mod.MultiStageSpecAgent()

    async for event in spec_agent.generate_spec_stream(
        analysis, improvement_plans, chat_history, additional_context
    ):
        yield event


if __name__ == "__main__":
    app.run()
