"""
Skill Loader - Progressive Disclosure 기반 스킬 로딩

agentskills.io 스펙 준수:
- 메타데이터 (~100 토큰): 시작 시 로드 (discovery에서 처리)
- 지침 (<5000 토큰): 스킬 활성화 시 로드
- 참조 (on-demand): references/ 디렉토리에서 필요 시 로드

캐싱 없음: 매번 파일에서 읽어 항상 최신 내용 반영
"""

import logging
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


class SkillNotFoundError(Exception):
    """요청한 스킬을 찾을 수 없을 때 발생하는 예외"""
    pass


class ReferenceNotFoundError(Exception):
    """요청한 참조 파일을 찾을 수 없을 때 발생하는 예외"""
    pass


class SkillLoader:
    """Progressive Disclosure 기반 스킬 로더"""

    def __init__(self, available_skills: dict[str, dict]):
        """
        Args:
            available_skills: SkillDiscovery에서 생성된 스킬 메타데이터 딕셔너리
                              {skill_name: {description, path, skill_dir, reference_files, ...}}
        """
        self.available_skills = available_skills

    def load(self, skill_name: str) -> str:
        """
        스킬의 전체 SKILL.md 내용 반환 (매번 파일에서 읽음)

        Args:
            skill_name: 로드할 스킬의 이름

        Returns:
            SKILL.md의 전체 내용

        Raises:
            SkillNotFoundError: 스킬을 찾을 수 없을 때
        """
        if skill_name not in self.available_skills:
            available = list(self.available_skills.keys())
            raise SkillNotFoundError(
                f"Skill '{skill_name}' not found. Available skills: {available}"
            )

        skill_path = self.available_skills[skill_name]['path']

        try:
            with open(skill_path, 'r', encoding='utf-8') as f:
                content = f.read()

            logger.info(f"Loaded skill '{skill_name}' from {skill_path} ({len(content)} chars)")
            return content

        except FileNotFoundError:
            raise SkillNotFoundError(
                f"Skill file not found: {skill_path}. "
                f"The skill may have been deleted after discovery."
            )
        except Exception as e:
            logger.error(f"Error loading skill '{skill_name}': {e}")
            raise

    def load_reference(self, skill_name: str, reference_name: str) -> str:
        """
        스킬의 특정 참조 파일을 on-demand로 로드

        Args:
            skill_name: 스킬 이름
            reference_name: 참조 파일 이름 (예: 'graph-pattern.md')

        Returns:
            참조 파일의 전체 내용

        Raises:
            SkillNotFoundError: 스킬을 찾을 수 없을 때
            ReferenceNotFoundError: 참조 파일을 찾을 수 없을 때
        """
        if skill_name not in self.available_skills:
            available = list(self.available_skills.keys())
            raise SkillNotFoundError(
                f"Skill '{skill_name}' not found. Available skills: {available}"
            )

        skill_info = self.available_skills[skill_name]
        skill_dir = Path(skill_info['skill_dir'])
        ref_path = skill_dir / 'references' / reference_name

        # 참조 파일 존재 확인
        if not ref_path.exists():
            available_refs = skill_info.get('reference_files', [])
            raise ReferenceNotFoundError(
                f"Reference '{reference_name}' not found in skill '{skill_name}'. "
                f"Available references: {available_refs}"
            )

        try:
            with open(ref_path, 'r', encoding='utf-8') as f:
                content = f.read()

            logger.info(
                f"Loaded reference '{reference_name}' from skill '{skill_name}' "
                f"({len(content)} chars)"
            )
            return content

        except Exception as e:
            logger.error(f"Error loading reference '{reference_name}': {e}")
            raise

    def list_references(self, skill_name: str) -> List[str]:
        """
        스킬의 사용 가능한 참조 파일 목록 반환

        Args:
            skill_name: 스킬 이름

        Returns:
            참조 파일 이름 목록

        Raises:
            SkillNotFoundError: 스킬을 찾을 수 없을 때
        """
        if skill_name not in self.available_skills:
            raise SkillNotFoundError(f"Skill '{skill_name}' not found")

        return self.available_skills[skill_name].get('reference_files', [])

    def has_references(self, skill_name: str) -> bool:
        """스킬에 참조 파일이 있는지 확인"""
        if skill_name not in self.available_skills:
            return False
        return self.available_skills[skill_name].get('has_references', False)

    def get_skill_description(self, skill_name: str) -> str:
        """스킬의 description만 반환 (전체 로드 없이)"""
        if skill_name not in self.available_skills:
            raise SkillNotFoundError(f"Skill '{skill_name}' not found")

        return self.available_skills[skill_name]['description']

    def skill_exists(self, skill_name: str) -> bool:
        """스킬 존재 여부 확인"""
        return skill_name in self.available_skills

    def get_skill_info(self, skill_name: str) -> dict:
        """스킬의 전체 메타데이터 반환"""
        if skill_name not in self.available_skills:
            raise SkillNotFoundError(f"Skill '{skill_name}' not found")

        return self.available_skills[skill_name]
