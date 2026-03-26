"""명세서 생성 조율 - DiagramAgent + PromptAgent + ToolAgent 병렬 실행"""

import asyncio
import logging
from typing import Dict, Any, AsyncIterator, Optional, List

from token_tracker import merge_usage
from spec.design_agent import DesignAgent
from spec.diagram_agent import DiagramAgent
from spec.prompt_agent import PromptAgent
from spec.tool_agent import ToolAgent
from spec.assembler import AssemblerAgent

logger = logging.getLogger(__name__)


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

            raw_results = await asyncio.gather(diagram_task, prompt_task, tool_task, return_exceptions=True)

            # 부분 실패 처리: 실패한 서브에이전트는 빈 문자열로 대체
            sub_names = ["DiagramAgent", "PromptAgent", "ToolAgent"]
            resolved: list[str] = []
            for i, r in enumerate(raw_results):
                if isinstance(r, BaseException):
                    logger.error(f"{sub_names[i]} 실패: {r}", exc_info=r)
                    resolved.append("")
                else:
                    resolved.append(r)

            diagram_result, prompt_result, tool_result = resolved
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
            try:
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
            except Exception as e:
                logger.warning(f"Usage 집계 실패: {e}")

            # 최종 100% 도달
            yield {'progress': 100, 'stage': '완료'}

        except Exception as e:
            logger.error(f"명세서 생성 오류: {e}", exc_info=True)
            yield {'error': '명세서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
