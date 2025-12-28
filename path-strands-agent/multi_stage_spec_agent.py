"""
Multi-Stage Spec Agents - 명세서 생성을 4개 Agent로 분할 (순차 호출)

순서: PatternAgent → AgentCoreAgent → ArchitectureAgent → AssemblerAgent
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Dict, Any, Optional, AsyncIterator
import json
from skill_tool import skill_tool
from skills.skill_utils import initialize_skills
import sys
import os
from contextlib import contextmanager

# stdout 억제를 위한 컨텍스트 매니저
@contextmanager
def suppress_output():
    """Agent 실행 중 stdout/stderr 억제"""
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    try:
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')
        yield
    finally:
        sys.stdout.close()
        sys.stderr.close()
        sys.stdout = old_stdout
        sys.stderr = old_stderr


# 공통 모델 설정
def get_bedrock_model(max_tokens: int = 8192) -> BedrockModel:
    """공통 Bedrock 모델 설정"""
    return BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        max_tokens=max_tokens,
        temperature=0.3
    )


class PatternAgent:
    """1단계: 패턴 분석 Agent"""
    
    def __init__(self):
        available_skills, skill_prompt = initialize_skills(
            skill_dirs=["./skills"],
            verbose=False
        )
        
        system_prompt = """당신은 Strands Agent 패턴 전문가입니다."""
        enhanced_prompt = system_prompt + skill_prompt
        
        self.agent = Agent(
            model=get_bedrock_model(max_tokens=16000),
            system_prompt=enhanced_prompt,
            tools=[skill_tool]
        )
    
    def analyze(self, analysis: Dict[str, Any]) -> str:
        """패턴 분석 - stdout 억제"""
        prompt = f"""다음 분석 결과를 바탕으로 Strands Agent 패턴을 분석하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}

**중요**: 먼저 <skill_tool>strands-agent-patterns</skill_tool>를 사용하여 적합한 패턴(Graph, Planning, Multi-Agent, Reflection, Agent-as-Tool)을 찾고, 해당 패턴의 구현 가이드를 참조하세요.

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|
**중요: 테이블에 HTML 태그 금지.**
**중요 : LLM은 Claude Sonnet/Haiku 4.5만 사용**

### 패턴 분석
선택된 패턴과 Strands Agent 구현 방법:
- [패턴명]: [Graph 구조 설명 1-2문장]

### Graph 구조
```python
# strands-agent-patterns 스킬의 코드 템플릿을 참조하여 작성
nodes = {{"node1": Agent(role="...", goal="...")}}
edges = [("node1", "node2")]
```

### Agent-as-Tool
| Agent Name | Role | Input | Output | 사용 시점 |
|------------|------|-------|--------|----------|
**중요: 테이블에 HTML 태그 금지.**

### Invocation State 활용
에이전트 간 상태 공유:
- **용도**: [어떤 데이터를 공유할지]
- **업데이트 시점**: [언제 상태를 업데이트할지]
- **활용 방법**: [다음 노드에서 어떻게 사용할지]

"""
        with suppress_output():
            result = self.agent(prompt)
        return result.message['content'][0]['text']


class AgentCoreAgent:
    """3단계: AgentCore 서비스 구성"""
    
    def __init__(self):
        available_skills, skill_prompt = initialize_skills(
            skill_dirs=["./skills"],
            verbose=False
        )
        
        system_prompt = """당신은 Amazon Bedrock AgentCore 전문가입니다."""
        enhanced_prompt = system_prompt + skill_prompt
        
        self.agent = Agent(
            model=get_bedrock_model(max_tokens=16000),
            system_prompt=enhanced_prompt,
            tools=[skill_tool]
        )
    
    def configure(self, analysis: Dict[str, Any], pattern_result: str) -> str:
        """AgentCore 구성 - PatternAgent 결과 기반"""
        prompt = f"""다음 Strands Agent 패턴 분석 결과를 기반으로 AgentCore 서비스를 구성하세요:

{pattern_result}

**중요**: 먼저 <skill_tool>agentcore-services</skill_tool>를 사용하여 각 서비스의 올바른 사용법과 베스트 프랙티스를 확인하세요.

**핵심 원칙** (agentcore-services 스킬 참조):
- **1개의 AgentCore Runtime**으로 전체 Multi-Agent Graph를 호스팅 (Agent별 Runtime 분리 금지 - 비용 N배, 레이턴시 증가)
- Memory는 STM(Short-term)/LTM(Long-term) 용도에 맞게 선택
- Gateway는 MCP 표준 준수

**중요**: 위에 정의된 Agent들(Agent Components 테이블)을 AgentCore에 배포한다고 가정하고 작성하세요.
새로운 Agent를 만들지 말고, 위에 나온 Agent들에 필요한 AgentCore 서비스를 매핑하세요.

## Amazon Bedrock AgentCore 서비스 구성

### 필요한 서비스 분석

위 Agent Components 테이블을 보고:
1. 각 Agent가 사용하는 Tools를 확인
2. 필요한 AgentCore 서비스 판단
3. 서비스별 구체적 설정 제시

### 서비스 구성 테이블

| 서비스 | 사용 여부 | 용도 (위 Agent들 기준) | 설정 |
|--------|-----------|----------------------|------|
| **AgentCore Runtime** | ✅ | 전체 Multi-Agent가 Graph패턴일 때 호스팅 (1개만 사용) | [총 Agent 개수]개 Agent를 1개의 Runtime에서 호스팅 |
| **AgentCore Memory** | ✅/❌ | [어떤 상태를 저장하는지] | Short-term/Long-term |
| **AgentCore Gateway** | ✅/❌ | [어떤 MCP를 연동하는지] | Lambda/OpenAPI/Self-hosted MCP |
| **AgentCore Identity** | ✅/❌ | [어떤 API 인증이 필요한지] | API Key/OAuth |
| **AgentCore Browser** | ✅/❌ | [웹 자동화 필요 여부] | - |
| **AgentCore Code Interpreter** | ✅/❌ | [코드 실행 필요 여부] | - |

**중요: 테이블에 HTML 태그 금지. 위 패턴 분석 결과에 나온 Agent들만 언급하세요.**
"""
        with suppress_output():
            result = self.agent(prompt)
        return result.message['content'][0]['text']


class ArchitectureAgent:
    """2단계: 아키텍처 다이어그램"""
    
    def __init__(self):
        available_skills, skill_prompt = initialize_skills(
            skill_dirs=["./skills"],
            verbose=False
        )
        
        system_prompt = """당신은 아키텍처 시각화 전문가입니다."""
        enhanced_prompt = system_prompt + skill_prompt
        
        self.agent = Agent(
            model=get_bedrock_model(max_tokens=16000),
            system_prompt=enhanced_prompt,
            tools=[skill_tool]
        )
    
    def generate_diagrams(self, pattern_result: str, agentcore_result: Optional[str] = None) -> str:
        """다이어그램 생성"""
        agentcore_section = f"\n\nAgentCore: {agentcore_result}" if agentcore_result else ""

        prompt = f"""Mermaid 다이어그램 3개를 생성하세요:

패턴: {pattern_result}{agentcore_section}

**중요**: <skill_tool>mermaid-diagrams</skill_tool>를 참조하여 패턴별 다이어그램 템플릿과 스타일 가이드를 사용하세요.

다음 3가지 다이어그램을 생성:

1. **Graph Structure** (graph TB 또는 TD):
   - Agent Components 테이블의 Agent들을 노드로 표현
   - 노드 간 연결 관계 (edges) 표시
   - subgraph로 논리적 그룹화
   - 스타일링 적용 (classDef)

2. **Sequence Diagram**:
   - 사용자 요청부터 최종 응답까지의 호출 흐름
   - Agent 간 메시지 전달 순서
   - 조건부 분기 표현 (alt/opt)

3. **Architecture Flowchart**:
   - 전체 시스템 아키텍처
   - 외부 서비스 연동 (MCP, API 등)
   - AgentCore 서비스 포함 (있는 경우)

**중요: 다이어그램에 HTML 태그 금지. mermaid-diagrams 스킬의 템플릿 구조를 따르세요.**
"""
        with suppress_output():
            result = self.agent(prompt)
        return result.message['content'][0]['text']


class AssemblerAgent:
    """4단계: 최종 조합 - LLM 없이 단순 문자열 조합"""

    def __init__(self):
        # LLM 불필요 - 단순 템플릿 조합만 수행
        pass

    async def assemble_stream(
        self,
        analysis: Dict[str, Any],
        pattern_result: str,
        architecture_result: str,
        agentcore_result: Optional[str] = None
    ) -> AsyncIterator[str]:
        """최종 조합 - LLM 없이 단순 문자열 조합 후 스트리밍"""

        import asyncio

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

# 1. Executive Summary

- **Problem**: {pain_point}
- **Solution**: {pattern} 패턴 사용
- **Reason**: {pattern_reason}
- **Feasibility**: {feasibility_score}/50
- **Recommendation**: {recommendation}

# 2. Strands Agent 구현

{pattern_result}
"""

        # AgentCore 섹션 (선택적)
        if agentcore_result:
            spec += f"""
# 3. Amazon Bedrock AgentCore

{agentcore_result}
"""

        # Architecture 섹션
        section_num = "4" if agentcore_result else "3"
        spec += f"""
# {section_num}. Architecture

{architecture_result}
"""

        # Problem Decomposition 섹션
        section_num = "5" if agentcore_result else "4"
        process_text = '\n'.join([f'  - {step}' for step in process_steps])
        output_text = ', '.join(output_types) if isinstance(output_types, list) else str(output_types)

        spec += f"""
# {section_num}. Problem Decomposition

- **INPUT**: {input_type}
- **PROCESS**:
{process_text}
- **OUTPUT**: {output_text}
- **Human-in-Loop**: {human_loop}
"""

        # Risks 섹션 (있는 경우)
        if risks:
            section_num = "6" if agentcore_result else "5"
            risks_text = '\n'.join([f'- {risk}' for risk in risks])
            spec += f"""
## {section_num}. Risks

{risks_text}
"""

        # Next Steps 섹션 (있는 경우)
        if next_steps:
            section_num = "7" if agentcore_result else ("6" if risks else "5")
            next_steps_text = '\n'.join([f'{i+1}. {step}' for i, step in enumerate(next_steps)])
            spec += f"""
## {section_num}. Next Steps

{next_steps_text}
"""

        # 스트리밍으로 전송 (청크 단위로, progress 포함)
        chunk_size = 100
        total_chunks = (len(spec) + chunk_size - 1) // chunk_size  # 올림 나눗셈

        for i in range(0, len(spec), chunk_size):
            chunk = spec[i:i+chunk_size]
            chunk_index = i // chunk_size
            # Progress를 75%→95%로 증가 (스트리밍 중)
            progress = 75 + int((chunk_index / total_chunks) * 20)  # 75-95%
            yield {'text': chunk, 'progress': min(progress, 95)}
            await asyncio.sleep(0.01)  # 스트리밍 효과


class MultiStageSpecAgent:
    """명세서 생성 조율 - 순차 호출"""
    
    def __init__(self):
        self.pattern_agent = PatternAgent()
        self.agentcore_agent = AgentCoreAgent()
        self.architecture_agent = ArchitectureAgent()
        self.assembler_agent = AssemblerAgent()
    
    async def generate_spec_stream(
        self,
        analysis: Dict[str, Any],
        use_agentcore: bool = False
    ) -> AsyncIterator[str]:
        """명세서 생성 - keep-alive 포함"""

        import asyncio

        try:
            # 1단계: 패턴 분석 (0-25%)
            yield f"data: {json.dumps({'progress': 0, 'stage': '패턴 분석 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(self.pattern_agent.analyze, analysis))
            progress = 5
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 20)
                    yield f"data: {json.dumps({'progress': progress, 'stage': '패턴 분석 중...'}, ensure_ascii=False)}\n\n"
            pattern_result = await task
            yield f"data: {json.dumps({'progress': 25, 'stage': '패턴 분석 완료'}, ensure_ascii=False)}\n\n"

            # 3단계: AgentCore (조건부, 25-50%)
            agentcore_result = None
            if use_agentcore:
                yield f"data: {json.dumps({'progress': 25, 'stage': 'AgentCore 구성 시작'}, ensure_ascii=False)}\n\n"
                task = asyncio.create_task(asyncio.to_thread(
                    self.agentcore_agent.configure, analysis, pattern_result
                ))
                progress = 30
                while not task.done():
                    await asyncio.sleep(3)
                    if not task.done():
                        progress = min(progress + 5, 45)
                        yield f"data: {json.dumps({'progress': progress, 'stage': 'AgentCore 구성 중...'}, ensure_ascii=False)}\n\n"
                agentcore_result = await task
                yield f"data: {json.dumps({'progress': 50, 'stage': 'AgentCore 구성 완료'}, ensure_ascii=False)}\n\n"
            else:
                yield f"data: {json.dumps({'progress': 50, 'stage': 'AgentCore 건너뜀'}, ensure_ascii=False)}\n\n"

            # 2단계: 아키텍처 (50-75%)
            yield f"data: {json.dumps({'progress': 50, 'stage': '아키텍처 생성 시작'}, ensure_ascii=False)}\n\n"
            task = asyncio.create_task(asyncio.to_thread(
                self.architecture_agent.generate_diagrams, pattern_result, agentcore_result
            ))
            progress = 55
            while not task.done():
                await asyncio.sleep(3)
                if not task.done():
                    progress = min(progress + 5, 70)
                    yield f"data: {json.dumps({'progress': progress, 'stage': '아키텍처 생성 중...'}, ensure_ascii=False)}\n\n"
            architecture_result = await task
            yield f"data: {json.dumps({'progress': 75, 'stage': '아키텍처 생성 완료'}, ensure_ascii=False)}\n\n"

            # 4단계: 최종 조합 (75-100%, 스트리밍)
            yield f"data: {json.dumps({'progress': 75, 'stage': '명세서 조합 시작'}, ensure_ascii=False)}\n\n"
            async for chunk_data in self.assembler_agent.assemble_stream(
                analysis, pattern_result, architecture_result, agentcore_result
            ):
                # chunk_data는 {'text': ..., 'progress': ...} 형식
                yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"

            # 최종 100% 도달
            yield f"data: {json.dumps({'progress': 100, 'stage': '완료'}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
