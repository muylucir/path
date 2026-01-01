"""
Chat Agent for PATH Step 2 - 대화형 분석 (스트리밍 + 채팅 지원)

사용자 입력을 분석하고 후속 질문을 생성하여 Feasibility를 평가하는 Agent
"""

from strands import Agent
from typing import Dict, List, Any, AsyncIterator
import json
import re
from prompts import SYSTEM_PROMPT, get_initial_analysis_prompt


class AnalyzerAgent:
    """사용자 입력(pain point, input, process, output 등)을 분석하는 Agent"""
    
    def __init__(self, model_id: str = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"):
        self.agent = Agent(
            model=model_id,
            system_prompt=SYSTEM_PROMPT
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
    
    def __init__(self, model_id: str = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"):
        self.agent = Agent(
            model=model_id,
            system_prompt=SYSTEM_PROMPT
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
    
    def __init__(self, model_id: str = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"):
        self.agent = Agent(
            model=model_id,
            system_prompt=SYSTEM_PROMPT
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

**패턴 용어 정의 (혼동 주의)**:
- **Tool Use**: Agent가 MCP 서버, 외부 API, 데이터베이스 등 외부 도구를 직접 호출하는 패턴
- **Agent-as-Tool**: 다른 Agent가 특정 Agent를 "도구"로 사용하는 패턴 (Agent → Agent 호출)
- **Planning**: 복잡한 작업을 단계별로 분해하여 순차 실행
- **Reflection**: 출력 품질 검증 후 자가 개선 루프
- **Multi-Agent (Graph)**: 여러 Agent가 협업하는 구조

**중요**: pattern_reason 작성 시 "Tool Use"와 "Agent-as-Tool"을 혼동하지 마세요.
- MCP/API 호출 = Tool Use (Agent-as-Tool 아님)
- Agent가 다른 Agent를 도구로 사용 = Agent-as-Tool

{{
  "pain_point": "사용자 Pain Point",
  "input_type": "INPUT 타입",
  "input_detail": "INPUT 상세",
  "process_steps": ["단계1: 설명", "단계2: 설명", "..."],
  "output_types": ["OUTPUT 타입1", "OUTPUT 타입2"],
  "output_detail": "OUTPUT 상세",
  "human_loop": "None/Review/Exception/Collaborate",
  "pattern": "Reflection/Tool Use/Planning/Multi-Agent",
  "pattern_reason": "패턴 선택 이유 (Tool Use와 Agent-as-Tool 구분하여 정확히 기술)",
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
            system_prompt=system_prompt_for_json
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
