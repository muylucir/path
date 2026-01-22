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
from sdd_multi_stage_agent import sdd_multi_stage_agent
from code_generator_agent import code_generator_agent

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


class SDDRequest(BaseModel):
    spec: str  # PATH 명세서 Markdown


class SDDDownloadRequest(BaseModel):
    spec: Optional[str] = None  # PATH 명세서 Markdown (session_id 없을 때 필요)
    session_id: Optional[str] = None  # 세션 ID (있으면 /tmp에서 ZIP 생성)


class CodeGenerateRequest(BaseModel):
    path_spec: str  # PATH 명세서 Markdown
    integration_details: Optional[List[Dict[str, Any]]] = None


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


@app.post("/sdd")
async def generate_sdd(request: SDDRequest):
    """SDD 문서 생성 - 6단계 파이프라인 스트리밍"""
    try:
        return StreamingResponse(
            sdd_multi_stage_agent.generate_sdd_stream(request.spec),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sdd/files/{session_id}")
async def get_sdd_files(session_id: str):
    """session_id로 /tmp에서 생성된 SDD 파일 내용 읽기"""
    temp_dir = f"/tmp/sdd-{session_id}/.kiro"

    if not os.path.exists(temp_dir):
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")

    def read_file(subdir: str, filename: str) -> str:
        filepath = f"{temp_dir}/{subdir}/{filename}"
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    result = {
        "specs": {
            "requirements.md": read_file("specs", "requirements.md"),
            "design.md": read_file("specs", "design.md"),
            "tasks.md": read_file("specs", "tasks.md"),
        },
        "steering": {
            "structure.md": read_file("steering", "structure.md"),
            "tech.md": read_file("steering", "tech.md"),
            "product.md": read_file("steering", "product.md"),
        }
    }

    return result


@app.post("/sdd/download")
async def download_sdd(request: SDDDownloadRequest):
    """SDD 문서를 ZIP 파일로 다운로드 - session_id로 /tmp에서 읽기"""
    from fastapi.responses import Response
    import zipfile
    import io

    try:
        zip_buffer = io.BytesIO()

        # session_id가 있으면 /tmp에서 파일 읽기
        if request.session_id:
            temp_dir = f"/tmp/sdd-{request.session_id}/.kiro"
            print(f"[SDD Download] Using session_id: {request.session_id}")

            if not os.path.exists(temp_dir):
                raise HTTPException(status_code=404, detail=f"Session not found: {request.session_id}")

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # 디렉토리 구조대로 파일 추가
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        # .kiro 기준 상대 경로
                        arcname = os.path.relpath(file_path, os.path.dirname(temp_dir))
                        zipf.write(file_path, arcname)

            print(f"[SDD Download] ZIP created from /tmp/sdd-{request.session_id}")

        # session_id가 없으면 새로 생성 (fallback)
        elif request.spec:
            print("[SDD Download] No session_id - generating new documents")
            result = sdd_multi_stage_agent.generate_sdd_sync(request.spec)

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.writestr(".kiro/path-spec/spec.md", request.spec)
                specs = result.get("specs", {})
                zipf.writestr(".kiro/specs/requirements.md", specs.get("requirements.md", ""))
                zipf.writestr(".kiro/specs/design.md", specs.get("design.md", ""))
                zipf.writestr(".kiro/specs/tasks.md", specs.get("tasks.md", ""))
                steering = result.get("steering", {})
                zipf.writestr(".kiro/steering/structure.md", steering.get("structure.md", ""))
                zipf.writestr(".kiro/steering/tech.md", steering.get("tech.md", ""))
                zipf.writestr(".kiro/steering/product.md", steering.get("product.md", ""))
        else:
            raise HTTPException(status_code=400, detail="session_id or spec is required")

        zip_buffer.seek(0)
        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=sdd-documents.zip"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/code/generate")
async def generate_code(request: CodeGenerateRequest):
    """PATH 명세서 → Strands Agent SDK 코드 생성"""
    try:
        files = code_generator_agent.generate(
            path_spec=request.path_spec,
            integration_details=request.integration_details
        )

        return {
            "success": True,
            "files": files,
            "file_count": len(files)
        }
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
