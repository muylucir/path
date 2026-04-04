"""1단계: Agent 설계 (프레임워크 독립적)"""

import json
import logging
import os
from typing import Any, Dict, List, Optional

from strands_utils import create_spec_agent, load_skill_content
from token_tracker import extract_usage
from spec._helpers import extract_final_text

logger = logging.getLogger(__name__)

# 10KB 이하 reference는 인라인 주입, 초과 시 file_read 도구 사용
_INLINE_SIZE_THRESHOLD = 10 * 1024


class DesignAgent:
    """1단계: Agent 설계 (프레임워크 독립적)"""

    # 패턴명 -> reference 파일 매핑 (Layer 2: LLM Workflows + Layer 1: Agent Patterns)
    PATTERN_REFERENCE_MAP = {
        # Layer 2: LLM Workflows
        'ReAct': 'react-pattern.md',
        'Reflection': 'reflection-pattern.md',
        'Planning': 'planning-pattern.md',
        'Prompt Chaining': 'prompt-chaining.md',
        'Routing': 'routing-pattern.md',
        'Parallelization': 'parallelization.md',
        'Human-in-the-Loop': 'human-in-loop-pattern.md',
        # Layer 1: Agent Patterns
        'Tool Use': 'tool-agent.md',
        'RAG': 'rag-agent.md',
        'Tool Server': 'tool-server-agent.md',
        'Coding': 'coding-agent.md',
        'Memory': 'memory-agent.md',
        'Observer': 'observer-agent.md',
    }

    def __init__(self):
        # SKILL.md 사전 주입 → skills 도구 호출 1회 완전 제거
        self._skill_content = load_skill_content("agent-patterns")
        self._refs_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "skills", "agent-patterns", "references",
        )

        system_prompt = f"""당신은 프레임워크 독립적 AI Agent 아키텍처 설계 전문가입니다.

## 전문 영역
- Agent 역할 분리 및 협업 구조 설계
- 상태 관리(Shared/Session/Persistent) 전략 수립
- 단일 Agent vs 멀티 Agent 아키텍처 판단
- 오류 복구 및 fallback 전략

## 설계 원칙
1. **단순함 우선**: 단일 Agent로 충분하면 멀티 Agent를 사용하지 않습니다
2. **역할 명확화**: 각 Agent는 하나의 명확한 책임을 가집니다
3. **확장성**: 향후 Agent 추가/교체가 용이한 구조를 설계합니다

## 품질 기준
- 각 Agent는 단일 책임 원칙(SRP)을 준수합니다
- Agent 간 상호작용은 최소화합니다
- 실패 시 복구 경로를 명시합니다

## 금지 사항
- 특정 프레임워크(Strands, LangGraph, CrewAI, AgentCore 등) 언급 금지
- 구현 코드 포함 금지 — 설계 수준의 기술만 작성
- 근거 없는 Agent 수 증가 금지

## 참조 스킬 (사전 로드됨 — 도구 호출 불필요)
{self._skill_content}"""

        self.agent = create_spec_agent(system_prompt, max_tokens=16000)

    def _load_references(self, analysis: Dict[str, Any]) -> tuple[str, list[str]]:
        """analysis 기반으로 reference 파일을 분류: 인라인 주입 vs file_read 지시.

        Returns:
            (inline_content, file_read_instructions)
            - inline_content: 10KB 이하 reference를 <reference> 태그로 결합한 텍스트
            - file_read_instructions: 10KB 초과 reference의 file_read 지시 목록
        """
        ref_files: list[str] = []

        # 패턴별 reference
        pattern = analysis.get('pattern', '')
        ref_file = self.PATTERN_REFERENCE_MAP.get(pattern)
        if ref_file:
            ref_files.append(ref_file)

        # 멀티 에이전트인 경우 추가 reference
        recommended_arch = analysis.get('recommended_architecture', '')
        if recommended_arch == 'multi-agent':
            ref_files.append('multi-agent-pattern.md')
            ref_files.append('state-management.md')

        if not ref_files:
            return "", []

        inline_parts: list[str] = []
        file_read_instructions: list[str] = []

        for fname in ref_files:
            fpath = os.path.join(self._refs_dir, fname)
            if not os.path.isfile(fpath):
                logger.warning(f"Reference file not found: {fpath}")
                continue

            size = os.path.getsize(fpath)
            if size <= _INLINE_SIZE_THRESHOLD:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                inline_parts.append(
                    f'<reference name="{fname}">\n{content}\n</reference>'
                )
            else:
                file_read_instructions.append(
                    f'file_read로 "./skills/agent-patterns/references/{fname}"를 읽으세요.'
                )

        return "\n\n".join(inline_parts), file_read_instructions

    def analyze(
        self,
        analysis: Dict[str, Any],
        improvement_plans: Optional[Dict[str, str]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        additional_context: Optional[Dict[str, str]] = None
    ) -> str:
        """Agent 설계"""

        # 대화 히스토리 요약 (사용자 메시지만 추출)
        chat_section = ""
        if chat_history:
            user_messages = [msg['content'] for msg in chat_history if msg.get('role') == 'user']
            if user_messages:
                chat_section = "\n**사용자 추가 요구사항 (대화에서 추출)**:\n"
                for msg in user_messages[-5:]:  # 최근 5개만
                    truncated = msg[:200] + "..." if len(msg) > 200 else msg
                    chat_section += f"- {truncated}\n"

        # 추가 컨텍스트 섹션
        context_section = ""
        if additional_context:
            if additional_context.get('sources'):
                context_section += f"\n**추가 데이터소스**: {additional_context['sources']}"
            if additional_context.get('context'):
                context_section += f"\n**추가 컨텍스트**: {additional_context['context']}"

        # 개선 방안 섹션
        improvement_section = ""
        if improvement_plans:
            non_empty_plans = {k: v for k, v in improvement_plans.items() if v and v.strip()}
            if non_empty_plans:
                improvement_section = "\n**사용자 개선 방안**:\n"
                for key, plan in non_empty_plans.items():
                    improvement_section += f"- {key}: {plan}\n"

        # reference 로드: 작은 파일은 인라인, 큰 파일은 file_read 지시
        inline_refs, file_read_instrs = self._load_references(analysis)
        ref_section = ""
        if inline_refs:
            ref_section = f"\n**참조 레퍼런스 (사전 로드됨 — 도구 호출 불필요)**:\n{inline_refs}\n"

        file_read_section = ""
        if file_read_instrs:
            numbered = "\n".join(
                f"**필수 {i+1}**: {instr}" for i, instr in enumerate(file_read_instrs)
            )
            file_read_section = f"\n{numbered}\n"

        # 자동화 수준 안내
        automation_level = analysis.get('automation_level', '')
        automation_guidance = ""
        if automation_level == 'ai-assisted-workflow':
            automation_guidance = """
**자동화 수준: AI-Assisted Workflow**
이 프로젝트는 결정적 파이프라인 + 특정 단계에서 AI를 활용하는 방식입니다.

**용어 변환 규칙:**
- "Agent Design Pattern" → "파이프라인 아키텍처"로 표현
- "Agent Components" → "워크플로우 단계(Stages)"로 표현
- "Agent"보다는 "AI Step" 또는 "AI-Powered Stage"로 표현
- "자율적 판단" 대신 "결정적 로직 + AI 보조"로 표현

**설계 원칙:**
- 전체 흐름은 워크플로우 엔진/코드가 제어하고, AI는 개별 단계(요약, 분류, 생성 등)에서만 활용
- 각 AI 호출 지점(Integration Point)의 입출력 스키마를 명확히 정의
- 폴백 전략 필수: AI 실패 시 기본값 또는 사람 에스컬레이션
- AI 단계별 적합한 모델 선택 (분류: 경량 모델, 생성: 중간 이상 모델)

**파이프라인 패턴 선택:**
- 순차 처리 → Sequential Pipeline
- 병렬 분석 필요 → Fan-out/Fan-in
- AI 판단 기반 분기 → Conditional Pipeline
- 외부 이벤트 반응 → Event-driven Pipeline

**출력 헤딩 변환**: "## 2. Agent Design Pattern" 대신 "## 2. 파이프라인 아키텍처"를 사용하세요. 하위 ### 헤딩은 그대로 유지합니다.
"""
            # pipeline-patterns reference 인라인 로드 (5KB — 임계값 이내)
            pp_path = os.path.join(self._refs_dir, "pipeline-patterns.md")
            if os.path.isfile(pp_path):
                with open(pp_path, "r", encoding="utf-8") as f:
                    pp_content = f.read()
                ref_section += f'\n<reference name="pipeline-patterns.md">\n{pp_content}\n</reference>\n'

        elif automation_level == 'agentic-ai':
            automation_guidance = """
**자동화 수준: Agentic AI**
이 프로젝트는 에이전트가 자율적으로 도구를 선택하고 판단하는 방식입니다.
- 3계층 택소노미로 설계: Agent Pattern(에이전트 유형) × LLM Workflow(인지 패턴) × Agentic Workflow(협업 방식)
- Agent가 상황에 따라 동적으로 경로와 도구를 결정
- 적합한 Agent Pattern(RAG, Tool-based, Memory 등)과 LLM Workflow(ReAct, Planning, Routing 등)를 조합하세요
"""

        prompt = f"""다음 분석 결과를 바탕으로 프레임워크 독립적인 Agent 설계를 수행하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}
{automation_guidance}
{chat_section}
{context_section}
{improvement_section}
{ref_section}
{file_read_section}

**필수**: 시스템 프롬프트에 사전 로드된 스킬과 위 레퍼런스를 참고하여 분석하세요. 스킬에 없는 내용은 추가하지 마세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "분석을 진행하겠습니다" 같은 문구 금지
- 바로 분석 결과만 출력하세요
- **특정 프레임워크(Strands, LangGraph, CrewAI, AgentCore 등) 언급 금지**

**출력 형식:**
**[필수] 출력의 첫 줄은 반드시 "## 2. Agent Design Pattern" (또는 AI-Assisted Workflow의 경우 "## 2. 파이프라인 아키텍처")으로 시작하세요. 이 줄을 생략하면 최종 문서 구조가 깨집니다. 절대 ## 2.1로 바로 시작하지 마세요.**

## 2. Agent Design Pattern

### 2.1 Pattern Selection (3-Layer Taxonomy)
- **Layer 1 — Agent Pattern**: [RAG/Tool-based/Tool Server/Coding/Memory/Observer 등 에이전트 유형]
- **Layer 2 — LLM Workflow**: [ReAct/Reflection/Planning/Prompt Chaining/Routing/Parallelization/Human-in-the-Loop]
- **Layer 3 — Agentic Workflow**: [싱글 에이전트 / Agents as Tools / Swarm / Graph / Workflow] (멀티 에이전트 시)
- **Pattern Combination**: [3계층 조합, 예: "Layer1(RAG) + Layer2(ReAct) + Layer3(Agents as Tools)"]
- **Selection Rationale**: [선택 이유 2-3문장]

### 2.2 Agent Components
| Agent Name | Role | Input | Output | Complexity |
|------------|------|-------|--------|------------|
**중요: 테이블에 HTML 태그 금지.**

### 2.3 State Management
- **Shared State**: [Agent 간 공유 데이터]
- **Session State**: [세션 내 유지 데이터]
- **Persistent State**: [영구 저장 필요 데이터]
"""
        result = self.agent(prompt)
        self._last_usage = extract_usage(result)
        return extract_final_text(result)
