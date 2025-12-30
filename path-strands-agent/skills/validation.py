"""
Skill Validation - agentskills.io 스펙 준수 검증기

스펙 요구사항:
- name: 1-64자, lowercase hyphen-case, 연속 하이픈 불가
- description: 1-1024자, angle brackets 불가
- SKILL.md body: <5000 토큰 권장 (Progressive Disclosure)
- 디렉토리: scripts/, references/, assets/만 허용
"""

import re
import logging
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass, field

import yaml

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """스킬 검증 결과"""
    valid: bool
    skill_path: str
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def __str__(self) -> str:
        status = "VALID" if self.valid else "INVALID"
        lines = [f"[{status}] {self.skill_path}"]
        for error in self.errors:
            lines.append(f"  ERROR: {error}")
        for warning in self.warnings:
            lines.append(f"  WARNING: {warning}")
        return "\n".join(lines)


class SkillValidator:
    """agentskills.io 스펙 준수 검증기"""

    # 스펙 상수
    NAME_MIN_LENGTH = 1
    NAME_MAX_LENGTH = 64
    DESCRIPTION_MIN_LENGTH = 1
    DESCRIPTION_MAX_LENGTH = 1024
    MAX_INSTRUCTION_TOKENS = 5000  # 약 20000자 추정
    MAX_SKILL_MD_LINES = 500  # 권장 최대 라인 수

    # 유효한 name 패턴: lowercase, 숫자, 하이픈 (연속 하이픈 불가, 시작/끝 하이픈 불가)
    NAME_PATTERN = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')

    # 표준 디렉토리
    VALID_DIRS = {'scripts', 'references', 'assets'}

    def validate_skill(self, skill_path: Path) -> ValidationResult:
        """
        스킬 디렉토리를 agentskills.io 스펙에 따라 검증

        Args:
            skill_path: 스킬 디렉토리 경로

        Returns:
            ValidationResult
        """
        skill_path = Path(skill_path)
        errors: List[str] = []
        warnings: List[str] = []

        # 1. SKILL.md 존재 확인
        skill_md = skill_path / 'SKILL.md'
        if not skill_md.exists():
            errors.append("SKILL.md not found")
            return ValidationResult(False, str(skill_path), errors, warnings)

        # 2. 파일 내용 파싱
        try:
            content = skill_md.read_text(encoding='utf-8')
        except Exception as e:
            errors.append(f"Failed to read SKILL.md: {e}")
            return ValidationResult(False, str(skill_path), errors, warnings)

        metadata, body = self._parse_skill_md(content)

        if metadata is None:
            errors.append("Invalid or missing YAML frontmatter")
            return ValidationResult(False, str(skill_path), errors, warnings)

        # 3. 필수 필드 검증
        self._validate_name(metadata, skill_path, errors, warnings)
        self._validate_description(metadata, errors, warnings)

        # 4. 선택 필드 검증
        self._validate_optional_fields(metadata, errors, warnings)

        # 5. 본문 크기 검증 (Progressive Disclosure)
        self._validate_body_size(body, content, errors, warnings)

        # 6. 디렉토리 구조 검증
        self._validate_structure(skill_path, errors, warnings)

        # 7. references/ 검증
        refs_dir = skill_path / 'references'
        if refs_dir.is_dir():
            self._validate_references(refs_dir, errors, warnings)

        return ValidationResult(
            valid=len(errors) == 0,
            skill_path=str(skill_path),
            errors=errors,
            warnings=warnings
        )

    def _parse_skill_md(self, content: str) -> Tuple[Optional[dict], str]:
        """SKILL.md를 frontmatter와 body로 분리"""
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', content, re.DOTALL)
        if not match:
            return None, content

        try:
            metadata = yaml.safe_load(match.group(1))
            body = match.group(2)
            return metadata, body
        except yaml.YAMLError:
            return None, content

    def _validate_name(
        self,
        metadata: dict,
        skill_path: Path,
        errors: List[str],
        warnings: List[str]
    ) -> None:
        """name 필드 검증"""
        if 'name' not in metadata:
            errors.append("Missing required field: name")
            return

        name = metadata['name']

        # 타입 확인
        if not isinstance(name, str):
            errors.append("name must be a string")
            return

        # 길이 검증
        if len(name) < self.NAME_MIN_LENGTH or len(name) > self.NAME_MAX_LENGTH:
            errors.append(
                f"name must be {self.NAME_MIN_LENGTH}-{self.NAME_MAX_LENGTH} chars, "
                f"got {len(name)}"
            )

        # 패턴 검증 (lowercase hyphen-case)
        if not self.NAME_PATTERN.match(name):
            errors.append(
                f"name '{name}' must be lowercase hyphen-case "
                "(a-z, 0-9, hyphens, no leading/trailing/consecutive hyphens)"
            )

        # 연속 하이픈 검증
        if '--' in name:
            errors.append(f"name '{name}' cannot contain consecutive hyphens")

        # 디렉토리 이름 일치 검증 (스펙 권장)
        if skill_path.name != name:
            warnings.append(
                f"Directory name '{skill_path.name}' doesn't match skill name '{name}'"
            )

    def _validate_description(
        self,
        metadata: dict,
        errors: List[str],
        warnings: List[str]
    ) -> None:
        """description 필드 검증"""
        if 'description' not in metadata:
            errors.append("Missing required field: description")
            return

        desc = metadata['description']

        # 타입 확인
        if not isinstance(desc, str):
            errors.append("description must be a string")
            return

        # 길이 검증
        if len(desc) < self.DESCRIPTION_MIN_LENGTH or len(desc) > self.DESCRIPTION_MAX_LENGTH:
            errors.append(
                f"description must be {self.DESCRIPTION_MIN_LENGTH}-{self.DESCRIPTION_MAX_LENGTH} chars, "
                f"got {len(desc)}"
            )

        # angle brackets 검증
        if '<' in desc or '>' in desc:
            errors.append("description cannot contain angle brackets (< or >)")

    def _validate_optional_fields(
        self,
        metadata: dict,
        errors: List[str],
        warnings: List[str]
    ) -> None:
        """선택 필드 검증"""
        # allowed-tools: 리스트여야 함
        if 'allowed-tools' in metadata:
            if not isinstance(metadata['allowed-tools'], list):
                errors.append("allowed-tools must be a list")

        # metadata: dict여야 함
        if 'metadata' in metadata:
            if not isinstance(metadata['metadata'], dict):
                errors.append("metadata must be a key-value map (dict)")

        # license: 문자열이어야 함
        if 'license' in metadata:
            if not isinstance(metadata['license'], str):
                errors.append("license must be a string")

        # compatibility: 문자열이어야 함, 500자 이하
        if 'compatibility' in metadata:
            comp = metadata['compatibility']
            if not isinstance(comp, str):
                errors.append("compatibility must be a string")
            elif len(comp) > 500:
                errors.append("compatibility must be 500 chars or less")

    def _validate_body_size(
        self,
        body: str,
        full_content: str,
        errors: List[str],
        warnings: List[str]
    ) -> None:
        """본문 크기 검증 (Progressive Disclosure)"""
        # 대략적인 토큰 추정: ~4자 = 1토큰
        estimated_tokens = len(body) / 4

        if estimated_tokens > self.MAX_INSTRUCTION_TOKENS:
            warnings.append(
                f"Body exceeds recommended ~{self.MAX_INSTRUCTION_TOKENS} tokens "
                f"(estimated {int(estimated_tokens)} tokens). "
                f"Consider moving detailed content to references/"
            )

        # 라인 수 검증
        line_count = len(full_content.splitlines())
        if line_count > self.MAX_SKILL_MD_LINES:
            warnings.append(
                f"SKILL.md has {line_count} lines, exceeds recommended {self.MAX_SKILL_MD_LINES} lines. "
                f"Consider splitting into references/"
            )

    def _validate_structure(
        self,
        skill_path: Path,
        errors: List[str],
        warnings: List[str]
    ) -> None:
        """디렉토리 구조 검증"""
        for item in skill_path.iterdir():
            if item.is_dir():
                # 숨김 디렉토리와 __pycache__ 무시
                if item.name.startswith('.') or item.name == '__pycache__':
                    continue

                if item.name not in self.VALID_DIRS:
                    warnings.append(
                        f"Non-standard directory '{item.name}'. "
                        f"Standard directories: {self.VALID_DIRS}"
                    )

    def _validate_references(
        self,
        refs_dir: Path,
        errors: List[str],
        warnings: List[str]
    ) -> None:
        """references/ 디렉토리 검증"""
        for ref_file in refs_dir.iterdir():
            if ref_file.is_file():
                # 마크다운 파일 권장
                if not ref_file.suffix == '.md':
                    warnings.append(
                        f"Reference file '{ref_file.name}' is not markdown (.md)"
                    )


def validate_all_skills(skill_dirs: List[str], verbose: bool = False) -> List[ValidationResult]:
    """
    여러 디렉토리의 모든 스킬 검증

    Args:
        skill_dirs: 스킬 디렉토리 경로 목록
        verbose: True면 검증 과정 출력

    Returns:
        ValidationResult 목록
    """
    validator = SkillValidator()
    results: List[ValidationResult] = []

    for skill_dir in skill_dirs:
        base_path = Path(skill_dir).expanduser().resolve()
        if not base_path.exists():
            if verbose:
                print(f"Directory not found: {base_path}")
            continue

        for skill_md in base_path.rglob("SKILL.md"):
            skill_path = skill_md.parent
            result = validator.validate_skill(skill_path)
            results.append(result)

            if verbose:
                print(str(result))

    return results


def validate_skill(skill_path: str, verbose: bool = False) -> ValidationResult:
    """
    단일 스킬 검증

    Args:
        skill_path: 스킬 디렉토리 경로
        verbose: True면 검증 결과 출력

    Returns:
        ValidationResult
    """
    validator = SkillValidator()
    result = validator.validate_skill(Path(skill_path))

    if verbose:
        print(str(result))

    return result
