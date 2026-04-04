"""Step 3: 패턴 분석 + 대화 + 확정 Agent (AgentSkills 플러그인)"""

import logging
import os
from typing import Any, AsyncIterator, Dict, List

from strands import AgentSkills
from agent_config import get_profile
from safe_tools import safe_file_read
from strands_utils import strands_utils, safe_extract_text
from token_tracker import extract_usage
from llm_parsing import extract_json, validate_analysis
from prompts import (
    PATTERN_ANALYSIS_SYSTEM_PROMPT,
    get_pattern_analysis_prompt,
    get_pattern_chat_prompt,
    get_pattern_finalize_prompt,
)

logger = logging.getLogger(__name__)
_SKILLS_DIR = os.path.join(os.path.dirname(__file__), "skills")


class PatternAnalyzerAgent:
    """Step3: Feasibility 결과를 바탕으로 패턴 분석하는 Agent (AgentSkills 플러그인)"""

    def __init__(self):
        cfg = get_profile("pattern_analyzer")

        # 네이티브 AgentSkills 플러그인 (온디맨드 스킬 활성화)
        skills_plugin = AgentSkills(skills=_SKILLS_DIR)

        self.agent = strands_utils.get_agent(
            system_prompts=PATTERN_ANALYSIS_SYSTEM_PROMPT,
            model_id=cfg["model_id"],
            max_tokens=cfg["max_tokens"],
            temperature=cfg["temperature"],
            tools=[safe_file_read],
            plugins=[skills_plugin],
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
        response = safe_extract_text(result)
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
        response_text = safe_extract_text(result)
        parsed = extract_json(response_text, "pattern finalization")
        parsed = validate_analysis(parsed)

        parsed["_usage"] = extract_usage(result)
        return parsed
