"""
백그라운드 워커 (코드 생성 작업 처리)
"""
import threading
import queue
import time
from job_manager import job_manager, JobStatus
from code_generator_agent import code_generator_agent

class BackgroundWorker:
    """백그라운드 작업 처리 워커"""

    def __init__(self):
        self.job_queue = queue.Queue()
        self.worker_thread = None
        self.running = False

    def start(self):
        """워커 시작"""
        if self.running:
            return

        self.running = True
        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.worker_thread.start()
        print("✅ Background worker started")

    def stop(self):
        """워커 중지"""
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        print("🛑 Background worker stopped")

    def submit_job(self, job_id: str):
        """작업 제출"""
        self.job_queue.put(job_id)
        print(f"📥 Job submitted: {job_id}")

    def _worker_loop(self):
        """워커 메인 루프"""
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

# 싱글톤 인스턴스
background_worker = BackgroundWorker()
