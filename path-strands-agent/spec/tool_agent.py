"""3b단계: Tool 스키마 정의"""

import logging
from typing import Dict, Any, List

from strands_utils import create_spec_agent, load_skill_content
from token_tracker import extract_usage
from spec._helpers import extract_final_text, build_analysis_context

logger = logging.getLogger(__name__)


class ToolAgent:
    """3b단계: Tool 스키마 정의"""

    # output_types 키워드 -> tool-schema reference 파일 매핑
    OUTPUT_TOOL_REFERENCE_MAP = {
        '검색': 'search-tools.md',
        '조회': 'search-tools.md',
        'search': 'search-tools.md',
        'CRUD': 'crud-tools.md',
        '생성': 'crud-tools.md',
        '수정': 'crud-tools.md',
        '삭제': 'crud-tools.md',
        '저장': 'crud-tools.md',
        '알림': 'notification-tools.md',
        '통보': 'notification-tools.md',
        '메일': 'notification-tools.md',
        '이메일': 'notification-tools.md',
        'notification': 'notification-tools.md',
        'API': 'external-api-tools.md',
        '연동': 'external-api-tools.md',
        '외부': 'external-api-tools.md',
        '변환': 'transform-tools.md',
        '포맷': 'transform-tools.md',
        '가공': 'transform-tools.md',
        '분석': 'transform-tools.md',
        '요약': 'transform-tools.md',
        'transform': 'transform-tools.md',
    }

    def __init__(self):
        # tool-schema SKILL.md 사전 주입 (동적 reference는 file_read 유지)
        skill_content = load_skill_content("tool-schema")

        system_prompt = f"""당신은 AI Agent 도구(Tool) 설계 전문가입니다.

## 전문 영역
- Tool 스키마 정의 (Compact Signature 형식)
- Agent가 사용할 외부 도구/API 인터페이스 설계

## 설계 원칙
1. **명확한 인터페이스**: 각 Tool의 입력/출력을 명확히 정의합니다
2. **단일 책임**: 하나의 Tool은 하나의 명확한 작업을 수행합니다
3. **재사용성**: 여러 Agent가 공유할 수 있는 범용 Tool을 설계합니다

## 품질 기준
- Tool은 Compact Signature 형식을 사용합니다 (JSON Schema 금지)
- 각 Tool에 사용 시점(When to use)을 명확히 기술합니다

## 금지 사항
- JSON Schema 형식의 Tool 정의 금지
- 구현 코드 포함 금지
- 플레이스홀더(TODO, TBD 등)만으로 채우기 금지

## 참조 스킬 (사전 로드됨 — SKILL.md 도구 호출 불필요)
{skill_content}"""

        self.agent = create_spec_agent(system_prompt, max_tokens=32000)

    def _get_tool_references(self, analysis: Dict[str, Any]) -> List[str]:
        """analysis의 output_types 기반으로 읽어야 할 tool-schema reference 파일 결정"""
        output_types = analysis.get('output_types', analysis.get('outputTypes', []))
        pain_point = analysis.get('pain_point', analysis.get('painPoint', ''))
        search_text = ' '.join(output_types) if isinstance(output_types, list) else str(output_types)
        search_text += ' ' + pain_point

        matched_files = set()
        for keyword, ref_file in self.OUTPUT_TOOL_REFERENCE_MAP.items():
            if keyword in search_text:
                matched_files.add(ref_file)

        return list(matched_files)

    def generate_tools(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """Tool 정의 생성"""
        context_section = build_analysis_context(analysis)

        # tool-schema reference 읽기 지시 생성
        tool_refs = self._get_tool_references(analysis)
        tool_ref_instructions = ""
        for i, ref_file in enumerate(tool_refs, 1):
            tool_ref_instructions += (
                f'\n**필수 추가 {i}**: file_read로 '
                f'"./skills/tool-schema/references/{ref_file}"를 읽으세요.'
            )

        prompt = f"""다음 Agent 설계를 기반으로 필요한 도구(Tool)를 정의하세요:

{design_result}

{context_section}

**필수**: 시스템 프롬프트에 사전 로드된 tool-schema 스킬을 참고하여 도구를 설계하세요.
{tool_ref_instructions}

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "설계를 진행하겠습니다" 같은 문구 금지
- 바로 설계 결과만 출력하세요

**출력 형식 (반드시 아래 헤딩 구조를 그대로 따르세요 — "## 5." 상위 헤딩 생략 금지, 각 도구는 반드시 ### 레벨):**

## 5. Tool Definitions

**중요: Compact Signature 형식 사용 (JSON Schema 금지)**

필요한 각 Tool에 대해 아래 형식으로 작성 (반드시 ### 레벨 헤딩 사용, ## 사용 금지):

### 5.1 [tool_name]
- **Purpose**: [도구의 목적 1문장]
- **Signature**: `tool_name(param1: type, param2?: type = default) -> ReturnType`
- **When to use**: [Agent가 이 도구를 사용해야 하는 상황]

**Signature 규칙:**
- 필수 파라미터: `param: type`
- 선택 파라미터: `param?: type = default`
- 반환 타입: `-> type` 또는 `-> {{field1: type, field2: type}}`
- 기본 타입: str, int, float, bool, list[T], dict, None
- 복합 타입: `list[Document]`, `{{success: bool, id?: str}}`
"""
        result = self.agent(prompt)
        self._last_usage = extract_usage(result)
        return extract_final_text(result)
