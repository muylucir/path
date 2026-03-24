"""4단계: 최종 조합 - LLM 없이 단순 문자열 조합"""

import asyncio
from typing import Dict, Any, AsyncIterator

from spec._helpers import clean_internal_comments


class AssemblerAgent:
    """4단계: 최종 조합 - LLM 없이 단순 문자열 조합"""

    def __init__(self):
        pass

    async def assemble_stream(
        self,
        analysis: Dict[str, Any],
        design_result: str,
        diagram_result: str,
        prompt_result: str,
        tool_result: str,
    ) -> AsyncIterator[dict]:
        """최종 조합 - LLM 없이 단순 문자열 조합 후 스트리밍"""

        # 내부 코멘트 제거
        design_result = clean_internal_comments(design_result)
        diagram_result = clean_internal_comments(diagram_result)
        prompt_result = clean_internal_comments(prompt_result)
        tool_result = clean_internal_comments(tool_result)

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
