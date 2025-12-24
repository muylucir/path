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
        """Feasibility 평가 수행"""
        conversation_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}" 
            for msg in conversation
        ])
        
        prompt = f"""다음 정보를 바탕으로 Feasibility를 평가하세요:

## 초기 입력
**Pain Point**: {form_data.get('painPoint', '')}
**INPUT**: {form_data.get('inputType', form_data.get('input', ''))}
**PROCESS**: {', '.join(form_data.get('processSteps', form_data.get('process', [])))}
**OUTPUT**: {', '.join(form_data.get('outputTypes', form_data.get('output', [])))}
**HUMAN-IN-LOOP**: {form_data.get('humanLoop', form_data.get('humanInLoop', ''))}
**Data Sources**: {json.dumps(form_data.get('dataSources', ''), ensure_ascii=False)}
**Error Tolerance**: {form_data.get('errorTolerance', '')}

## 대화 내용
{conversation_text}

다음 5개 항목을 평가하여 JSON 형식으로 반환하세요:

{{
  "data_accessibility": {{"score": 0-10, "reason": "평가 이유"}},
  "decision_clarity": {{"score": 0-10, "reason": "평가 이유"}},
  "error_tolerance": {{"score": 0-10, "reason": "평가 이유"}},
  "latency_requirement": {{"score": 0-10, "reason": "평가 이유"}},
  "integration_complexity": {{"score": 0-10, "reason": "평가 이유"}},
  "total_score": 0-50,
  "recommendation": "즉시 시작/조건부 진행/개선 후 재평가/대안 모색",
  "patterns": ["추천 패턴들"],
  "summary": "종합 평가 요약"
}}

**중요**: 반드시 유효한 JSON만 반환하세요.
"""
        result = self.agent(prompt)
        response_text = result.message['content'][0]['text']
        
        # JSON 추출
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
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
