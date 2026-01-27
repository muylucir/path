"""
API Key 인증 미들웨어

보안 취약점 수정: API 인증 부재 해결
- X-API-Key 헤더 기반 인증
- Timing-safe 비교 (타이밍 공격 방지)
- 공개 엔드포인트 제외
"""

import os
import hmac
import logging
from typing import Set, Optional

from fastapi import Request, HTTPException, Security
from fastapi.security import APIKeyHeader
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# API Key 설정
API_KEY_HEADER_NAME = "X-API-Key"
API_KEY_ENV_VAR = "PATH_API_KEY"

# 공개 엔드포인트 (인증 불필요)
PUBLIC_ENDPOINTS: Set[str] = {
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
}

# API Key 헤더 정의
api_key_header = APIKeyHeader(
    name=API_KEY_HEADER_NAME,
    auto_error=False,
    description="API Key for authentication"
)


def get_api_key() -> Optional[str]:
    """환경 변수에서 API Key 조회"""
    return os.environ.get(API_KEY_ENV_VAR)


def is_development_mode() -> bool:
    """개발 모드 여부 확인"""
    env = os.environ.get("ENV", "development").lower()
    return env in ("development", "dev", "local")


def verify_api_key(provided_key: Optional[str]) -> bool:
    """
    API Key 검증 (Timing-safe 비교)

    Args:
        provided_key: 요청에서 제공된 API Key

    Returns:
        검증 성공 여부
    """
    expected_key = get_api_key()

    # 개발 모드에서 API Key가 설정되지 않은 경우 허용
    if expected_key is None:
        if is_development_mode():
            logger.warning("API Key가 설정되지 않았습니다. 개발 모드에서만 허용됩니다.")
            return True
        else:
            logger.error("프로덕션 환경에서 API Key가 설정되지 않았습니다!")
            return False

    if provided_key is None:
        return False

    # Timing-safe 비교 (타이밍 공격 방지)
    return hmac.compare_digest(
        provided_key.encode('utf-8'),
        expected_key.encode('utf-8')
    )


async def verify_api_key_dependency(
    api_key: Optional[str] = Security(api_key_header)
) -> str:
    """
    FastAPI Dependency로 사용할 API Key 검증 함수

    Usage:
        @app.get("/protected")
        async def protected_route(api_key: str = Depends(verify_api_key_dependency)):
            return {"message": "authorized"}
    """
    if not verify_api_key(api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API Key",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    return api_key


class APIKeyMiddleware(BaseHTTPMiddleware):
    """
    API Key 인증 미들웨어

    모든 요청에 대해 API Key 검증
    (공개 엔드포인트 제외)
    """

    def __init__(self, app, public_endpoints: Set[str] = None):
        super().__init__(app)
        self.public_endpoints = public_endpoints or PUBLIC_ENDPOINTS

    def _is_public_endpoint(self, path: str) -> bool:
        """공개 엔드포인트 여부 확인"""
        # 정확한 경로 매칭
        if path in self.public_endpoints:
            return True

        # prefix 매칭 (예: /docs/, /redoc/)
        for endpoint in self.public_endpoints:
            if path.startswith(endpoint + "/"):
                return True

        return False

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 공개 엔드포인트는 인증 건너뜀
        if self._is_public_endpoint(path):
            return await call_next(request)

        # API Key 추출
        api_key = request.headers.get(API_KEY_HEADER_NAME)

        # API Key 검증
        if not verify_api_key(api_key):
            logger.warning(
                f"인증 실패 - Path: {path}, "
                f"IP: {request.client.host if request.client else 'unknown'}"
            )
            return JSONResponse(
                status_code=401,
                content={
                    "error": "Unauthorized",
                    "detail": "Invalid or missing API Key"
                },
                headers={"WWW-Authenticate": "ApiKey"}
            )

        # 인증 성공, 다음 핸들러로 전달
        return await call_next(request)


def setup_auth_middleware(app, public_endpoints: Set[str] = None) -> None:
    """
    앱에 인증 미들웨어 추가

    Args:
        app: FastAPI 앱 인스턴스
        public_endpoints: 인증을 건너뛸 엔드포인트 집합
    """
    endpoints = public_endpoints or PUBLIC_ENDPOINTS
    app.add_middleware(APIKeyMiddleware, public_endpoints=endpoints)
    logger.info(f"API Key 인증 미들웨어 활성화. 공개 엔드포인트: {endpoints}")
