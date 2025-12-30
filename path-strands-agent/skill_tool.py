"""
Skill Tool - Strands Agent SDK용 스킬 도구

agentskills.io 스펙 준수 Progressive Disclosure:
- 스킬 전체 로드: skill_tool(skill_name="...")
- 참조 파일 로드: skill_tool(skill_name="...", reference="...")
- 참조 목록 조회: list_skill_references(skill_name="...")
"""

import logging
from typing import Annotated, Optional

from strands import tool

from skills.loader import SkillLoader, SkillNotFoundError, ReferenceNotFoundError

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
def skill_tool(
    skill_name: Annotated[str, "Name of the skill to invoke (e.g., 'strands-agent-patterns', 'agentcore-services', 'mermaid-diagrams')"],
    reference: Annotated[Optional[str], "Optional: specific reference file to load (e.g., 'graph-pattern.md'). If provided, loads only the reference instead of full skill."] = None
) -> str:
    """
    Load specialized skill instructions or specific references for detailed guidance.

    Progressive Disclosure:
    - Without reference: Load full SKILL.md instructions
    - With reference: Load specific reference file from references/ directory

    Args:
        skill_name: The name of the skill to load
        reference: Optional reference file name to load instead of full skill

    Returns:
        Skill instructions or reference content
    """
    if _loader is None:
        raise ValueError("Skill tool not initialized. Call setup_skill_tool() first.")

    if not skill_name:
        raise ValueError("skill_name is required")

    try:
        if reference:
            # 특정 참조 파일 로드 (Progressive Disclosure - on-demand)
            print(f"📄 [SKILL] Loading reference: {skill_name}/{reference}")
            logger.info(f"Loading reference: {skill_name}/{reference}")

            content = _loader.load_reference(skill_name, reference)
            print(f"✅ [SKILL] Loaded reference: {reference} ({len(content)} chars)")

            return (
                f"<skill_reference skill='{skill_name}' file='{reference}'>\n"
                f"{content}\n"
                f"</skill_reference>\n\n"
                f"Reference '{reference}' from skill '{skill_name}' has been loaded. "
                f"Follow the instructions above."
            )
        else:
            # 전체 스킬 로드
            print(f"🔧 [SKILL] Loading: {skill_name}")
            logger.info(f"Loading skill: {skill_name}")

            skill_content = _loader.load(skill_name)
            print(f"✅ [SKILL] Loaded: {skill_name} ({len(skill_content)} chars)")

            # 참조 파일이 있으면 힌트 추가
            available_refs = _loader.list_references(skill_name)
            ref_hint = ""
            if available_refs:
                ref_list = ", ".join(available_refs[:5])
                if len(available_refs) > 5:
                    ref_list += f", ... (+{len(available_refs) - 5} more)"
                ref_hint = (
                    f"\n\n[Progressive Disclosure] This skill has {len(available_refs)} reference(s): {ref_list}\n"
                    f"Load specific reference: skill_tool(skill_name='{skill_name}', reference='<filename>')"
                )

            return (
                f"<skill name='{skill_name}'>\n"
                f"{skill_content}\n"
                f"</skill>{ref_hint}\n\n"
                f"The skill '{skill_name}' has been loaded. "
                f"Follow the instructions above to complete the task."
            )

    except SkillNotFoundError as e:
        print(f"❌ [SKILL] Not found: {skill_name}")
        logger.warning(f"Skill not found: {skill_name}")
        raise ValueError(str(e))
    except ReferenceNotFoundError as e:
        print(f"❌ [SKILL] Reference not found: {skill_name}/{reference}")
        logger.warning(f"Reference not found: {skill_name}/{reference}")
        raise ValueError(str(e))


@tool
def list_skill_references(
    skill_name: Annotated[str, "Name of the skill to list references for"]
) -> str:
    """
    List available reference files for a skill.

    Use this to discover what detailed references are available before loading them.
    References contain in-depth documentation that can be loaded on-demand.

    Args:
        skill_name: The name of the skill

    Returns:
        List of available reference files
    """
    if _loader is None:
        raise ValueError("Skill tool not initialized. Call setup_skill_tool() first.")

    if not skill_name:
        raise ValueError("skill_name is required")

    try:
        refs = _loader.list_references(skill_name)

        if not refs:
            return (
                f"Skill '{skill_name}' has no reference files.\n"
                f"Use skill_tool(skill_name='{skill_name}') to load the full skill instructions."
            )

        ref_list = "\n".join(f"  - {ref}" for ref in refs)
        return (
            f"Available references for skill '{skill_name}':\n"
            f"{ref_list}\n\n"
            f"Load a reference: skill_tool(skill_name='{skill_name}', reference='<filename>')"
        )

    except SkillNotFoundError as e:
        logger.warning(f"Skill not found: {skill_name}")
        raise ValueError(str(e))
