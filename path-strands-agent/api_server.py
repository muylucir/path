"""
FastAPI 서버 - Strands Agent 호스팅

PATH 웹앱의 2-3단계 API를 Strands Agent로 제공

보안 강화:
- API Key 인증
- Rate Limiting
- 입력 검증 및 새니타이징
- 보안 세션 관리
"""

# .env 파일 로드 (환경 변수 설정)
from dotenv import load_dotenv
load_dotenv()

# LLM 및 라이브러리 로그 출력 억제
import logging
logger = logging.getLogger(__name__)
import sys
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Dict, Any, List, Optional
import json
import asyncio

from chat_agent import AnalyzerAgent, ChatAgent, EvaluatorAgent, FeasibilityAgent, PatternAnalyzerAgent
from multi_stage_spec_agent import MultiStageSpecAgent

# 보안 모듈 import
from validators import (
    sanitize_input,
    validate_conversation,
    MAX_PAIN_POINT_LENGTH,
    MAX_CONTEXT_LENGTH,
    MAX_SOURCES_LENGTH,
    MAX_MESSAGE_LENGTH,
)
from session_manager import SecureSessionManager
from session_cleanup import get_cleanup_scheduler, session_cleanup_lifespan
from auth import setup_auth_middleware, PUBLIC_ENDPOINTS, is_development_mode
from rate_limiter import (
    limiter,
    setup_rate_limiter,
    RATE_LIMITS,
)


# Lifespan 이벤트 핸들러
@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 lifespan 이벤트"""
    # 프로덕션 환경에서 API Key 필수 확인
    if not is_development_mode() and not os.environ.get("PATH_API_KEY"):
        raise RuntimeError(
            "PATH_API_KEY 환경 변수가 설정되지 않았습니다. "
            "프로덕션 환경에서는 API Key가 필수입니다."
        )

    # 시작 시
    scheduler = get_cleanup_scheduler()
    scheduler.register_manager(chat_sessions)
    scheduler.register_manager(pattern_sessions)
    await scheduler.start()

    yield

    # 종료 시
    await scheduler.stop()


_is_dev = is_development_mode()
app = FastAPI(
    title="PATH Strands Agent API",
    lifespan=lifespan,
    docs_url="/docs" if _is_dev else None,
    redoc_url="/redoc" if _is_dev else None,
    openapi_url="/openapi.json" if _is_dev else None,
)

# Rate Limiter 설정 (가장 먼저)
setup_rate_limiter(app)

# CORS 설정 (Next.js 웹앱과 통신)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3009","https://d21k0iabhuk0yx.cloudfront.net","https://path.workloom.net"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "Accept"],
)

# API Key 인증 미들웨어 설정 (CORS 다음에)
setup_auth_middleware(app, PUBLIC_ENDPOINTS)


def _deep_sanitize(obj, max_depth=5):
    """Dict/List의 모든 문자열 값을 재귀적으로 sanitize"""
    if max_depth <= 0:
        return obj
    if isinstance(obj, str):
        return sanitize_input(obj, max_length=5000)
    if isinstance(obj, dict):
        return {k: _deep_sanitize(v, max_depth-1) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_deep_sanitize(item, max_depth-1) for item in obj[:100]]
    return obj



def _sse_event(data: dict) -> str:
    """표준화된 SSE 이벤트 포맷"""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _sse_done() -> str:
    """SSE 스트림 종료 이벤트"""
    return "data: [DONE]\n\n"


def _sse_error(message: str = "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.") -> str:
    """표준화된 SSE 에러 이벤트"""
    return f"data: {json.dumps({'error': message}, ensure_ascii=False)}\n\n"




async def _stream_with_disconnect_check(
    request: Request,
    generator,
    media_type: str = "text/event-stream",
    extra_headers: dict = None,
):
    """클라이언트 연결 끊김 감지가 포함된 스트리밍 응답.
    
    클라이언트가 연결을 끊으면 generator를 정리하고 반환합니다.
    """
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    if extra_headers:
        headers.update(extra_headers)

    async def checked_generator():
        try:
            async for chunk in generator:
                if await request.is_disconnected():
                    logger.info("클라이언트 연결 끊김 감지, 스트리밍 중단")
                    break
                yield chunk
        except asyncio.CancelledError:
            logger.info("스트리밍 태스크 취소됨")
        finally:
            # generator cleanup
            if hasattr(generator, 'aclose'):
                await generator.aclose()

    return StreamingResponse(
        checked_generator(),
        media_type=media_type,
        headers=headers,
    )


def _error_response(status_code: int, detail: str = "내부 서버 오류가 발생했습니다.") -> JSONResponse:
    """표준화된 JSON 에러 응답"""
    return JSONResponse(
        status_code=status_code,
        content={"error": detail, "status": status_code}
    )


# Request Models with Validation
class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    painPoint: str = Field(..., min_length=10, max_length=MAX_PAIN_POINT_LENGTH)
    inputType: str = Field(..., min_length=1, max_length=50)
    processSteps: List[str] = Field(..., min_length=1, max_length=10)
    outputTypes: List[str] = Field(..., min_length=1, max_length=10)
    humanLoop: str = Field(..., min_length=1, max_length=50)
    errorTolerance: str = Field(..., min_length=1, max_length=50)
    additionalContext: Optional[str] = Field(None, max_length=MAX_CONTEXT_LENGTH)
    additionalSources: Optional[str] = Field(None, max_length=MAX_SOURCES_LENGTH)

    @field_validator('painPoint', 'additionalContext', 'additionalSources', mode='before')
    @classmethod
    def sanitize_text_fields(cls, v):
        if v is None:
            return v
        return sanitize_input(v, MAX_PAIN_POINT_LENGTH)

    @field_validator('processSteps', 'outputTypes', mode='before')
    @classmethod
    def validate_list_length(cls, v):
        if v and len(v) > 10:
            raise ValueError('최대 10개까지 선택 가능합니다')
        return v


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    conversation: List[Dict[str, str]] = Field(default_factory=list, max_length=50)
    userMessage: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    sessionId: Optional[str] = Field(None, max_length=100)

    @field_validator('userMessage', mode='before')
    @classmethod
    def sanitize_message(cls, v):
        return sanitize_input(v, MAX_MESSAGE_LENGTH)

    @field_validator('conversation', mode='before')
    @classmethod
    def validate_conv(cls, v):
        return validate_conversation(v)


class FinalizeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    formData: Dict[str, Any]
    conversation: List[Dict[str, str]] = Field(default_factory=list, max_length=50)

    @field_validator('formData', mode='before')
    @classmethod
    def sanitize_dicts(cls, v):
        if v is not None:
            return _deep_sanitize(v)
        return v

    @field_validator('conversation', mode='before')
    @classmethod
    def validate_conv(cls, v):
        return validate_conversation(v)


class SpecRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    analysis: Dict[str, Any]
    improvement_plans: Optional[Dict[str, str]] = None
    chat_history: Optional[List[Dict[str, str]]] = None
    additional_context: Optional[Dict[str, str]] = None

    @field_validator('analysis', 'improvement_plans', 'additional_context', mode='before')
    @classmethod
    def sanitize_dicts(cls, v):
        if v is not None:
            return _deep_sanitize(v)
        return v

    @field_validator('chat_history', mode='before')
    @classmethod
    def sanitize_chat(cls, v):
        if v:
            return validate_conversation(v)
        return v


# Step2: Feasibility 관련 Request Models
class FeasibilityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    painPoint: str = Field(..., min_length=10, max_length=MAX_PAIN_POINT_LENGTH)
    inputType: str = Field(..., min_length=1, max_length=50)
    processSteps: List[str] = Field(..., min_length=1, max_length=10)
    outputTypes: List[str] = Field(..., min_length=1, max_length=10)
    humanLoop: str = Field(..., min_length=1, max_length=50)
    errorTolerance: str = Field(..., min_length=1, max_length=50)
    additionalContext: Optional[str] = Field(None, max_length=MAX_CONTEXT_LENGTH)
    additionalSources: Optional[str] = Field(None, max_length=MAX_SOURCES_LENGTH)

    @field_validator('painPoint', 'additionalContext', 'additionalSources', mode='before')
    @classmethod
    def sanitize_text_fields(cls, v):
        if v is None:
            return v
        return sanitize_input(v, MAX_PAIN_POINT_LENGTH)


class FeasibilityReevaluateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    formData: Dict[str, Any]
    previousEvaluation: Dict[str, Any]
    improvementPlans: Dict[str, str]

    @field_validator('formData', 'previousEvaluation', 'improvementPlans', mode='before')
    @classmethod
    def sanitize_dicts(cls, v):
        if v is not None:
            return _deep_sanitize(v)
        return v


# Step3: Pattern Analysis 관련 Request Models
class PatternAnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    formData: Dict[str, Any]
    feasibility: Dict[str, Any]
    improvementPlans: Optional[Dict[str, str]] = None

    @field_validator('formData', 'feasibility', 'improvementPlans', mode='before')
    @classmethod
    def sanitize_dicts(cls, v):
        if v is not None:
            return _deep_sanitize(v)
        return v


class PatternChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    conversation: List[Dict[str, str]] = Field(default_factory=list, max_length=50)
    userMessage: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    formData: Dict[str, Any]
    feasibility: Dict[str, Any]
    sessionId: Optional[str] = Field(None, max_length=100)

    @field_validator('formData', 'feasibility', mode='before')
    @classmethod
    def sanitize_dicts(cls, v):
        if v is not None:
            return _deep_sanitize(v)
        return v

    @field_validator('userMessage', mode='before')
    @classmethod
    def sanitize_message(cls, v):
        return sanitize_input(v, MAX_MESSAGE_LENGTH)

    @field_validator('conversation', mode='before')
    @classmethod
    def validate_conv(cls, v):
        return validate_conversation(v)


class PatternFinalizeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    formData: Dict[str, Any]
    feasibility: Dict[str, Any]
    conversation: List[Dict[str, str]] = Field(default_factory=list, max_length=50)
    improvementPlans: Optional[Dict[str, str]] = None
    sessionId: Optional[str] = Field(None, max_length=100)

    @field_validator('formData', 'feasibility', 'improvementPlans', mode='before')
    @classmethod
    def sanitize_dicts(cls, v):
        if v is not None:
            return _deep_sanitize(v)
        return v

    @field_validator('conversation', mode='before')
    @classmethod
    def validate_conv(cls, v):
        return validate_conversation(v)


# 보안 세션 관리자로 교체
chat_sessions: SecureSessionManager[ChatAgent] = SecureSessionManager()
pattern_sessions: SecureSessionManager[PatternAnalyzerAgent] = SecureSessionManager()


@app.post("/analyze")
@limiter.limit(RATE_LIMITS["analyze"])
async def analyze(request: Request, data: AnalyzeRequest):
    """2단계 초기 분석 - 스트리밍"""
    try:
        form_data = data.model_dump()
        analyzer = AnalyzerAgent()

        async def generate():
            try:
                async for chunk in analyzer.analyze_stream(form_data):
                    yield _sse_event({'text': chunk})
                yield _sse_done()
            except Exception as e:
                logger.error(f"스트리밍 오류: {e}", exc_info=True)
                yield _sse_error()

        return await _stream_with_disconnect_check(request, generate())
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


@app.post("/chat")
@limiter.limit(RATE_LIMITS["chat"])
async def chat(request: Request, data: ChatRequest):
    """2단계 대화 - 스트리밍"""
    try:
        # 세션 ID 처리
        session_id = data.sessionId

        # 기존 세션 조회 또는 새 세션 생성
        chat_agent = None
        if session_id:
            chat_agent = chat_sessions.get_session(session_id)

        if chat_agent is None:
            # 새 ChatAgent 생성
            chat_agent = ChatAgent()
            # 기존 대화 히스토리 복원
            for msg in data.conversation:
                chat_agent.add_message(msg["role"], msg["content"])
            # 새 세션 생성
            session_id = chat_sessions.create_session(chat_agent)

        async def generate():
            try:
                async for chunk in chat_agent.chat_stream(data.userMessage):
                    yield _sse_event({'text': chunk, 'sessionId': session_id})
                yield _sse_done()
            except Exception as e:
                logger.error(f"스트리밍 오류: {e}", exc_info=True)
                yield _sse_error()

        return await _stream_with_disconnect_check(request, generate())
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


@app.post("/finalize")
@limiter.limit(RATE_LIMITS["finalize"])
async def finalize(request: Request, data: FinalizeRequest):
    """2단계 최종 평가"""
    try:
        evaluator = EvaluatorAgent()
        evaluation = await asyncio.to_thread(evaluator.evaluate, data.formData, data.conversation)
        return JSONResponse(content=evaluation)
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


@app.post("/spec")
@limiter.limit(RATE_LIMITS["spec"])
async def spec(request: Request, data: SpecRequest):
    """3단계 명세서 생성 - MultiStage 스트리밍 (프레임워크 독립적)"""
    try:
        spec_agent = MultiStageSpecAgent()
        return await _stream_with_disconnect_check(
            request,
            spec_agent.generate_spec_stream(
                data.analysis,
                data.improvement_plans,
                data.chat_history,
                data.additional_context
            ),
            extra_headers={"X-Accel-Buffering": "no"},
        )
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


# ============================================
# Step 2: Feasibility 평가 엔드포인트
# ============================================

@app.post("/feasibility")
@limiter.limit(RATE_LIMITS["feasibility"])
async def feasibility(request: Request, data: FeasibilityRequest):
    """Step2: 초기 Feasibility 평가 - SSE 스트리밍"""
    try:
        form_data = data.model_dump()
        feasibility_agent = FeasibilityAgent()

        async def generate():
            try:
                async for chunk in feasibility_agent.evaluate_stream(form_data):
                    yield f"data: {chunk}\n\n"
                yield _sse_done()
            except Exception as e:
                logger.error(f"스트리밍 오류: {e}", exc_info=True)
                yield _sse_error()

        return await _stream_with_disconnect_check(
            request,
            generate(),
            extra_headers={"X-Accel-Buffering": "no"},
        )
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


@app.post("/feasibility/update")
@limiter.limit(RATE_LIMITS["feasibility_update"])
async def feasibility_update(request: Request, data: FeasibilityReevaluateRequest):
    """Step2: 개선안 반영 재평가"""
    try:
        feasibility_agent = FeasibilityAgent()
        evaluation = await asyncio.to_thread(
            feasibility_agent.reevaluate,
            data.formData,
            data.previousEvaluation,
            data.improvementPlans
        )
        usage = evaluation.pop("_usage", None)
        response = {**evaluation}
        if usage:
            response["_usage"] = usage
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


# ============================================
# Step 3: Pattern Analysis 엔드포인트
# ============================================

@app.post("/pattern/analyze")
@limiter.limit(RATE_LIMITS["pattern_analyze"])
async def pattern_analyze(request: Request, data: PatternAnalyzeRequest):
    """Step3: Feasibility 기반 패턴 분석 - 스트리밍"""
    try:
        # 새로운 PatternAnalyzerAgent 생성
        pattern_agent = PatternAnalyzerAgent()
        session_id = pattern_sessions.create_session(pattern_agent)

        async def generate():
            try:
                async for chunk in pattern_agent.analyze_stream(
                    data.formData,
                    data.feasibility,
                    data.improvementPlans
                ):
                    if "text" in chunk:
                        yield _sse_event({'text': chunk["text"], 'sessionId': session_id})
                    elif "usage" in chunk:
                        yield _sse_event({'usage': chunk["usage"]})
                yield _sse_done()
            except Exception as e:
                logger.error(f"스트리밍 오류: {e}", exc_info=True)
                yield _sse_error()

        return await _stream_with_disconnect_check(request, generate())
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


@app.post("/pattern/chat")
@limiter.limit(RATE_LIMITS["pattern_chat"])
async def pattern_chat(request: Request, data: PatternChatRequest):
    """Step3: 패턴 관련 대화 - 스트리밍"""
    try:
        # 세션 ID 처리
        session_id = data.sessionId

        # 기존 세션 조회 또는 새 세션 생성
        is_stateful = False
        pattern_agent = None
        if session_id:
            pattern_agent = pattern_sessions.get_session(session_id)
            if pattern_agent is not None:
                is_stateful = True

        if pattern_agent is None:
            # 새 PatternAnalyzerAgent 생성
            pattern_agent = PatternAnalyzerAgent()
            # 기존 대화 히스토리 복원
            for msg in data.conversation:
                pattern_agent.add_message(msg["role"], msg["content"])
            # 새 세션 생성
            session_id = pattern_sessions.create_session(pattern_agent)

        async def generate():
            try:
                async for chunk in pattern_agent.chat_stream(data.userMessage, stateful=is_stateful):
                    if "text" in chunk:
                        yield _sse_event({'text': chunk["text"], 'sessionId': session_id})
                    elif "usage" in chunk:
                        yield _sse_event({'usage': chunk["usage"]})
                yield _sse_done()
            except Exception as e:
                logger.error(f"스트리밍 오류: {e}", exc_info=True)
                yield _sse_error()

        return await _stream_with_disconnect_check(request, generate())
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


@app.post("/pattern/finalize")
@limiter.limit(RATE_LIMITS["pattern_finalize"])
async def pattern_finalize(request: Request, data: PatternFinalizeRequest):
    """Step3: 패턴 확정 및 최종 분석"""
    try:
        # 세션 재사용 로직
        is_stateful = False
        pattern_agent = None

        if data.sessionId:
            pattern_agent = pattern_sessions.get_session(data.sessionId)
            if pattern_agent is not None:
                is_stateful = True

        if pattern_agent is None:
            pattern_agent = PatternAnalyzerAgent()
            for msg in data.conversation:
                pattern_agent.add_message(msg["role"], msg["content"])

        analysis = await asyncio.to_thread(
            pattern_agent.finalize,
            data.formData,
            data.feasibility,
            data.improvementPlans,
            stateful=is_stateful
        )
        usage = analysis.pop("_usage", None)
        response = {**analysis}
        if usage:
            response["_usage"] = usage
        return JSONResponse(content=response)
    except Exception as e:
        logger.error(f"엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="내부 서버 오류가 발생했습니다.")


@app.get("/health")
async def health():
    """헬스체크 (인증 불필요)"""
    return {"status": "healthy", "service": "PATH Strands Agent API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001
    )
