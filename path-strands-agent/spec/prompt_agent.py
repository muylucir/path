"""3a단계: Agent Prompt 설계 — 3개 이상 에이전트 시 병렬 분할(Scatter-Gather)"""

import logging
import re
from typing import Dict, Any, Optional, List

from agent_config import get_profile
from strands_utils import strands_utils, load_skill_content
from token_tracker import extract_usage, merge_usage
from spec._helpers import extract_final_text, build_analysis_context, parse_agent_names, clean_internal_comments

logger = logging.getLogger(__name__)

# PromptAgent 공통 프롬프트 상수
_PROMPT_AGENT_SYSTEM = """당신은 AI Agent 프롬프트 엔지니어링 전문가입니다.

## 전문 영역
- Agent System Prompt 설계 (역할, 지시사항, 제약조건)
- 입출력 형식 명세 및 예시 작성

## 설계 원칙
1. **역할 명확화**: System Prompt에서 Agent의 정체성과 경계를 명확히 정의합니다
2. **구체적 지시**: 모호한 표현 대신 구체적이고 측정 가능한 지시를 사용합니다
3. **출력 형식 명시**: 예상 출력의 구조와 형식을 명확히 정의합니다

## 품질 기준
- System Prompt는 최소 200자 이상으로 충분한 컨텍스트를 제공합니다
- 각 Agent에 실제 사용 예시(Example User Prompt)를 포함합니다

## 금지 사항
- 구현 코드 포함 금지
- 플레이스홀더(TODO, TBD 등)만으로 채우기 금지
- 이모지 사용 금지"""

_PROMPT_HEADING_RULES = """**중요 — 헤딩 레벨 규칙:**
- System Prompt 코드 블록(```) 안에서 마크다운 헤딩(#, ##, ###)을 절대 사용하지 마세요.
- 코드 블록 내부에서 섹션을 구분해야 하면 XML 태그(<section>, <phase>), 대문자 레이블(PHASE 1:), 또는 구분선(---)을 사용하세요.
- 이 규칙을 어기면 최종 문서의 헤더 구조가 깨집니다."""

_PROMPT_OUTPUT_RULES = """**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "설계를 진행하겠습니다" 같은 문구 금지
- 바로 설계 결과만 출력하세요"""


class PromptAgent:
    """3a단계: Agent Prompt 설계 — 3개 이상 에이전트 시 병렬 분할(Scatter-Gather)"""

    def __init__(self):
        # 스킬 + reference 사전 주입 → tool call 완전 제거
        skill_content = load_skill_content(
            "prompt-engineering", ["role-templates.md"]
        )
        self._enhanced_prompt = (
            _PROMPT_AGENT_SYSTEM
            + "\n\n## 참조 스킬 및 레퍼런스 (사전 로드됨 — 도구 호출 불필요)\n"
            + skill_content
        )

        # fallback용 단일 호출 에이전트 (1-2개 에이전트 또는 파싱 실패 시)
        cfg = get_profile("prompt_single")
        self.agent = strands_utils.get_agent(
            system_prompts=self._enhanced_prompt,
            model_id=cfg["model_id"],
            max_tokens=cfg["max_tokens"],
            temperature=cfg["temperature"],
            tools=[]
        )

    def _create_per_agent_instance(self):
        """병렬 호출용 Agent 인스턴스 생성"""
        cfg = get_profile("prompt_parallel")
        return strands_utils.get_agent(
            system_prompts=self._enhanced_prompt,
            model_id=cfg["model_id"],
            max_tokens=cfg["max_tokens"],
            temperature=cfg["temperature"],
            tools=[]
        )

    @staticmethod
    def _compact_design_context(agent_name: str, design_result: str) -> str:
        """design_result에서 per-agent 호출에 필요한 핵심만 추출.

        전체 design_result 대신:
        - 2.1 Pattern Selection (전체 아키텍처 컨텍스트)
        - 2.2 Agent Components 테이블 헤더 + 전체 에이전트 목록 (상호관계 파악용)
          단, 현재 에이전트 행을 ★로 하이라이트
        - 2.3 State Management
        """
        sections: list[str] = []
        lines = design_result.split('\n')

        # --- 2.1 Pattern Selection 추출 ---
        in_section = False
        buf: list[str] = []
        for line in lines:
            if re.match(r'#+\s+2\.1\s', line):
                in_section = True
                buf.append(line)
            elif in_section:
                if re.match(r'#+\s+2\.\d', line):
                    break
                buf.append(line)
        if buf:
            sections.append('\n'.join(buf).rstrip())

        # --- 2.2 Agent Components 테이블 추출 (전체, 대상 에이전트 하이라이트) ---
        in_section = False
        buf = []
        for line in lines:
            if re.match(r'#+\s+2\.2\s', line):
                in_section = True
                buf.append(line)
            elif in_section:
                if re.match(r'#+\s+2\.\d', line):
                    break
                # 테이블 행에서 해당 에이전트를 하이라이트
                if agent_name.lower() in line.lower() and line.strip().startswith('|'):
                    buf.append(line.rstrip() + '  ← ★ 대상 에이전트')
                else:
                    buf.append(line)
        if buf:
            sections.append('\n'.join(buf).rstrip())

        # --- 2.3 State Management 추출 ---
        in_section = False
        buf = []
        for line in lines:
            if re.match(r'#+\s+2\.3\s', line):
                in_section = True
                buf.append(line)
            elif in_section:
                if re.match(r'#+\s+\d', line):
                    break
                buf.append(line)
        if buf:
            sections.append('\n'.join(buf).rstrip())

        return '\n\n'.join(sections) if sections else design_result

    def _build_single_agent_prompt(self, agent_name: str, agent_index: int,
                                   design_result: str, context_section: str) -> str:
        """1개 에이전트 전용 프롬프트 구성"""
        compact = self._compact_design_context(agent_name, design_result)
        return f"""다음 Agent 설계에서 **"{agent_name}"** 에이전트의 프롬프트만 작성하세요.

{compact}

{context_section}

**필수**: 시스템 프롬프트에 사전 로드된 스킬과 reference를 참고하여 프롬프트를 설계하세요.

{_PROMPT_OUTPUT_RULES}

{_PROMPT_HEADING_RULES}

**출력 형식 — "{agent_name}" 에이전트만 작성:**

### 4.{agent_index} {agent_name}
**System Prompt:**
```
당신은 [역할]입니다.
[구체적인 지시사항]
```

**Example User Prompt:**
```
[예시 사용자 입력]
```
"""

    def _generate_single_agent_prompt(self, agent_name: str, agent_index: int,
                                      design_result: str, context_section: str) -> tuple:
        """1개 에이전트의 프롬프트를 생성 (스레드에서 실행)"""
        agent = self._create_per_agent_instance()
        prompt = self._build_single_agent_prompt(agent_name, agent_index, design_result, context_section)
        result = agent(prompt)
        text = extract_final_text(result)
        usage = extract_usage(result)
        return (text, usage)

    def _generate_prompts_parallel(self, agent_names: List[str],
                                   design_result: str, analysis: Dict[str, Any]) -> str:
        """Scatter-Gather: 에이전트별 병렬 프롬프트 생성"""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        from functools import reduce

        context_section = build_analysis_context(analysis)
        results: List[Optional[str]] = [None] * len(agent_names)
        usages = []

        logger.info(f"PromptAgent 병렬 모드: {len(agent_names)}개 에이전트 ({', '.join(agent_names)})")

        with ThreadPoolExecutor(max_workers=min(len(agent_names), 6)) as executor:
            future_to_index = {}
            for i, name in enumerate(agent_names):
                future = executor.submit(
                    self._generate_single_agent_prompt,
                    name, i + 1, design_result, context_section
                )
                future_to_index[future] = i

            for future in as_completed(future_to_index):
                idx = future_to_index[future]
                text, usage = future.result()
                results[idx] = text
                usages.append(usage)
                logger.info(f"PromptAgent 병렬: {agent_names[idx]} 완료 ({idx + 1}/{len(agent_names)})")

        # Gather: ## 4. 헤딩 + 에이전트별 결과 조합
        assembled = "## 4. Agent Prompts\n\n"
        for i, text in enumerate(results):
            if text:
                cleaned = clean_internal_comments(text)
                assembled += cleaned.strip() + "\n\n"

        # 토큰 사용량 집계
        if usages:
            self._last_usage = reduce(merge_usage, usages)
        else:
            self._last_usage = {}

        return assembled.strip()

    def _generate_prompts_single(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """기존 단일 호출 방식 (1-2개 에이전트 또는 fallback)"""
        context_section = build_analysis_context(analysis)

        prompt = f"""다음 Agent 설계를 기반으로 각 Agent의 프롬프트를 정의하세요:

{design_result}

{context_section}

**필수**: 시스템 프롬프트에 사전 로드된 스킬과 reference를 참고하여 프롬프트를 설계하세요.

{_PROMPT_OUTPUT_RULES}

**출력 형식 (반드시 아래 헤딩 구조를 그대로 따르세요 — "## 4." 상위 헤딩 생략 금지):**

{_PROMPT_HEADING_RULES}

## 4. Agent Prompts

위 Agent Components 테이블의 각 Agent에 대해 아래 형식으로 작성:

### 4.1 [Agent Name]
**System Prompt:**
```
당신은 [역할]입니다.
[구체적인 지시사항]
```

**Example User Prompt:**
```
[예시 사용자 입력]
```
"""
        result = self.agent(prompt)
        self._last_usage = extract_usage(result)
        return extract_final_text(result)

    def generate_prompts(self, design_result: str, analysis: Dict[str, Any]) -> str:
        """Agent Prompt 설계 생성 — 3개 이상 에이전트 시 자동으로 병렬 분할"""
        agent_names = parse_agent_names(design_result)

        if len(agent_names) >= 3:
            logger.info(f"PromptAgent: {len(agent_names)}개 에이전트 감지 → 병렬 모드")
            try:
                return self._generate_prompts_parallel(agent_names, design_result, analysis)
            except Exception as e:
                logger.warning(f"PromptAgent 병렬 실패, 단일 호출로 fallback: {e}")
                return self._generate_prompts_single(design_result, analysis)
        else:
            logger.info(f"PromptAgent: {len(agent_names)}개 에이전트 → 단일 호출 모드")
            return self._generate_prompts_single(design_result, analysis)
