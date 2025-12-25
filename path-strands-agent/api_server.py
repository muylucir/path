"""
FastAPI 서버 - Strands Agent 호스팅

PATH 웹앱의 2-3단계 API를 Strands Agent로 제공
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import asyncio

from chat_agent import AnalyzerAgent, ChatAgent, EvaluatorAgent
from spec_agent import SpecAgent

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
    dataSources: List[Dict[str, str]]
    errorTolerance: str
    additionalContext: Optional[str] = None

class ChatRequest(BaseModel):
    conversation: List[Dict[str, str]]
    userMessage: str

class FinalizeRequest(BaseModel):
    formData: Dict[str, Any]
    conversation: List[Dict[str, str]]

class SpecRequest(BaseModel):
    analysis: Dict[str, Any]
    useAgentCore: bool = False


# Global agents (재사용)
analyzer_agent = AnalyzerAgent()
spec_agent = SpecAgent()
chat_sessions: Dict[str, ChatAgent] = {}  # 세션별 ChatAgent 관리


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
    """3단계 명세서 생성 - 스트리밍"""
    try:
        async def generate():
            try:
                async for chunk in spec_agent.generate_spec_stream(
                    request.analysis, 
                    use_agentcore=request.useAgentCore
                ):
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except GeneratorExit:
                pass
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """헬스체크"""
    return {"status": "healthy", "service": "PATH Strands Agent API"}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting PATH Strands Agent API Server...")
    print("📍 http://localhost:8001")
    print("📖 Docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
