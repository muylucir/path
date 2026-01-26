"""
Multi-Stage Spec Agents - 명세서 생성을 3개 Agent로 분할 (순차 호출)

순서: DesignAgent → DiagramAgent → DetailAgent → AssemblerAgent

프레임워크 독립적 Agent 설계 명세서 생성
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Dict, Any, AsyncIterator
import json
from strands_tools import file_read
from agentskills import discover_skills, generate_skills_prompt
from strands_utils import strands_utils


class DesignAgent:
    """1단계: Agent 설계 (프레임워크 독립적)"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 AI Agent 설계 전문가입니다.
프레임워크에 독립적인 Agent 아키텍처를 설계합니다."""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-opus-4-5-20251101-v1:0",
            max_tokens=16000,
            temperature=0.3,
            tools=[file_read]
        )

    def analyze(self, analysis: Dict[str, Any]) -> str:
        """Agent 설계"""

        prompt = f"""다음 분석 결과를 바탕으로 프레임워크 독립적인 Agent 설계를 수행하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}

**필수 1단계**: file_read로 "universal-agent-patterns" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: 스킬을 참고하여 분석하세요. 스킬에 없는 내용은 추가하지 마세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "분석을 진행하겠습니다" 같은 문구 금지
- 바로 분석 결과만 출력하세요
- **특정 프레임워크(Strands, LangGraph, CrewAI, AgentCore 등) 언급 금지**

**출력 형식:**

## 2. Agent Design Pattern

### 2.1 Pattern Selection
- **Primary Pattern**: [ReAct/Reflection/Tool Use/Planning/Multi-Agent/Human-in-the-Loop]
- **Pattern Combination**: [조합 패턴, 해당시]
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
        return result.message['content'][0]['text']


class DiagramAgent:
    """2단계: 다이어그램 생성 (프레임워크 독립적)"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 아키텍처 시각화 전문가입니다.
프레임워크 독립적인 Agent 워크플로우를 Mermaid 다이어그램으로 표현합니다."""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-opus-4-5-20251101-v1:0",
            max_tokens=16000,
            temperature=0.3,
            tools=[file_read]
        )

    def generate_diagrams(self, design_result: str) -> str:
        """다이어그램 생성"""

        prompt = f"""다음 Agent 설계를 기반으로 Mermaid 다이어그램을 생성하세요:

{design_result}

**필수 1단계**: file_read로 "mermaid-diagrams" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: 로드된 SKILL의 템플릿과 베스트 프랙티스만을 사용하세요.
**필수 3단계**: Sequence Diagram에서 activate/deactivate 쌍을 반드시 확인하세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "다이어그램을 생성하겠습니다" 같은 문구 금지
- 바로 다이어그램만 출력하세요
- **특정 프레임워크 컴포넌트(AgentCore Runtime, Gateway, GraphBuilder 등) 금지**
- **Agent, Tool, User, External Service 등 추상 개념만 사용**

**출력 형식:**

## 3. Visual Design

### 3.1 Agent Workflow
```mermaid
flowchart TD
    [Agent 간 워크플로우 - 추상적 개념만]
```

### 3.2 Sequence Diagram
```mermaid
sequenceDiagram
    [User, Agent, Tool 간 상호작용]
```

### 3.3 Architecture Overview
```mermaid
flowchart TB
    [시스템 아키텍처 - 추상적 컴포넌트만]
```

**특수 문자 이스케이프 (필수)**:
- 노드 텍스트에 `>=`, `>`, `<`, `?`, `&` 등 특수 문자가 있으면 **반드시 따옴표로 감싸세요**
- 잘못된 예: `{{Score >= 70?}}`
- 올바른 예: `{{"Score >= 70?"}}`

**중요: 다이어그램에 HTML 태그 금지.**
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class DetailAgent:
    """3단계: 상세 설계 (프롬프트, 도구)"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 AI Agent 상세 설계 전문가입니다.
Agent의 System Prompt와 Tool 스키마를 정의합니다."""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-opus-4-5-20251101-v1:0",
            max_tokens=16000,
            temperature=0.3,
            tools=[file_read]
        )

    def generate_details(self, design_result: str) -> str:
        """프롬프트 및 도구 정의 생성"""

        prompt = f"""다음 Agent 설계를 기반으로 프롬프트와 도구를 정의하세요:

{design_result}

**필수 1단계**: file_read로 "prompt-engineering" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: file_read로 "tool-schema" 스킬의 SKILL.md를 읽으세요.
**필수 3단계**: 두 스킬을 참고하여 상세 설계하세요.

**중요 - 출력 규칙**:
- 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
- "스킬을 읽었으므로", "설계를 진행하겠습니다" 같은 문구 금지
- 바로 설계 결과만 출력하세요

**출력 형식:**

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

**Expected Output:**
```
[예상 출력 형식]
```

## 5. Tool Definitions

필요한 각 Tool에 대해 아래 형식으로 작성:

### 5.1 [Tool Name]
- **Description**: [도구 설명]
- **Input Schema**:
```json
{{
  "param1": {{ "type": "string", "description": "..." }}
}}
```
- **Output Schema**:
```json
{{
  "result": {{ "type": "string", "description": "..." }}
}}
```
"""
        result = self.agent(prompt)
        return result.message['content'][0]['text']


class AssemblerAgent:
    """4단계: 최종 조합 - LLM 없이 단순 문자열 조합"""

    def __init__(self):
        pass

    def _clean_internal_comments(self, text: str) -> str:
        """내부 코멘트 제거 (Claude의 메타 발언)"""
        import re

        line_patterns = [
            r'^네,?\s*(이미|먼저)?\s*스킬을?\s*(읽었으므로|로드했으므로).*$',
            r'^이미\s+SKILL\.?md를?\s*(로드|읽).*$',
            r'^(먼저|우선)?\s*스킬을?\s*(로드|읽).*$',
            r'^(바로|이제)?\s*(분석|다이어그램|명세서).*?(진행|생성|작성)하겠습니다.*$',
            r'^(바로|이제)?\s*\d+가지\s*다이어그램을?\s*생성하겠습니다.*$',
            r'^(알겠습니다|네,?\s*알겠습니다).*$',
            r'^(그럼|그러면)\s*(바로|이제)?.*?(시작|진행).*$',
        ]

        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            should_remove = False
            for pattern in line_patterns:
                if re.match(pattern, line.strip(), flags=re.IGNORECASE):
                    should_remove = True
                    break
            if not should_remove:
                cleaned_lines.append(line)

        cleaned = '\n'.join(cleaned_lines)
        cleaned = re.sub(r'^---\s*\n+', '', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

        return cleaned.strip()

    async def assemble_stream(
        self,
        analysis: Dict[str, Any],
        design_result: str,
        diagram_result: str,
        detail_result: str
    ) -> AsyncIterator[dict]:
        """최종 조합 - LLM 없이 단순 문자열 조합 후 스트리밍"""

        import asyncio

        # 내부 코멘트 제거
        design_result = self._clean_internal_comments(design_result)
        diagram_result = self._clean_internal_comments(diagram_result)
        detail_result = self._clean_internal_comments(detail_result)

        # 데이터 추출
        pain_point = analysis.get('pain_point', analysis.get('painPoint', 'N/A'))
        pattern = analysis.get('pattern', 'N/A')
        pattern_reason = analysis.get('pattern_reason', '')
        feasibility_score = analysis.get('feasibility_score', 'N/A')
        recommendation = analysis.get('recommendation', '')
        input_type = analysis.get('input_type', analysis.get('inputType', 'N/A'))
        process_steps = analysis.get('process_steps', analysis.get('processSteps', []))
        output_types = analysis.get('output_types', analysis.get('outputTypes', []))
        human_loop = analysis.get('human_loop', analysis.get('humanLoop', 'N/A'))
        risks = analysis.get('risks', [])
        next_steps = analysis.get('next_steps', [])

        # 명세서 조합
        spec = f"""# AI Agent Design Specification

## 1. Executive Summary

- **Problem**: {pain_point}
- **Solution**: {pattern} 패턴 사용
- **Reason**: {pattern_reason}
- **Feasibility**: {feasibility_score}/50
- **Recommendation**: {recommendation}

{design_result}

{diagram_result}

{detail_result}

## 6. Problem Decomposition

- **INPUT**: {input_type}
- **PROCESS**:
"""
        # PROCESS 단계 추가
        for step in process_steps:
            spec += f'  - {step}\n'

        output_text = ', '.join(output_types) if isinstance(output_types, list) else str(output_types)
        spec += f"""- **OUTPUT**: {output_text}
- **Human-in-Loop**: {human_loop}
"""

        # Risks 섹션 (있는 경우)
        if risks:
            spec += "\n## 7. Risks\n\n"
            for risk in risks:
                spec += f'- {risk}\n'

        # Next Steps 섹션 (있는 경우)
        if next_steps:
            section_num = "8" if risks else "7"
            spec += f"\n## {section_num}. Next Steps\n\n"
            for i, step in enumerate(next_steps):
                spec += f'{i+1}. {step}\n'

        # 스트리밍으로 전송
        chunk_size = 100
        total_chunks = (len(spec) + chunk_size - 1) // chunk_size

        for i in range(0, len(spec), chunk_size):
            chunk = spec[i:i+chunk_size]
            chunk_index = i // chunk_size
            progress = 70 + int((chunk_index / total_chunks) * 25)
            yield {'text': chunk, 'progress': min(progress, 95)}
            await asyncio.sleep(0.01)


class MultiStageSpecAgent:
    """명세서 생성 조율 - 순차 호출"""

    def __init__(self):
        self.design_agent = DesignAgent()
        self.diagram_agent = DiagramAgent()
        self.detail_agent = DetailAgent()
        self.assembler_agent = AssemblerAgent()

    async def generate_spec_stream(
        self,
        analysis: Dict[str, Any]
    ) -> AsyncIterator[str]:
        """명세서 생성 - keep-alive 포함"""

        import asyncio

        try:
            # 1단계: Agent 설계 패턴 (0-40%) - Section 2: Agent Design Pattern
            yield f"data: {json.dumps({'progress': 0, 'stage': '2. 에이전트 설계 패턴 분석 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(self.design_agent.analyze, analysis))
            progress = 5
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 35)
                    yield f"data: {json.dumps({'progress': progress, 'stage': '2. 에이전트 설계 패턴 분석 중...'}, ensure_ascii=False)}\n\n"
            design_result = await task
            yield f"data: {json.dumps({'progress': 40, 'stage': '2. 에이전트 설계 패턴 완료'}, ensure_ascii=False)}\n\n"

            # 2단계: 다이어그램 (40-70%) - Section 3: Visual Design
            yield f"data: {json.dumps({'progress': 40, 'stage': '3. 워크플로우 다이어그램 생성 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(
                self.diagram_agent.generate_diagrams, design_result
            ))
            progress = 45
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 65)
                    yield f"data: {json.dumps({'progress': progress, 'stage': '3. 워크플로우 다이어그램 생성 중...'}, ensure_ascii=False)}\n\n"
            diagram_result = await task
            yield f"data: {json.dumps({'progress': 70, 'stage': '3. 워크플로우 다이어그램 완료'}, ensure_ascii=False)}\n\n"

            # 3단계: 상세 설계 (70-95%) - Section 4-5: Prompts & Tools
            yield f"data: {json.dumps({'progress': 70, 'stage': '4-5. 프롬프트 및 도구 정의 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(
                self.detail_agent.generate_details, design_result
            ))
            progress = 75
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 90)
                    yield f"data: {json.dumps({'progress': progress, 'stage': '4-5. 프롬프트 및 도구 정의 중...'}, ensure_ascii=False)}\n\n"
            detail_result = await task
            yield f"data: {json.dumps({'progress': 95, 'stage': '4-5. 프롬프트 및 도구 정의 완료'}, ensure_ascii=False)}\n\n"

            # 4단계: 최종 조합 (95-100%, 스트리밍) - Section 1,6-8: Summary, Decomposition
            yield f"data: {json.dumps({'progress': 95, 'stage': '1,6-8. 요약 및 최종 조합 시작'}, ensure_ascii=False)}\n\n"
            async for chunk_data in self.assembler_agent.assemble_stream(
                analysis, design_result, diagram_result, detail_result
            ):
                yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"

            # 최종 100% 도달
            yield f"data: {json.dumps({'progress': 100, 'stage': '완료'}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
