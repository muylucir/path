"""
Skill Discovery - 스킬 디렉토리를 스캔하여 메타데이터만 추출

agentskills.io 스펙 준수:
- 필수 필드: name (1-64자, lowercase hyphen-case), description (1-1024자)
- 선택 필드: license, allowed-tools, metadata, compatibility
- 디렉토리: references/, scripts/, assets/ 탐지

시작 시 한 번만 실행하여 available_skills를 구성한다.
전체 스킬 내용은 로드하지 않고 메타데이터만 추출한다 (Progressive Disclosure).
"""

import re
import logging
from pathlib import Path
from typing import Optional, List
from dataclasses import dataclass, field

import yaml

logger = logging.getLogger(__name__)


@dataclass
class SkillMetadata:
    """agentskills.io 스펙 준수 스킬 메타데이터"""
    name: str
    description: str
    path: str
    skill_dir: str
    license: Optional[str] = None
    allowed_tools: List[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    compatibility: Optional[str] = None
    has_references: bool = False
    has_scripts: bool = False
    has_assets: bool = False
    reference_files: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """하위 호환성을 위한 딕셔너리 변환"""
        return {
            'name': self.name,
            'description': self.description,
            'path': self.path,
            'skill_dir': self.skill_dir,
            'license': self.license,
            'allowed_tools': self.allowed_tools,
            'metadata': self.metadata,
            'compatibility': self.compatibility,
            'has_references': self.has_references,
            'has_scripts': self.has_scripts,
            'has_assets': self.has_assets,
            'reference_files': self.reference_files,
        }


class SkillDiscovery:
    """스킬 디렉토리를 스캔하여 메타데이터만 추출"""

    def __init__(self, skill_dirs: list[str]):
        """
        Args:
            skill_dirs: 스킬을 검색할 디렉토리 목록 (예: ["./skills"])
        """
        self.skill_dirs = skill_dirs
        self.available_skills: dict[str, dict] = {}

    def discover(self) -> dict[str, dict]:
        """
        모든 스킬 디렉토리를 스캔하여 메타데이터 수집

        Returns:
            {skill_name: {description, path}} 형태의 딕셔너리
        """
        self.available_skills = {}

        for skill_dir in self.skill_dirs:
            expanded_path = Path(skill_dir).expanduser().resolve()

            if not expanded_path.exists():
                logger.warning(f"Skill directory not found: {expanded_path}")
                continue

            self._scan_directory(expanded_path)

        logger.info(f"Discovered {len(self.available_skills)} skills: {list(self.available_skills.keys())}")
        return self.available_skills

    def _scan_directory(self, base_path: Path) -> None:
        """
        디렉토리를 재귀적으로 스캔하여 SKILL.md 파일 찾기

        중첩 디렉토리 지원 (예: document-skills/pdf/SKILL.md)
        agentskills.io 스펙: references/, scripts/, assets/ 디렉토리 탐지
        """
        for skill_md_path in base_path.rglob("SKILL.md"):
            try:
                metadata = self._parse_frontmatter(skill_md_path)

                if metadata and 'name' in metadata and 'description' in metadata:
                    skill_name = metadata['name']
                    skill_dir = skill_md_path.parent

                    # 중복 스킬 경고
                    if skill_name in self.available_skills:
                        logger.warning(
                            f"Duplicate skill '{skill_name}' found. "
                            f"Keeping: {self.available_skills[skill_name]['path']}, "
                            f"Ignoring: {skill_md_path}"
                        )
                        continue

                    # agentskills.io 스펙: 디렉토리 탐지
                    has_references = (skill_dir / 'references').is_dir()
                    has_scripts = (skill_dir / 'scripts').is_dir()
                    has_assets = (skill_dir / 'assets').is_dir()

                    # references/ 디렉토리 내 파일 목록
                    reference_files = []
                    if has_references:
                        refs_dir = skill_dir / 'references'
                        reference_files = sorted([
                            f.name for f in refs_dir.glob('*.md')
                            if f.is_file()
                        ])

                    # SkillMetadata 생성
                    skill_metadata = SkillMetadata(
                        name=skill_name,
                        description=metadata['description'],
                        path=str(skill_md_path),
                        skill_dir=str(skill_dir),
                        license=metadata.get('license'),
                        allowed_tools=metadata.get('allowed-tools', []),
                        metadata=metadata.get('metadata', {}),
                        compatibility=metadata.get('compatibility'),
                        has_references=has_references,
                        has_scripts=has_scripts,
                        has_assets=has_assets,
                        reference_files=reference_files,
                    )

                    self.available_skills[skill_name] = skill_metadata.to_dict()

                    logger.debug(
                        f"Discovered skill: {skill_name} at {skill_md_path}"
                        f"{' (+refs)' if has_references else ''}"
                    )
                else:
                    logger.warning(f"Invalid SKILL.md (missing name or description): {skill_md_path}")

            except Exception as e:
                logger.error(f"Error parsing {skill_md_path}: {e}")

    def _parse_frontmatter(self, skill_md_path: Path) -> Optional[dict]:
        """
        SKILL.md에서 YAML frontmatter 파싱

        SKILL.md 형식:
        ---
        name: skill-name
        description: What the skill does
        license: Optional license info
        allowed-tools: Optional list of tools
        ---
        # Markdown content...

        Returns:
            파싱된 YAML frontmatter 딕셔너리, 실패 시 None
        """
        try:
            with open(skill_md_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # YAML frontmatter 추출 (--- 로 둘러싸인 부분)
            frontmatter_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)

            if not frontmatter_match:
                logger.warning(f"No YAML frontmatter found in {skill_md_path}")
                return None

            frontmatter_text = frontmatter_match.group(1)
            metadata = yaml.safe_load(frontmatter_text)

            return metadata

        except yaml.YAMLError as e:
            logger.error(f"YAML parsing error in {skill_md_path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error reading {skill_md_path}: {e}")
            return None

    def get_skill_info(self, skill_name: str) -> Optional[dict]:
        """특정 스킬의 메타데이터 반환"""
        return self.available_skills.get(skill_name)

    def list_skills(self) -> list[str]:
        """발견된 모든 스킬 이름 목록 반환"""
        return list(self.available_skills.keys())
