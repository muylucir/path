"""
Strands SDK Utilities - Agent 생성 및 관리를 위한 유틸리티
strands-skill-system에서 필요한 부분만 추출
"""

from strands import Agent
from strands.models import BedrockModel
from strands.models.bedrock import CacheConfig
from typing import Any
import logging
import os
import botocore.config
from agentskills import discover_skills, generate_skills_prompt

logger = logging.getLogger(__name__)

# Default model ID - can be overridden via environment variable
DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "global.anthropic.claude-opus-4-6-v1")


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


def safe_extract_text(result) -> str:
    """AgentResult에서 텍스트를 안전하게 추출.

    result.message['content'][0]['text'] 직접 접근 시 KeyError/IndexError 가능.
    빈 응답, 거부, 비정상 구조에서도 크래시 없이 ValueError를 발생시킨다.
    """
    try:
        content = result.message.get('content', [])
        if not content:
            raise ValueError("Empty LLM response content")
        for block in content:
            if isinstance(block, dict) and 'text' in block and block['text'].strip():
                return block['text']
        raise ValueError("No text block found in LLM response")
    except (AttributeError, TypeError) as e:
        raise ValueError(f"Malformed LLM response structure: {e}")


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
        if not _cached_skills:
            logger.warning(f"No skills discovered in {_skills_dir}")
        _cached_skill_prompt = generate_skills_prompt(_cached_skills)
    return _cached_skill_prompt


def create_spec_agent(system_prompt: str, max_tokens: int = 8192,
                      model_id: str = None, temperature: float = 0.3,
                      tools=None):
    """Skill 프롬프트 자동 병합 + 표준 기본값으로 Agent 생성.

    모든 spec 서브에이전트의 공통 초기화 보일러플레이트를 제거한다.
    """
    from safe_tools import safe_file_read  # lazy import to avoid circular

    skill_prompt = get_skill_prompt()
    enhanced_prompt = system_prompt + "\n" + skill_prompt
    return strands_utils.get_agent(
        system_prompts=enhanced_prompt,
        model_id=model_id or DEFAULT_MODEL_ID,
        max_tokens=max_tokens,
        temperature=temperature,
        tools=tools if tools is not None else [safe_file_read]
    )
