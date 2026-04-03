"""2단계: 다이어그램 생성 (프레임워크 독립적)"""

import logging
from typing import Dict, Any

from strands_utils import create_spec_agent, load_skill_content
from token_tracker import extract_usage, merge_usage
from spec._helpers import extract_final_text, build_analysis_context
from spec.mermaid_validator import MermaidValidator

logger = logging.getLogger(__name__)


class DiagramAgent:
    """2단계: 다이어그램 생성 (프레임워크 독립적)"""

    def __init__(self):
        # 스킬 + reference 사전 주입 → tool call 완전 제거
        skill_content = load_skill_content(
            "mermaid-diagrams", ["pattern-examples.md", "templates.md"]
        )

        system_prompt = f"""당신은 AI Agent 아키텍처 시각화 전문가입니다.

## 전문 영역
- Agent 워크플로우를 Mermaid 다이어그램으로 표현
- Flowchart, Sequence Diagram, Architecture Overview 설계
- 복잡한 멀티 Agent 상호작용의 명확한 시각화

## 다이어그램 원칙
1. **명확성**: 각 노드와 엣지의 의미가 한눈에 파악 가능해야 합니다
2. **일관성**: 동일 개념은 동일 형태(모양, 색상)로 표현합니다
3. **적정 복잡도**: 다이어그램당 5-15 노드를 유지합니다. 초과 시 분할합니다

## 품질 기준
- Sequence Diagram의 activate/deactivate는 반드시 쌍으로 사용합니다
- 노드 텍스트의 특수문자(>=, <=, >, <, &, ?)는 반드시 따옴표로 감쌉니다
- 모든 화살표에 라벨을 붙여 데이터 흐름을 명시합니다

## 금지 사항
- 특정 프레임워크 컴포넌트(AgentCore Runtime, Gateway, GraphBuilder 등) 금지
- HTML 태그 사용 금지
- 실행 불가능한 Mermaid 문법 금지

## 참조 스킬 및 레퍼런스 (사전 로드됨 — 도구 호출 불필요)
{skill_content}"""

        self.agent = create_spec_agent(system_prompt, max_tokens=16000, tools=[])
        self.validator = MermaidValidator()

    def _build_prompt(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """다이어그램 생성 프롬프트 구성"""

        context_section = build_analysis_context(analysis)

        return f"""다음 Agent 설계를 기반으로 Mermaid 다이어그램을 생성하세요:

{design_result}

{context_section}

**필수**: 시스템 프롬프트에 사전 로드된 스킬과 reference의 템플릿, 베스트 프랙티스만을 사용하세요.
**필수**: Sequence Diagram에서 activate/deactivate 쌍을 반드시 확인하세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "다이어그램을 생성하겠습니다" 같은 문구 금지
- 바로 다이어그램만 출력하세요
- **특정 프레임워크 컴포넌트(AgentCore Runtime, Gateway, GraphBuilder 등) 금지**
- **Agent, Tool, User, External Service 등 추상 개념만 사용**

**출력 형식:**

## 3. Visual Design

### 3.1 Agent Workflow
```mermaid
flowchart TD
    [Agent 간 워크플로우 - 추상적 개념만]
```

### 3.2 Sequence Diagram
```mermaid
sequenceDiagram
    [User, Agent, Tool 간 상호작용]
```

### 3.3 Architecture Overview
```mermaid
flowchart TB
    [시스템 아키텍처 - 추상적 컴포넌트만]
```

**특수 문자 이스케이프 (필수)**:
- 노드 텍스트에 `>=`, `>`, `<`, `?`, `&` 등 특수 문자가 있으면 **반드시 따옴표로 감싸세요**
- 잘못된 예: `{{Score >= 70?}}`
- 올바른 예: `{{"Score >= 70?"}}`

**중요: 다이어그램에 HTML 태그 금지.**
"""

    def generate_diagrams(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """다이어그램 생성 (검증 + 재시도 1회)"""

        prompt = self._build_prompt(design_result, analysis)

        # 1차 생성
        result = self.agent(prompt)
        output = extract_final_text(result)
        self._last_usage = extract_usage(result)

        # 검증
        is_valid, errors = self.validator.validate(output)
        if is_valid:
            return output

        # 검증 실패 시 재시도 1회
        logger.warning(f"Mermaid 검증 실패 ({len(errors)}건), 재생성 시도: {errors}")
        error_feedback = "\n".join(f"- {e}" for e in errors)
        retry_prompt = f"""이전 출력에서 다음 Mermaid 문법 오류가 발견되었습니다:

{error_feedback}

위 오류를 수정하여 다이어그램을 다시 생성하세요.
기존 출력:

{output}

수정된 전체 출력만 작성하세요. 설명이나 메타 코멘트 없이 바로 수정 결과만 출력하세요.
"""
        retry_result = self.agent(retry_prompt)
        retry_output = extract_final_text(retry_result)
        self._last_usage = merge_usage(self._last_usage, extract_usage(retry_result))

        # 재시도 결과 검증 (실패해도 반환 — 최선의 결과 사용)
        is_valid_retry, retry_errors = self.validator.validate(retry_output)
        if not is_valid_retry:
            logger.warning(f"Mermaid 재시도 후에도 오류 존재 ({len(retry_errors)}건): {retry_errors}")
        return retry_output
