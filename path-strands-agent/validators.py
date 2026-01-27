"""
입력 검증 및 새니타이징 유틸리티

보안 취약점 수정: 입력 검증 부족 해결
- HTML 이스케이프
- LLM 프롬프트 인젝션 방지
- 길이 제한
"""

import re
import html
from typing import Optional, List, Set

# 길이 제한 상수
MAX_PAIN_POINT_LENGTH = 2000
MAX_CONTEXT_LENGTH = 5000
MAX_SOURCES_LENGTH = 2000
MAX_MESSAGE_LENGTH = 4000
MAX_CONVERSATION_LENGTH = 50  # 최대 대화 턴 수

# 위험 패턴 (LLM 프롬프트 인젝션 방지)
DANGEROUS_PATTERNS: List[re.Pattern] = [
    # System prompt injection attempts
    re.compile(r'\bSYSTEM\s*:', re.IGNORECASE),
    re.compile(r'\bASSISTANT\s*:', re.IGNORECASE),
    re.compile(r'\bHUMAN\s*:', re.IGNORECASE),
    re.compile(r'\bUSER\s*:', re.IGNORECASE),

    # Role manipulation
    re.compile(r'ignore\s+(previous|above|all)\s+instructions?', re.IGNORECASE),
    re.compile(r'disregard\s+(previous|above|all)\s+instructions?', re.IGNORECASE),
    re.compile(r'forget\s+(previous|above|all)\s+instructions?', re.IGNORECASE),

    # Jailbreak attempts
    re.compile(r'you\s+are\s+now\s+', re.IGNORECASE),
    re.compile(r'pretend\s+you\s+are\s+', re.IGNORECASE),
    re.compile(r'act\s+as\s+if\s+you\s+', re.IGNORECASE),
    re.compile(r'roleplay\s+as\s+', re.IGNORECASE),

    # Code injection via prompt
    re.compile(r'<\s*script\s*>', re.IGNORECASE),
    re.compile(r'javascript\s*:', re.IGNORECASE),

    # XML/HTML tag injection for LLM context
    re.compile(r'<\s*/?\s*(system|prompt|instruction|context)\s*>', re.IGNORECASE),
]

# 허용된 enum 값들
VALID_INPUT_TYPES: Set[str] = {
    "text", "image", "audio", "video", "document", "structured_data", "api_response"
}

VALID_HUMAN_LOOP_OPTIONS: Set[str] = {
    "always", "critical_only", "never", "optional"
}

VALID_ERROR_TOLERANCE_OPTIONS: Set[str] = {
    "strict", "moderate", "lenient"
}

VALID_PROCESS_STEPS: Set[str] = {
    "extract", "analyze", "transform", "generate", "validate",
    "classify", "summarize", "translate", "compare", "recommend"
}

VALID_OUTPUT_TYPES: Set[str] = {
    "text", "json", "markdown", "html", "code", "report",
    "notification", "api_call", "file", "structured_data"
}


def sanitize_input(text: Optional[str], max_length: int = MAX_PAIN_POINT_LENGTH) -> Optional[str]:
    """
    입력 텍스트 새니타이징

    - HTML 이스케이프
    - 위험 패턴 제거
    - 길이 제한
    - 과도한 공백 정리
    """
    if text is None:
        return None

    if not isinstance(text, str):
        raise ValueError("입력은 문자열이어야 합니다")

    # 1. 길이 제한
    if len(text) > max_length:
        text = text[:max_length]

    # 2. HTML 이스케이프 (XSS 방지)
    text = html.escape(text)

    # 3. 위험 패턴 필터링 (LLM 프롬프트 인젝션 방지)
    for pattern in DANGEROUS_PATTERNS:
        text = pattern.sub('[FILTERED]', text)

    # 4. 과도한 공백 정리
    text = re.sub(r'\s{3,}', '  ', text)

    # 5. 제어 문자 제거 (줄바꿈, 탭 제외)
    text = ''.join(char for char in text if char.isprintable() or char in '\n\t')

    return text.strip()


def validate_enum_value(value: str, valid_values: Set[str], field_name: str) -> str:
    """
    열거형 값 검증
    """
    if value not in valid_values:
        raise ValueError(f"'{field_name}' 값이 유효하지 않습니다: {value}. 허용된 값: {valid_values}")
    return value


def validate_input_type(value: str) -> str:
    """INPUT 타입 검증"""
    return validate_enum_value(value, VALID_INPUT_TYPES, "inputType")


def validate_human_loop(value: str) -> str:
    """Human-in-Loop 옵션 검증"""
    return validate_enum_value(value, VALID_HUMAN_LOOP_OPTIONS, "humanLoop")


def validate_error_tolerance(value: str) -> str:
    """오류 허용도 옵션 검증"""
    return validate_enum_value(value, VALID_ERROR_TOLERANCE_OPTIONS, "errorTolerance")


def validate_process_steps(steps: List[str]) -> List[str]:
    """프로세스 단계 검증"""
    if not steps:
        raise ValueError("최소 1개 이상의 프로세스 단계를 선택해야 합니다")

    if len(steps) > 10:
        raise ValueError("프로세스 단계는 최대 10개까지 선택 가능합니다")

    for step in steps:
        validate_enum_value(step, VALID_PROCESS_STEPS, "processSteps")

    return steps


def validate_output_types(types: List[str]) -> List[str]:
    """출력 타입 검증"""
    if not types:
        raise ValueError("최소 1개 이상의 출력 타입을 선택해야 합니다")

    if len(types) > 10:
        raise ValueError("출력 타입은 최대 10개까지 선택 가능합니다")

    for t in types:
        validate_enum_value(t, VALID_OUTPUT_TYPES, "outputTypes")

    return types


def validate_conversation(conversation: List[dict], max_turns: int = MAX_CONVERSATION_LENGTH) -> List[dict]:
    """
    대화 히스토리 검증
    """
    if not isinstance(conversation, list):
        raise ValueError("대화 히스토리는 리스트여야 합니다")

    if len(conversation) > max_turns:
        # 너무 긴 대화는 최근 것만 유지
        conversation = conversation[-max_turns:]

    validated = []
    for msg in conversation:
        if not isinstance(msg, dict):
            continue

        role = msg.get("role", "")
        content = msg.get("content", "")

        if role not in ["user", "assistant", "system"]:
            continue

        # 내용 새니타이징
        sanitized_content = sanitize_input(content, MAX_MESSAGE_LENGTH)
        if sanitized_content:
            validated.append({
                "role": role,
                "content": sanitized_content
            })

    return validated


def check_dangerous_patterns(text: str) -> bool:
    """
    위험 패턴이 포함되어 있는지 확인

    Returns:
        True if dangerous patterns found, False otherwise
    """
    if not text:
        return False

    for pattern in DANGEROUS_PATTERNS:
        if pattern.search(text):
            return True

    return False
