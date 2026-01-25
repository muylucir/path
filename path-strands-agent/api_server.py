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
from deployment_manager import deployment_manager, DeploymentStatus
from deployment_service import deployment_service
from deployment_log_manager import deployment_log_manager
from mcp_deployment_manager import mcp_deployment_manager, MCPDeploymentStatus

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
    errorTolerance: str
    additionalContext: Optional[str] = None
    # 새 구조: 카테고리별 통합 선택
    selectedGateways: Optional[List[str]] = None
    selectedRAGs: Optional[List[str]] = None
    selectedS3s: Optional[List[str]] = None
    integrationDetails: Optional[List[Dict[str, Any]]] = None
    additionalSources: Optional[str] = None

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


class DeploymentRequest(BaseModel):
    job_id: str  # 완료된 코드 생성 작업 ID
    agent_name: str  # Agent 이름 (ECR 리포지토리 이름으로 사용)
    region: str = "us-west-2"  # 배포 리전


class InvokeRuntimeRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None


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


# ============ Deployment Endpoints ============

@app.post("/deployments")
async def create_deployment(request: DeploymentRequest):
    """배포 생성"""
    try:
        # 코드 생성 작업 확인
        job = job_manager.get_job(request.job_id)
        if not job:
            raise HTTPException(status_code=404, detail="코드 생성 작업을 찾을 수 없습니다")

        if job.status != JobStatus.COMPLETED:
            raise HTTPException(
                status_code=400,
                detail=f"코드 생성이 완료되지 않았습니다 (상태: {job.status.value})"
            )

        # 배포 생성
        deployment_id = deployment_manager.create_deployment(
            job_id=request.job_id,
            agent_name=request.agent_name,
            region=request.region,
            pain_point=job.pain_point,
            pattern=job.pattern,
            feasibility_score=job.feasibility_score
        )

        # 백그라운드 워커에 제출
        background_worker.submit_deployment(deployment_id)

        return {
            "deployment_id": deployment_id,
            "status": "pending",
            "message": "배포가 시작되었습니다. 상태를 확인하세요."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/deployments")
async def list_deployments(limit: int = 10):
    """배포 목록"""
    deployments = deployment_manager.list_recent_deployments(limit=limit)

    return {
        "deployments": [
            {
                "deployment_id": d.deployment_id,
                "job_id": d.job_id,
                "agent_name": d.agent_name,
                "status": d.status.value,
                "progress": d.progress,
                "message": d.message,
                "version": d.version,
                "region": d.region,
                "runtime_id": d.runtime_id,
                "runtime_arn": d.runtime_arn,
                "s3_uri": d.s3_uri,
                "endpoint_url": d.endpoint_url,
                "created_at": d.created_at,
                "completed_at": d.updated_at if d.status == DeploymentStatus.ACTIVE else None,
                "error": d.error,
                # 메타데이터
                "pain_point": d.pain_point,
                "pattern": d.pattern,
                "feasibility_score": d.feasibility_score,
            }
            for d in deployments
        ]
    }


@app.get("/deployments/{deployment_id}")
async def get_deployment(deployment_id: str):
    """배포 상태 조회"""
    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    return {
        "deployment_id": deployment.deployment_id,
        "job_id": deployment.job_id,
        "agent_name": deployment.agent_name,
        "status": deployment.status.value,
        "progress": deployment.progress,
        "message": deployment.message,
        "version": deployment.version,
        "region": deployment.region,
        "runtime_id": deployment.runtime_id,
        "runtime_arn": deployment.runtime_arn,
        "s3_uri": deployment.s3_uri,
        "endpoint_url": deployment.endpoint_url,
        "created_at": deployment.created_at,
        "updated_at": deployment.updated_at,
        "error": deployment.error,
        # 메타데이터
        "pain_point": deployment.pain_point,
        "pattern": deployment.pattern,
        "feasibility_score": deployment.feasibility_score,
    }


@app.delete("/deployments/{deployment_id}")
async def delete_deployment(deployment_id: str):
    """배포 삭제 (boto3 API 기반)"""
    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    runtime_deleted = False
    runtime_error = None

    # runtime_id가 있으면 상태와 관계없이 Runtime 삭제 시도
    # (배포 중/실패/활성 상태 모두 AgentCore에 리소스가 생성되어 있을 수 있음)
    if deployment.runtime_id:
        try:
            print(f"Deleting AgentCore runtime: {deployment.runtime_id} (agent: {deployment.agent_name})")
            # boto3 API로 Runtime 삭제
            runtime_deleted = deployment_service.delete_runtime(
                deployment.runtime_id,
                agent_name=deployment.agent_name
            )
            if runtime_deleted:
                print(f"AgentCore runtime deleted: {deployment.runtime_id}")
            else:
                print(f"AgentCore runtime deletion returned False: {deployment.runtime_id}")
                runtime_error = "Runtime 삭제 실패"
        except Exception as e:
            print(f"Runtime 삭제 실패: {e}")
            runtime_error = str(e)

    success = deployment_manager.delete_deployment(deployment_id)

    if not success:
        raise HTTPException(status_code=500, detail="배포 삭제 실패")

    result = {"message": "배포가 삭제되었습니다", "deployment_id": deployment_id}

    # Runtime 삭제 실패 시 경고 포함
    if deployment.runtime_id and not runtime_deleted:
        result["warning"] = f"Runtime 삭제 실패: {runtime_error or 'Unknown error'}. AWS 콘솔에서 직접 삭제해야 할 수 있습니다."

    return result


@app.post("/deployments/{deployment_id}/invoke")
async def invoke_deployment(deployment_id: str, request: InvokeRuntimeRequest):
    """배포된 Agent 호출 (Playground용) - CLI 기반"""
    import time as time_module
    start_time = time_module.time()

    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    if deployment.status != DeploymentStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail=f"배포가 활성 상태가 아닙니다 (상태: {deployment.status.value})"
        )

    if not deployment.agent_name and not deployment.endpoint_url and not deployment.runtime_id:
        raise HTTPException(status_code=500, detail="Agent 이름, Runtime ID, 또는 엔드포인트 URL이 없습니다")

    try:
        # boto3 invoke_agent_runtime API 호출
        result = await deployment_service.invoke_runtime(
            endpoint_url=deployment.endpoint_url,
            prompt=request.prompt,
            session_id=request.session_id,
            agent_name=deployment.agent_name,
            deployment_id=deployment_id,
            runtime_id=deployment.runtime_id,
            runtime_arn=deployment.runtime_arn  # 직접 지정된 ARN 사용
        )

        # 메트릭 기록
        end_time = time_module.time()
        latency_ms = int((end_time - start_time) * 1000)
        tokens_used = result.get("metadata", {}).get("tokens_used", 0)

        deployment_manager.record_invocation(
            deployment_id=deployment_id,
            latency_ms=latency_ms,
            tokens_used=tokens_used,
            success=True
        )

        return {
            "response": result["response"],
            "session_id": result["session_id"],
            "metadata": {
                **result.get("metadata", {}),
                "latency_ms": latency_ms
            }
        }
    except Exception as e:
        # 실패한 호출도 기록
        end_time = time_module.time()
        latency_ms = int((end_time - start_time) * 1000)
        deployment_manager.record_invocation(
            deployment_id=deployment_id,
            latency_ms=latency_ms,
            tokens_used=0,
            success=False
        )
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/deployments/{deployment_id}/invoke/stream")
async def invoke_deployment_stream(deployment_id: str, request: InvokeRuntimeRequest):
    """배포된 Agent 스트리밍 호출 (Playground용) - SSE"""
    import time as time_module
    start_time = time_module.time()

    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    if deployment.status != DeploymentStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail=f"배포가 활성 상태가 아닙니다 (상태: {deployment.status.value})"
        )

    if not deployment.runtime_id and not deployment.runtime_arn:
        raise HTTPException(status_code=500, detail="Runtime ID 또는 ARN이 없습니다")

    async def generate():
        """SSE 스트리밍 생성기"""
        full_response = ""
        session_id = None
        metadata = {}

        try:
            async for chunk in deployment_service.invoke_runtime_stream(
                prompt=request.prompt,
                runtime_id=deployment.runtime_id,
                runtime_arn=deployment.runtime_arn,
                session_id=request.session_id
            ):
                chunk_type = chunk.get("type", "chunk")

                if chunk_type == "chunk":
                    content = chunk.get("content", "")
                    full_response += content
                    yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"

                elif chunk_type == "done":
                    session_id = chunk.get("session_id")
                    metadata = chunk.get("metadata", {})
                    yield f"data: {json.dumps({'type': 'done', 'session_id': session_id, 'metadata': metadata})}\n\n"

                elif chunk_type == "error":
                    error_msg = chunk.get("content", "Unknown error")
                    yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
                    # 실패 기록
                    end_time = time_module.time()
                    latency_ms = int((end_time - start_time) * 1000)
                    deployment_manager.record_invocation(
                        deployment_id=deployment_id,
                        latency_ms=latency_ms,
                        tokens_used=0,
                        success=False
                    )
                    return

            # 성공 시 메트릭 기록
            end_time = time_module.time()
            latency_ms = int((end_time - start_time) * 1000)
            deployment_manager.record_invocation(
                deployment_id=deployment_id,
                latency_ms=latency_ms,
                tokens_used=metadata.get("tokens_used", 0),
                success=True
            )

        except Exception as e:
            error_msg = str(e)
            yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
            # 실패 기록
            end_time = time_module.time()
            latency_ms = int((end_time - start_time) * 1000)
            deployment_manager.record_invocation(
                deployment_id=deployment_id,
                latency_ms=latency_ms,
                tokens_used=0,
                success=False
            )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/deployments/{deployment_id}/metrics")
async def get_deployment_metrics(deployment_id: str):
    """배포 메트릭 조회"""
    metrics = deployment_manager.get_metrics(deployment_id)

    if not metrics:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    return metrics


@app.get("/deployments/{deployment_id}/versions")
async def get_deployment_versions(deployment_id: str):
    """동일 Agent의 버전 히스토리 조회"""
    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    # 동일 agent_name을 가진 모든 배포 조회
    versions = deployment_manager.get_all_versions_by_agent(deployment.agent_name)

    return {
        "versions": [
            {
                "deployment_id": d.deployment_id,
                "version": d.version,
                "status": d.status.value,
                "created_at": d.created_at,
                "s3_uri": d.s3_uri,
                "is_current": d.deployment_id == deployment_id
            }
            for d in versions
        ]
    }


@app.get("/deployments/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: str,
    limit: int = 100,
    level: Optional[str] = None,
    stage: Optional[str] = None,
    offset: int = 0
):
    """배포 로그 조회"""
    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    logs = deployment_log_manager.get_logs(
        deployment_id=deployment_id,
        limit=limit,
        level=level,
        stage=stage,
        offset=offset
    )

    return {
        "deployment_id": deployment_id,
        "logs": [
            {
                "timestamp": log.timestamp,
                "level": log.level,
                "stage": log.stage,
                "message": log.message
            }
            for log in logs
        ],
        "count": len(logs)
    }


@app.get("/deployments/{deployment_id}/logs/stream")
async def stream_deployment_logs(deployment_id: str):
    """배포 로그 실시간 스트리밍 (SSE)"""
    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    async def generate():
        try:
            async for log in deployment_log_manager.stream_logs(deployment_id):
                yield f"data: {json.dumps(log, ensure_ascii=False)}\n\n"
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


class RollbackRequest(BaseModel):
    target_version: int


@app.post("/deployments/{deployment_id}/rollback")
async def rollback_deployment(deployment_id: str, request: RollbackRequest):
    """배포 롤백 (이전 버전으로 새 배포 생성)"""
    deployment = deployment_manager.get_deployment(deployment_id)

    if not deployment:
        raise HTTPException(status_code=404, detail="배포를 찾을 수 없습니다")

    # 대상 버전 배포 찾기
    target_deployment = deployment_manager.get_deployment_by_version(
        deployment.agent_name,
        request.target_version
    )

    if not target_deployment:
        raise HTTPException(
            status_code=404,
            detail=f"버전 {request.target_version}을(를) 찾을 수 없습니다"
        )

    if not target_deployment.s3_uri:
        raise HTTPException(
            status_code=400,
            detail="롤백할 S3 배포 패키지가 없습니다"
        )

    # 같은 job_id로 새 배포 생성
    new_deployment_id = deployment_manager.create_deployment(
        job_id=target_deployment.job_id,
        agent_name=target_deployment.agent_name,
        region=target_deployment.region,
        pain_point=target_deployment.pain_point,
        pattern=target_deployment.pattern,
        feasibility_score=target_deployment.feasibility_score
    )

    # 롤백 배포는 빌드 건너뛰고 기존 S3 패키지로 Runtime 재생성
    deployment_manager.update_deployment(
        new_deployment_id,
        status=DeploymentStatus.DEPLOYING,
        progress=70,
        message=f"v{request.target_version}에서 롤백 중...",
        s3_uri=target_deployment.s3_uri
    )

    # S3 URI에서 버킷/키 추출
    s3_parts = target_deployment.s3_uri.replace("s3://", "").split("/", 1)
    s3_bucket = s3_parts[0]
    s3_key = s3_parts[1] if len(s3_parts) > 1 else ""

    # Runtime 생성
    runtime_result = deployment_service.create_runtime(
        target_deployment.agent_name,
        s3_bucket,
        s3_key
    )

    deployment_manager.update_deployment(
        new_deployment_id,
        status=DeploymentStatus.ACTIVE,
        progress=100,
        message=f"v{request.target_version}에서 롤백 완료!",
        runtime_id=runtime_result["runtime_id"],
        runtime_arn=runtime_result["runtime_arn"],
        endpoint_url=runtime_result["endpoint_url"]
    )

    return {
        "message": f"v{request.target_version}에서 롤백 완료",
        "new_deployment_id": new_deployment_id,
        "source_version": request.target_version
    }


# ============ Gateway/Identity Endpoints ============

class GatewayCreateRequest(BaseModel):
    integration_id: str
    name: str
    enable_semantic_search: bool = True
    targets: List[Dict[str, Any]] = []


class IdentityProviderCreateRequest(BaseModel):
    integration_id: str
    name: str
    provider_type: str  # 'api-key' or 'oauth2'
    api_key: Optional[Dict[str, str]] = None  # { headerName, apiKeyValue }
    oauth2: Optional[Dict[str, Any]] = None  # { clientId, clientSecret, tokenEndpoint, scopes }


@app.post("/gateways")
async def create_gateway(request: GatewayCreateRequest):
    """Gateway 생성 (AgentCore Gateway API 호출)"""
    from gateway_manager import gateway_manager
    import os

    try:
        # IAM Role ARN
        role_arn = os.environ.get(
            'AGENTCORE_ROLE_ARN',
            f"arn:aws:iam::{gateway_manager.get_account_id()}:role/BedrockAgentCoreRole"
        )

        # Create Gateway with Cognito auth
        result = gateway_manager.create_gateway(
            name=request.name,
            role_arn=role_arn,
            enable_semantic_search=request.enable_semantic_search
        )

        # Add targets
        target_ids = []
        for target in request.targets:
            target_type = target.get('type', '')
            target_name = target.get('name', '')

            # Build credential config based on outboundAuthType
            credential_config = None
            auth_type = target.get('outboundAuthType', 'iam')

            if auth_type == 'iam':
                # IAM role auth - default, no special config needed
                credential_config = gateway_manager.build_credential_config(auth_type='iam')
            elif auth_type in ('api-key', 'oauth') and target.get('credentialProviderArn'):
                # API Key or OAuth with provider
                credential_config = gateway_manager.build_credential_config(
                    auth_type=auth_type,
                    provider_arn=target.get('credentialProviderArn'),
                    provider_type=target.get('credentialProviderType'),
                    api_key_config=target.get('apiKeyConfig'),
                    oauth_scopes=target.get('oauthScopes')
                )
            elif target.get('credentialProviderArn'):
                # Legacy: use credentialProviderType directly (backwards compatibility)
                credential_config = gateway_manager.build_credential_config(
                    auth_type=target.get('credentialProviderType', 'api-key'),
                    provider_arn=target['credentialProviderArn'],
                    api_key_config=target.get('apiKeyConfig')
                )

            if target_type == 'api' and target.get('apiConfig'):
                api_config = target['apiConfig']
                # Upload OpenAPI spec to S3 if available
                if api_config.get('openApiSpec'):
                    s3_uri = gateway_manager.upload_openapi_to_s3(
                        api_config['openApiSpec'],
                        request.name,
                        target_name
                    )
                    target_id = gateway_manager.add_openapi_target(
                        result.gateway_id,
                        target_name,
                        s3_uri,
                        credential_config=credential_config
                    )
                    target_ids.append(target_id)

            elif target_type == 'mcp' and target.get('mcpConfig'):
                mcp_config = target['mcpConfig']
                target_id = gateway_manager.add_mcp_server_target(
                    result.gateway_id,
                    target_name,
                    mcp_config.get('serverUrl', ''),
                    credential_config=credential_config
                )
                target_ids.append(target_id)

            elif target_type == 'lambda' and target.get('lambdaConfig'):
                lambda_config = target['lambdaConfig']
                target_id = gateway_manager.add_lambda_target(
                    result.gateway_id,
                    target_name,
                    lambda_config.get('functionArn', '')
                )
                target_ids.append(target_id)

            # NEW: API Gateway target
            elif target_type == 'apiGateway' and target.get('apiGatewayConfig'):
                apigw_config = target['apiGatewayConfig']
                tool_config = apigw_config.get('apiGatewayToolConfiguration', {})
                target_id = gateway_manager.add_api_gateway_target(
                    gateway_id=result.gateway_id,
                    name=target_name,
                    rest_api_id=apigw_config.get('restApiId', ''),
                    stage=apigw_config.get('stage', ''),
                    tool_filters=tool_config.get('toolFilters', []),
                    tool_overrides=tool_config.get('toolOverrides'),
                    credential_config=credential_config
                )
                target_ids.append(target_id)

            # NEW: Smithy Model target
            elif target_type == 'smithyModel' and target.get('smithyModelConfig'):
                smithy_config = target['smithyModelConfig']
                s3_config = smithy_config.get('s3')
                target_id = gateway_manager.add_smithy_model_target(
                    gateway_id=result.gateway_id,
                    name=target_name,
                    s3_uri=s3_config.get('uri') if s3_config else None,
                    bucket_owner_account_id=s3_config.get('bucketOwnerAccountId') if s3_config else None,
                    inline_payload=smithy_config.get('inlinePayload'),
                    credential_config=credential_config
                )
                target_ids.append(target_id)

        return {
            "gateway_id": result.gateway_id,
            "gateway_url": result.gateway_url,
            "target_ids": target_ids,
            "cognito_pool_id": result.cognito_config.get("user_pool_id") if result.cognito_config else None,
            "cognito_client_id": result.cognito_config.get("client_id") if result.cognito_config else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/gateways/{gateway_id}")
async def delete_gateway(gateway_id: str):
    """Gateway 삭제"""
    from gateway_manager import gateway_manager

    try:
        success = gateway_manager.delete_gateway(gateway_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete gateway")
        return {"message": "Gateway deleted", "gateway_id": gateway_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/identity-providers")
async def create_identity_provider(request: IdentityProviderCreateRequest):
    """Identity Provider 생성 (AgentCore Identity API 호출)"""
    from identity_manager import identity_manager

    try:
        provider_arn = None

        if request.provider_type == 'api-key' and request.api_key:
            api_key_value = request.api_key.get('apiKeyValue', '')
            if not api_key_value:
                raise HTTPException(status_code=400, detail="API key value is required")

            provider_arn = identity_manager.create_api_key_provider(
                name=request.name,
                api_key=api_key_value
            )

        elif request.provider_type == 'oauth2' and request.oauth2:
            oauth2 = request.oauth2
            client_id = oauth2.get('clientId', '')
            client_secret = oauth2.get('clientSecret', '')
            token_endpoint = oauth2.get('tokenEndpoint', '')
            scopes = oauth2.get('scopes', [])

            if not client_id or not client_secret or not token_endpoint:
                raise HTTPException(status_code=400, detail="OAuth2 client credentials are required")

            provider_arn = identity_manager.create_oauth2_provider(
                name=request.name,
                client_id=client_id,
                client_secret=client_secret,
                token_endpoint=token_endpoint,
                scopes=scopes if scopes else None
            )

        else:
            raise HTTPException(status_code=400, detail="Invalid provider type or missing configuration")

        return {"provider_arn": provider_arn}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/identity-providers/{provider_arn:path}")
async def delete_identity_provider(provider_arn: str):
    """Identity Provider 삭제"""
    from identity_manager import identity_manager

    try:
        success = identity_manager.delete_credential_provider(provider_arn)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete identity provider")
        return {"message": "Identity provider deleted", "provider_arn": provider_arn}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ MCP Server Deployment Endpoints ============

class MCPServerDeployRequest(BaseModel):
    mcp_server_id: str
    name: str
    code: str  # main.py 내용
    requirements: str = ""


@app.post("/mcp-servers/deploy")
async def deploy_mcp_server(request: MCPServerDeployRequest):
    """MCP 서버를 AgentCore Runtime에 배포 (비동기)

    MCP 서버를 백그라운드에서 배포합니다.
    배포 상태는 GET /mcp-servers/{mcp_server_id}/deployment 로 확인할 수 있습니다.
    """
    try:
        print(f"🔧 MCP Deploy request: id={request.mcp_server_id}, name={request.name}")
        print(f"   Code length: {len(request.code) if request.code else 0}")
        print(f"   Requirements: {request.requirements[:100] if request.requirements else 'none'}...")

        # MCP 서버 존재 확인
        server = mcp_deployment_manager.get_mcp_server(request.mcp_server_id)
        if not server:
            print(f"❌ MCP server not found: {request.mcp_server_id}")
            raise HTTPException(status_code=404, detail="MCP server not found")

        # source type 확인 (self-hosted, template만 배포 가능)
        source_type = server.get("source", {}).get("type", "")
        print(f"   Source type: {source_type}")
        if source_type not in ["self-hosted", "template"]:
            print(f"❌ Invalid source type: {source_type}")
            raise HTTPException(
                status_code=400,
                detail=f"Only self-hosted or template MCP servers can be deployed (current: {source_type})"
            )

        # 이미 배포 중인지 확인
        current_deployment = server.get("deployment", {})
        current_status = current_deployment.get("status", "none")
        print(f"   Current deployment status: {current_status}")
        if current_status == "deploying":
            print(f"❌ Already deploying")
            raise HTTPException(status_code=400, detail="MCP server is already being deployed")

        # NOTE: 상태 업데이트는 Worker에서 단일 포인트로 관리
        # API 서버에서 중복 업데이트하지 않음 (경쟁 상태 방지)

        # 백그라운드 워커에 제출
        background_worker.submit_mcp_deployment({
            "mcp_server_id": request.mcp_server_id,
            "name": request.name,
            "code": request.code,
            "requirements": request.requirements
        })

        return {
            "status": "deploying",
            "message": "MCP 서버 배포가 시작되었습니다. 상태를 확인하세요.",
            "mcp_server_id": request.mcp_server_id
        }

    except HTTPException:
        raise
    except Exception as e:
        # 실패 시 상태 업데이트
        mcp_deployment_manager.update_deployment_status(
            request.mcp_server_id,
            MCPDeploymentStatus.FAILED,
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/mcp-servers/{mcp_server_id}/deployment")
async def get_mcp_deployment_status(mcp_server_id: str):
    """MCP 서버 배포 상태 조회"""
    try:
        deployment = mcp_deployment_manager.get_deployment_status(mcp_server_id)

        if deployment is None:
            raise HTTPException(status_code=404, detail="MCP server not found")

        return {
            "mcp_server_id": mcp_server_id,
            "deployment": deployment
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/mcp-servers/{mcp_server_id}/logs")
async def get_mcp_deployment_logs(
    mcp_server_id: str,
    limit: int = 100,
    level: Optional[str] = None,
    stage: Optional[str] = None,
    offset: int = 0
):
    """MCP 서버 배포 로그 조회"""
    try:
        # MCP 서버 존재 확인
        server = mcp_deployment_manager.get_mcp_server(mcp_server_id)
        if not server:
            raise HTTPException(status_code=404, detail="MCP server not found")

        # deployment_log_manager 재사용 (mcp_server_id를 deployment_id로 사용)
        logs = deployment_log_manager.get_logs(
            deployment_id=mcp_server_id,
            limit=limit,
            level=level,
            stage=stage,
            offset=offset
        )

        return {
            "mcp_server_id": mcp_server_id,
            "logs": [
                {
                    "timestamp": log.timestamp,
                    "level": log.level,
                    "stage": log.stage,
                    "message": log.message
                }
                for log in logs
            ],
            "count": len(logs)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/mcp-servers/{mcp_server_id}/logs/stream")
async def stream_mcp_deployment_logs(mcp_server_id: str):
    """MCP 서버 배포 로그 실시간 스트리밍 (SSE)"""
    # MCP 서버 존재 확인
    server = mcp_deployment_manager.get_mcp_server(mcp_server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    async def generate():
        try:
            # deployment_log_manager 재사용 (mcp_server_id를 deployment_id로 사용)
            async for log in deployment_log_manager.stream_logs(mcp_server_id):
                yield f"data: {json.dumps(log, ensure_ascii=False)}\n\n"
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


@app.get("/mcp-servers/{mcp_server_id}/versions")
async def get_mcp_version_history(mcp_server_id: str):
    """MCP 서버 버전 히스토리 조회"""
    try:
        server = mcp_deployment_manager.get_mcp_server(mcp_server_id)
        if not server:
            raise HTTPException(status_code=404, detail="MCP server not found")

        deployment = server.get("deployment", {})
        history = deployment.get("history", [])
        current_version = deployment.get("version", 1)

        return {
            "mcp_server_id": mcp_server_id,
            "current_version": current_version,
            "versions": history
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class MCPRollbackRequest(BaseModel):
    target_version: int


class MCPInvokeToolRequest(BaseModel):
    tool: str
    arguments: Dict[str, Any] = {}


@app.get("/mcp-servers/{mcp_server_id}/tools")
async def list_mcp_tools(mcp_server_id: str):
    """배포된 MCP 서버의 도구 목록 조회 (MCP tools/list 호출)"""
    try:
        server = mcp_deployment_manager.get_mcp_server(mcp_server_id)
        if not server:
            raise HTTPException(status_code=404, detail="MCP server not found")

        deployment = server.get("deployment", {})
        if deployment.get("status") != "ready":
            raise HTTPException(
                status_code=400,
                detail=f"MCP 서버가 준비되지 않았습니다 (상태: {deployment.get('status', 'unknown')})"
            )

        endpoint_url = deployment.get("endpointUrl")
        runtime_arn = deployment.get("runtimeArn")

        if not endpoint_url and not runtime_arn:
            raise HTTPException(status_code=500, detail="MCP 서버 엔드포인트 정보가 없습니다")

        # MCP tools/list 호출
        try:
            if runtime_arn:
                # boto3 invoke API 사용
                import boto3
                client = boto3.client('bedrock-agentcore', region_name="us-west-2")

                payload = json.dumps({
                    "jsonrpc": "2.0",
                    "method": "tools/list",
                    "id": 1
                }).encode('utf-8')

                response = client.invoke_agent_runtime(
                    agentRuntimeArn=runtime_arn,
                    payload=payload,
                    contentType='application/json',
                    accept='application/json',
                    runtimeSessionId=f"tools-list-{int(asyncio.get_event_loop().time())}"
                )

                response_body = response.get('response')
                if response_body:
                    response_text = response_body.read().decode('utf-8')
                    response_data = json.loads(response_text) if response_text else {}
                else:
                    response_data = {}

                tools = response_data.get("result", {}).get("tools", [])

            else:
                # HTTP 호출 (fallback)
                import aiohttp
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        endpoint_url,
                        json={
                            "jsonrpc": "2.0",
                            "method": "tools/list",
                            "id": 1
                        },
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        response_data = await resp.json()
                        tools = response_data.get("result", {}).get("tools", [])

            return {
                "mcp_server_id": mcp_server_id,
                "tools": tools
            }

        except Exception as e:
            # MCP 서버에 저장된 도구 정보 반환 (fallback)
            stored_tools = server.get("tools", [])
            return {
                "mcp_server_id": mcp_server_id,
                "tools": stored_tools,
                "note": f"실시간 조회 실패, 저장된 정보 반환: {str(e)}"
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mcp-servers/{mcp_server_id}/invoke")
async def invoke_mcp_tool(mcp_server_id: str, request: MCPInvokeToolRequest):
    """MCP 도구 호출 (MCP tools/call 호출)"""
    try:
        server = mcp_deployment_manager.get_mcp_server(mcp_server_id)
        if not server:
            raise HTTPException(status_code=404, detail="MCP server not found")

        deployment = server.get("deployment", {})
        if deployment.get("status") != "ready":
            raise HTTPException(
                status_code=400,
                detail=f"MCP 서버가 준비되지 않았습니다 (상태: {deployment.get('status', 'unknown')})"
            )

        endpoint_url = deployment.get("endpointUrl")
        runtime_arn = deployment.get("runtimeArn")

        if not endpoint_url and not runtime_arn:
            raise HTTPException(status_code=500, detail="MCP 서버 엔드포인트 정보가 없습니다")

        import time as time_module
        start_time = time_module.time()

        # MCP tools/call 호출
        if runtime_arn:
            # boto3 invoke API 사용
            import boto3
            client = boto3.client('bedrock-agentcore', region_name="us-west-2")

            payload = json.dumps({
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": request.tool,
                    "arguments": request.arguments
                },
                "id": 1
            }).encode('utf-8')

            import uuid
            session_id = str(uuid.uuid4()) + "-" + str(uuid.uuid4())[:8]

            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.invoke_agent_runtime(
                    agentRuntimeArn=runtime_arn,
                    payload=payload,
                    contentType='application/json',
                    accept='application/json',
                    runtimeSessionId=session_id
                )
            )

            response_body = response.get('response')
            if response_body:
                response_text = response_body.read().decode('utf-8')
                response_data = json.loads(response_text) if response_text else {}
            else:
                response_data = {}

        else:
            # HTTP 호출 (fallback)
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint_url,
                    json={
                        "jsonrpc": "2.0",
                        "method": "tools/call",
                        "params": {
                            "name": request.tool,
                            "arguments": request.arguments
                        },
                        "id": 1
                    },
                    timeout=aiohttp.ClientTimeout(total=120)
                ) as resp:
                    response_data = await resp.json()

        latency_ms = int((time_module.time() - start_time) * 1000)

        return {
            "mcp_server_id": mcp_server_id,
            "tool": request.tool,
            "result": response_data.get("result"),
            "error": response_data.get("error"),
            "metadata": {
                "latency_ms": latency_ms
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mcp-servers/{mcp_server_id}/rollback")
async def rollback_mcp_server(mcp_server_id: str, request: MCPRollbackRequest):
    """MCP 서버 롤백 (이전 버전으로 재배포)"""
    try:
        server = mcp_deployment_manager.get_mcp_server(mcp_server_id)
        if not server:
            raise HTTPException(status_code=404, detail="MCP server not found")

        deployment = server.get("deployment", {})
        history = deployment.get("history", [])

        # 대상 버전 찾기
        target_entry = None
        for entry in history:
            if entry.get("version") == request.target_version:
                target_entry = entry
                break

        if not target_entry:
            raise HTTPException(
                status_code=404,
                detail=f"버전 {request.target_version}을(를) 찾을 수 없습니다"
            )

        if not target_entry.get("s3Uri"):
            raise HTTPException(
                status_code=400,
                detail="롤백할 S3 배포 패키지가 없습니다"
            )

        # 현재 배포 중인지 확인
        if deployment.get("status") == "deploying":
            raise HTTPException(status_code=400, detail="이미 배포 중입니다")

        # S3 URI에서 버킷/키 추출
        s3_uri = target_entry.get("s3Uri")
        s3_parts = s3_uri.replace("s3://", "").split("/", 1)
        s3_bucket = s3_parts[0]
        s3_key = s3_parts[1] if len(s3_parts) > 1 else ""

        # 상태 업데이트: deploying
        mcp_deployment_manager.update_deployment_status(
            mcp_server_id,
            MCPDeploymentStatus.DEPLOYING,
            progress=70
        )
        deployment_log_manager.info(mcp_server_id, "deploy", f"v{request.target_version}에서 롤백 시작...")

        # Runtime 재생성
        from deployment_service import deployment_service, sanitize_agent_name

        sanitized_name = sanitize_agent_name(f"mcp_{server.get('name', mcp_server_id)}")

        runtime_result = deployment_service.create_runtime(
            sanitized_name,
            s3_bucket,
            s3_key,
            protocol_type="MCP"
        )

        # READY 대기
        await deployment_service.wait_for_runtime_ready(
            runtime_result["runtime_id"],
            timeout=300,
            poll_interval=10
        )

        # 새 버전으로 상태 업데이트
        new_version = mcp_deployment_manager.get_next_version(mcp_server_id)
        mcp_deployment_manager.update_deployment_status(
            mcp_server_id,
            MCPDeploymentStatus.READY,
            runtime_arn=runtime_result.get("runtime_arn"),
            endpoint_url=runtime_result.get("endpoint_url"),
            runtime_id=runtime_result.get("runtime_id"),
            s3_uri=s3_uri,
            version=new_version
        )

        deployment_log_manager.info(mcp_server_id, "deploy", f"v{request.target_version}에서 롤백 완료! (새 버전: v{new_version})")

        return {
            "success": True,
            "message": f"v{request.target_version}에서 롤백 완료",
            "new_version": new_version,
            "runtime_id": runtime_result.get("runtime_id")
        }

    except HTTPException:
        raise
    except Exception as e:
        deployment_log_manager.error(mcp_server_id, "deploy", f"롤백 실패: {str(e)}")
        mcp_deployment_manager.update_deployment_status(
            mcp_server_id,
            MCPDeploymentStatus.FAILED,
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/mcp-servers/{mcp_server_id}/runtime")
async def delete_mcp_runtime(mcp_server_id: str):
    """MCP 서버 Runtime 삭제 (AgentCore에서 삭제)

    MCP 서버가 삭제될 때 AgentCore Runtime도 함께 삭제합니다.
    DynamoDB에서 MCP 서버 레코드 삭제 전에 호출해야 합니다.
    """
    try:
        server = mcp_deployment_manager.get_mcp_server(mcp_server_id)
        if not server:
            # 서버가 없으면 삭제할 것이 없음 - 성공으로 처리
            return {
                "success": True,
                "message": "MCP server not found, nothing to delete",
                "runtime_deleted": False
            }

        deployment = server.get("deployment", {})
        runtime_id = deployment.get("runtimeId")

        if not runtime_id:
            # Runtime이 없으면 삭제할 것이 없음
            return {
                "success": True,
                "message": "No runtime to delete",
                "runtime_deleted": False
            }

        # AgentCore Runtime 삭제
        server_name = server.get("name", mcp_server_id)
        print(f"🗑️ Deleting MCP Runtime: {runtime_id} (server: {server_name})")

        runtime_deleted = deployment_service.delete_runtime(
            runtime_id,
            agent_name=f"mcp_{server_name}"
        )

        if runtime_deleted:
            print(f"✅ MCP Runtime deleted: {runtime_id}")
            return {
                "success": True,
                "message": "Runtime deleted successfully",
                "runtime_deleted": True,
                "runtime_id": runtime_id
            }
        else:
            print(f"⚠️ MCP Runtime deletion returned False: {runtime_id}")
            return {
                "success": True,
                "message": "Runtime deletion returned false (may already be deleted)",
                "runtime_deleted": False,
                "runtime_id": runtime_id
            }

    except Exception as e:
        print(f"❌ Failed to delete MCP Runtime: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001
    )
