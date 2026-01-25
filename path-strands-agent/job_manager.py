"""
코드 생성 작업 관리자 (비동기 작업 큐)
"""
import uuid
import json
import time
from typing import Dict, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import threading
from pathlib import Path

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class CodeGenerationJob:
    """코드 생성 작업"""
    job_id: str
    status: JobStatus
    progress: int  # 0-100
    message: str
    path_spec: str
    integration_details: list
    created_at: float
    updated_at: float
    result: Optional[Dict[str, str]] = None  # 생성된 파일들
    error: Optional[str] = None
    # 메타데이터 (UI 표시용)
    pain_point: Optional[str] = None
    pattern: Optional[str] = None
    feasibility_score: Optional[int] = None

class JobManager:
    """작업 관리자 (메모리 기반, 나중에 DynamoDB로 확장 가능)"""

    def __init__(self, storage_dir: str = "/tmp/code-generation-jobs"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        self.jobs: Dict[str, CodeGenerationJob] = {}
        self.lock = threading.Lock()

        # 재시작 시 기존 작업 로드
        self._load_jobs()

    def create_job(
        self,
        path_spec: str,
        integration_details: list,
        pain_point: Optional[str] = None,
        pattern: Optional[str] = None,
        feasibility_score: Optional[int] = None
    ) -> str:
        """새 작업 생성"""
        job_id = str(uuid.uuid4())
        now = time.time()

        job = CodeGenerationJob(
            job_id=job_id,
            status=JobStatus.PENDING,
            progress=0,
            message="작업 대기 중...",
            path_spec=path_spec,
            integration_details=integration_details,
            created_at=now,
            updated_at=now,
            pain_point=pain_point,
            pattern=pattern,
            feasibility_score=feasibility_score
        )

        with self.lock:
            self.jobs[job_id] = job
            self._save_job(job)

        return job_id

    def get_job(self, job_id: str) -> Optional[CodeGenerationJob]:
        """작업 조회"""
        with self.lock:
            return self.jobs.get(job_id)

    def update_job(self, job_id: str, **kwargs):
        """작업 상태 업데이트"""
        with self.lock:
            if job_id not in self.jobs:
                return

            job = self.jobs[job_id]
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)

            job.updated_at = time.time()
            self._save_job(job)

    def delete_job(self, job_id: str) -> bool:
        """작업 삭제"""
        with self.lock:
            if job_id not in self.jobs:
                return False

            # 메모리에서 삭제
            del self.jobs[job_id]

            # 파일에서 삭제
            job_file = self.storage_dir / f"{job_id}.json"
            if job_file.exists():
                job_file.unlink()

            return True

    def _save_job(self, job: CodeGenerationJob):
        """작업을 파일에 저장"""
        job_file = self.storage_dir / f"{job.job_id}.json"

        # result(Dict)를 JSON 직렬화 가능하게 변환
        job_dict = asdict(job)
        job_dict['status'] = job.status.value

        with open(job_file, 'w') as f:
            json.dump(job_dict, f, ensure_ascii=False, indent=2)

    def _load_jobs(self):
        """저장된 작업들 로드"""
        for job_file in self.storage_dir.glob("*.json"):
            try:
                with open(job_file, 'r') as f:
                    data = json.load(f)

                # 재시작 시 processing 상태는 failed로 변경
                if data['status'] == JobStatus.PROCESSING.value:
                    data['status'] = JobStatus.FAILED.value
                    data['error'] = "서버 재시작으로 인한 작업 중단"

                job = CodeGenerationJob(
                    job_id=data['job_id'],
                    status=JobStatus(data['status']),
                    progress=data['progress'],
                    message=data['message'],
                    path_spec=data['path_spec'],
                    integration_details=data['integration_details'],
                    created_at=data['created_at'],
                    updated_at=data['updated_at'],
                    result=data.get('result'),
                    error=data.get('error')
                )

                self.jobs[job.job_id] = job
            except Exception as e:
                print(f"⚠️ 작업 로드 실패 ({job_file}): {e}")

    def list_recent_jobs(self, limit: int = 10) -> list:
        """최근 작업 목록"""
        with self.lock:
            jobs = sorted(
                self.jobs.values(),
                key=lambda j: j.created_at,
                reverse=True
            )
            return jobs[:limit]

# 싱글톤 인스턴스
job_manager = JobManager()
