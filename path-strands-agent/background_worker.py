"""
백그라운드 워커 (코드 생성, 배포, MCP 서버 배포 작업 처리)
"""
import threading
import queue
import time
import asyncio
from job_manager import job_manager, JobStatus
from code_generator_agent import code_generator_agent
from deployment_manager import deployment_manager, DeploymentStatus
from deployment_service import deployment_service
from deployment_log_manager import deployment_log_manager
from mcp_deployment_manager import mcp_deployment_manager, MCPDeploymentStatus


class BackgroundWorker:
    """백그라운드 작업 처리 워커"""

    def __init__(self):
        self.job_queue = queue.Queue()
        self.deployment_queue = queue.Queue()
        self.mcp_deployment_queue = queue.Queue()  # MCP 배포 큐 추가
        self.worker_thread = None
        self.deployment_thread = None
        self.mcp_deployment_thread = None  # MCP 배포 스레드 추가
        self.running = False

    def start(self):
        """워커 시작"""
        if self.running:
            return

        self.running = True

        # 코드 생성 워커
        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.worker_thread.start()

        # 배포 워커
        self.deployment_thread = threading.Thread(target=self._deployment_loop, daemon=True)
        self.deployment_thread.start()

        # MCP 배포 워커
        self.mcp_deployment_thread = threading.Thread(target=self._mcp_deployment_loop, daemon=True)
        self.mcp_deployment_thread.start()

        print("✅ Background worker started (code generation + deployment + MCP deployment)")

    def stop(self):
        """워커 중지"""
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        if self.deployment_thread:
            self.deployment_thread.join(timeout=5)
        if self.mcp_deployment_thread:
            self.mcp_deployment_thread.join(timeout=5)
        print("🛑 Background worker stopped")

    def submit_job(self, job_id: str):
        """코드 생성 작업 제출"""
        self.job_queue.put(job_id)
        print(f"📥 Job submitted: {job_id}")

    def submit_deployment(self, deployment_id: str):
        """배포 작업 제출"""
        self.deployment_queue.put(deployment_id)
        print(f"🚀 Deployment submitted: {deployment_id}")

    def submit_mcp_deployment(self, mcp_data: dict):
        """MCP 서버 배포 작업 제출

        Args:
            mcp_data: {
                "mcp_server_id": str,
                "name": str,
                "code": str,  # main.py 내용
                "requirements": str
            }
        """
        self.mcp_deployment_queue.put(mcp_data)
        print(f"🔧 MCP deployment submitted: {mcp_data.get('mcp_server_id')}")

    def _worker_loop(self):
        """코드 생성 워커 메인 루프"""
        while self.running:
            try:
                # 작업 가져오기 (1초 타임아웃)
                job_id = self.job_queue.get(timeout=1)
                self._process_job(job_id)
                self.job_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"❌ Worker error: {e}")

    def _deployment_loop(self):
        """배포 워커 메인 루프"""
        # 각 스레드에서 이벤트 루프 생성
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        while self.running:
            try:
                # 배포 작업 가져오기 (1초 타임아웃)
                deployment_id = self.deployment_queue.get(timeout=1)
                loop.run_until_complete(self._process_deployment(deployment_id))
                self.deployment_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"❌ Deployment worker error: {e}")

        loop.close()

    def _process_job(self, job_id: str):
        """작업 처리"""
        job = job_manager.get_job(job_id)
        if not job:
            print(f"⚠️ Job not found: {job_id}")
            return

        try:
            # 상태 업데이트: processing
            job_manager.update_job(
                job_id,
                status=JobStatus.PROCESSING,
                progress=5,
                message="코드 생성 준비 중..."
            )

            print(f"🚀 Processing job: {job_id}")

            # 코드 생성 (동기)
            # 진행 상황 업데이트
            job_manager.update_job(job_id, progress=15, message="통합 정보 처리 중...")
            time.sleep(0.1)  # 상태 저장 시간 확보

            job_manager.update_job(job_id, progress=25, message="프롬프트 구성 중...")
            time.sleep(0.1)

            job_manager.update_job(job_id, progress=30, message="Claude Opus 4.5로 코드 생성 중... (2-3분 소요)")

            # 실제 코드 생성
            files = code_generator_agent.generate(
                path_spec=job.path_spec,
                integration_details=job.integration_details
            )

            job_manager.update_job(job_id, progress=85, message="파일 파싱 완료")
            time.sleep(0.1)

            # 완료
            job_manager.update_job(
                job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                message="코드 생성 완료!",
                result=files
            )

            print(f"✅ Job completed: {job_id} ({len(files)} files)")

        except Exception as e:
            print(f"❌ Job failed: {job_id} - {e}")
            job_manager.update_job(
                job_id,
                status=JobStatus.FAILED,
                message="코드 생성 실패",
                error=str(e)
            )

    async def _process_deployment(self, deployment_id: str):
        """배포 작업 처리"""
        deployment = deployment_manager.get_deployment(deployment_id)
        if not deployment:
            print(f"⚠️ Deployment not found: {deployment_id}")
            return

        try:
            # 로그 시작
            deployment_log_manager.info(deployment_id, "build", "배포 작업 시작")

            # 연결된 코드 생성 작업 조회
            job = job_manager.get_job(deployment.job_id)
            if not job:
                deployment_log_manager.error(deployment_id, "build", f"코드 생성 작업을 찾을 수 없음: {deployment.job_id}")
                raise Exception(f"연결된 코드 생성 작업을 찾을 수 없습니다: {deployment.job_id}")

            if job.status != JobStatus.COMPLETED:
                deployment_log_manager.error(deployment_id, "build", f"코드 생성 미완료 (상태: {job.status.value})")
                raise Exception(f"코드 생성이 완료되지 않았습니다 (상태: {job.status.value})")

            if not job.result:
                deployment_log_manager.error(deployment_id, "build", "생성된 코드 파일이 없음")
                raise Exception("생성된 코드 파일이 없습니다")

            deployment_log_manager.info(deployment_id, "build", f"코드 파일 {len(job.result)}개 확인됨")

            # 상태 업데이트: building
            deployment_manager.update_deployment(
                deployment_id,
                status=DeploymentStatus.BUILDING,
                progress=5,
                message="배포 시작 중..."
            )
            deployment_log_manager.info(deployment_id, "build", "AgentCore CLI 배포 시작")

            print(f"🚀 Processing deployment: {deployment_id}")

            # 진행률 콜백 함수 (로그 포함)
            async def progress_callback(progress: int, message: str):
                # 상태 결정
                if progress < 45:
                    status = DeploymentStatus.BUILDING
                    stage = "build"
                elif progress < 65:
                    status = DeploymentStatus.PUSHING  # S3 업로드
                    stage = "push"
                else:
                    status = DeploymentStatus.DEPLOYING  # Runtime 생성/대기
                    stage = "deploy"

                deployment_manager.update_deployment(
                    deployment_id,
                    status=status,
                    progress=progress,
                    message=message
                )

                # 로그 기록
                deployment_log_manager.info(deployment_id, stage, f"[{progress}%] {message}")

            # 배포 실행
            deployment_log_manager.info(deployment_id, "build", f"Agent 이름: {deployment.agent_name}")
            deployment_log_manager.info(deployment_id, "build", f"배포 리전: {deployment.region}")
            deployment_log_manager.info(deployment_id, "build", f"버전: v{deployment.version}")

            result = await deployment_service.deploy_agent(
                deployment_id=deployment_id,
                agent_name=deployment.agent_name,
                files=job.result,
                region=deployment.region,
                version=deployment.version,
                progress_callback=progress_callback
            )

            if result.success:
                # 완료
                deployment_manager.update_deployment(
                    deployment_id,
                    status=DeploymentStatus.ACTIVE,
                    progress=100,
                    message="배포 완료!",
                    runtime_id=result.runtime_id,
                    runtime_arn=result.runtime_arn,
                    s3_uri=result.s3_uri,
                    endpoint_url=result.endpoint_url
                )
                deployment_log_manager.info(deployment_id, "deploy", "AgentCore Runtime 배포 완료!")
                deployment_log_manager.info(deployment_id, "deploy", f"Runtime ID: {result.runtime_id}")
                deployment_log_manager.info(deployment_id, "deploy", f"Runtime ARN: {result.runtime_arn}")
                deployment_log_manager.info(deployment_id, "deploy", f"S3 URI: {result.s3_uri}")
                deployment_log_manager.info(deployment_id, "deploy", f"엔드포인트: {result.endpoint_url}")
                print(f"Deployment completed: {deployment_id}")
            else:
                deployment_log_manager.error(deployment_id, "deploy", result.error or "배포 실패")
                raise Exception(result.error or "배포 실패")

        except Exception as e:
            print(f"❌ Deployment failed: {deployment_id} - {e}")
            deployment_log_manager.error(deployment_id, "deploy", f"배포 실패: {str(e)}")
            deployment_manager.update_deployment(
                deployment_id,
                status=DeploymentStatus.FAILED,
                message="배포 실패",
                error=str(e)
            )

    def _mcp_deployment_loop(self):
        """MCP 배포 워커 메인 루프"""
        # 각 스레드에서 이벤트 루프 생성
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        while self.running:
            try:
                # MCP 배포 작업 가져오기 (1초 타임아웃)
                mcp_data = self.mcp_deployment_queue.get(timeout=1)
                loop.run_until_complete(self._process_mcp_deployment(mcp_data))
                self.mcp_deployment_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"❌ MCP deployment worker error: {e}")

        loop.close()

    async def _process_mcp_deployment(self, mcp_data: dict):
        """MCP 서버 배포 작업 처리"""
        mcp_server_id = mcp_data.get("mcp_server_id")
        name = mcp_data.get("name")
        code = mcp_data.get("code")
        requirements = mcp_data.get("requirements", "")

        # mcp_server_id가 없으면 상태 업데이트 불가 - 즉시 반환
        if not mcp_server_id:
            print(f"❌ MCP deployment data missing mcp_server_id")
            return

        # 필수 필드 검증 - 실패 시 상태 업데이트 후 반환
        if not name or not code:
            print(f"❌ Invalid MCP deployment data: mcp_server_id={mcp_server_id}, name={name}, code_len={len(code) if code else 0}")
            mcp_deployment_manager.update_deployment_status(
                mcp_server_id,
                MCPDeploymentStatus.FAILED,
                error="필수 필드 누락: name 또는 code가 비어 있습니다"
            )
            deployment_log_manager.error(mcp_server_id, "build", "필수 필드 누락: name 또는 code가 비어 있습니다")
            return

        print(f"🔧 Processing MCP deployment: {mcp_server_id} ({name})")

        # 로그 시작
        deployment_log_manager.info(mcp_server_id, "build", "MCP 서버 배포 시작")
        deployment_log_manager.info(mcp_server_id, "build", f"서버 이름: {name}")
        deployment_log_manager.info(mcp_server_id, "build", f"코드 길이: {len(code)} bytes")

        try:
            # 상태를 deploying으로 업데이트 (Worker가 유일한 업데이트 포인트)
            mcp_deployment_manager.update_deployment_status(
                mcp_server_id,
                MCPDeploymentStatus.DEPLOYING
            )

            # 진행률 콜백 함수 (로그 포함)
            async def progress_callback(progress: int, message: str):
                # 스테이지 결정
                if progress < 45:
                    stage = "build"
                elif progress < 65:
                    stage = "push"
                else:
                    stage = "deploy"

                print(f"  [{progress}%] {message}")
                deployment_log_manager.info(mcp_server_id, stage, f"[{progress}%] {message}")

            # 배포 실행
            result = await deployment_service.deploy_mcp_server(
                mcp_server_id=mcp_server_id,
                name=name,
                main_py=code,
                requirements=requirements,
                progress_callback=progress_callback
            )

            if result.success:
                # 버전 추출 (S3 URI에서 추출)
                version = 1
                if result.s3_uri:
                    import re
                    version_match = re.search(r'/v(\d+)/', result.s3_uri)
                    if version_match:
                        version = int(version_match.group(1))

                # 성공: 상태 업데이트 (버전 포함)
                mcp_deployment_manager.update_deployment_status(
                    mcp_server_id,
                    MCPDeploymentStatus.READY,
                    runtime_arn=result.runtime_arn,
                    endpoint_url=result.endpoint_url,
                    runtime_id=result.runtime_id,
                    s3_uri=result.s3_uri,
                    version=version
                )
                deployment_log_manager.info(mcp_server_id, "deploy", "MCP 서버 배포 완료!")
                deployment_log_manager.info(mcp_server_id, "deploy", f"Runtime ID: {result.runtime_id}")
                deployment_log_manager.info(mcp_server_id, "deploy", f"Runtime ARN: {result.runtime_arn}")
                deployment_log_manager.info(mcp_server_id, "deploy", f"S3 URI: {result.s3_uri}")
                deployment_log_manager.info(mcp_server_id, "deploy", f"엔드포인트: {result.endpoint_url}")
                print(f"✅ MCP deployment completed: {mcp_server_id}")
                print(f"   Runtime ARN: {result.runtime_arn}")
                print(f"   Endpoint: {result.endpoint_url}")
            else:
                # 실패: 상태 업데이트
                mcp_deployment_manager.update_deployment_status(
                    mcp_server_id,
                    MCPDeploymentStatus.FAILED,
                    error=result.error
                )
                deployment_log_manager.error(mcp_server_id, "deploy", f"배포 실패: {result.error}")
                print(f"❌ MCP deployment failed: {mcp_server_id} - {result.error}")

        except Exception as e:
            print(f"❌ MCP deployment error: {mcp_server_id} - {e}")
            deployment_log_manager.error(mcp_server_id, "deploy", f"배포 오류: {str(e)}")
            mcp_deployment_manager.update_deployment_status(
                mcp_server_id,
                MCPDeploymentStatus.FAILED,
                error=str(e)
            )


# 싱글톤 인스턴스
background_worker = BackgroundWorker()
