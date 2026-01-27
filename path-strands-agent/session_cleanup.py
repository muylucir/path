"""
세션 정리 스케줄러

FastAPI lifespan 이벤트로 백그라운드 세션 정리 실행
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Callable, Any

from session_manager import SecureSessionManager, SESSION_CLEANUP_INTERVAL

logger = logging.getLogger(__name__)


class SessionCleanupScheduler:
    """
    백그라운드 세션 정리 스케줄러

    FastAPI lifespan 이벤트와 통합하여
    주기적으로 만료된 세션을 정리합니다.
    """

    def __init__(
        self,
        cleanup_interval: int = SESSION_CLEANUP_INTERVAL,
    ):
        self._cleanup_interval = cleanup_interval
        self._session_managers: List[SecureSessionManager] = []
        self._task: asyncio.Task = None
        self._running = False

    def register_manager(self, manager: SecureSessionManager) -> None:
        """
        정리 대상 세션 관리자 등록

        Args:
            manager: SecureSessionManager 인스턴스
        """
        if manager not in self._session_managers:
            self._session_managers.append(manager)
            logger.info(f"세션 관리자 등록됨. 총 {len(self._session_managers)}개")

    async def _cleanup_loop(self) -> None:
        """백그라운드 정리 루프"""
        logger.info(f"세션 정리 스케줄러 시작 (간격: {self._cleanup_interval}초)")

        while self._running:
            try:
                await asyncio.sleep(self._cleanup_interval)

                if not self._running:
                    break

                total_cleaned = 0
                for manager in self._session_managers:
                    cleaned = manager.cleanup()
                    total_cleaned += cleaned

                if total_cleaned > 0:
                    logger.info(f"만료된 세션 {total_cleaned}개 정리됨")

            except asyncio.CancelledError:
                logger.info("세션 정리 스케줄러 종료 요청")
                break
            except Exception as e:
                logger.error(f"세션 정리 중 오류: {e}")
                # 오류 발생해도 계속 실행
                await asyncio.sleep(self._cleanup_interval)

    async def start(self) -> None:
        """스케줄러 시작"""
        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._cleanup_loop())
        logger.info("세션 정리 스케줄러 시작됨")

    async def stop(self) -> None:
        """스케줄러 중지"""
        self._running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

        logger.info("세션 정리 스케줄러 중지됨")


# 글로벌 스케줄러 인스턴스
_cleanup_scheduler: SessionCleanupScheduler = None


def get_cleanup_scheduler() -> SessionCleanupScheduler:
    """글로벌 스케줄러 인스턴스 반환"""
    global _cleanup_scheduler
    if _cleanup_scheduler is None:
        _cleanup_scheduler = SessionCleanupScheduler()
    return _cleanup_scheduler


@asynccontextmanager
async def session_cleanup_lifespan(app: Any):
    """
    FastAPI lifespan 이벤트 핸들러

    사용법:
        from session_cleanup import session_cleanup_lifespan

        app = FastAPI(lifespan=session_cleanup_lifespan)

    또는 기존 lifespan과 조합:
        @asynccontextmanager
        async def lifespan(app):
            async with session_cleanup_lifespan(app):
                # 다른 초기화 작업
                yield
                # 다른 정리 작업
    """
    scheduler = get_cleanup_scheduler()
    await scheduler.start()

    try:
        yield
    finally:
        await scheduler.stop()
