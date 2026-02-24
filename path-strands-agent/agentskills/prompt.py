"""Generate skills prompt for agent system prompts

This module provides XML-formatted prompt generation following the AgentSkills.io specification.
"""

from pathlib import Path
from typing import List
from .models import SkillProperties

# Directory paths for agent file operations
ROOT_DIR = Path(__file__).parent.parent  # Project root

# AgentCore 런타임에서는 /var/task 가 읽기 전용이므로 /tmp 폴백
import tempfile
try:
    SCRATCH_DIR = ROOT_DIR / "_scratch"
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    SCRATCH_DIR = Path(tempfile.gettempdir()) / "_scratch"
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)

try:
    OUTPUT_DIR = ROOT_DIR / "_output"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    OUTPUT_DIR = Path(tempfile.gettempdir()) / "_output"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


DEFAULT_SYSTEM_PROMPT = """
You are a helpful AI assistant. You have access to a skills library that provides specialized capabilities and domain knowledge.

## Tool usage policy

- Use specialized tools instead of bash commands when possible, as this provides a better user experience. Reserve bash tools exclusively for actual system commands and terminal operations that require shell execution. 
- After completing a task that involves tool use, provide a quick summary of the work you've done.

<file_operations_policy>
- **Root directory**: `{root_dir}` - All operations must stay within this boundary
- **Scratch directory**: `{root_dir}/_scratch` - Use for ALL temporary/intermediate files
- **Output directory**: `{root_dir}/_output` - Final deliverables go here
- **[IMPORTANT]**: Never use absolute paths like `/home`, `/tmp`, `/etc`, or `~` that fall outside the root boundary. 
</file_operations_policy>
"""

SKILLS_SYSTEM_PROMPT = """
## Skills System (Progressive Disclosure)

You have access to a skills library that provides specialized capabilities and domain knowledge.

<skills_instructions>
**How to Use Skills (File-based Pattern):**

Skills follow a **progressive disclosure** pattern:
1. **Phase 1 - Metadata**: Skill name, description, and location (shown below)
2. **Phase 2 - Instructions**: Read SKILL.md when skill is needed
3. **Phase 3 - References**: Read files in references/ directory for detailed guidance

**Usage:**
1. **Recognize when a skill applies**: Check if the user's task matches any skill's description
2. **Read the skill's SKILL.md**: Use `file_read` tool with the location path shown below
   - Example: `file_read(path="/path/to/skills/skill-name/SKILL.md")`
3. **Follow the skill's instructions**: SKILL.md contains step-by-step workflows, best practices, and examples
4. **Access references if needed**: Use `file_read` to read files in the `references/` subdirectory
   - Example: `file_read(path="/path/to/skills/skill-name/references/guide.md")`

**When to Use Skills:**
- When the user's request matches a skill's domain
- When you need specialized knowledge or structured workflows
- When a skill provides proven patterns for complex tasks

**Important:** Only use skills listed in <available_skills> below.
</skills_instructions>

<available_skills>
{skills_list}
</available_skills>
"""

SKILL_INSTRUCTIONS_PROMPT = """
{default_system_prompt}

## Skill Execution Guidelines

<skills_instructions>
1. **Follow the instructions**: Instructions contains step-by-step workflows, best practices, and examples
2. **Access supporting files**: Instructions may include Python scripts, configs, or reference docs - always use absolute paths
</skills_instructions>

## Instructions

{instructions}
"""


def generate_skills_prompt(skills: List[SkillProperties], include_default_prompt: bool = False) -> str:
    """Generate XML system prompt section from SkillProperties list

    This generates a concise prompt with skill metadata only (Phase 1 of Progressive Disclosure),
    following the AgentSkills.io specification format using XML.

    Args:
        skills: List of discovered skill properties
        include_default_prompt: If True, includes DEFAULT_SYSTEM_PROMPT (default: False)

    Returns:
        XML formatted prompt text with <available_skills> section

    Example:
        >>> from agentskills import discover_skills, generate_skills_prompt
        >>> skills = discover_skills("./skills")
        >>> prompt = generate_skills_prompt(skills)
        >>> agent = Agent(system_prompt=base + "\\n\\n" + prompt)
    """
    if not skills:
        return ""

    # Build XML skills list (metadata only)
    skill_elements = []
    for skill in sorted(skills, key=lambda s: s.name):
        skill_xml = (
            "  <skill>\n"
            f"    <name>{skill.name}</name>\n"
            f"    <description>{skill.description}</description>\n"
            f"    <location>{skill.path}</location>\n"
            "  </skill>"
        )
        skill_elements.append(skill_xml)

    skills_list = "\n".join(skill_elements)

    # Format the template with skills list
    if include_default_prompt:
        return generate_default_system_prompt() + "\n" + SKILLS_SYSTEM_PROMPT.format(skills_list=skills_list)
    else:
        return SKILLS_SYSTEM_PROMPT.format(skills_list=skills_list)


def generate_default_system_prompt() -> str:
    """Generate default system prompt"""
    return DEFAULT_SYSTEM_PROMPT.format(
        root_dir=str(ROOT_DIR.resolve())
    )

def generate_skill_instructions_prompt(instructions: str) -> str:
    """Generate skill instructions prompt"""
    return SKILL_INSTRUCTIONS_PROMPT.format(
        default_system_prompt=generate_default_system_prompt(),
        instructions=instructions
    )


__all__ = ["generate_skills_prompt", "generate_default_system_prompt", "generate_skill_instructions_prompt"]
