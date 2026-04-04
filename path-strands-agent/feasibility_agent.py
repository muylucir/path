"""Step 2: Feasibility 평가 전용 Agent"""

import asyncio
import json
import logging
from typing import Any, AsyncIterator, Dict

from agent_config import get_profile
from strands_utils import strands_utils, load_skill_content, safe_extract_text
from token_tracker import extract_usage
from llm_parsing import extract_json, validate_feasibility
from prompts import (
    FEASIBILITY_SYSTEM_PROMPT,
    get_feasibility_evaluation_prompt,
    get_feasibility_reevaluation_prompt,
)

logger = logging.getLogger(__name__)


class FeasibilityAgent:
    """Step2: Feasibility 평가 전용 Agent"""

    def __init__(self):
        cfg = get_profile("feasibility")

        # 스킬 + 전체 reference 사전 주입 → tools/plugins 불필요, 1회 LLM 호출로 완료
        skill_content = load_skill_content(
            "feasibility-evaluation",
            ["scoring-criteria.md", "improvement-suggestions.md", "risk-patterns.md"],
        )
        enhanced_prompt = (
            FEASIBILITY_SYSTEM_PROMPT
            + "\n\n## 참조 스킬 및 레퍼런스 (사전 로드됨 — 도구 호출 불필요)\n"
            + skill_content
        )

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=cfg["model_id"],
            max_tokens=cfg["max_tokens"],
            temperature=cfg["temperature"],
            tools=[],
        )

    def evaluate(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """초기 Feasibility 평가 수행"""
        prompt = get_feasibility_evaluation_prompt(form_data)
        result = self.agent(prompt)
        response_text = safe_extract_text(result)
        parsed = extract_json(response_text, "feasibility evaluation")
        parsed = validate_feasibility(parsed)
        parsed["_usage"] = extract_usage(result)
        return parsed

    async def evaluate_stream(self, form_data: Dict[str, Any]) -> AsyncIterator[str]:
        """초기 Feasibility 평가 수행 - SSE 스트리밍 (Progress 포함)"""
        prompt = get_feasibility_evaluation_prompt(form_data)

        # 평가 항목 단계
        stages = [
            "데이터 접근성 분석 중...",
            "판단 명확성 분석 중...",
            "오류 허용도 분석 중...",
            "응답속도 요구사항 분석 중...",
            "시스템 연동 분석 중...",
            "자율성 요구도 분석 중...",
        ]

        # 시작 알림
        yield json.dumps({"stage": "준비도 점검 시작", "progress": 0}, ensure_ascii=False)

        # LLM 호출을 백그라운드에서 실행
        task = asyncio.create_task(asyncio.to_thread(self._evaluate_sync, prompt))

        # 진행 상태 업데이트 (3초마다)
        progress = 10
        stage_idx = 0
        while not task.done():
            await asyncio.sleep(3)
            if not task.done():
                progress = min(progress + 15, 85)
                stage = stages[stage_idx % len(stages)]
                stage_idx += 1
                yield json.dumps({"stage": stage, "progress": progress}, ensure_ascii=False)

        # 결과 가져오기
        try:
            result = await task
        except Exception as e:
            error_detail = f"[FeasibilityAgent] {type(e).__name__}: {str(e)[:200]}"
            logger.error(f"Feasibility 평가 실패: {error_detail}", exc_info=True)
            yield json.dumps({"stage": "오류 발생", "progress": 100, "error": f"평가 중 오류가 발생했습니다. ({error_detail})"}, ensure_ascii=False)
            return

        usage = result.pop("_usage", None)

        # 완료 및 결과 전송
        yield json.dumps({"stage": "분석 완료", "progress": 100}, ensure_ascii=False)
        yield json.dumps({"result": result}, ensure_ascii=False)
        if usage:
            yield json.dumps({"usage": usage}, ensure_ascii=False)

    def _evaluate_sync(self, prompt: str) -> Dict[str, Any]:
        """동기 평가 (내부용)"""
        result = self.agent(prompt)
        response_text = safe_extract_text(result)
        parsed = extract_json(response_text, "feasibility evaluation")
        parsed = validate_feasibility(parsed)
        parsed["_usage"] = extract_usage(result)
        return parsed

    def reevaluate(self, form_data: Dict[str, Any], previous_evaluation: Dict[str, Any], improvement_plans: Dict[str, str]) -> Dict[str, Any]:
        """개선안 반영 재평가 수행"""
        prompt = get_feasibility_reevaluation_prompt(form_data, previous_evaluation, improvement_plans)
        result = self.agent(prompt)
        response_text = safe_extract_text(result)
        parsed = extract_json(response_text, "feasibility re-evaluation")
        parsed = validate_feasibility(parsed)
        parsed["_usage"] = extract_usage(result)
        return parsed

    async def reevaluate_stream(self, form_data: Dict[str, Any], previous_evaluation: Dict[str, Any], improvement_plans: Dict[str, str]) -> AsyncIterator[str]:
        """개선안 반영 재평가 - SSE 스트리밍 (Progress 포함, 타임아웃 방지)"""
        stages = [
            "개선 방안 분석 중...",
            "이전 평가 비교 중...",
            "데이터 접근성 재평가 중...",
            "판단 명확성 재평가 중...",
            "오류 허용도 재평가 중...",
            "시스템 연동 재평가 중...",
            "점수 변화 계산 중...",
        ]

        yield json.dumps({"stage": "재평가 시작", "progress": 0}, ensure_ascii=False)

        task = asyncio.create_task(asyncio.to_thread(self.reevaluate, form_data, previous_evaluation, improvement_plans))

        progress = 10
        stage_idx = 0
        while not task.done():
            await asyncio.sleep(3)
            if not task.done():
                progress = min(progress + 12, 85)
                stage = stages[stage_idx % len(stages)]
                stage_idx += 1
                yield json.dumps({"stage": stage, "progress": progress}, ensure_ascii=False)

        try:
            result = await task
        except Exception as e:
            error_detail = f"[FeasibilityAgent.reevaluate] {type(e).__name__}: {str(e)[:200]}"
            logger.error(f"Feasibility 재평가 실패: {error_detail}", exc_info=True)
            yield json.dumps({"stage": "오류 발생", "progress": 100, "error": f"재평가 중 오류가 발생했습니다. ({error_detail})"}, ensure_ascii=False)
            return

        usage = result.pop("_usage", None)

        yield json.dumps({"stage": "재평가 완료", "progress": 100}, ensure_ascii=False)
        yield json.dumps({"result": result}, ensure_ascii=False)
        if usage:
            yield json.dumps({"usage": usage}, ensure_ascii=False)
