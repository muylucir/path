"""Shared helpers for spec sub-agents."""

from typing import Dict, Any, List
import re


def extract_final_text(result) -> str:
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


def build_analysis_context(analysis: Dict[str, Any]) -> str:
    """analysis 데이터에서 공통 컨텍스트 섹션 생성 (모든 서브에이전트 공용)"""
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

    three_axis = analysis.get('three_axis_scores', {})
    axis_line = ""
    if three_axis and isinstance(three_axis, dict):
        a1 = three_axis.get('axis1_tool_complexity', '?')
        a2 = three_axis.get('axis2_role_separation', '?')
        a3 = three_axis.get('axis3_flow_complexity', '?')
        total = three_axis.get('total', '?')
        axis_line = f"\n- **3-Axis Scores**: Tool={a1}, Role={a2}, Flow={a3}, Total={total}"

    return f"""**원본 분석 컨텍스트**:
- **Pain Point**: {pain_point}
- **Input Type**: {input_type}
- **Process Steps**:
{steps_text}
- **Output Types**: {outputs_text}
- **Human-in-Loop**: {human_loop}
- **Pattern**: {pattern}
- **Architecture**: {recommended_arch or 'single-agent'}
- **Multi-Agent Pattern**: {multi_agent_pattern or 'N/A'}{automation_line}{axis_line}"""


def parse_agent_names(design_result: str) -> List[str]:
    """design_result의 '### 2.2 Agent Components' 테이블에서 Agent 이름 목록을 추출.

    마크다운 테이블의 첫 번째 컬럼(Agent Name / Stage Name)을 파싱한다.
    파싱 실패 시 빈 리스트를 반환하여 fallback(단일 호출)을 유도한다.
    """
    # 2.2 섹션 찾기 (Agent Components 또는 워크플로우 단계)
    section_match = re.search(
        r'#+\s+2\.2\s+.+',
        design_result
    )
    if not section_match:
        return []

    # 해당 섹션부터 다음 ## 또는 ### 헤딩까지 추출
    start = section_match.end()
    next_heading = re.search(r'\n#+\s+\d', design_result[start:])
    section_text = design_result[start:start + next_heading.start()] if next_heading else design_result[start:]

    # 테이블 행 추출 (| ... | 형태)
    table_rows = re.findall(r'^\s*\|(.+)\|', section_text, re.MULTILINE)
    if len(table_rows) < 3:  # 최소 헤더 + 구분선 + 데이터 1행
        return []

    agent_names = []
    for row in table_rows[2:]:  # 헤더(0), 구분선(1) 스킵
        cols = [col.strip() for col in row.split('|')]
        first_col = cols[0].strip() if cols else ''
        if first_col and first_col != '---' and not re.match(r'^[-:]+$', first_col):
            agent_names.append(first_col)

    return agent_names


def clean_internal_comments(text: str) -> str:
    """내부 코멘트 제거 (Claude의 메타 발언 + tool call 잔재)

    전략:
    1. tool_call/tool_result XML 태그 블록 제거
    2. 첫 번째 섹션 헤딩(##) 이전의 모든 텍스트 제거 (메타 코멘터리가 항상 앞부분에 위치)
    3. 라인 단위 패턴 매칭으로 남은 메타 코멘터리 제거
    """
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
