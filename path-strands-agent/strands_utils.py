"""
Strands SDK Utilities - Agent 생성 및 관리를 위한 유틸리티
strands-skill-system에서 필요한 부분만 추출
"""

from strands import Agent
from strands.models import BedrockModel
from strands.models.bedrock import CacheConfig
from typing import Any
import os
import botocore.config
from agentskills import discover_skills, generate_skills_prompt


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
        model_id = kwargs.get("model_id", "global.anthropic.claude-opus-4-6-v1")
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

        # BedrockModel 생성 (타임아웃 설정 + Automatic Cache Strategy)
        model = BedrockModel(
            model_id=model_id,
            max_tokens=max_tokens,
            temperature=temperature,
            boto_client_config=client_config,
            cache_config=CacheConfig(strategy="auto"),
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


# Cache skill discovery results (static content, no need to re-read)
_cached_skills = None
_cached_skill_prompt = None

def get_skill_prompt():
    """Skill 프롬프트를 캐싱하여 반환 (모든 Agent에서 공유)"""
    global _cached_skills, _cached_skill_prompt
    if _cached_skill_prompt is None:
        _skills_dir = os.path.join(os.path.dirname(__file__), "skills")
        _cached_skills = discover_skills(_skills_dir)
        _cached_skill_prompt = generate_skills_prompt(_cached_skills)
    return _cached_skill_prompt
