"""
Chat Agent for PATH — Feasibility 평가 및 Pattern 분석 Agent

FeasibilityAgent: Step 2 준비도 점검
PatternAnalyzerAgent: Step 3 패턴 분석 + 대화 + 확정
"""

from strands import Agent
from typing import Dict, List, Any, AsyncIterator
import json
import os
import re
from safe_tools import safe_file_read
from strands_utils import strands_utils, get_skill_prompt
from token_tracker import extract_usage
from prompts import (
    FEASIBILITY_SYSTEM_PROMPT,
    get_feasibility_evaluation_prompt,
    get_feasibility_reevaluation_prompt,
    PATTERN_ANALYSIS_SYSTEM_PROMPT,
    get_pattern_analysis_prompt,
    get_pattern_chat_prompt,
    get_pattern_finalize_prompt,
)

# Default model ID - can be overridden via environment variable
DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "global.anthropic.claude-opus-4-6-v1")

def _extract_json(response_text: str, context: str = "response") -> Dict[str, Any]:
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

    # { ... } 추출
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1

    if json_start != -1 and json_end > json_start:
        json_str = response_text[json_start:json_end]
        return json.loads(json_str)

    raise ValueError(f"Failed to extract JSON from {context}")


class FeasibilityAgent:
    """Step2: Feasibility 평가 전용 Agent"""

    def __init__(self, model_id: str = DEFAULT_MODEL_ID):
        # Skill 시스템 초기화 (cached)
        skill_prompt = get_skill_prompt()
        enhanced_prompt = FEASIBILITY_SYSTEM_PROMPT + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=model_id,
            max_tokens=8192,
            temperature=0.3,
            tools=[safe_file_read]
        )

    def evaluate(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """초기 Feasibility 평가 수행"""
        prompt = get_feasibility_evaluation_prompt(form_data)
        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']
        parsed = _extract_json(response_text, "feasibility evaluation")
        parsed["_usage"] = extract_usage(result)
        return parsed

    async def evaluate_stream(self, form_data: Dict[str, Any]) -> AsyncIterator[str]:
        """초기 Feasibility 평가 수행 - SSE 스트리밍 (Progress 포함)"""
        import asyncio

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
        result = await task
        usage = result.pop("_usage", None)

        # 완료 및 결과 전송
        yield json.dumps({"stage": "분석 완료", "progress": 100}, ensure_ascii=False)
        yield json.dumps({"result": result}, ensure_ascii=False)
        if usage:
            yield json.dumps({"usage": usage}, ensure_ascii=False)

    def _evaluate_sync(self, prompt: str) -> Dict[str, Any]:
        """동기 평가 (내부용)"""
        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']
        parsed = _extract_json(response_text, "feasibility evaluation")
        parsed["_usage"] = extract_usage(result)
        return parsed

    def reevaluate(self, form_data: Dict[str, Any], previous_evaluation: Dict[str, Any], improvement_plans: Dict[str, str]) -> Dict[str, Any]:
        """개선안 반영 재평가 수행"""
        prompt = get_feasibility_reevaluation_prompt(form_data, previous_evaluation, improvement_plans)
        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']
        parsed = _extract_json(response_text, "feasibility re-evaluation")
        parsed["_usage"] = extract_usage(result)
        return parsed


class PatternAnalyzerAgent:
    """Step3: Feasibility 결과를 바탕으로 패턴 분석하는 Agent (Skill 시스템 지원)"""

    def __init__(self, model_id: str = DEFAULT_MODEL_ID):
        # Skill 시스템 초기화 (cached)
        skill_prompt = get_skill_prompt()
        enhanced_prompt = PATTERN_ANALYSIS_SYSTEM_PROMPT + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=model_id,
            max_tokens=16000,
            temperature=0.3,
            tools=[safe_file_read]
        )
        # Stateful 모드에서 충분한 대화 컨텍스트 유지 (기본 40 → 200)
        self.agent.conversation_manager.window_size = 200
        self.conversation_history: List[Dict[str, str]] = []

    def add_message(self, role: str, content: str):
        """대화 히스토리에 메시지 추가"""
        self.conversation_history.append({"role": role, "content": content})

    def get_history(self) -> List[Dict[str, str]]:
        """대화 히스토리 반환"""
        return self.conversation_history

    def clear_history(self):
        """대화 히스토리 초기화"""
        self.conversation_history = []

    def analyze(self, form_data: Dict[str, Any], feasibility: Dict[str, Any]) -> str:
        """Feasibility 기반 초기 패턴 분석 - 동기 버전"""
        prompt = get_pattern_analysis_prompt(form_data, feasibility)
        result = self.agent(prompt)
        response = result.message['content'][0]['text']
        self.add_message("assistant", response)
        return response

    async def _stream_filtered(self, prompt: str) -> AsyncIterator[dict]:
        """Tool 사용 시 meta-commentary를 필터링하는 스트리밍 헬퍼

        동작 원리:
        1. 텍스트를 버퍼에 축적
        2. current_tool_use 이벤트 → 버퍼 폐기 (tool 전 메타 코멘터리 제거)
        3. start 이벤트 (tool 후 새 사이클) → 스트리밍 모드 전환
        4. tool 미사용 시 → 100자 초과 시 자동 플러시 (지연 최소화)
        """
        full_response = ""
        usage = None
        buffer = ""
        had_tool_use = False
        streaming = False

        try:
            async for event in self.agent.stream_async(prompt):
                if "data" in event:
                    chunk = event["data"]
                    if streaming:
                        full_response += chunk
                        yield {"text": chunk}
                    else:
                        buffer += chunk
                        # Tool 미사용이 확실해지면 바로 스트리밍 시작
                        if not had_tool_use and len(buffer) > 100:
                            streaming = True
                            full_response += buffer
                            yield {"text": buffer}
                            buffer = ""
                elif "current_tool_use" in event:
                    had_tool_use = True
                    buffer = ""  # Tool 전 메타 코멘터리 폐기
                elif "start" in event:
                    # Tool 실행 후 새 사이클 시작 → 스트리밍 모드 전환
                    if had_tool_use and not streaming:
                        streaming = True
                elif "result" in event:
                    usage = extract_usage(event["result"])
        except RuntimeError as e:
            if "StopIteration" not in str(e):
                raise

        # 잔여 버퍼 플러시 (짧은 응답 또는 tool 미사용)
        if buffer:
            full_response += buffer
            yield {"text": buffer}

        yield {"_full_response": full_response}
        if usage:
            yield {"usage": usage}

    async def analyze_stream(self, form_data: Dict[str, Any], feasibility: Dict[str, Any], improvement_plans: Dict[str, str] = None) -> AsyncIterator[dict]:
        """Feasibility 기반 초기 패턴 분석 - 스트리밍 버전 (dict yield)"""
        prompt = get_pattern_analysis_prompt(form_data, feasibility, improvement_plans)

        async for chunk in self._stream_filtered(prompt):
            if "_full_response" in chunk:
                self.add_message("assistant", chunk["_full_response"])
            else:
                yield chunk

    async def chat_stream(self, user_message: str, stateful: bool = False) -> AsyncIterator[dict]:
        """패턴 관련 대화 - 스트리밍 버전 (Skill 시스템 지원, dict yield)"""
        self.add_message("user", user_message)

        if stateful:
            prompt = get_pattern_chat_prompt(user_message=user_message)
        else:
            history_text = "\n\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in self.conversation_history
            ])
            prompt = get_pattern_chat_prompt(user_message=user_message, history_text=history_text)

        async for chunk in self._stream_filtered(prompt):
            if "_full_response" in chunk:
                self.add_message("assistant", chunk["_full_response"])
            else:
                yield chunk

    def finalize(self, form_data: Dict[str, Any], feasibility: Dict[str, Any], improvement_plans: Dict[str, str] = None, stateful: bool = False) -> Dict[str, Any]:
        """패턴 확정 및 최종 분석 결과 생성 (개선된 점수 포함)"""
        if stateful:
            conversation_text = None
        else:
            conversation_text = "\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in self.conversation_history
            ])

        prompt = get_pattern_finalize_prompt(
            form_data, feasibility,
            improvement_plans=improvement_plans,
            conversation_text=conversation_text
        )

        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']
        parsed = _extract_json(response_text, "pattern finalization")

        # improved_feasibility 유효성 검증: 불완전한 객체 방어
        improved = parsed.get("improved_feasibility")
        if improved is not None:
            if (not isinstance(improved, dict)
                or not isinstance(improved.get("score"), (int, float))
                or not isinstance(improved.get("score_change"), (int, float))):
                parsed["improved_feasibility"] = None

        parsed["_usage"] = extract_usage(result)
        return parsed
