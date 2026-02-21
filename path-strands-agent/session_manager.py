"""
보안 세션 관리자

보안 취약점 수정:
- 예측 가능한 세션 ID → SHA-256 기반 랜덤 ID
- 세션 정리 부재 → TTL 및 자동 정리
"""

import logging
import secrets
import hashlib
import time
import threading
from typing import Dict, Any, Optional, TypeVar, Generic
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)

# 세션 설정 상수
SESSION_TTL_SECONDS = 3600  # 60분
MAX_SESSIONS = 100
SESSION_CLEANUP_INTERVAL = 300  # 5분
SESSION_ID_PREFIX = "sess_"


@dataclass
class Session:
    """세션 데이터 컨테이너"""
    id: str
    data: Any
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    ttl: int = SESSION_TTL_SECONDS

    def is_expired(self) -> bool:
        """세션 만료 여부 확인"""
        return time.time() - self.last_accessed > self.ttl

    def touch(self) -> None:
        """세션 접근 시간 갱신"""
        self.last_accessed = time.time()


T = TypeVar('T')


class SecureSessionManager(Generic[T]):
    """
    보안 세션 관리자

    특징:
    - SHA-256 기반 예측 불가능한 세션 ID
    - TTL 기반 자동 만료
    - 최대 세션 수 제한
    - 스레드 안전
    """

    def __init__(
        self,
        max_sessions: int = MAX_SESSIONS,
        ttl_seconds: int = SESSION_TTL_SECONDS
    ):
        self._sessions: Dict[str, Session] = {}
        self._lock = threading.RLock()
        self._max_sessions = max_sessions
        self._ttl_seconds = ttl_seconds

    def generate_session_id(self) -> str:
        """
        보안 세션 ID 생성

        32바이트 랜덤 토큰을 SHA-256 해시하여
        예측 불가능한 세션 ID 생성
        """
        random_bytes = secrets.token_bytes(32)
        timestamp_bytes = str(time.time_ns()).encode()
        combined = random_bytes + timestamp_bytes

        hash_object = hashlib.sha256(combined)
        session_hash = hash_object.hexdigest()[:48]  # 48자 해시

        return f"{SESSION_ID_PREFIX}{session_hash}"

    def create_session(self, data: T) -> str:
        """
        새 세션 생성

        Args:
            data: 세션에 저장할 데이터

        Returns:
            생성된 세션 ID

        Raises:
            RuntimeError: 최대 세션 수 초과 시
        """
        with self._lock:
            # 만료된 세션 정리
            self._cleanup_expired_sessions()

            # 최대 세션 수 확인
            if len(self._sessions) >= self._max_sessions:
                # 가장 오래된 세션 제거
                self._remove_oldest_session()

            session_id = self.generate_session_id()

            # ID 충돌 방지 (극히 드물지만 안전을 위해)
            while session_id in self._sessions:
                session_id = self.generate_session_id()

            session = Session(
                id=session_id,
                data=data,
                ttl=self._ttl_seconds
            )
            self._sessions[session_id] = session

            current_count = len(self._sessions)
            if current_count > int(self._max_sessions * 0.8):
                logger.warning(f"세션 수가 한계에 근접합니다: {current_count}/{self._max_sessions}")

            return session_id

    def get_session(self, session_id: str) -> Optional[T]:
        """
        세션 데이터 조회

        Args:
            session_id: 세션 ID

        Returns:
            세션 데이터 또는 None (만료/존재하지 않는 경우)
        """
        with self._lock:
            session = self._sessions.get(session_id)

            if session is None:
                return None

            if session.is_expired():
                del self._sessions[session_id]
                return None

            session.touch()
            return session.data

    def update_session(self, session_id: str, data: T) -> bool:
        """
        세션 데이터 업데이트

        Args:
            session_id: 세션 ID
            data: 새 데이터

        Returns:
            성공 여부
        """
        with self._lock:
            session = self._sessions.get(session_id)

            if session is None or session.is_expired():
                return False

            session.data = data
            session.touch()
            return True

    def delete_session(self, session_id: str) -> bool:
        """
        세션 삭제

        Args:
            session_id: 세션 ID

        Returns:
            삭제 성공 여부
        """
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False

    def _cleanup_expired_sessions(self) -> int:
        """
        만료된 세션 정리

        Returns:
            정리된 세션 수
        """
        expired_ids = [
            sid for sid, session in self._sessions.items()
            if session.is_expired()
        ]

        for sid in expired_ids:
            del self._sessions[sid]

        return len(expired_ids)

    def _remove_oldest_session(self) -> None:
        """가장 오래된 세션 제거"""
        if not self._sessions:
            return

        oldest_id = min(
            self._sessions.keys(),
            key=lambda sid: self._sessions[sid].last_accessed
        )
        del self._sessions[oldest_id]

    def cleanup(self) -> int:
        """
        공개 정리 메서드

        Returns:
            정리된 세션 수
        """
        with self._lock:
            return self._cleanup_expired_sessions()

    def get_stats(self) -> Dict[str, Any]:
        """
        세션 통계 조회

        Returns:
            세션 관련 통계 정보
        """
        with self._lock:
            active_count = len(self._sessions)
            expired_count = sum(
                1 for session in self._sessions.values()
                if session.is_expired()
            )

            return {
                "total_sessions": active_count,
                "expired_sessions": expired_count,
                "active_sessions": active_count - expired_count,
                "max_sessions": self._max_sessions,
                "ttl_seconds": self._ttl_seconds
            }

    def __len__(self) -> int:
        """현재 세션 수"""
        with self._lock:
            return len(self._sessions)

    def __contains__(self, session_id: str) -> bool:
        """세션 존재 여부 확인"""
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return False
            if session.is_expired():
                del self._sessions[session_id]
                return False
            return True
