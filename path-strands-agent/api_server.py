"""
FastAPI 서버 - Strands Agent 호스팅

PATH 웹앱의 2-3단계 API를 Strands Agent로 제공
"""

# LLM 및 라이브러리 로그 출력 억제
import logging
import sys
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import asyncio

from chat_agent import AnalyzerAgent, ChatAgent, EvaluatorAgent, FeasibilityAgent, PatternAnalyzerAgent
from multi_stage_spec_agent import MultiStageSpecAgent

app = FastAPI(title="PATH Strands Agent API")

# CORS 설정 (Next.js 웹앱과 통신)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3009"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class AnalyzeRequest(BaseModel):
    painPoint: str
    inputType: str
    processSteps: List[str]
    outputTypes: List[str]
    humanLoop: str
    errorTolerance: str
    additionalContext: Optional[str] = None
    additionalSources: Optional[str] = None

class ChatRequest(BaseModel):
    conversation: List[Dict[str, str]]
    userMessage: str

class FinalizeRequest(BaseModel):
    formData: Dict[str, Any]
    conversation: List[Dict[str, str]]

class SpecRequest(BaseModel):
    analysis: Dict[str, Any]


# Step2: Feasibility 관련 Request Models
class FeasibilityRequest(BaseModel):
    painPoint: str
    inputType: str
    processSteps: List[str]
    outputTypes: List[str]
    humanLoop: str
    errorTolerance: str
    additionalContext: Optional[str] = None
    additionalSources: Optional[str] = None


class FeasibilityReevaluateRequest(BaseModel):
    formData: Dict[str, Any]
    previousEvaluation: Dict[str, Any]
    improvementPlans: Dict[str, str]


# Step3: Pattern Analysis 관련 Request Models
class PatternAnalyzeRequest(BaseModel):
    formData: Dict[str, Any]
    feasibility: Dict[str, Any]


class PatternChatRequest(BaseModel):
    conversation: List[Dict[str, str]]
    userMessage: str
    formData: Dict[str, Any]
    feasibility: Dict[str, Any]


class PatternFinalizeRequest(BaseModel):
    formData: Dict[str, Any]
    feasibility: Dict[str, Any]
    conversation: List[Dict[str, str]]


# Global agents (재사용)
analyzer_agent = AnalyzerAgent()
multi_stage_spec_agent = MultiStageSpecAgent()
feasibility_agent = FeasibilityAgent()
chat_sessions: Dict[str, ChatAgent] = {}  # 세션별 ChatAgent 관리
pattern_sessions: Dict[str, PatternAnalyzerAgent] = {}  # 세션별 PatternAnalyzerAgent 관리


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """2단계 초기 분석 - 스트리밍"""
    try:
        form_data = request.dict()

        async def generate():
            try:
                async for chunk in analyzer_agent.analyze_stream(form_data):
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    """2단계 대화 - 스트리밍"""
    try:
        # 세션 ID 생성 (간단하게 conversation 길이 기반)
        session_id = f"session_{len(request.conversation)}"

        # ChatAgent 가져오기 또는 생성
        if session_id not in chat_sessions:
            chat_sessions[session_id] = ChatAgent()
            # 기존 대화 히스토리 복원
            for msg in request.conversation:
                chat_sessions[session_id].add_message(msg["role"], msg["content"])

        chat_agent = chat_sessions[session_id]

        async def generate():
            try:
                async for chunk in chat_agent.chat_stream(request.userMessage):
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/finalize")
async def finalize(request: FinalizeRequest):
    """2단계 최종 평가"""
    try:
        evaluator = EvaluatorAgent()
        evaluation = evaluator.evaluate(request.formData, request.conversation)
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/spec")
async def spec(request: SpecRequest):
    """3단계 명세서 생성 - MultiStage 스트리밍 (프레임워크 독립적)"""
    try:
        return StreamingResponse(
            multi_stage_spec_agent.generate_spec_stream(request.analysis),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Step 2: Feasibility 평가 엔드포인트
# ============================================

@app.post("/feasibility")
async def feasibility(request: FeasibilityRequest):
    """Step2: 초기 Feasibility 평가"""
    try:
        form_data = request.dict()
        evaluation = feasibility_agent.evaluate(form_data)
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feasibility/update")
async def feasibility_update(request: FeasibilityReevaluateRequest):
    """Step2: 개선안 반영 재평가"""
    try:
        evaluation = feasibility_agent.reevaluate(
            request.formData,
            request.previousEvaluation,
            request.improvementPlans
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Step 3: Pattern Analysis 엔드포인트
# ============================================

@app.post("/pattern/analyze")
async def pattern_analyze(request: PatternAnalyzeRequest):
    """Step3: Feasibility 기반 패턴 분석 - 스트리밍"""
    try:
        # 새로운 PatternAnalyzerAgent 생성 (세션별)
        session_id = f"pattern_{id(request)}"
        pattern_agent = PatternAnalyzerAgent()
        pattern_sessions[session_id] = pattern_agent

        async def generate():
            try:
                async for chunk in pattern_agent.analyze_stream(request.formData, request.feasibility):
                    yield f"data: {json.dumps({'text': chunk, 'sessionId': session_id})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/pattern/chat")
async def pattern_chat(request: PatternChatRequest):
    """Step3: 패턴 관련 대화 - 스트리밍"""
    try:
        # 세션 ID 생성
        session_id = f"pattern_{len(request.conversation)}"

        # PatternAnalyzerAgent 가져오기 또는 생성
        if session_id not in pattern_sessions:
            pattern_sessions[session_id] = PatternAnalyzerAgent()
            # 기존 대화 히스토리 복원
            for msg in request.conversation:
                pattern_sessions[session_id].add_message(msg["role"], msg["content"])

        pattern_agent = pattern_sessions[session_id]

        async def generate():
            try:
                async for chunk in pattern_agent.chat_stream(request.userMessage):
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/pattern/finalize")
async def pattern_finalize(request: PatternFinalizeRequest):
    """Step3: 패턴 확정 및 최종 분석"""
    try:
        # PatternAnalyzerAgent 생성 및 히스토리 복원
        pattern_agent = PatternAnalyzerAgent()
        for msg in request.conversation:
            pattern_agent.add_message(msg["role"], msg["content"])

        analysis = pattern_agent.finalize(request.formData, request.feasibility)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """헬스체크"""
    return {"status": "healthy", "service": "PATH Strands Agent API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001
    )
