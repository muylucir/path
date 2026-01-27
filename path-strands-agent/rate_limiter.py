"""
Rate Limiting 설정

보안 취약점 수정: Rate Limiting 부재 해결
- slowapi 기반 요청 제한
- 엔드포인트별 차등 제한
- 비용이 높은 엔드포인트(spec)는 더 엄격한 제한
"""

import os
import logging
from typing import Dict

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

logger = logging.getLogger(__name__)

# Rate Limiting 활성화 여부
RATE_LIMIT_ENABLED = os.environ.get("RATE_LIMIT_ENABLED", "true").lower() == "true"

# 엔드포인트별 Rate Limit 설정
RATE_LIMITS: Dict[str, str] = {
    # 분석 관련 - LLM 호출 비용이 높음
    "analyze": "10/minute",
    "feasibility": "10/minute",
    "pattern_analyze": "10/minute",

    # 채팅 관련 - 사용자 상호작용 빈번
    "chat": "30/minute",
    "pattern_chat": "30/minute",

    # 스펙 생성 - 가장 비용이 높음 (4단계 파이프라인)
    "spec": "5/minute",

    # 확정 관련 - 중간 비용
    "finalize": "15/minute",
    "pattern_finalize": "15/minute",
    "feasibility_update": "15/minute",

    # 기본 제한
    "default": "60/minute",
}


def custom_key_func(request: Request) -> str:
    """
    Rate Limit 키 생성 함수

    IP 주소 기반으로 제한을 적용합니다.
    프록시 뒤에 있는 경우 X-Forwarded-For 헤더를 확인합니다.
    """
    # X-Forwarded-For 헤더 확인 (프록시/로드밸런서 뒤에 있는 경우)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # 첫 번째 IP가 실제 클라이언트 IP
        return forwarded_for.split(",")[0].strip()

    # X-Real-IP 헤더 확인
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # 직접 연결된 클라이언트 IP
    return get_remote_address(request)


# Limiter 인스턴스 생성
limiter = Limiter(
    key_func=custom_key_func,
    default_limits=[RATE_LIMITS["default"]],
    enabled=RATE_LIMIT_ENABLED,
    headers_enabled=True,  # 응답에 Rate Limit 헤더 포함
    strategy="fixed-window",  # 고정 윈도우 전략
)


def get_rate_limit(endpoint_name: str) -> str:
    """
    엔드포인트별 Rate Limit 값 반환

    Args:
        endpoint_name: 엔드포인트 이름

    Returns:
        Rate limit 문자열 (예: "10/minute")
    """
    return RATE_LIMITS.get(endpoint_name, RATE_LIMITS["default"])


def setup_rate_limiter(app) -> None:
    """
    앱에 Rate Limiter 설정

    Args:
        app: FastAPI 앱 인스턴스
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    if RATE_LIMIT_ENABLED:
        logger.info("Rate Limiting 활성화됨")
        logger.info(f"Rate Limits: {RATE_LIMITS}")
    else:
        logger.warning("Rate Limiting 비활성화됨 (RATE_LIMIT_ENABLED=false)")


# 데코레이터 헬퍼 함수들
def limit_analyze(func):
    """분석 엔드포인트 Rate Limit 데코레이터"""
    return limiter.limit(RATE_LIMITS["analyze"])(func)


def limit_chat(func):
    """채팅 엔드포인트 Rate Limit 데코레이터"""
    return limiter.limit(RATE_LIMITS["chat"])(func)


def limit_spec(func):
    """스펙 생성 엔드포인트 Rate Limit 데코레이터"""
    return limiter.limit(RATE_LIMITS["spec"])(func)


def limit_finalize(func):
    """확정 엔드포인트 Rate Limit 데코레이터"""
    return limiter.limit(RATE_LIMITS["finalize"])(func)


def limit_feasibility(func):
    """Feasibility 엔드포인트 Rate Limit 데코레이터"""
    return limiter.limit(RATE_LIMITS["feasibility"])(func)
