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

from chat_agent import AnalyzerAgent, ChatAgent, EvaluatorAgent
from multi_stage_spec_agent import MultiStageSpecAgent
from code_generator_agent import code_generator_agent
from job_manager import job_manager, JobStatus
from background_worker import background_worker

app = FastAPI(title="PATH Strands Agent API")

# 백그라운드 워커 시작
@app.on_event("startup")
async def startup_event():
    background_worker.start()

@app.on_event("shutdown")
async def shutdown_event():
    background_worker.stop()

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
    selectedIntegrations: Optional[List[str]] = None
    integrationDetails: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    conversation: List[Dict[str, str]]
    userMessage: str

class FinalizeRequest(BaseModel):
    formData: Dict[str, Any]
    conversation: List[Dict[str, str]]

class SpecRequest(BaseModel):
    analysis: Dict[str, Any]
    useAgentCore: bool = False
    integrationDetails: Optional[List[Dict[str, Any]]] = None


class CodeGenerateRequest(BaseModel):
    path_spec: str  # PATH 명세서 Markdown
    integration_details: Optional[List[Dict[str, Any]]] = None
    # 메타데이터 (UI 표시용)
    pain_point: Optional[str] = None
    pattern: Optional[str] = None
    feasibility_score: Optional[int] = None


class CodeDownloadRequest(BaseModel):
    path_spec: str  # PATH 명세서 Markdown
    integration_details: Optional[List[Dict[str, Any]]] = None


# Global agents (재사용)
analyzer_agent = AnalyzerAgent()
multi_stage_spec_agent = MultiStageSpecAgent()  # 변경
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
    """3단계 명세서 생성 - MultiStage 스트리밍"""
    try:
        return StreamingResponse(
            multi_stage_spec_agent.generate_spec_stream(
                request.analysis,
                use_agentcore=request.useAgentCore,
                integration_details=request.integrationDetails
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/code/generate")
async def generate_code(request: CodeGenerateRequest):
    """PATH 명세서 → Strands Agent SDK 코드 생성 (SSE 스트리밍)"""
    try:
        async def generate():
            async for chunk in code_generator_agent.generate_stream(
                path_spec=request.path_spec,
                integration_details=request.integration_details
            ):
                yield f"data: {chunk}\n"
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/code/download")
async def download_code(request: CodeDownloadRequest):
    """생성된 코드를 ZIP 파일로 다운로드"""
    from fastapi.responses import Response
    import zipfile
    import io

    try:
        # 코드 생성
        files = code_generator_agent.generate(
            path_spec=request.path_spec,
            integration_details=request.integration_details
        )

        # ZIP 생성
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for filename, content in files.items():
                zipf.writestr(filename, content)

        zip_buffer.seek(0)
        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=strands-agent-code.zip"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/code/jobs")
async def create_code_generation_job(request: CodeGenerateRequest):
    """코드 생성 작업 생성 (비동기)"""
    try:
        # 디버깅: 받은 메타데이터 로깅
        print(f"📝 Creating job with metadata:")
        print(f"   - pain_point: {request.pain_point}")
        print(f"   - pattern: {request.pattern}")
        print(f"   - feasibility_score: {request.feasibility_score}")

        # 작업 생성
        job_id = job_manager.create_job(
            path_spec=request.path_spec,
            integration_details=request.integration_details,
            pain_point=request.pain_point,
            pattern=request.pattern,
            feasibility_score=request.feasibility_score
        )

        # 백그라운드 워커에 제출
        background_worker.submit_job(job_id)

        return {
            "job_id": job_id,
            "status": "pending",
            "message": "작업이 시작되었습니다. 상태를 확인하세요."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/code/jobs/{job_id}")
async def get_job_status(job_id: str):
    """작업 상태 조회"""
    job = job_manager.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")

    return {
        "job_id": job.job_id,
        "status": job.status.value,
        "progress": job.progress,
        "message": job.message,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "file_count": len(job.result) if job.result else 0,
        "error": job.error
    }


@app.get("/code/jobs/{job_id}/download")
async def download_job_result(job_id: str):
    """완료된 작업의 코드 다운로드"""
    from fastapi.responses import Response
    import zipfile
    import io

    job = job_manager.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail=f"작업이 아직 완료되지 않았습니다 (상태: {job.status.value})")

    if not job.result:
        raise HTTPException(status_code=500, detail="생성된 파일이 없습니다")

    # ZIP 생성
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, content in job.result.items():
            zipf.writestr(filename, content)

    zip_buffer.seek(0)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=strands-agent-code-{job_id[:8]}.zip"
        }
    )


@app.get("/code/jobs")
async def list_recent_jobs(limit: int = 10):
    """최근 작업 목록"""
    jobs = job_manager.list_recent_jobs(limit=limit)

    return {
        "jobs": [
            {
                "job_id": job.job_id,
                "status": job.status.value,
                "progress": job.progress,
                "message": job.message,
                "created_at": job.created_at,
                "updated_at": job.updated_at,
                "completed_at": job.updated_at if job.status.value == "completed" else None,
                "error": job.error,
                "file_count": len(job.result) if job.result else None,
                # 메타데이터
                "pain_point": job.pain_point,
                "pattern": job.pattern,
                "feasibility_score": job.feasibility_score,
            }
            for job in jobs
        ]
    }


@app.delete("/code/jobs/{job_id}")
async def delete_code_generation_job(job_id: str):
    """코드 생성 작업 삭제"""
    success = job_manager.delete_job(job_id)

    if not success:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")

    return {"message": "작업이 삭제되었습니다", "job_id": job_id}


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
