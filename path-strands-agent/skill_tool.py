"""
Skill Tool - Strands Agent SDK용 스킬 도구

에이전트가 스킬을 호출할 수 있도록 하는 tool 정의.
"""

import logging
from typing import Annotated

from strands import tool

from skills.loader import SkillLoader, SkillNotFoundError

logger = logging.getLogger(__name__)

# Global reference to loader (set by skill_utils.setup_skill_tool)
_loader: SkillLoader | None = None


def setup_skill_tool(loader: SkillLoader, available_skills: dict[str, dict]):
    """
    Initialize the skill tool with loader and available skills.

    Args:
        loader: SkillLoader instance
        available_skills: Dictionary of skill metadata
    """
    global _loader
    _loader = loader
    
    logger.info(f"Skill tool initialized with {len(available_skills)} skills")


@tool
def skill_tool(skill_name: Annotated[str, "Name of the skill to invoke (e.g., 'strands-agent-patterns', 'agentcore-services', 'mermaid-diagrams')"]) -> str:
    """
    Load specialized skill instructions for specific tasks.
    Use this when you need detailed guidance on a particular topic.
    
    Args:
        skill_name: The name of the skill to load
    
    Returns:
        Full skill content with instructions
    """
    if _loader is None:
        raise ValueError("Skill tool not initialized. Call setup_skill_tool() first.")
    
    if not skill_name:
        raise ValueError("skill_name is required")
    
    print(f"🔧 [SKILL] Loading: {skill_name}")
    logger.info(f"Loading skill: {skill_name}")
    
    try:
        skill_content = _loader.load(skill_name)
        print(f"✅ [SKILL] Loaded: {skill_name} ({len(skill_content)} chars)")
        
        # 스킬 내용을 XML 태그로 감싸서 반환
        formatted_content = (
            f"<skill name='{skill_name}'>\n"
            f"{skill_content}\n"
            f"</skill>\n\n"
            f"The skill '{skill_name}' has been loaded. "
            f"Follow the instructions above to complete the task."
        )
        
        return formatted_content
    
    except SkillNotFoundError as e:
        print(f"❌ [SKILL] Not found: {skill_name}")
        logger.warning(f"Skill not found: {skill_name}")
        raise ValueError(str(e))

