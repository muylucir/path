"""
Code Generator - Canvas State를 Strands Agent SDK 코드로 변환

캔버스에서 구성된 에이전트 아키텍처를 실행 가능한 Python 코드로 생성합니다.
"""

import json
import zipfile
import io
from typing import Dict, List, Any, Optional
from datetime import datetime


class CodeGenerator:
    """Canvas State를 Python 코드로 변환하는 생성기"""

    def __init__(self, canvas_state: Dict[str, Any]):
        self.canvas_state = canvas_state
        self.nodes = canvas_state.get("nodes", [])
        self.edges = canvas_state.get("edges", [])
        self.entry_point = canvas_state.get("entryPoint", "")
        self.agentcore_config = canvas_state.get("agentCoreConfig")
        self.metadata = canvas_state.get("metadata", {})

    def generate_all(self) -> Dict[str, str]:
        """모든 파일 생성"""
        return {
            "agent.py": self.generate_agent_code(),
            "agentcore_config.py": self.generate_agentcore_config(),
            "requirements.txt": self.generate_requirements(),
            "README.md": self.generate_readme(),
        }

    def generate_zip(self) -> bytes:
        """ZIP 파일로 생성"""
        files = self.generate_all()

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for filename, content in files.items():
                zf.writestr(filename, content)

        buffer.seek(0)
        return buffer.read()

    def generate_agent_code(self) -> str:
        """agent.py 생성"""
        agent_nodes = [n for n in self.nodes if n.get("type") == "agent"]
        router_nodes = [n for n in self.nodes if n.get("type") == "router"]

        # 헤더
        code = f'''"""
Strands Agent SDK - Generated Code
Pattern: {self.metadata.get("pattern", "Graph Pattern")}
Generated: {datetime.now().isoformat()}

이 파일은 PATH Agent Designer에서 자동 생성되었습니다.
"""

from strands import Agent
from strands.multiagent import GraphBuilder
from strands.models import BedrockModel
from typing import Dict, Any

'''

        # 모델 설정 함수
        code += '''
def get_bedrock_model(model_type: str = "sonnet", max_tokens: int = 8192) -> BedrockModel:
    """Bedrock 모델 설정"""
    model_ids = {
        "sonnet": "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        "haiku": "global.anthropic.claude-haiku-4-5-20250929-v1:0",
    }
    return BedrockModel(
        model_id=model_ids.get(model_type, model_ids["sonnet"]),
        max_tokens=max_tokens,
        temperature=0.3
    )


'''

        # 에이전트 정의
        code += "# Agent Definitions\n"
        code += "# " + "=" * 50 + "\n\n"

        for node in agent_nodes:
            data = node.get("data", {})
            name = data.get("name", "Agent")
            var_name = self._to_snake_case(name)
            role = data.get("role", "")
            system_prompt = data.get("systemPrompt", "") or role
            llm_config = data.get("llm", {})
            llm_type = "haiku" if "haiku" in llm_config.get("model", "").lower() else "sonnet"
            tools = data.get("tools", [])

            code += f'''
# {name}
{var_name}_model = get_bedrock_model("{llm_type}")

{var_name} = Agent(
    model={var_name}_model,
    system_prompt="""{system_prompt}""",
    tools=[{", ".join(tools) if tools else ""}]
)
'''

        # 라우터 노드 처리
        for node in router_nodes:
            data = node.get("data", {})
            name = data.get("name", "Router")
            var_name = self._to_snake_case(name)
            condition = data.get("condition", "")

            code += f'''
# {name} - Router Node
def {var_name}_condition(state: Dict[str, Any]) -> str:
    """라우팅 조건 함수"""
    # TODO: 조건 로직 구현
    # 조건: {condition}
    return "default"
'''

        # Graph Builder
        code += '''

# Graph Builder
# ''' + "=" * 50 + '''

builder = GraphBuilder()

# Add nodes
'''
        for node in agent_nodes:
            data = node.get("data", {})
            name = data.get("name", "Agent")
            var_name = self._to_snake_case(name)
            node_id = node.get("id", var_name)
            code += f'builder.add_node("{node_id}", {var_name})\n'

        code += "\n# Add edges\n"
        for edge in self.edges:
            source = edge.get("source", "")
            target = edge.get("target", "")
            label = edge.get("label", "")
            if label:
                code += f'builder.add_edge("{source}", "{target}")  # {label}\n'
            else:
                code += f'builder.add_edge("{source}", "{target}")\n'

        code += f'''
# Set entry point
builder.set_entry_point("{self.entry_point}")

# Build graph
graph = builder.build()
'''

        # 실행 함수
        code += '''

# Execution Functions
# ''' + "=" * 50 + '''

def invoke(prompt: str) -> str:
    """
    에이전트 그래프 실행

    Args:
        prompt: 사용자 입력 프롬프트

    Returns:
        에이전트 응답 텍스트
    """
    result = graph(prompt)
    return result.message['content'][0]['text']


async def invoke_async(prompt: str) -> str:
    """
    비동기 에이전트 그래프 실행

    Args:
        prompt: 사용자 입력 프롬프트

    Returns:
        에이전트 응답 텍스트
    """
    result = await graph.ainvoke(prompt)
    return result.message['content'][0]['text']


if __name__ == "__main__":
    # 테스트 실행
    response = invoke("Hello, how can you help me?")
    print(response)
'''

        return code

    def generate_agentcore_config(self) -> str:
        """agentcore_config.py 생성"""
        agent_count = len([n for n in self.nodes if n.get("type") == "agent"])
        pattern = self.metadata.get("pattern", "Graph Pattern")

        config = self.agentcore_config or {}
        has_memory = config.get("memory", {}).get("enabled", False)
        has_gateway = config.get("gateway", {}).get("enabled", False)
        has_identity = config.get("identity", {}).get("enabled", False)

        code = f'''"""
Amazon Bedrock AgentCore Configuration
Generated for deployment to AgentCore Runtime

Pattern: {pattern}
Agent Count: {agent_count}
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from agent import graph

# Initialize AgentCore App
app = BedrockAgentCoreApp()

'''

        # Memory 설정
        if has_memory:
            strategies = config.get("memory", {}).get("strategies", [])
            code += f'''
# Memory Configuration
from bedrock_agentcore.memory import MemoryClient

memory = MemoryClient()
# Enabled strategies: {", ".join(strategies) if strategies else "default"}
'''

        # Gateway 설정
        if has_gateway:
            code += '''
# Gateway Configuration
from bedrock_agentcore.gateway import GatewayClient

gateway = GatewayClient()
'''

        # Identity 설정
        if has_identity:
            code += '''
# Identity Configuration
from bedrock_agentcore.identity import IdentityClient

identity = IdentityClient()
'''

        # Entrypoint
        code += f'''

@app.entrypoint
def invoke(payload: dict, context: dict) -> dict:
    """
    AgentCore Runtime entrypoint.

    Args:
        payload: Request payload containing 'prompt' key
        context: Runtime context with session info

    Returns:
        Response dict with 'response' key
    """
    prompt = payload.get("prompt", "")
    session_id = context.get("session_id", "default")

    # Invoke the agent graph
    result = graph(prompt)
    response_text = result.message['content'][0]['text']

    return {{
        "response": response_text,
        "session_id": session_id,
        "metadata": {{
            "pattern": "{pattern}",
            "agent_count": {agent_count}
        }}
    }}


# Health check endpoint
@app.health_check
def health() -> dict:
    """Health check for AgentCore Runtime."""
    return {{"status": "healthy", "pattern": "{pattern}"}}
'''

        return code

    def generate_requirements(self) -> str:
        """requirements.txt 생성"""
        return '''# Strands Agent SDK
strands-agents>=0.1.0

# AWS Bedrock
boto3>=1.34.0
botocore>=1.34.0

# AgentCore Runtime (for deployment)
bedrock-agentcore>=0.1.0

# Utilities
python-dotenv>=1.0.0
pydantic>=2.0.0

# Async support
aiohttp>=3.9.0
'''

    def generate_readme(self) -> str:
        """README.md 생성"""
        agent_count = len([n for n in self.nodes if n.get("type") == "agent"])
        pattern = self.metadata.get("pattern", "Graph Pattern")

        agent_list = []
        for node in self.nodes:
            if node.get("type") == "agent":
                data = node.get("data", {})
                agent_list.append(f"- **{data.get('name', 'Agent')}**: {data.get('role', '')}")

        return f'''# AI Agent Project

Generated by PATH Agent Designer

## Overview

- **Pattern**: {pattern}
- **Agent Count**: {agent_count}
- **Generated**: {datetime.now().strftime("%Y-%m-%d %H:%M")}

## Agents

{chr(10).join(agent_list)}

## Quick Start

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
```

### 2. Configure AWS Credentials

```bash
aws configure
```

### 3. Run Locally

```bash
python agent.py
```

### 4. Deploy to AgentCore

```bash
pip install bedrock-agentcore-cli
agentcore deploy --name my-agent --entry agentcore_config.py
```

## Files

- `agent.py` - Main agent code with Strands SDK
- `agentcore_config.py` - AgentCore Runtime configuration
- `requirements.txt` - Python dependencies

## Architecture

```
{self._generate_ascii_diagram()}
```

## License

Generated by PATH Agent Designer
'''

    def _generate_ascii_diagram(self) -> str:
        """간단한 ASCII 다이어그램 생성"""
        agent_nodes = [n for n in self.nodes if n.get("type") == "agent"]

        if not agent_nodes:
            return "No agents defined"

        lines = ["[User Request]", "     |"]

        for i, node in enumerate(agent_nodes):
            data = node.get("data", {})
            name = data.get("name", "Agent")
            if i == 0:
                lines.append(f"     v")
            lines.append(f"[{name}]")
            if i < len(agent_nodes) - 1:
                lines.append("     |")

        lines.extend(["     |", "     v", "[Response]"])

        return "\n".join(lines)

    def _to_snake_case(self, name: str) -> str:
        """CamelCase를 snake_case로 변환"""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        s2 = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1)
        return s2.lower().replace(" ", "_").replace("-", "_")


def generate_code_from_canvas(canvas_state: Dict[str, Any]) -> Dict[str, str]:
    """
    편의 함수: Canvas State를 코드로 변환

    Args:
        canvas_state: AgentCanvasState 딕셔너리

    Returns:
        파일명 -> 코드 내용 딕셔너리
    """
    generator = CodeGenerator(canvas_state)
    return generator.generate_all()


def generate_zip_from_canvas(canvas_state: Dict[str, Any]) -> bytes:
    """
    편의 함수: Canvas State를 ZIP 파일로 변환

    Args:
        canvas_state: AgentCanvasState 딕셔너리

    Returns:
        ZIP 파일 바이트
    """
    generator = CodeGenerator(canvas_state)
    return generator.generate_zip()


if __name__ == "__main__":
    # 테스트
    sample_canvas = {
        "nodes": [
            {
                "id": "agent-1",
                "type": "agent",
                "position": {"x": 100, "y": 50},
                "data": {
                    "id": "agent-1",
                    "name": "Coordinator",
                    "role": "요청 분석 및 라우팅",
                    "systemPrompt": "",
                    "llm": {"model": "claude-sonnet-4.5"},
                    "tools": ["route_to_agent"],
                },
            },
            {
                "id": "agent-2",
                "type": "agent",
                "position": {"x": 100, "y": 250},
                "data": {
                    "id": "agent-2",
                    "name": "Analyzer",
                    "role": "데이터 분석",
                    "systemPrompt": "",
                    "llm": {"model": "claude-sonnet-4.5"},
                    "tools": ["data_query"],
                },
            },
        ],
        "edges": [
            {"id": "e1", "source": "agent-1", "target": "agent-2"},
        ],
        "entryPoint": "agent-1",
        "metadata": {
            "pattern": "Graph Pattern",
            "version": "1.0.0",
        },
    }

    files = generate_code_from_canvas(sample_canvas)
    for filename, content in files.items():
        print(f"\n{'='*50}")
        print(f"File: {filename}")
        print("=" * 50)
        print(content[:500] + "..." if len(content) > 500 else content)
