"""
Strands SDK Utilities - Agent 생성 및 관리를 위한 유틸리티
strands-skill-system에서 필요한 부분만 추출
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Any
import botocore.config


# Bedrock API 호출 타임아웃 및 재시도 설정
BEDROCK_CLIENT_CONFIG = botocore.config.Config(
    read_timeout=120,
    connect_timeout=10,
    retries={"max_attempts": 2}
)


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
            read_timeout: Bedrock API read timeout in seconds (default: 120)
            connect_timeout: Bedrock API connect timeout in seconds (default: 10)
            **kwargs: 기타 Agent 파라미터
        """
        system_prompts = kwargs.get("system_prompts", "")
        model_id = kwargs.get("model_id", "global.anthropic.claude-opus-4-5-20251101-v1:0")
        tools = kwargs.get("tools", [])
        max_tokens = kwargs.get("max_tokens", 8192)
        temperature = kwargs.get("temperature", 0.3)
        read_timeout = kwargs.get("read_timeout", 120)
        connect_timeout = kwargs.get("connect_timeout", 10)

        # 커스텀 타임아웃이 기본값과 다르면 별도 Config 생성
        if read_timeout != 120 or connect_timeout != 10:
            client_config = botocore.config.Config(
                read_timeout=read_timeout,
                connect_timeout=connect_timeout,
                retries={"max_attempts": 2}
            )
        else:
            client_config = BEDROCK_CLIENT_CONFIG

        # BedrockModel 생성 (타임아웃 설정 포함)
        model = BedrockModel(
            model_id=model_id,
            max_tokens=max_tokens,
            temperature=temperature,
            boto_client_config=client_config
        )
        
        # Agent 생성 (콘솔 출력 비활성화)
        agent = Agent(
            model=model,
            system_prompt=system_prompts,
            tools=tools,
            callback_handler=None
        )

        return agent


# Singleton instance
strands_utils = StrandsUtils()
