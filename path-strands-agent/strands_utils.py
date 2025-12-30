"""
Strands SDK Utilities - Agent 생성 및 관리를 위한 유틸리티
strands-skill-system에서 필요한 부분만 추출
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Any


class StrandsUtils:
    """Strands Agent SDK 유틸리티"""
    
    @staticmethod
    def get_agent(**kwargs) -> Agent:
        """
        Strands Agent 생성 (tool 호환성 보장)
        
        Args:
            system_prompts: System prompt
            model_id: Bedrock model ID
            tools: Tool 리스트
            **kwargs: 기타 Agent 파라미터
        """
        system_prompts = kwargs.get("system_prompts", "")
        model_id = kwargs.get("model_id", "global.anthropic.claude-sonnet-4-5-20250929-v1:0")
        tools = kwargs.get("tools", [])
        max_tokens = kwargs.get("max_tokens", 8192)
        temperature = kwargs.get("temperature", 0.3)
        
        # BedrockModel 생성
        model = BedrockModel(
            model_id=model_id,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        # Agent 생성
        agent = Agent(
            model=model,
            system_prompt=system_prompts,
            tools=tools
        )
        
        return agent


# Singleton instance
strands_utils = StrandsUtils()
