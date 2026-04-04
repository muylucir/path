"""LLM 응답 파싱 및 검증 유틸리티"""

import json
import logging
import re
from typing import Any, Dict

from schemas import FeasibilityEvaluation, PatternAnalysis

logger = logging.getLogger(__name__)


def extract_json(response_text: str, context: str = "response") -> Dict[str, Any]:
    """LLM 응답에서 JSON을 추출하고 파싱.

    Args:
        response_text: LLM 응답 전체 텍스트
        context: 에러 메시지에 포함할 컨텍스트 설명

    Returns:
        파싱된 JSON dict

    Raises:
        ValueError: JSON을 추출할 수 없는 경우
        json.JSONDecodeError: JSON 파싱에 실패한 경우
    """
    # ```json ... ``` 블록 먼저 시도
    json_block = re.search(r'''```json\s*\n(.*?)\n\s*```''', response_text, re.DOTALL)
    if json_block:
        return json.loads(json_block.group(1))

    # { ... } 추출 — bracket depth 매칭으로 정확한 범위 탐색
    json_start = response_text.find("{")
    if json_start == -1:
        raise ValueError(f"Failed to extract JSON from {context}")

    depth = 0
    in_string = False
    escape = False
    for i in range(json_start, len(response_text)):
        ch = response_text[i]
        if escape:
            escape = False
            continue
        if ch == '\\' and in_string:
            escape = True
            continue
        if ch == '"' and not escape:
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                json_str = response_text[json_start:i + 1]
                return json.loads(json_str)

    raise ValueError(f"Failed to extract JSON from {context}")


def validate_feasibility(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Pydantic으로 Feasibility 평가 결과를 검증하고 타입을 강제 변환한다.
    검증 실패 시 원본 dict를 그대로 반환 (graceful degradation)."""
    try:
        validated = FeasibilityEvaluation(**raw)
        return validated.model_dump(exclude_none=False)
    except Exception as e:
        logger.warning(f"Feasibility validation failed, using raw data: {e}")
        return raw


def validate_analysis(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Pydantic으로 패턴 확정 결과를 검증하고 타입을 강제 변환한다."""
    try:
        validated = PatternAnalysis(**raw)
        return validated.model_dump(exclude_none=False)
    except Exception as e:
        logger.warning(f"Analysis validation failed, using raw data: {e}")
        return raw
