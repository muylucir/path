"""
Chat Agent for PATH Step 2 - 대화형 분석 (스트리밍 + 채팅 지원)

사용자 입력을 분석하고 후속 질문을 생성하여 Feasibility를 평가하는 Agent
"""

from strands import Agent
from typing import Dict, List, Any, AsyncIterator
import json
import re
from strands_tools import file_read
from agentskills import discover_skills, generate_skills_prompt
from strands_utils import strands_utils
from prompts import (
    SYSTEM_PROMPT,
    get_initial_analysis_prompt,
    FEASIBILITY_SYSTEM_PROMPT,
    get_feasibility_evaluation_prompt,
    get_feasibility_reevaluation_prompt,
    PATTERN_ANALYSIS_SYSTEM_PROMPT,
    get_pattern_analysis_prompt
)


class AnalyzerAgent:
    """사용자 입력(pain point, input, process, output 등)을 분석하는 Agent"""

    def __init__(self, model_id: str = "global.anthropic.claude-opus-4-5-20251101-v1:0"):
        self.agent = Agent(
            model=model_id,
            system_prompt=SYSTEM_PROMPT,
            callback_handler=None  # 콘솔 출력 비활성화
        )
    
    def analyze(self, form_data: Dict[str, Any]) -> str:
        """초기 분석 수행 - 동기 버전"""
        prompt = get_initial_analysis_prompt(form_data)
        result = self.agent(prompt)
        return result.message['content'][0]['text']
    
    async def analyze_stream(self, form_data: Dict[str, Any]) -> AsyncIterator[str]:
        """초기 분석 수행 - 스트리밍 버전"""
        prompt = get_initial_analysis_prompt(form_data)
        
        async for event in self.agent.stream_async(prompt):
            if "data" in event:
                yield event["data"]


class ChatAgent:
    """대화형 분석 Agent - 채팅 지원"""

    def __init__(self, model_id: str = "global.anthropic.claude-opus-4-5-20251101-v1:0"):
        self.agent = Agent(
            model=model_id,
            system_prompt=SYSTEM_PROMPT,
            callback_handler=None  # 콘솔 출력 비활성화
        )
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
    
    def chat(self, user_message: str) -> str:
        """채팅 - 동기 버전"""
        # 사용자 메시지 추가
        self.add_message("user", user_message)
        
        # 대화 컨텍스트 구성
        history_text = "\n\n".join([
            f"{msg['role'].upper()}: {msg['content']}" 
            for msg in self.conversation_history
        ])
        
        prompt = f"""{history_text}

사용자의 답변을 반영하여:
1. 추가 정보가 더 필요하면 구체적으로 질문 (최대 3개)
2. 충분하면 "이제 최종 분석을 진행할 수 있습니다. '분석 완료'를 입력하세요." 안내

자연스럽게 대화하세요."""
        
        result = self.agent(prompt)
        response = result.message['content'][0]['text']
        
        # 응답 추가
        self.add_message("assistant", response)
        
        return response
    
    async def chat_stream(self, user_message: str) -> AsyncIterator[str]:
        """채팅 - 스트리밍 버전"""
        # 사용자 메시지 추가
        self.add_message("user", user_message)
        
        # 대화 컨텍스트 구성
        history_text = "\n\n".join([
            f"{msg['role'].upper()}: {msg['content']}" 
            for msg in self.conversation_history
        ])
        
        prompt = f"""{history_text}

사용자의 답변을 반영하여:
1. 추가 정보가 더 필요하면 구체적으로 질문 (최대 3개)
2. 충분하면 "이제 최종 분석을 진행할 수 있습니다. '분석 완료'를 입력하세요." 안내

자연스럽게 대화하세요."""
        
        # 스트리밍 응답 수집
        full_response = ""
        async for event in self.agent.stream_async(prompt):
            if "data" in event:
                chunk = event["data"]
                full_response += chunk
                yield chunk
        
        # 전체 응답 추가
        self.add_message("assistant", full_response)


class EvaluatorAgent:
    """답변 수집 후 Feasibility 점수를 계산하는 Agent"""

    def __init__(self, model_id: str = "global.anthropic.claude-opus-4-5-20251101-v1:0"):
        self.agent = Agent(
            model=model_id,
            system_prompt=SYSTEM_PROMPT,
            callback_handler=None  # 콘솔 출력 비활성화
        )
    
    def evaluate(self, form_data: Dict[str, Any], conversation: List[Dict]) -> Dict[str, Any]:
        """Feasibility 평가 수행 - PATH 웹앱 형식"""
        conversation_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}" 
            for msg in conversation
        ])
        
        prompt = f"""다음은 지금까지의 분석 내용입니다:

{conversation_text}

이제 최종 분석을 수행하세요. 다음을 JSON 형식으로 출력:

**Universal Agent Design Patterns**:
- **ReAct**: 단계적 추론(Think) → 도구 사용(Act) → 결과 관찰(Observe) → 반복
- **Reflection**: 출력 생성 → 품질 검토 → 개선 반복 (자기 성찰 루프)
- **Tool Use**: 외부 도구/API를 호출하여 데이터 접근, 계산, 시스템 연동
- **Planning**: 복잡한 작업을 하위 작업으로 분해하여 순차 실행
- **Multi-Agent**: 전문화된 여러 에이전트가 역할 분담하여 협업
- **Human-in-the-Loop**: Agent 제안 → 사람 검토/승인 → 실행

**패턴 조합도 가능**: 예) "ReAct + Tool Use", "Planning + Multi-Agent"

{{
  "pain_point": "사용자 Pain Point",
  "input_type": "INPUT 타입",
  "input_detail": "INPUT 상세",
  "process_steps": ["단계1: 설명", "단계2: 설명", "..."],
  "output_types": ["OUTPUT 타입1", "OUTPUT 타입2"],
  "output_detail": "OUTPUT 상세",
  "human_loop": "None/Review/Exception/Collaborate",
  "pattern": "ReAct/Reflection/Tool Use/Planning/Multi-Agent/Human-in-the-Loop (조합 가능)",
  "pattern_reason": "패턴 선택 이유 (문제의 특성과 패턴의 적합성 설명)",
  "feasibility_breakdown": {{
    "data_access": 0-10,
    "decision_clarity": 0-10,
    "error_tolerance": 0-10,
    "latency": 0-10,
    "integration": 0-10
  }},
  "feasibility_score": 0-50,
  "recommendation": "추천 사항",
  "risks": ["리스크1", "리스크2"],
  "next_steps": [
    "Phase 1: 핵심 기능 프로토타입 - 설명",
    "Phase 2: 검증 및 테스트 - 설명",
    "Phase 3: (선택적) 개선 및 확장 - 설명"
  ]
}}

중요: next_steps는 주 단위 기간이 아닌 Phase/단계 중심으로 작성하세요.
JSON만 출력하세요.
"""
        
        system_prompt_for_json = f"""{SYSTEM_PROMPT}

당신은 지금까지의 대화를 바탕으로 최종 분석을 수행하고 JSON 형식으로 출력합니다.
간결하고 정확하게 작성하세요."""
        
        # Agent 재생성 (JSON 전용 시스템 프롬프트)
        json_agent = Agent(
            model=self.agent.model.config['model_id'],
            system_prompt=system_prompt_for_json,
            callback_handler=None  # 콘솔 출력 비활성화
        )
        
        result = json_agent(prompt)
        response_text = result.message['content'][0]['text']
        
        # JSON 추출
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        
        if json_start != -1 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            return json.loads(json_str)
        else:
            raise ValueError("Failed to extract JSON from evaluation response")


class FeasibilityAgent:
    """Step2: Feasibility 평가 전용 Agent"""

    def __init__(self, model_id: str = "global.anthropic.claude-opus-4-5-20251101-v1:0"):
        self.agent = Agent(
            model=model_id,
            system_prompt=FEASIBILITY_SYSTEM_PROMPT,
            callback_handler=None  # 콘솔 출력 비활성화
        )

    def evaluate(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """초기 Feasibility 평가 수행"""
        prompt = get_feasibility_evaluation_prompt(form_data)
        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']

        # JSON 추출
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1

        if json_start != -1 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            return json.loads(json_str)
        else:
            raise ValueError("Failed to extract JSON from feasibility evaluation")

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

        # 완료 및 결과 전송
        yield json.dumps({"stage": "분석 완료", "progress": 100}, ensure_ascii=False)
        yield json.dumps({"result": result}, ensure_ascii=False)

    def _evaluate_sync(self, prompt: str) -> Dict[str, Any]:
        """동기 평가 (내부용)"""
        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']

        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1

        if json_start != -1 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            return json.loads(json_str)
        else:
            raise ValueError("Failed to extract JSON from feasibility evaluation")

    def reevaluate(self, form_data: Dict[str, Any], previous_evaluation: Dict[str, Any], improvement_plans: Dict[str, str]) -> Dict[str, Any]:
        """개선안 반영 재평가 수행"""
        prompt = get_feasibility_reevaluation_prompt(form_data, previous_evaluation, improvement_plans)
        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']

        # JSON 추출
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1

        if json_start != -1 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            return json.loads(json_str)
        else:
            raise ValueError("Failed to extract JSON from feasibility re-evaluation")


class PatternAnalyzerAgent:
    """Step3: Feasibility 결과를 바탕으로 패턴 분석하는 Agent (Skill 시스템 지원)"""

    def __init__(self, model_id: str = "global.anthropic.claude-opus-4-5-20251101-v1:0"):
        # Skill 시스템 초기화
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)
        enhanced_prompt = PATTERN_ANALYSIS_SYSTEM_PROMPT + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id=model_id,
            max_tokens=16000,
            temperature=0.3,
            tools=[file_read]
        )
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

    async def analyze_stream(self, form_data: Dict[str, Any], feasibility: Dict[str, Any], improvement_plans: Dict[str, str] = None) -> AsyncIterator[str]:
        """Feasibility 기반 초기 패턴 분석 - 스트리밍 버전"""
        prompt = get_pattern_analysis_prompt(form_data, feasibility, improvement_plans)

        full_response = ""
        async for event in self.agent.stream_async(prompt):
            if "data" in event:
                chunk = event["data"]
                full_response += chunk
                yield chunk

        self.add_message("assistant", full_response)

    async def chat_stream(self, user_message: str) -> AsyncIterator[str]:
        """패턴 관련 대화 - 스트리밍 버전 (Skill 시스템 지원)"""
        self.add_message("user", user_message)

        history_text = "\n\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in self.conversation_history
        ])

        prompt = f"""{history_text}

사용자의 답변을 반영하여 패턴 분석을 계속하세요.
추가 정보가 필요하면 구체적으로 질문하세요.
충분하면 "패턴을 확정할 수 있습니다. '패턴 확정'을 입력하세요." 안내하세요.

**Skill 사용 안내**:
- 다이어그램(플로우차트, 박스, 시퀀스, 테이블, 트리 등)을 그려야 하면:
  file_read로 "ascii-diagram" 스킬의 SKILL.md를 읽고 가이드를 따르세요.
- 코드 블록(```)으로 감싸서 고정폭 폰트로 정렬하세요."""

        full_response = ""
        async for event in self.agent.stream_async(prompt):
            if "data" in event:
                chunk = event["data"]
                full_response += chunk
                yield chunk

        self.add_message("assistant", full_response)

    def finalize(self, form_data: Dict[str, Any], feasibility: Dict[str, Any], improvement_plans: Dict[str, str] = None) -> Dict[str, Any]:
        """패턴 확정 및 최종 분석 결과 생성 (개선된 점수 포함)"""
        conversation_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in self.conversation_history
        ])

        # Feasibility breakdown을 단순화
        breakdown = feasibility.get('feasibility_breakdown', {})
        simple_breakdown = {}
        for key, value in breakdown.items():
            if isinstance(value, dict):
                simple_breakdown[key] = value.get('score', 0)
            else:
                simple_breakdown[key] = value

        # 개선 방안 텍스트 구성
        improvement_section = ""
        if improvement_plans:
            plans_with_content = {k: v for k, v in improvement_plans.items() if v and v.strip()}
            if plans_with_content:
                improvement_section = "\n**사용자 개선 방안**:\n"
                for item, plan in plans_with_content.items():
                    improvement_section += f"- {item}: {plan}\n"

        # 개선된 점수 계산 프롬프트 추가
        improved_feasibility_prompt = ""
        if improvement_plans and any(v and v.strip() for v in improvement_plans.values()):
            improved_feasibility_prompt = """
**개선된 Feasibility 점수 계산 (improved_feasibility)**:
사용자의 개선 방안과 대화 내용을 분석하여 예상되는 개선 점수를 계산하세요.

계산 기준:
1. 구체적이고 실행 가능한 개선 계획만 점수에 반영
2. 항목당 최대 +3점 상향 가능
3. 막연한 계획은 반영하지 않음
4. 점수는 상향만 가능 (하향 불가)

improved_feasibility 필드에 다음 형식으로 포함:
"improved_feasibility": {
  "score": 개선후총점,
  "score_change": 점수변화량,
  "breakdown": {
    "data_access": {
      "original_score": 원본점수,
      "improved_score": 개선후점수,
      "improvement_reason": "왜 점수가 올랐는지 구체적 설명 (개선 방안이 없으면 빈 문자열)"
    },
    "decision_clarity": {...},
    "error_tolerance": {...},
    "latency": {...},
    "integration": {...}
  },
  "summary": "전체 개선 점수 요약 (1-2문장)"
}"""

        prompt = f"""다음은 지금까지의 패턴 분석 대화입니다:

{conversation_text}

**Feasibility 정보**:
- 총점: {feasibility.get('feasibility_score', 0)}/50
- 판정: {feasibility.get('judgment', '')}
{improvement_section}
이제 최종 분석을 수행하세요. 다음을 JSON 형식으로 출력:
{improved_feasibility_prompt}
{{
  "pain_point": "사용자 Pain Point",
  "input_type": "INPUT 타입",
  "input_detail": "INPUT 상세",
  "process_steps": ["단계1: 설명", "단계2: 설명", "..."],
  "output_types": ["OUTPUT 타입1", "OUTPUT 타입2"],
  "output_detail": "OUTPUT 상세",
  "human_loop": "None/Review/Exception/Collaborate",
  "pattern": "ReAct/Reflection/Tool Use/Planning/Multi-Agent/Human-in-the-Loop (조합 가능)",
  "pattern_reason": "패턴 선택 이유 (Feasibility와 연계하여 설명)",
  "feasibility_breakdown": {json.dumps(simple_breakdown)},
  "feasibility_score": {feasibility.get('feasibility_score', 0)},
  "improved_feasibility": null,
  "recommendation": "추천 사항",
  "risks": ["리스크1", "리스크2"],
  "next_steps": [
    "Phase 1: 핵심 기능 프로토타입 - 설명",
    "Phase 2: 검증 및 테스트 - 설명",
    "Phase 3: (선택적) 개선 및 확장 - 설명"
  ]
}}

중요:
- 사용자 개선 방안이 있으면 improved_feasibility를 계산하여 포함하세요.
- 개선 방안이 없거나 반영할 내용이 없으면 improved_feasibility는 null로 유지하세요.
- JSON만 출력하세요."""

        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']

        # JSON 추출
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1

        if json_start != -1 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            return json.loads(json_str)
        else:
            raise ValueError("Failed to extract JSON from pattern finalization")


# 테스트용 메인 함수
if __name__ == "__main__":
    import asyncio

    async def test():
        # 스트리밍 테스트
        print("🔍 스트리밍 분석 테스트")
        print("="*80)
        analyzer = AnalyzerAgent()
        async for chunk in analyzer.analyze_stream(form_data):
            print(chunk, end="", flush=True)
        print("\n\n✅ 완료!")

    asyncio.run(test())
