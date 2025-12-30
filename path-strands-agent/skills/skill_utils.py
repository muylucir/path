"""
Skill Utils - 스킬 시스템 초기화 및 설정 유틸리티

agentskills.io 스펙 준수:
- Progressive Disclosure 지원
- 검증 기능 통합
- references/ 정보 포함

스킬 디스커버리, 로더, 툴 설정, 프롬프트 생성을 처리하는 유틸리티 함수 제공.
"""

import logging
import sys
from pathlib import Path
from typing import Tuple, List, Optional

# 상위 디렉토리를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from skills.discovery import SkillDiscovery
from skills.loader import SkillLoader
from skill_tool import setup_skill_tool

logger = logging.getLogger(__name__)


def get_skill_prompt(available_skills: dict[str, dict]) -> str:
    """
    Generate skill-related system prompt section with Progressive Disclosure support.

    Args:
        available_skills: Dictionary of skill metadata

    Returns:
        Formatted skill prompt section (Markdown + XML hybrid format)
    """
    skill_entries = []
    for name, info in available_skills.items():
        entry = f"  - {name}: {info['description']}"
        # references 정보 추가
        refs = info.get('reference_files', [])
        if refs:
            ref_preview = ", ".join(refs[:3])
            if len(refs) > 3:
                ref_preview += f" (+{len(refs) - 3} more)"
            entry += f"\n    [refs: {ref_preview}]"
        skill_entries.append(entry)

    skill_list = "\n".join(skill_entries)

    return f"""
## Skill System (Progressive Disclosure)
<skill_instructions>
You have access to specialized skills with Progressive Disclosure:

**Disclosure Levels:**
1. **Metadata** (~100 tokens): Skill name and description (always visible below)
2. **Instructions** (<5000 tokens): Full SKILL.md body when skill is invoked
3. **References** (on-demand): Detailed guides loaded only when needed

**How to use skills:**
- Load full skill: `skill_tool(skill_name="<name>")`
- Load specific reference: `skill_tool(skill_name="<name>", reference="<file>.md")`
- List references: `list_skill_references(skill_name="<name>")`

**Important:**
- Only use skills listed in <available_skills>
- Load references only when you need detailed implementation guidance
- Don't reload skills already in conversation
</skill_instructions>

<available_skills>
{skill_list}
</available_skills>
"""


def initialize_skills(
    skill_dirs: list[str] = None,
    verbose: bool = False,
    validate: bool = False
) -> Tuple[dict, str]:
    """
    스킬 시스템 초기화 (디스커버리 + 로더 + 툴 설정)

    Args:
        skill_dirs: 스킬 디렉토리 경로 리스트 (기본값: ["./skills"])
        verbose: True면 초기화 과정 출력
        validate: True면 스펙 검증 실행

    Returns:
        (available_skills, skill_prompt) 튜플
        - available_skills: 스킬 메타데이터 딕셔너리
        - skill_prompt: 시스템 프롬프트에 append할 스킬 프롬프트

    Example:
        >>> from skills.skill_utils import initialize_skills
        >>> available_skills, skill_prompt = initialize_skills(["./skills"])
        >>> system_prompt = base_prompt + skill_prompt
    """
    if skill_dirs is None:
        skill_dirs = ["./skills"]

    # 1. 검증 (선택적)
    if validate:
        if verbose:
            print("\n[Skill Init] Validating skills...")

        try:
            from skills.validation import validate_all_skills
            results = validate_all_skills(skill_dirs, verbose=verbose)

            invalid_count = sum(1 for r in results if not r.valid)
            if invalid_count > 0:
                logger.warning(f"{invalid_count} skill(s) failed validation")
        except ImportError:
            logger.warning("Validation module not available")

    # 2. 스킬 디스커버리
    if verbose:
        print("\n[Skill Init] Discovering skills...")

    discovery = SkillDiscovery(skill_dirs=skill_dirs)
    available_skills = discovery.discover()

    if not available_skills:
        logger.warning("No skills found in directories: %s", skill_dirs)
        if verbose:
            print("No skills found. Please check the skill directories.")
        return {}, ""

    if verbose:
        print(f"Discovered {len(available_skills)} skills:")
        for name, info in available_skills.items():
            desc = info['description'][:60] + "..." if len(info['description']) > 60 else info['description']
            refs = info.get('reference_files', [])
            ref_str = f" (+{len(refs)} refs)" if refs else ""
            print(f"  - {name}{ref_str}: {desc}")

    # 3. 스킬 로더 생성 + 툴 설정
    if verbose:
        print("\n[Skill Init] Setting up skill tool...")

    loader = SkillLoader(available_skills)
    setup_skill_tool(loader, available_skills)

    # 4. 스킬 프롬프트 생성
    skill_prompt = get_skill_prompt(available_skills)

    logger.info(f"Skill system initialized with {len(available_skills)} skills")

    return available_skills, skill_prompt


def validate_skills(
    skill_dirs: list[str] = None,
    verbose: bool = True
) -> List:
    """
    스킬 검증만 실행

    Args:
        skill_dirs: 스킬 디렉토리 경로 리스트
        verbose: True면 검증 결과 출력

    Returns:
        ValidationResult 리스트
    """
    if skill_dirs is None:
        skill_dirs = ["./skills"]

    from skills.validation import validate_all_skills
    return validate_all_skills(skill_dirs, verbose=verbose)
