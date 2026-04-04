"""
Strands SDK Utilities - Agent 생성 및 관리를 위한 유틸리티
"""

from strands import Agent
from strands.models import BedrockModel
from strands.models.bedrock import CacheConfig
import logging
import os
import botocore.config

logger = logging.getLogger(__name__)

# Model configuration is centralized in agent_config.py
from agent_config import DEFAULT_MODEL as DEFAULT_MODEL_ID  # noqa: E402


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
        model_id = kwargs.get("model_id", DEFAULT_MODEL_ID)
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
        plugins = kwargs.get("plugins", None)
        agent_kwargs = dict(
            model=model,
            system_prompt=system_prompts,
            tools=tools,
            callback_handler=None,
        )
        if plugins:
            agent_kwargs["plugins"] = plugins

        return Agent(**agent_kwargs)


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


_SKILLS_DIR = os.path.join(os.path.dirname(__file__), "skills")

# --- Skill content pre-loading (Phase 2+3 사전 주입) ---

_skill_content_cache: dict[str, str] = {}


def load_skill_content(skill_name: str, reference_files: list[str] | None = None) -> str:
    """스킬 SKILL.md 본문 + 지정 reference 파일을 사전 로드하여 프롬프트용 텍스트 반환.

    init 시 1회 호출 → 시스템 프롬프트에 삽입 → tool call 완전 제거.
    결과는 캐싱되어 동일 인자 재호출 시 파일 I/O 없이 반환.
    """
    cache_key = f"{skill_name}|{','.join(reference_files or [])}"
    if cache_key in _skill_content_cache:
        return _skill_content_cache[cache_key]

    skill_dir = os.path.join(_SKILLS_DIR, skill_name)
    parts: list[str] = []

    # SKILL.md 본문 읽기 (frontmatter 이후)
    skill_md = os.path.join(skill_dir, "SKILL.md")
    if os.path.isfile(skill_md):
        with open(skill_md, "r", encoding="utf-8") as f:
            content = f.read()
        # frontmatter (---...---) 제거, 본문만 추출
        if content.startswith("---"):
            end = content.find("---", 3)
            if end != -1:
                content = content[end + 3:].strip()
        parts.append(f"<skill name=\"{skill_name}\">\n{content}\n</skill>")
    else:
        logger.warning(f"SKILL.md not found: {skill_md}")

    # reference 파일 읽기
    if reference_files:
        refs_dir = os.path.join(skill_dir, "references")
        for ref_file in reference_files:
            ref_path = os.path.join(refs_dir, ref_file)
            if os.path.isfile(ref_path):
                with open(ref_path, "r", encoding="utf-8") as f:
                    ref_content = f.read()
                parts.append(
                    f"<reference name=\"{ref_file}\">\n{ref_content}\n</reference>"
                )
            else:
                logger.warning(f"Reference file not found: {ref_path}")

    result = "\n\n".join(parts)
    _skill_content_cache[cache_key] = result
    return result


def create_spec_agent(system_prompt: str, max_tokens: int = 8192,
                      model_id: str | None = None, temperature: float = 0.3,
                      tools=None, plugins=None):
    """표준 기본값으로 spec 서브에이전트 생성.

    skill_content가 시스템 프롬프트에 이미 포함된 경우 tools=[]로 호출하여
    tool call을 완전히 제거할 수 있다.
    """
    from safe_tools import safe_file_read  # lazy import to avoid circular

    return strands_utils.get_agent(
        system_prompts=system_prompt,
        model_id=model_id or DEFAULT_MODEL_ID,
        max_tokens=max_tokens,
        temperature=temperature,
        tools=tools if tools is not None else [safe_file_read],
        plugins=plugins,
    )
