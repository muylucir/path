"""
Spec Agent with SKILL System - PATH 3단계 명세서 생성

원본 PATH 웹앱의 프롬프트를 그대로 사용하며 스트리밍 지원 추가
"""

from strands import Agent
from typing import Dict, Any, AsyncIterator
import json
from prompts import SYSTEM_PROMPT
from skill_tool import skill_tool
from skills.skill_utils import initialize_skills


class SpecAgent:
    """명세서 생성 Agent (SKILL 기반)"""
    
    def __init__(self, model_id: str = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"):
        # SKILL 시스템 초기화
        available_skills, skill_prompt = initialize_skills(
            skill_dirs=["./skills"],
            verbose=False
        )
        
        # 시스템 프롬프트에 SKILL 프롬프트 추가
        enhanced_prompt = SYSTEM_PROMPT + skill_prompt
        
        # Agent 생성 (SKILL tool 포함)
        self.agent = Agent(
            model=model_id,
            system_prompt=enhanced_prompt,
            tools=[skill_tool]
        )
    
    def generate_spec(self, analysis: Dict[str, Any], use_agentcore: bool = False) -> str:
        """명세서 생성 - 동기 버전"""
        prompt = self._get_selfhosted_prompt(analysis) if not use_agentcore else self._get_agentcore_prompt(analysis)
        result = self.agent(prompt)
        return result.message['content'][0]['text']
    
    async def generate_spec_stream(self, analysis: Dict[str, Any], use_agentcore: bool = False) -> AsyncIterator[str]:
        """명세서 생성 - 스트리밍 버전"""
        prompt = self._get_selfhosted_prompt(analysis) if not use_agentcore else self._get_agentcore_prompt(analysis)
        
        async for event in self.agent.stream_async(prompt):
            if "data" in event:
                yield event["data"]
    
    def _get_selfhosted_prompt(self, analysis: Dict[str, Any]) -> str:
        """Self-hosted 명세서 프롬프트 - PATH 웹앱과 동일"""
        return f"""다음 분석 결과를 바탕으로 Strands Agent 기반 구현 명세서를 작성하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1문장)
- **Solution**: Strands Agent 구현 방법 (1-2문장)
- **Feasibility**: X/50 (판정)

## 2. Strands Agent 구현

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

### 패턴 분석
선택된 패턴과 Strands Agent 구현 방법:
- [패턴명]: [Graph 구조 설명 1-2문장]

### Graph 구조
```python
nodes = {{"node1": Agent(role="...", goal="...")}}
edges = [("node1", "node2")]
```

### Agent-as-Tool
| Agent Name | Role | Input | Output | 사용 시점 |
|------------|------|-------|--------|----------|

### Invocation State 활용
에이전트 간 상태 공유:
- **용도**: [어떤 데이터를 공유할지]
- **업데이트 시점**: [언제 상태를 업데이트할지]
- **활용 방법**: [다음 노드에서 어떻게 사용할지]

### MCP 연동
- [MCP 서버명]: [용도]

## 3. Architecture

```mermaid
graph TB
    [Strands Graph 구조]
```

```mermaid
sequenceDiagram
    [핵심 흐름만]
```

```mermaid
flowchart TD
    [처리 흐름]
```

## 4. Problem Decomposition
- INPUT: [트리거]
- PROCESS: [핵심 단계만 3-5개]
- OUTPUT: [결과물]
- Human-in-Loop: [개입 시점]

---
**중요1**: 패턴 분석에서 선택된 패턴과 Graph 구조를 명확히 설명하세요.
**중요2**: Invocation State로 에이전트 간 데이터를 공유하는 방법을 구체적으로 작성하세요.
**중요3**: 구현 코드는 핵심 노드만 간결하게 작성하세요.
**중요4**: LLM은 Claude Sonnet 4.5, Haiku 4.5 중에서만 선택하세요.
**중요5**: 다이어그램은 Strands Agent 아키텍처에 맞게 작성하세요.
**중요6**: 위 4개 섹션만 작성하고, 구현 계획이나 일정은 포함하지 마세요.
"""
    
    def _get_agentcore_prompt(self, analysis: Dict[str, Any]) -> str:
        """AgentCore 명세서 프롬프트 - PATH 웹앱과 동일"""
        return f"""다음 분석 결과를 바탕으로 Strands Agent + Amazon Bedrock AgentCore 기반 구현 명세서를 작성하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1문장)
- **Solution**: Strands Agent + Amazon Bedrock AgentCore 구현 방법 (1-2문장)
- **Feasibility**: X/50 (판정)

## 2. Strands Agent 구현

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

### 패턴 분석
선택된 패턴과 Strands Agent 구현 방법:
- [패턴명]: [Graph 구조 설명 1-2문장]

### Graph 구조
```python
nodes = {{"node1": Agent(role="...", goal="...")}}
edges = [("node1", "node2")]
```

### Agent-as-Tool
| Agent Name | Role | Input | Output | 사용 시점 |
|------------|------|-------|--------|----------|

### Invocation State 활용
에이전트 간 상태 공유:
- **용도**: [어떤 데이터를 공유할지]
- **업데이트 시점**: [언제 상태를 업데이트할지]
- **활용 방법**: [다음 노드에서 어떻게 사용할지]

### MCP 연동
- [MCP 서버명]: [용도]

## 3. Amazon Bedrock AgentCore

- **AgentCore Runtime** (필수): 서버리스 에이전트 호스팅
- **AgentCore Memory** (필요시): 단기/장기 메모리 관리
- **AgentCore Gateway** (필요시): API/Lambda를 MCP 도구로 변환
- **AgentCore Identity** (필요시): OAuth 연동 및 API 키 관리
- **AgentCore Browser** (필요시): 웹 자동화
- **AgentCore Code Interpreter** (필요시): 코드 실행

| 서비스 | 사용 여부 | 용도 | 설정 |
|--------|-----------|------|------|
| **AgentCore Memory** | ✅/❌ | 단기/장기 메모리 관리 | Event/Semantic Memory |
| **AgentCore Gateway** | ✅/❌ | API/Lambda를 MCP 도구로 변환 | Target: Lambda/OpenAPI |
| **AgentCore Identity** | ✅/❌ | OAuth 연동 및 API 키 관리 | Provider: GitHub/Google |
| **AgentCore Browser** | ✅/❌ | 웹 자동화 | Headless Chrome |
| **AgentCore Code Interpreter** | ✅/❌ | 코드 실행 | Python/Node.js |

## 4. Architecture

```mermaid
graph TB
    [Strands Graph 구조]
```

```mermaid
sequenceDiagram
    [핵심 흐름만]
```

```mermaid
flowchart TD
    [처리 흐름]
```

## 5. Problem Decomposition
- INPUT: [트리거]
- PROCESS: [핵심 단계만 3-5개]
- OUTPUT: [결과물]
- Human-in-Loop: [개입 시점]

---
**중요1**: 패턴 분석에서 선택된 패턴과 Graph 구조를 명확히 설명하세요.
**중요2**: Invocation State로 에이전트 간 데이터를 공유하는 방법을 구체적으로 작성하세요.
**중요3**: 구현 코드는 핵심 노드만 간결하게 작성하세요.
**중요4**: LLM은 Claude Sonnet 4.5, Haiku 4.5 중에서만 선택하세요.
**중요5**: 다이어그램은 Strands Agent 아키텍처에 맞게 작성하세요.
**중요6**: 위 5개 섹션만 작성하고, 구현 계획이나 일정은 포함하지 마세요.
**중요7**: 분석된 요구사항에 맞게 AgentCore 서비스(Runtime/Memory/Gateway/Identity/Browser/Code Interpreter) 중 필요한 것을 선택하고 활용 방법을 구체적으로 설명하세요.
"""


# 테스트용 메인 함수
if __name__ == "__main__":
    import asyncio
    
    test_analysis = {
        "painPoint": "고객 문의 이메일 자동 분류 및 답변",
        "patterns": ["Multi-Agent", "Reflection"],
        "feasibility_score": 37
    }
    
    async def test_streaming():
        print("🔍 Spec Agent 스트리밍 테스트 (AgentCore)")
        print("="*80)
        
        spec_agent = SpecAgent()
        
        print("\n📡 스트리밍 시작...\n")
        async for chunk in spec_agent.generate_spec_stream(test_analysis, use_agentcore=True):
            print(chunk, end="", flush=True)
        
        print("\n\n✅ 스트리밍 완료!")
    
    asyncio.run(test_streaming())
