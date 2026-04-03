"""
AgentCore Runtime 엔트리포인트 - PATH Agent Designer

6개 액션을 단일 BedrockAgentCoreApp 엔드포인트에서 dispatch:
  feasibility       → FeasibilityAgent SSE 스트리밍
  feasibility_update → FeasibilityAgent SSE 스트리밍 (재평가)
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
import time
from collections import OrderedDict
from bedrock_agentcore.runtime import BedrockAgentCoreApp

logger = logging.getLogger(__name__)

app = BedrockAgentCoreApp()

# PatternAnalyzerAgent 세션 캐시 (TTL + 최대 크기 제한)
_MAX_SESSIONS = 100
_SESSION_TTL_SECONDS = 3600  # 1시간

_pattern_sessions: OrderedDict = OrderedDict()
_session_timestamps: dict = {}


def _cleanup_sessions():
    """만료 세션 정리 및 최대 크기 제한 적용."""
    now = time.time()
    expired = [
        sid for sid, ts in _session_timestamps.items()
        if now - ts > _SESSION_TTL_SECONDS
    ]
    for sid in expired:
        _pattern_sessions.pop(sid, None)
        _session_timestamps.pop(sid, None)

    while len(_pattern_sessions) > _MAX_SESSIONS:
        oldest_sid, _ = _pattern_sessions.popitem(last=False)
        _session_timestamps.pop(oldest_sid, None)

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
    """spec 패키지를 최초 요청 시 임포트"""
    global _spec_agent_module
    if _spec_agent_module is None:
        import spec as mod
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
    _cleanup_sessions()

    if session_id and session_id in _pattern_sessions:
        _session_timestamps[session_id] = time.time()  # TTL 갱신
        return _pattern_sessions[session_id], True

    mod = _get_chat_agent_module()
    agent = mod.PatternAnalyzerAgent()

    # 대화 히스토리 복원 (stateless fallback) — role 검증 포함
    _ALLOWED_ROLES = {"user", "assistant"}
    if conversation:
        for msg in conversation:
            role = msg.get("role", "user")
            if role not in _ALLOWED_ROLES:
                role = "user"
            content = msg.get("content", "")
            if isinstance(content, str) and content:
                agent.add_message(role, content)

    if session_id:
        _pattern_sessions[session_id] = agent
        _session_timestamps[session_id] = time.time()

    return agent, False


_MAX_FIELD_LEN = 10000      # 단일 문자열 필드 최대 길이
_MAX_CONVERSATION_TURNS = 100  # 대화 히스토리 최대 턴 수


_MAX_ARRAY_ITEMS = 50  # 배열 필드 최대 항목 수


def _validate_payload(payload: dict):
    """Payload 크기 기본 검증. 초과 시 ValueError."""
    form_data = payload.get("formData", {})
    if isinstance(form_data, dict):
        # 문자열 필드 길이 검증
        for key in ("painPoint", "additionalContext", "additionalSources",
                     "inputType", "humanLoop", "errorTolerance"):
            val = form_data.get(key, "")
            if isinstance(val, str) and len(val) > _MAX_FIELD_LEN:
                raise ValueError(f"Field '{key}' exceeds maximum length")
        # 배열 필드 크기 검증
        for key in ("processSteps", "outputTypes"):
            arr = form_data.get(key, [])
            if isinstance(arr, list):
                if len(arr) > _MAX_ARRAY_ITEMS:
                    raise ValueError(f"Field '{key}' has too many items")
                for item in arr:
                    if isinstance(item, str) and len(item) > _MAX_FIELD_LEN:
                        raise ValueError(f"Item in '{key}' exceeds maximum length")

    # userMessage 길이 검증
    user_msg = payload.get("userMessage", "")
    if isinstance(user_msg, str) and len(user_msg) > _MAX_FIELD_LEN:
        raise ValueError("userMessage exceeds maximum length")

    # conversation/chat_history 턴 수 + 개별 메시지 크기 검증
    for conv_key in ("conversation", "chat_history"):
        conv = payload.get(conv_key, [])
        if isinstance(conv, list):
            if len(conv) > _MAX_CONVERSATION_TURNS:
                raise ValueError(f"'{conv_key}' exceeds maximum turns ({_MAX_CONVERSATION_TURNS})")
            for msg in conv:
                if isinstance(msg, dict):
                    content = msg.get("content", "")
                    if isinstance(content, str) and len(content) > _MAX_FIELD_LEN:
                        raise ValueError(f"Message in '{conv_key}' exceeds maximum length")


@app.entrypoint
async def invoke(payload, context):
    """메인 디스패처 — payload.type으로 액션 분기"""
    action_type = payload.get("type")
    session_id = getattr(context, "session_id", "") or ""

    # 로그 injection 방어: 개행 문자 제거 및 길이 제한
    safe_action = str(action_type or "").replace('\n', '').replace('\r', '')[:50]
    safe_session = str(session_id).replace('\n', '').replace('\r', '')[:100]
    logger.info(f"[INVOKE] action={safe_action} session={safe_session}")

    # Payload 크기 검증
    try:
        _validate_payload(payload)
    except ValueError as e:
        logger.warning(f"[PAYLOAD REJECTED] {e}")
        yield {"error": "요청 데이터가 허용 크기를 초과합니다."}
        return

    try:
        if action_type == "ping":
            yield {"status": "ok", "message": "pong"}
            return

        elif action_type == "feasibility":
            async for event in _handle_feasibility(payload):
                yield event

        elif action_type == "feasibility_update":
            async for event in _handle_feasibility_update(payload):
                yield event

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
            yield {"error": "Unknown action type"}

    except RuntimeError as e:
        if "StopIteration" in str(e):
            # Strands SDK stream_async 종료 시 StopIteration이
            # async generator로 누출되는 현상 — 정상 종료로 처리
            return
        error_detail = f"{type(e).__name__}: {str(e)[:300]}"
        logger.error(f"[ENTRYPOINT ERROR] action={safe_action} error={error_detail}", exc_info=True)
        yield {"error": f"처리 중 오류가 발생했습니다. [action={safe_action}] {error_detail}"}
    except Exception as e:
        error_detail = f"{type(e).__name__}: {str(e)[:300]}"
        logger.error(f"[ENTRYPOINT ERROR] action={safe_action} error={error_detail}", exc_info=True)
        yield {"error": f"처리 중 오류가 발생했습니다. [action={safe_action}] {error_detail}"}


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


async def _handle_feasibility_update(payload: dict):
    """개선안 반영 재평가 — SSE 스트리밍 (타임아웃 방지)"""
    form_data = payload.get("formData", {})
    previous_evaluation = payload.get("previousEvaluation", {})
    improvement_plans = payload.get("improvementPlans", {})

    mod = _get_chat_agent_module()
    agent = mod.FeasibilityAgent()

    async for chunk in agent.reevaluate_stream(form_data, previous_evaluation, improvement_plans):
        try:
            yield json.loads(chunk)
        except (json.JSONDecodeError, TypeError):
            yield {"raw": chunk}


# ──────────────────────────────────────────────
# Step 3: Pattern Analysis
# ──────────────────────────────────────────────

async def _handle_pattern_analyze(payload: dict, session_id: str):
    """Feasibility 기반 패턴 분석 — SSE 스트리밍"""
    form_data = payload.get("formData", {})
    feasibility = payload.get("feasibility", {})
    improvement_plans = payload.get("improvementPlans")

    _cleanup_sessions()
    mod = _get_chat_agent_module()
    agent = mod.PatternAnalyzerAgent()
    if session_id:
        _pattern_sessions[session_id] = agent
        _session_timestamps[session_id] = time.time()

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
