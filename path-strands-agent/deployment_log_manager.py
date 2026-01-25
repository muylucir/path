"""
배포 로그 관리자 - 배포 과정 및 런타임 로그 관리
"""
import json
import time
import logging
import asyncio
from typing import Dict, List, Optional, AsyncGenerator
from dataclasses import dataclass, asdict
from pathlib import Path
import threading
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class DeploymentLog:
    """배포 로그 항목"""
    timestamp: float
    level: str  # info, warning, error
    stage: str  # build, push, deploy, runtime
    message: str


class DeploymentLogManager:
    """배포 로그 관리자 (파일 기반)"""

    def __init__(self, log_dir: str = "/tmp/deployment-logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        # 실시간 스트리밍을 위한 구독자 관리
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def _get_log_file(self, deployment_id: str) -> Path:
        """로그 파일 경로 반환"""
        return self.log_dir / f"{deployment_id}.jsonl"

    def add_log(
        self,
        deployment_id: str,
        level: str,
        stage: str,
        message: str
    ) -> DeploymentLog:
        """로그 추가"""
        log = DeploymentLog(
            timestamp=time.time(),
            level=level,
            stage=stage,
            message=message
        )

        # 파일에 저장 (JSONL 형식)
        with self.lock:
            log_file = self._get_log_file(deployment_id)
            with open(log_file, 'a') as f:
                f.write(json.dumps(asdict(log), ensure_ascii=False) + '\n')

        # 구독자에게 알림 (실시간 스트리밍용)
        self._notify_subscribers(deployment_id, log)

        logger.debug(f"Log added [{deployment_id}]: [{level}] {stage} - {message}")
        return log

    def info(self, deployment_id: str, stage: str, message: str) -> DeploymentLog:
        """INFO 레벨 로그 추가"""
        return self.add_log(deployment_id, "info", stage, message)

    def warning(self, deployment_id: str, stage: str, message: str) -> DeploymentLog:
        """WARNING 레벨 로그 추가"""
        return self.add_log(deployment_id, "warning", stage, message)

    def error(self, deployment_id: str, stage: str, message: str) -> DeploymentLog:
        """ERROR 레벨 로그 추가"""
        return self.add_log(deployment_id, "error", stage, message)

    def get_logs(
        self,
        deployment_id: str,
        limit: int = 100,
        level: Optional[str] = None,
        stage: Optional[str] = None,
        offset: int = 0
    ) -> List[DeploymentLog]:
        """로그 조회"""
        log_file = self._get_log_file(deployment_id)

        if not log_file.exists():
            return []

        logs = []
        with self.lock:
            with open(log_file, 'r') as f:
                for line in f:
                    try:
                        data = json.loads(line.strip())
                        log = DeploymentLog(**data)

                        # 필터 적용
                        if level and log.level != level:
                            continue
                        if stage and log.stage != stage:
                            continue

                        logs.append(log)
                    except Exception as e:
                        logger.error(f"Failed to parse log line: {e}")

        # 최신순 정렬 후 offset/limit 적용
        logs.sort(key=lambda x: x.timestamp, reverse=True)

        if offset:
            logs = logs[offset:]

        return logs[:limit]

    def delete_logs(self, deployment_id: str) -> bool:
        """배포 로그 삭제"""
        log_file = self._get_log_file(deployment_id)

        with self.lock:
            if log_file.exists():
                log_file.unlink()
                return True
            return False

    def _notify_subscribers(self, deployment_id: str, log: DeploymentLog):
        """구독자에게 새 로그 알림"""
        if deployment_id in self._subscribers:
            log_dict = asdict(log)
            for q in self._subscribers[deployment_id]:
                try:
                    q.put_nowait(log_dict)
                except asyncio.QueueFull:
                    # 큐가 가득 찬 경우 오래된 항목 제거
                    try:
                        q.get_nowait()
                        q.put_nowait(log_dict)
                    except:
                        pass

    def subscribe(self, deployment_id: str) -> asyncio.Queue:
        """실시간 로그 구독"""
        q = asyncio.Queue(maxsize=100)
        if deployment_id not in self._subscribers:
            self._subscribers[deployment_id] = []
        self._subscribers[deployment_id].append(q)
        return q

    def unsubscribe(self, deployment_id: str, queue: asyncio.Queue):
        """구독 해제"""
        if deployment_id in self._subscribers:
            try:
                self._subscribers[deployment_id].remove(queue)
                if not self._subscribers[deployment_id]:
                    del self._subscribers[deployment_id]
            except ValueError:
                pass

    async def stream_logs(
        self,
        deployment_id: str,
        include_history: bool = True,
        history_limit: int = 50
    ) -> AsyncGenerator[Dict, None]:
        """실시간 로그 스트리밍 (SSE용)"""
        # 히스토리 먼저 전송
        if include_history:
            history = self.get_logs(deployment_id, limit=history_limit)
            # 오래된 것부터 전송
            for log in reversed(history):
                yield asdict(log)

        # 구독 시작
        queue = self.subscribe(deployment_id)

        try:
            while True:
                try:
                    # 새 로그 대기 (30초 타임아웃)
                    log = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield log
                except asyncio.TimeoutError:
                    # 타임아웃 시 heartbeat 전송
                    yield {"type": "heartbeat", "timestamp": time.time()}
        finally:
            self.unsubscribe(deployment_id, queue)


# 싱글톤 인스턴스
deployment_log_manager = DeploymentLogManager()
