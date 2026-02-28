"""
Multi-Stage Spec Agents - 명세서 생성을 4개 Agent로 분할 (DiagramAgent + PromptAgent + ToolAgent 병렬)

순서: DesignAgent → (DiagramAgent || PromptAgent || ToolAgent) → AssemblerAgent

프레임워크 독립적 Agent 설계 명세서 생성
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Dict, Any, AsyncIterator, Optional, List, Tuple
import json
import re
import logging
from safe_tools import safe_file_read
from strands_utils import strands_utils, get_skill_prompt
from token_tracker import extract_usage, merge_usage
from chat_agent import DEFAULT_MODEL_ID

logger = logging.getLogger(__name__)


def _extract_final_text(result) -> str:
    """LLM 결과에서 최종 텍스트를 추출.

    Tool 사용 시 content 배열에 여러 블록이 포함됨:
      [text(meta), toolUse, toolResult, text(meta), toolUse, toolResult, text(actual)]
    마지막 text 블록이 실제 응답이므로 이를 추출한다.
    Tool 미사용 시 전체 text를 합쳐서 반환.
    """
    content = result.message.get('content', [])
    if not content:
        return ''

    # text 블록만 추출
    text_blocks = [
        block.get('text', '')
        for block in content
        if isinstance(block, dict) and block.get('type') == 'text' and block.get('text', '').strip()
    ]

    if not text_blocks:
        # type 키 없이 text만 있는 경우 (단순 응답)
        for block in content:
            if isinstance(block, dict) and 'text' in block:
                text_blocks.append(block['text'])

    if not text_blocks:
        return ''

    # toolUse 블록이 있으면 마지막 text만 사용 (그 이전은 메타 코멘터리)
    has_tool_use = any(
        isinstance(block, dict) and block.get('type') == 'toolUse'
        for block in content
    )

    if has_tool_use and len(text_blocks) > 1:
        return text_blocks[-1]

    return '\n'.join(text_blocks)


class MermaidValidator:
    """Mermaid 다이어그램 문법 검증기 (Python only, Node.js 의존 없음)"""

    # 지원하는 다이어그램 타입 선언 키워드
    DIAGRAM_TYPES = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
        'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt',
        'pie', 'journey', 'gitGraph', 'mindmap', 'timeline',
        'quadrantChart', 'sankey-beta', 'xychart-beta',
    ]

    def validate(self, content: str) -> Tuple[bool, List[str]]:
        """Mermaid 다이어그램 검증.

        Args:
            content: Mermaid 코드 블록을 포함한 전체 텍스트

        Returns:
            (is_valid, errors) 튜플. is_valid=True이면 errors는 빈 리스트.
        """
        errors: List[str] = []
        mermaid_blocks = self._extract_mermaid_blocks(content)

        if not mermaid_blocks:
            return (True, [])  # Mermaid 블록이 없으면 검증 스킵

        for i, block in enumerate(mermaid_blocks, 1):
            block_errors = []
            block_errors.extend(self._check_diagram_type(block))
            block_errors.extend(self._check_bracket_pairs(block))
            block_errors.extend(self._check_special_chars(block))
            block_errors.extend(self._check_activate_deactivate(block))

            for err in block_errors:
                errors.append(f"[블록 {i}] {err}")

        return (len(errors) == 0, errors)

    def _extract_mermaid_blocks(self, content: str) -> List[str]:
        """```mermaid ... ``` 코드 블록 추출"""
        pattern = r'```mermaid\s*\n(.*?)```'
        return re.findall(pattern, content, re.DOTALL)

    def _check_diagram_type(self, block: str) -> List[str]:
        """다이어그램 타입 선언 확인"""
        first_line = block.strip().split('\n')[0].strip()
        has_type = any(first_line.startswith(dt) for dt in self.DIAGRAM_TYPES)
        if not has_type:
            return [f"다이어그램 타입 선언 누락. 첫 줄: '{first_line[:50]}'. "
                    f"graph/flowchart/sequenceDiagram 등으로 시작해야 합니다."]
        return []

    def _strip_comments(self, block: str) -> str:
        """Mermaid %% 주석 제거"""
        return re.sub(r'%%.*$', '', block, flags=re.MULTILINE)

    def _check_bracket_pairs(self, block: str) -> List[str]:
        """괄호 짝 확인 ({}, [], ())"""
        errors = []
        pairs = {'{': '}', '[': ']', '(': ')'}

        # 주석, 따옴표 안의 내용 제거
        cleaned = self._strip_comments(block)
        cleaned = re.sub(r'"[^"]*"', '', cleaned)
        cleaned = re.sub(r"'[^']*'", '', cleaned)

        for open_char, close_char in pairs.items():
            open_count = cleaned.count(open_char)
            close_count = cleaned.count(close_char)
            if open_count != close_count:
                errors.append(
                    f"'{open_char}{close_char}' 짝 불일치: "
                    f"열기 {open_count}개, 닫기 {close_count}개"
                )
        return errors

    def _check_special_chars(self, block: str) -> List[str]:
        """노드 텍스트 내 특수문자 따옴표 미사용 감지"""
        errors = []
        cleaned = self._strip_comments(block)

        # 노드 정의 패턴: 대괄호/중괄호/소괄호 안의 텍스트 (따옴표 없는 경우만)
        node_patterns = [
            r'\[([^\]"]+)\]',   # [text]
            r'\{([^}"]+)\}',    # {text}
            r'\(([^)"]+)\)',    # (text)
        ]
        # 2글자 특수문자를 먼저 검사하여 >=/<=를 >/<보다 우선 감지
        special_chars_multi = ['>=', '<=']
        special_chars_single = ['&', '?']

        for pattern in node_patterns:
            matches = re.finditer(pattern, cleaned)
            for match in matches:
                text = match.group(1)
                found = None
                # 2글자 특수문자 먼저
                for sc in special_chars_multi:
                    if sc in text:
                        found = sc
                        break
                # 단독 > < 는 >=/<= 이 없을 때만 검사
                if not found:
                    for sc in ('>', '<'):
                        if sc in text and '>=' not in text and '<=' not in text:
                            found = sc
                            break
                # 나머지 단일문자
                if not found:
                    for sc in special_chars_single:
                        if sc in text:
                            found = sc
                            break
                if found:
                    errors.append(
                        f"노드 텍스트에 특수문자 '{found}' 발견 (따옴표 필요): "
                        f"'{text[:60]}'"
                    )
        return errors

    def _check_activate_deactivate(self, block: str) -> List[str]:
        """Sequence Diagram activate/deactivate 쌍 확인 (명시적 + 인라인 +/- 문법)

        인라인 문법 의미:
        - A->>+B: msg → B(타겟)를 activate
        - B-->>-A: msg → B(소스)를 deactivate
        """
        if not block.strip().startswith('sequenceDiagram'):
            return []

        errors = []
        activate_counts: Dict[str, int] = {}
        deactivate_counts: Dict[str, int] = {}

        # 인라인 메시지 파싱: SOURCE ARROW MODIFIER TARGET: MESSAGE
        # ARROW: ->> / -->> / -x / --x / -> / -->
        # MODIFIER: + (activate target) / - (deactivate source) / 없음
        inline_msg_re = re.compile(
            r'^(\S+?)\s*'          # SOURCE
            r'(?:--?>>?|--?x)'     # ARROW (non-capturing)
            r'([+-]?)'             # MODIFIER
            r'(\S+?)'             # TARGET
            r'\s*:'                # colon
        )

        for line in block.split('\n'):
            line = line.strip()

            # 명시적 activate/deactivate
            activate_match = re.match(r'activate\s+(\S+)', line)
            deactivate_match = re.match(r'deactivate\s+(\S+)', line)

            if activate_match:
                p = activate_match.group(1)
                activate_counts[p] = activate_counts.get(p, 0) + 1
            elif deactivate_match:
                p = deactivate_match.group(1)
                deactivate_counts[p] = deactivate_counts.get(p, 0) + 1
            else:
                # 인라인 +/- 문법
                m = inline_msg_re.match(line)
                if m:
                    source, modifier, target = m.group(1), m.group(2), m.group(3)
                    if modifier == '+':
                        # + → activate TARGET
                        activate_counts[target] = activate_counts.get(target, 0) + 1
                    elif modifier == '-':
                        # - → deactivate SOURCE
                        deactivate_counts[source] = deactivate_counts.get(source, 0) + 1

        all_participants = set(activate_counts.keys()) | set(deactivate_counts.keys())
        for participant in all_participants:
            act = activate_counts.get(participant, 0)
            deact = deactivate_counts.get(participant, 0)
            if act != deact:
                errors.append(
                    f"Sequence Diagram '{participant}': "
                    f"activate {act}회, deactivate {deact}회 (불일치)"
                )

        return errors


class DesignAgent:
    """1단계: Agent 설계 (프레임워크 독립적)"""

    # 패턴명 → reference 파일 매핑
    PATTERN_REFERENCE_MAP = {
        'ReAct': 'react-pattern.md',
        'Reflection': 'reflection-pattern.md',
        'Tool Use': 'tool-use-pattern.md',
        'Planning': 'planning-pattern.md',
        'Human-in-the-Loop': 'human-in-loop-pattern.md',
    }

    def __init__(self):
        skill_prompt = get_skill_prompt()

        system_prompt = """당신은 프레임워크 독립적 AI Agent 아키텍처 설계 전문가입니다.

## 전문 영역
- Agent 역할 분리 및 협업 구조 설계
- 상태 관리(Shared/Session/Persistent) 전략 수립
- 단일 Agent vs 멀티 Agent 아키텍처 판단
- 오류 복구 및 fallback 전략

## 설계 원칙
1. **단순함 우선**: 단일 Agent로 충분하면 멀티 Agent를 사용하지 않습니다
2. **역할 명확화**: 각 Agent는 하나의 명확한 책임을 가집니다
3. **확장성**: 향후 Agent 추가/교체가 용이한 구조를 설계합니다

## 품질 기준
- 각 Agent는 단일 책임 원칙(SRP)을 준수합니다
- Agent 간 상호작용은 최소화합니다
- 실패 시 복구 경로를 명시합니다

## 금지 사항
- 특정 프레임워크(Strands, LangGraph, CrewAI, AgentCore 등) 언급 금지
- 구현 코드 포함 금지 — 설계 수준의 기술만 작성
- 근거 없는 Agent 수 증가 금지"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=DEFAULT_MODEL_ID,
            max_tokens=16000,
            temperature=0.3,
            tools=[safe_file_read]
        )

    def analyze(
        self,
        analysis: Dict[str, Any],
        improvement_plans: Optional[Dict[str, str]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        additional_context: Optional[Dict[str, str]] = None
    ) -> str:
        """Agent 설계"""

        # 대화 히스토리 요약 (사용자 메시지만 추출)
        chat_section = ""
        if chat_history:
            user_messages = [msg['content'] for msg in chat_history if msg.get('role') == 'user']
            if user_messages:
                chat_section = "\n**사용자 추가 요구사항 (대화에서 추출)**:\n"
                for msg in user_messages[-5:]:  # 최근 5개만
                    truncated = msg[:200] + "..." if len(msg) > 200 else msg
                    chat_section += f"- {truncated}\n"

        # 추가 컨텍스트 섹션
        context_section = ""
        if additional_context:
            if additional_context.get('sources'):
                context_section += f"\n**추가 데이터소스**: {additional_context['sources']}"
            if additional_context.get('context'):
                context_section += f"\n**추가 컨텍스트**: {additional_context['context']}"

        # 개선 방안 섹션
        improvement_section = ""
        if improvement_plans:
            non_empty_plans = {k: v for k, v in improvement_plans.items() if v and v.strip()}
            if non_empty_plans:
                improvement_section = "\n**사용자 개선 방안**:\n"
                for key, plan in non_empty_plans.items():
                    improvement_section += f"- {key}: {plan}\n"

        # 패턴별 reference 파일 읽기 지시 생성
        pattern = analysis.get('pattern', '')
        ref_instructions = ""
        ref_file = self.PATTERN_REFERENCE_MAP.get(pattern)
        if ref_file:
            ref_instructions += (
                f'\n**필수 2단계**: file_read로 '
                f'"./skills/universal-agent-patterns/references/{ref_file}"를 읽으세요.'
            )
        # 멀티 에이전트 아키텍처인 경우 추가 reference
        recommended_arch = analysis.get('recommended_architecture', '')
        if recommended_arch == 'multi-agent':
            ref_instructions += (
                '\n**필수 추가**: file_read로 '
                '"./skills/universal-agent-patterns/references/multi-agent-pattern.md"와 '
                '"./skills/universal-agent-patterns/references/state-management.md"를 읽으세요.'
            )

        # 자동화 수준 안내
        automation_level = analysis.get('automation_level', '')
        automation_guidance = ""
        if automation_level == 'ai-assisted-workflow':
            automation_guidance = """
**자동화 수준: AI-Assisted Workflow**
이 프로젝트는 결정적 파이프라인 + 특정 단계에서 AI를 활용하는 방식입니다.

**용어 변환 규칙:**
- "Agent Design Pattern" → "파이프라인 아키텍처"로 표현
- "Agent Components" → "워크플로우 단계(Stages)"로 표현
- "Agent"보다는 "AI Step" 또는 "AI-Powered Stage"로 표현
- "자율적 판단" 대신 "결정적 로직 + AI 보조"로 표현

**설계 원칙:**
- 전체 흐름은 워크플로우 엔진/코드가 제어하고, AI는 개별 단계(요약, 분류, 생성 등)에서만 활용
- 각 AI 호출 지점(Integration Point)의 입출력 스키마를 명확히 정의
- 폴백 전략 필수: AI 실패 시 기본값 또는 사람 에스컬레이션
- AI 단계별 적합한 모델 선택 (분류: Haiku, 생성: Sonnet)

**파이프라인 패턴 선택:**
- 순차 처리 → Sequential Pipeline
- 병렬 분석 필요 → Fan-out/Fan-in
- AI 판단 기반 분기 → Conditional Pipeline
- 외부 이벤트 반응 → Event-driven Pipeline

**구현 기술:**
- AWS Step Functions + Lambda + Bedrock (서버리스 권장)
- 또는 코드 기반 파이프라인 (단순한 경우)

**필수 참조**: file_read로 "./skills/ai-assisted-workflow/SKILL.md"를 읽고,
"./skills/ai-assisted-workflow/references/pipeline-patterns.md"와
"./skills/ai-assisted-workflow/references/ai-integration-guide.md"를 참조하세요.
"""
        elif automation_level == 'agentic-ai':
            automation_guidance = """
**자동화 수준: Agentic AI**
이 프로젝트는 에이전트가 자율적으로 도구를 선택하고 판단하는 방식입니다.
- Agent가 상황에 따라 동적으로 경로와 도구를 결정
- ReAct, Planning 등 에이전트 패턴을 적극 활용하세요
"""

        prompt = f"""다음 분석 결과를 바탕으로 프레임워크 독립적인 Agent 설계를 수행하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}
{automation_guidance}
{chat_section}
{context_section}
{improvement_section}

**필수 1단계**: file_read로 "universal-agent-patterns" 스킬의 SKILL.md를 읽으세요.
{ref_instructions}
**필수 최종단계**: 스킬과 reference를 참고하여 분석하세요. 스킬에 없는 내용은 추가하지 마세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "분석을 진행하겠습니다" 같은 문구 금지
- 바로 분석 결과만 출력하세요
- **특정 프레임워크(Strands, LangGraph, CrewAI, AgentCore 등) 언급 금지**

**출력 형식:**

## 2. Agent Design Pattern

### 2.1 Pattern Selection
- **Primary Pattern**: [ReAct/Reflection/Tool Use/Planning/Multi-Agent/Human-in-the-Loop]
- **Pattern Combination**: [조합 패턴, 해당시]
- **Selection Rationale**: [선택 이유 2-3문장]

### 2.2 Agent Components
| Agent Name | Role | Input | Output | Complexity |
|------------|------|-------|--------|------------|
**중요: 테이블에 HTML 태그 금지.**

### 2.3 State Management
- **Shared State**: [Agent 간 공유 데이터]
- **Session State**: [세션 내 유지 데이터]
- **Persistent State**: [영구 저장 필요 데이터]
"""
        result = self.agent(prompt)
        self._last_usage = extract_usage(result)
        return _extract_final_text(result)


class DiagramAgent:
    """2단계: 다이어그램 생성 (프레임워크 독립적)"""

    def __init__(self):
        skill_prompt = get_skill_prompt()

        system_prompt = """당신은 AI Agent 아키텍처 시각화 전문가입니다.

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
- 실행 불가능한 Mermaid 문법 금지"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=DEFAULT_MODEL_ID,
            max_tokens=16000,
            temperature=0.3,
            tools=[safe_file_read]
        )
        self.validator = MermaidValidator()

    def _build_prompt(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """다이어그램 생성 프롬프트 구성"""

        # analysis 컨텍스트 섹션
        context_section = self._build_analysis_context(analysis)

        return f"""다음 Agent 설계를 기반으로 Mermaid 다이어그램을 생성하세요:

{design_result}

{context_section}

**필수 1단계**: file_read로 "mermaid-diagrams" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: file_read로 "./skills/mermaid-diagrams/references/pattern-examples.md"를 읽으세요.
**필수 3단계**: file_read로 "./skills/mermaid-diagrams/references/templates.md"를 읽으세요.
**필수 4단계**: 로드된 SKILL과 reference의 템플릿, 베스트 프랙티스만을 사용하세요.
**필수 5단계**: Sequence Diagram에서 activate/deactivate 쌍을 반드시 확인하세요.

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

    def _build_analysis_context(self, analysis: Dict[str, Any]) -> str:
        """analysis 데이터에서 컨텍스트 섹션 생성"""
        pain_point = analysis.get('pain_point', analysis.get('painPoint', ''))
        input_type = analysis.get('input_type', analysis.get('inputType', ''))
        process_steps = analysis.get('process_steps', analysis.get('processSteps', []))
        output_types = analysis.get('output_types', analysis.get('outputTypes', []))
        human_loop = analysis.get('human_loop', analysis.get('humanLoop', ''))
        pattern = analysis.get('pattern', '')
        recommended_arch = analysis.get('recommended_architecture', '')
        multi_agent_pattern = analysis.get('multi_agent_pattern', '')
        automation_level = analysis.get('automation_level', '')

        steps_text = '\n'.join(f'  - {s}' for s in process_steps) if process_steps else 'N/A'
        outputs_text = ', '.join(output_types) if isinstance(output_types, list) else str(output_types)

        automation_line = ""
        if automation_level:
            label = 'AI-Assisted Workflow' if automation_level == 'ai-assisted-workflow' else 'Agentic AI'
            automation_line = f"\n- **Automation Level**: {label}"

        return f"""**원본 분석 컨텍스트**:
- **Pain Point**: {pain_point}
- **Input Type**: {input_type}
- **Process Steps**:
{steps_text}
- **Output Types**: {outputs_text}
- **Human-in-Loop**: {human_loop}
- **Pattern**: {pattern}
- **Architecture**: {recommended_arch or 'single-agent'}
- **Multi-Agent Pattern**: {multi_agent_pattern or 'N/A'}{automation_line}"""

    def generate_diagrams(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """다이어그램 생성 (검증 + 재시도 1회)"""

        prompt = self._build_prompt(design_result, analysis)

        # 1차 생성
        result = self.agent(prompt)
        output = _extract_final_text(result)
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
        retry_output = _extract_final_text(retry_result)
        self._last_usage = merge_usage(self._last_usage, extract_usage(retry_result))

        # 재시도 결과 검증 (실패해도 반환 — 최선의 결과 사용)
        is_valid_retry, retry_errors = self.validator.validate(retry_output)
        if not is_valid_retry:
            logger.warning(f"Mermaid 재시도 후에도 오류 존재 ({len(retry_errors)}건): {retry_errors}")
        return retry_output


def _build_analysis_context_section(analysis: Dict[str, Any]) -> str:
    """analysis 데이터에서 공통 컨텍스트 섹션 생성 (PromptAgent, ToolAgent 공용)"""
    pain_point = analysis.get('pain_point', analysis.get('painPoint', ''))
    input_type = analysis.get('input_type', analysis.get('inputType', ''))
    process_steps = analysis.get('process_steps', analysis.get('processSteps', []))
    output_types = analysis.get('output_types', analysis.get('outputTypes', []))
    human_loop = analysis.get('human_loop', analysis.get('humanLoop', ''))
    pattern = analysis.get('pattern', '')
    recommended_arch = analysis.get('recommended_architecture', '')
    multi_agent_pattern = analysis.get('multi_agent_pattern', '')
    automation_level = analysis.get('automation_level', '')
    automation_level_reason = analysis.get('automation_level_reason', '')

    steps_text = '\n'.join(f'  - {s}' for s in process_steps) if process_steps else 'N/A'
    outputs_text = ', '.join(output_types) if isinstance(output_types, list) else str(output_types)

    automation_line = ""
    if automation_level:
        label = 'AI-Assisted Workflow' if automation_level == 'ai-assisted-workflow' else 'Agentic AI'
        automation_line = f"\n- **Automation Level**: {label}"
        if automation_level_reason:
            automation_line += f" ({automation_level_reason})"

    return f"""**원본 분석 컨텍스트**:
- **Pain Point**: {pain_point}
- **Input Type**: {input_type}
- **Process Steps**:
{steps_text}
- **Output Types**: {outputs_text}
- **Human-in-Loop**: {human_loop}
- **Pattern**: {pattern}
- **Architecture**: {recommended_arch or 'single-agent'}
- **Multi-Agent Pattern**: {multi_agent_pattern or 'N/A'}{automation_line}"""


class PromptAgent:
    """3a단계: Agent Prompt 설계"""

    def __init__(self):
        skill_prompt = get_skill_prompt()

        system_prompt = """당신은 AI Agent 프롬프트 엔지니어링 전문가입니다.

## 전문 영역
- Agent System Prompt 설계 (역할, 지시사항, 제약조건)
- 입출력 형식 명세 및 예시 작성

## 설계 원칙
1. **역할 명확화**: System Prompt에서 Agent의 정체성과 경계를 명확히 정의합니다
2. **구체적 지시**: 모호한 표현 대신 구체적이고 측정 가능한 지시를 사용합니다
3. **출력 형식 명시**: 예상 출력의 구조와 형식을 명확히 정의합니다

## 품질 기준
- System Prompt는 최소 200자 이상으로 충분한 컨텍스트를 제공합니다
- 각 Agent에 실제 사용 예시(Example User Prompt + Expected Output)를 포함합니다

## 금지 사항
- 구현 코드 포함 금지
- 플레이스홀더(TODO, TBD 등)만으로 채우기 금지"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=DEFAULT_MODEL_ID,
            max_tokens=32000,
            temperature=0.3,
            tools=[safe_file_read]
        )

    def generate_prompts(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """Agent Prompt 설계 생성"""
        context_section = _build_analysis_context_section(analysis)

        prompt = f"""다음 Agent 설계를 기반으로 각 Agent의 프롬프트를 정의하세요:

{design_result}

{context_section}

**필수 1단계**: file_read로 "prompt-engineering" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: file_read로 "./skills/prompt-engineering/references/role-templates.md"를 읽으세요.
**필수 최종단계**: 위 스킬과 reference를 참고하여 프롬프트를 설계하세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "설계를 진행하겠습니다" 같은 문구 금지
- 바로 설계 결과만 출력하세요

**출력 형식:**

## 4. Agent Prompts

위 Agent Components 테이블의 각 Agent에 대해 아래 형식으로 작성:

### 4.1 [Agent Name]
**System Prompt:**
```
당신은 [역할]입니다.
[구체적인 지시사항]
```

**Example User Prompt:**
```
[예시 사용자 입력]
```

**Expected Output:**
```
[예상 출력 형식]
```
"""
        result = self.agent(prompt)
        self._last_usage = extract_usage(result)
        return _extract_final_text(result)


class ToolAgent:
    """3b단계: Tool 스키마 정의"""

    # output_types 키워드 → tool-schema reference 파일 매핑
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
        skill_prompt = get_skill_prompt()

        system_prompt = """당신은 AI Agent 도구(Tool) 설계 전문가입니다.

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
- 플레이스홀더(TODO, TBD 등)만으로 채우기 금지"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=DEFAULT_MODEL_ID,
            max_tokens=32000,
            temperature=0.3,
            tools=[safe_file_read]
        )

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
        context_section = _build_analysis_context_section(analysis)

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

**필수 1단계**: file_read로 "tool-schema" 스킬의 SKILL.md를 읽으세요.
{tool_ref_instructions}
**필수 최종단계**: 위 스킬과 reference를 참고하여 도구를 설계하세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "설계를 진행하겠습니다" 같은 문구 금지
- 바로 설계 결과만 출력하세요

**출력 형식:**

## 5. Tool Definitions

**중요: Compact Signature 형식 사용 (JSON Schema 금지)**

필요한 각 Tool에 대해 아래 형식으로 작성:

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
        return _extract_final_text(result)


class AssemblerAgent:
    """4단계: 최종 조합 - LLM 없이 단순 문자열 조합"""

    def __init__(self):
        pass

    def _clean_internal_comments(self, text: str) -> str:
        """내부 코멘트 제거 (Claude의 메타 발언 + tool call 잔재)

        전략:
        1. tool_call/tool_result XML 태그 블록 제거
        2. 첫 번째 섹션 헤딩(##) 이전의 모든 텍스트 제거 (메타 코멘터리가 항상 앞부분에 위치)
        3. 라인 단위 패턴 매칭으로 남은 메타 코멘터리 제거
        """
        import re

        # 1단계: <tool_call>...</tool_call> 및 <tool_result>...</tool_result> 블록 제거
        text = re.sub(r'<tool_call>.*?</tool_call>', '', text, flags=re.DOTALL)
        text = re.sub(r'<tool_result>.*?</tool_result>', '', text, flags=re.DOTALL)

        # 2단계: 첫 번째 ## 헤딩 이전의 모든 텍스트 제거
        heading_match = re.search(r'^##\s+', text, re.MULTILINE)
        if heading_match:
            text = text[heading_match.start():]

        # 3단계: 라인 단위 메타 코멘터리 패턴 제거 (한국어 + 영어)
        line_patterns = [
            # 한국어 패턴
            r'^네,?\s*(이미|먼저)?\s*스킬을?\s*(읽었으므로|로드했으므로).*$',
            r'^이미\s+SKILL\.?md를?\s*(로드|읽).*$',
            r'^(먼저|우선)?\s*스킬을?\s*(로드|읽).*$',
            r'^(바로|이제)?\s*(분석|다이어그램|명세서|설계|도구).*?(진행|생성|작성|시작)하겠습니다.*$',
            r'^(바로|이제)?\s*\d+가지\s*다이어그램을?\s*생성하겠습니다.*$',
            r'^(알겠습니다|네,?\s*알겠습니다).*$',
            r'^(그럼|그러면)\s*(바로|이제)?.*?(시작|진행).*$',
            r'^.*스킬.*?(참조|읽|로드).*$',
            r'^.*reference.*?(읽|참조|로드).*$',
            # 영어 패턴
            r"^I'?ll\s+(read|load|check|look|start|review|first).*$",
            r"^Let\s+me\s+(read|load|check|look|start|review|first).*$",
            r"^(First|Now),?\s+I'?ll\s+.*$",
            r'^(OK|Okay|Sure|Alright),?\s*(let me|I\'ll).*$',
            r'^I\s+(need to|will|should)\s+(read|load|check|review|look).*$',
            r'^(Reading|Loading|Checking|Looking)\s+(the|at|through)?\s*(skill|reference|file).*$',
        ]

        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            should_remove = False
            stripped = line.strip()
            for pattern in line_patterns:
                if re.match(pattern, stripped, flags=re.IGNORECASE):
                    should_remove = True
                    break
            if not should_remove:
                cleaned_lines.append(line)

        cleaned = '\n'.join(cleaned_lines)
        cleaned = re.sub(r'^---\s*\n+', '', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

        return cleaned.strip()

    async def assemble_stream(
        self,
        analysis: Dict[str, Any],
        design_result: str,
        diagram_result: str,
        prompt_result: str,
        tool_result: str,
    ) -> AsyncIterator[dict]:
        """최종 조합 - LLM 없이 단순 문자열 조합 후 스트리밍"""

        import asyncio

        # 내부 코멘트 제거
        design_result = self._clean_internal_comments(design_result)
        diagram_result = self._clean_internal_comments(diagram_result)
        prompt_result = self._clean_internal_comments(prompt_result)
        tool_result = self._clean_internal_comments(tool_result)

        # 데이터 추출
        pain_point = analysis.get('pain_point', analysis.get('painPoint', 'N/A'))
        pattern = analysis.get('pattern', 'N/A')
        pattern_reason = analysis.get('pattern_reason', '')
        recommendation = analysis.get('recommendation', '')
        input_type = analysis.get('input_type', analysis.get('inputType', 'N/A'))
        process_steps = analysis.get('process_steps', analysis.get('processSteps', []))
        output_types = analysis.get('output_types', analysis.get('outputTypes', []))
        human_loop = analysis.get('human_loop', analysis.get('humanLoop', 'N/A'))
        risks = analysis.get('risks', [])
        next_steps = analysis.get('next_steps', [])
        automation_level = analysis.get('automation_level', '')
        automation_level_reason = analysis.get('automation_level_reason', '')

        # 개선된 점수 우선 사용
        improved = analysis.get('improved_feasibility')
        original_score = analysis.get('feasibility_score', 'N/A')
        if improved and improved.get('score'):
            feasibility_score = improved['score']
            score_display = f"{feasibility_score}/50 (개선됨, 기존: {original_score})"
        else:
            feasibility_score = original_score
            score_display = f"{feasibility_score}/50"

        # 자동화 수준 표시
        automation_line = ""
        if automation_level:
            label = 'AI-Assisted Workflow' if automation_level == 'ai-assisted-workflow' else 'Agentic AI'
            automation_line = f"\n- **Automation Level**: {label}"
            if automation_level_reason:
                automation_line += f"\n  - {automation_level_reason}"

        # 명세서 조합
        spec = f"""# AI Agent Design Specification

## 1. Executive Summary

- **Problem**: {pain_point}
- **Solution**: {pattern} 패턴 사용
- **Reason**: {pattern_reason}
- **Feasibility**: {score_display}{automation_line}
- **Recommendation**: {recommendation}

{design_result}

{diagram_result}

{prompt_result}

{tool_result}

## 6. Problem Decomposition

- **INPUT**: {input_type}
- **PROCESS**:
"""
        # PROCESS 단계 추가
        for step in process_steps:
            spec += f'  - {step}\n'

        output_text = ', '.join(output_types) if isinstance(output_types, list) else str(output_types)
        spec += f"""- **OUTPUT**: {output_text}
- **Human-in-Loop**: {human_loop}
"""

        # 동적 섹션 번호 관리
        section_num = 7

        # Risks 섹션 (있는 경우)
        if risks:
            spec += f"\n## {section_num}. Risks\n\n"
            for risk in risks:
                spec += f'- {risk}\n'
            section_num += 1

        # Next Steps 섹션 (있는 경우)
        if next_steps:
            spec += f"\n## {section_num}. Next Steps\n\n"
            for i, step in enumerate(next_steps):
                spec += f'{i+1}. {step}\n'
            section_num += 1

        # 스트리밍으로 전송
        chunk_size = 100
        total_chunks = (len(spec) + chunk_size - 1) // chunk_size

        for i in range(0, len(spec), chunk_size):
            chunk = spec[i:i+chunk_size]
            chunk_index = i // chunk_size
            progress = 70 + int((chunk_index / total_chunks) * 25)
            yield {'text': chunk, 'progress': min(progress, 95)}
            await asyncio.sleep(0.01)


class MultiStageSpecAgent:
    """명세서 생성 조율 - DiagramAgent + PromptAgent + ToolAgent 병렬 실행"""

    def __init__(self):
        self.design_agent = DesignAgent()
        self.diagram_agent = DiagramAgent()
        self.prompt_agent = PromptAgent()
        self.tool_agent = ToolAgent()
        self.assembler_agent = AssemblerAgent()

    async def generate_spec_stream(
        self,
        analysis: Dict[str, Any],
        improvement_plans: Optional[Dict[str, str]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        additional_context: Optional[Dict[str, str]] = None
    ) -> AsyncIterator[dict]:
        """명세서 생성 - dict yield (AgentCore 엔트리포인트에서 SSE 변환)"""

        import asyncio

        try:
            # 1단계: Agent 설계 패턴 (0-40%) - Section 2: Agent Design Pattern
            yield {'progress': 0, 'stage': '2. 에이전트 설계 패턴 분석 시작'}
            task = asyncio.create_task(asyncio.to_thread(
                self.design_agent.analyze,
                analysis,
                improvement_plans,
                chat_history,
                additional_context
            ))
            progress = 5
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 35)
                    yield {'progress': progress, 'stage': '2. 에이전트 설계 패턴 분석 중...'}
            design_result = await task
            yield {'progress': 40, 'stage': '2. 에이전트 설계 패턴 완료'}

            # 2-3단계: 다이어그램 + 프롬프트 + 도구 병렬 실행 (40-95%)
            yield {'progress': 40, 'stage': '3. 다이어그램 & 4. 프롬프트 & 5. 도구 병렬 생성 시작'}

            diagram_task = asyncio.create_task(asyncio.to_thread(
                self.diagram_agent.generate_diagrams, design_result, analysis
            ))
            prompt_task = asyncio.create_task(asyncio.to_thread(
                self.prompt_agent.generate_prompts, design_result, analysis
            ))
            tool_task = asyncio.create_task(asyncio.to_thread(
                self.tool_agent.generate_tools, design_result, analysis
            ))

            progress = 45
            while not diagram_task.done() or not prompt_task.done() or not tool_task.done():
                await asyncio.sleep(3)
                if not diagram_task.done() or not prompt_task.done() or not tool_task.done():
                    progress = min(progress + 5, 90)
                    stages_status = []
                    if not diagram_task.done():
                        stages_status.append("다이어그램")
                    if not prompt_task.done():
                        stages_status.append("프롬프트")
                    if not tool_task.done():
                        stages_status.append("도구")
                    stage_text = " & ".join(stages_status) + " 생성 중..."
                    yield {'progress': progress, 'stage': stage_text}

            diagram_result, prompt_result, tool_result = await asyncio.gather(diagram_task, prompt_task, tool_task)
            yield {'progress': 95, 'stage': '3-5. 다이어그램 & 프롬프트 & 도구 완료'}

            # 4단계: 최종 조합 (95-100%, 스트리밍) - Section 1,6-8: Summary, Decomposition
            yield {'progress': 95, 'stage': '1,6-8. 요약 및 최종 조합 시작'}
            async for chunk_data in self.assembler_agent.assemble_stream(
                analysis,
                design_result,
                diagram_result,
                prompt_result,
                tool_result,
            ):
                yield chunk_data

            # 서브 에이전트 토큰 사용량 집계
            total_usage = merge_usage(
                merge_usage(
                    getattr(self.design_agent, '_last_usage', {}) or {},
                    getattr(self.diagram_agent, '_last_usage', {}) or {}
                ),
                merge_usage(
                    getattr(self.prompt_agent, '_last_usage', {}) or {},
                    getattr(self.tool_agent, '_last_usage', {}) or {}
                )
            )
            if total_usage.get("totalTokens", 0) > 0:
                yield {'usage': total_usage}

            # 최종 100% 도달
            yield {'progress': 100, 'stage': '완료'}

        except Exception as e:
            logger.error(f"명세서 생성 오류: {e}", exc_info=True)
            yield {'error': '명세서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
