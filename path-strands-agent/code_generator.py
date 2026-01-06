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

        # Service nodes extraction
        self.memory_nodes = [n for n in self.nodes if n.get("type") == "memory"]
        self.gateway_nodes = [n for n in self.nodes if n.get("type") == "gateway"]
        self.identity_nodes = [n for n in self.nodes if n.get("type") == "identity"]

        # Build service connection map (agent_id -> service_ids)
        self.agent_service_map = self._build_agent_service_map()

    def _build_agent_service_map(self) -> Dict[str, List[str]]:
        """Agent에서 Service로의 연결 맵 생성"""
        service_map = {}
        service_node_ids = set(
            n["id"] for n in self.memory_nodes + self.gateway_nodes + self.identity_nodes
        )

        for edge in self.edges:
            source = edge.get("source", "")
            target = edge.get("target", "")
            edge_type = edge.get("type", "")

            # Service edge: Agent → Service 연결
            if edge_type == "service" and target in service_node_ids:
                if source not in service_map:
                    service_map[source] = []
                service_map[source].append(target)

        return service_map

    def _agent_uses_service(self, agent_id: str, service_type: str) -> bool:
        """Agent가 특정 서비스 타입을 사용하는지 확인"""
        service_ids = self.agent_service_map.get(agent_id, [])

        if service_type == "memory":
            return any(sid.startswith("memory-") for sid in service_ids)
        elif service_type == "gateway":
            return any(sid.startswith("gateway-") for sid in service_ids)
        elif service_type == "identity":
            return any(sid.startswith("identity-") for sid in service_ids)

        return False

    def generate_all(self) -> Dict[str, str]:
        """모든 파일 생성"""
        files = {
            "agent.py": self.generate_agent_code(),
            "agentcore_config.py": self.generate_agentcore_config(),
            "requirements.txt": self.generate_requirements(),
            "README.md": self.generate_readme(),
        }

        # Memory 서비스 파일 생성
        if self.memory_nodes:
            files["memory_service.py"] = self._generate_memory_service()

        # Gateway 서비스 파일 생성
        if self.gateway_nodes:
            files["gateway_service.py"] = self._generate_gateway_service()

        # Identity 서비스 파일 생성
        if self.identity_nodes:
            files["identity_service.py"] = self._generate_identity_service()

        return files

    def _generate_memory_service(self) -> str:
        """Memory 서비스 클라이언트 코드 생성"""
        if not self.memory_nodes:
            return ""

        memory_node = self.memory_nodes[0]
        data = memory_node.get("data", {})
        memory_type = data.get("type", "short-term")
        strategies = data.get("strategies", [])
        namespaces = data.get("namespaces", [])

        code = f'''"""
Memory Service - AgentCore Memory Integration
Memory Type: {memory_type}
Strategies: {", ".join(strategies) if strategies else "default"}
"""

from bedrock_agentcore.memory import MemoryClient
from bedrock_agentcore.memory.integrations.strands.session_manager import AgentCoreMemorySessionManager
from bedrock_agentcore.memory.config import AgentCoreMemoryConfig
from typing import Optional


class MemoryService:
    """AgentCore Memory 서비스 래퍼"""

    def __init__(self, region_name: str = "us-west-2"):
        self.client = MemoryClient(region_name=region_name)
        self.memory_type = "{memory_type}"
        self.strategies = {strategies}
        self.namespaces = {namespaces}

    def create_session_manager(
        self,
        memory_id: str,
        actor_id: str,
        session_id: str,
        namespace: Optional[str] = None
    ) -> AgentCoreMemorySessionManager:
        """
        Strands Agent용 세션 매니저 생성

        Args:
            memory_id: AgentCore Memory ID
            actor_id: 사용자 또는 액터 ID
            session_id: 세션 ID
            namespace: 선택적 네임스페이스

        Returns:
            AgentCoreMemorySessionManager 인스턴스
        """
        config = AgentCoreMemoryConfig(
            memory_id=memory_id,
            session_id=session_id,
            actor_id=actor_id,
            namespace=namespace or self.namespaces[0] if self.namespaces else None
        )
        return AgentCoreMemorySessionManager(agentcore_memory_config=config)

    def store_fact(self, memory_id: str, actor_id: str, fact: str) -> dict:
        """사실 정보 저장 (Long-term Memory)"""
        return self.client.store_memory(
            memory_id=memory_id,
            actor_id=actor_id,
            content=fact,
            memory_type="fact"
        )

    def store_preference(self, memory_id: str, actor_id: str, preference: str) -> dict:
        """사용자 선호도 저장"""
        return self.client.store_memory(
            memory_id=memory_id,
            actor_id=actor_id,
            content=preference,
            memory_type="preference"
        )

    def retrieve(self, memory_id: str, actor_id: str, query: str, limit: int = 5) -> list:
        """관련 메모리 검색"""
        return self.client.retrieve_memory(
            memory_id=memory_id,
            actor_id=actor_id,
            query=query,
            limit=limit
        )


# Singleton instance
memory_service = MemoryService()


def get_memory_session_manager(memory_id: str, actor_id: str, session_id: str) -> AgentCoreMemorySessionManager:
    """편의 함수: 세션 매니저 생성"""
    return memory_service.create_session_manager(memory_id, actor_id, session_id)
'''
        return code

    def _generate_gateway_service(self) -> str:
        """Gateway 서비스 클라이언트 코드 생성"""
        if not self.gateway_nodes:
            return ""

        gateway_node = self.gateway_nodes[0]
        data = gateway_node.get("data", {})
        targets = data.get("targets", [])

        target_configs = []
        for target in targets:
            target_type = target.get("type", "mcp-server")
            target_name = target.get("name", "unknown")
            target_configs.append(f'    # - {target_name} ({target_type})')

        code = f'''"""
Gateway Service - AgentCore Gateway Integration

Configured Targets:
{chr(10).join(target_configs) if target_configs else "    # No targets configured"}
"""

from strands.tools.mcp.mcp_client import MCPClient
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from typing import Optional, List
import asyncio


class GatewayService:
    """AgentCore Gateway 서비스 래퍼"""

    def __init__(self):
        self.clients = {{}}
        self.targets = {targets}

    async def connect_mcp_server(
        self,
        gateway_url: str,
        access_token: Optional[str] = None,
        server_name: str = "default"
    ) -> MCPClient:
        """
        MCP 서버에 연결

        Args:
            gateway_url: Gateway URL
            access_token: 인증 토큰 (선택)
            server_name: 서버 이름

        Returns:
            연결된 MCPClient
        """
        headers = {{"Authorization": f"Bearer {{access_token}}"}} if access_token else {{}}

        client = MCPClient(
            lambda: streamablehttp_client(gateway_url, headers=headers)
        )
        self.clients[server_name] = client
        return client

    def get_client(self, server_name: str = "default") -> Optional[MCPClient]:
        """연결된 MCP 클라이언트 조회"""
        return self.clients.get(server_name)

    async def list_tools(self, server_name: str = "default") -> List[dict]:
        """사용 가능한 도구 목록 조회"""
        client = self.get_client(server_name)
        if not client:
            return []

        async with client:
            tools = await client.list_tools()
            return [tool.model_dump() for tool in tools]

    async def call_tool(
        self,
        tool_name: str,
        arguments: dict,
        server_name: str = "default"
    ) -> dict:
        """
        도구 호출

        Args:
            tool_name: 도구 이름
            arguments: 도구 인자
            server_name: 서버 이름

        Returns:
            도구 실행 결과
        """
        client = self.get_client(server_name)
        if not client:
            raise ValueError(f"No client connected for server: {{server_name}}")

        async with client:
            result = await client.call_tool(tool_name, arguments)
            return result


# Singleton instance
gateway_service = GatewayService()


async def connect_gateway(gateway_url: str, access_token: str = None) -> MCPClient:
    """편의 함수: Gateway 연결"""
    return await gateway_service.connect_mcp_server(gateway_url, access_token)
'''
        return code

    def _generate_identity_service(self) -> str:
        """Identity 서비스 클라이언트 코드 생성"""
        if not self.identity_nodes:
            return ""

        identity_node = self.identity_nodes[0]
        data = identity_node.get("data", {})
        auth_type = data.get("authType", "api-key")
        provider = data.get("provider", "")
        scopes = data.get("scopes", [])

        code = f'''"""
Identity Service - AgentCore Identity Integration

Auth Type: {auth_type}
Provider: {provider or "Not specified"}
Scopes: {", ".join(scopes) if scopes else "None"}
"""

from bedrock_agentcore.identity import IdentityClient
from typing import Optional, List
import os


class IdentityService:
    """AgentCore Identity 서비스 래퍼"""

    def __init__(self, region_name: str = "us-west-2"):
        self.client = IdentityClient(region_name=region_name)
        self.auth_type = "{auth_type}"
        self.provider = "{provider}"
        self.scopes = {scopes}

    def get_oauth_token(
        self,
        connection_id: str,
        actor_id: str,
        scopes: Optional[List[str]] = None
    ) -> dict:
        """
        OAuth 토큰 획득 (2LO - Two-legged OAuth)

        Args:
            connection_id: Identity Connection ID
            actor_id: 액터 ID
            scopes: 요청 스코프

        Returns:
            토큰 정보 dict
        """
        return self.client.get_token(
            connection_id=connection_id,
            actor_id=actor_id,
            scopes=scopes or self.scopes
        )

    def get_user_token(
        self,
        connection_id: str,
        actor_id: str,
        authorization_code: str,
        redirect_uri: str
    ) -> dict:
        """
        OAuth 토큰 획득 (3LO - Three-legged OAuth)

        Args:
            connection_id: Identity Connection ID
            actor_id: 액터 ID
            authorization_code: 사용자 인증 코드
            redirect_uri: 리다이렉트 URI

        Returns:
            토큰 정보 dict
        """
        return self.client.exchange_code(
            connection_id=connection_id,
            actor_id=actor_id,
            code=authorization_code,
            redirect_uri=redirect_uri
        )

    def get_authorization_url(
        self,
        connection_id: str,
        redirect_uri: str,
        scopes: Optional[List[str]] = None,
        state: Optional[str] = None
    ) -> str:
        """
        OAuth 인증 URL 생성 (3LO)

        Args:
            connection_id: Identity Connection ID
            redirect_uri: 리다이렉트 URI
            scopes: 요청 스코프
            state: 상태 값

        Returns:
            인증 URL
        """
        return self.client.get_authorization_url(
            connection_id=connection_id,
            redirect_uri=redirect_uri,
            scopes=scopes or self.scopes,
            state=state
        )


# Singleton instance
identity_service = IdentityService()


def get_access_token(connection_id: str, actor_id: str) -> str:
    """편의 함수: 액세스 토큰 획득"""
    token_info = identity_service.get_oauth_token(connection_id, actor_id)
    return token_info.get("access_token", "")
'''
        return code

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

        # Check which services are used
        has_memory = len(self.memory_nodes) > 0
        has_gateway = len(self.gateway_nodes) > 0
        has_identity = len(self.identity_nodes) > 0

        # 헤더
        code = f'''"""
Strands Agent SDK - Generated Code
Pattern: {self.metadata.get("pattern", "Graph Pattern")}
Generated: {datetime.now().isoformat()}

이 파일은 PATH Agent Designer에서 자동 생성되었습니다.

AgentCore Services:
- Memory: {"Enabled" if has_memory else "Disabled"}
- Gateway: {"Enabled" if has_gateway else "Disabled"}
- Identity: {"Enabled" if has_identity else "Disabled"}
"""

from strands import Agent
from strands.multiagent import GraphBuilder
from strands.models import BedrockModel
from typing import Dict, Any, Optional
import os

'''

        # Service imports
        if has_memory:
            code += '''# Memory Service Integration
from memory_service import memory_service, get_memory_session_manager

'''

        if has_gateway:
            code += '''# Gateway Service Integration
from gateway_service import gateway_service, connect_gateway

'''

        if has_identity:
            code += '''# Identity Service Integration
from identity_service import identity_service, get_access_token

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

        # Environment variables for AgentCore configuration
        if has_memory or has_gateway or has_identity:
            code += '''# AgentCore Configuration (set via environment variables)
MEMORY_ID = os.getenv("AGENTCORE_MEMORY_ID", "")
GATEWAY_URL = os.getenv("AGENTCORE_GATEWAY_URL", "")
IDENTITY_CONNECTION_ID = os.getenv("AGENTCORE_IDENTITY_CONNECTION_ID", "")

'''

        for node in agent_nodes:
            data = node.get("data", {})
            node_id = node.get("id", "")
            name = data.get("name", "Agent")
            var_name = self._to_snake_case(name)
            role = data.get("role", "")
            system_prompt = data.get("systemPrompt", "") or role
            llm_config = data.get("llm", {})
            llm_type = "haiku" if "haiku" in llm_config.get("model", "").lower() else "sonnet"
            tools = data.get("tools", [])

            # Check service connections for this agent
            uses_memory = self._agent_uses_service(node_id, "memory")
            uses_gateway = self._agent_uses_service(node_id, "gateway")

            code += f'''
# {name}
{var_name}_model = get_bedrock_model("{llm_type}")
'''

            # Add session manager factory if agent uses memory
            if uses_memory:
                code += f'''
def create_{var_name}_with_session(actor_id: str, session_id: str) -> Agent:
    """Memory가 연결된 {name} Agent 생성"""
    session_manager = get_memory_session_manager(MEMORY_ID, actor_id, session_id)
    return Agent(
        model={var_name}_model,
        system_prompt="""{system_prompt}""",
        tools=[{", ".join(tools) if tools else ""}],
        session_manager=session_manager
    )

# Default agent (without session - for backward compatibility)
{var_name} = Agent(
    model={var_name}_model,
    system_prompt="""{system_prompt}""",
    tools=[{", ".join(tools) if tools else ""}]
)
'''
            else:
                code += f'''
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

        code += "\n# Add edges (workflow only, excluding service connections)\n"
        for edge in self.edges:
            # Skip service edges - they represent Agent↔Service connections, not workflow
            if edge.get("type") == "service":
                continue

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

### 3. Configure Environment Variables

```bash
# Create .env file
cat > .env << EOF
{f"AGENTCORE_MEMORY_ID=your-memory-id" if self.memory_nodes else "# No memory service configured"}
{f"AGENTCORE_GATEWAY_URL=https://your-gateway-url" if self.gateway_nodes else "# No gateway service configured"}
{f"AGENTCORE_IDENTITY_CONNECTION_ID=your-connection-id" if self.identity_nodes else "# No identity service configured"}
EOF
```

### 4. Run Locally

```bash
python agent.py
```

### 5. Deploy to AgentCore

```bash
pip install bedrock-agentcore-cli
agentcore deploy --name my-agent --entry agentcore_config.py
```

## Files

- `agent.py` - Main agent code with Strands SDK
- `agentcore_config.py` - AgentCore Runtime configuration
- `requirements.txt` - Python dependencies
{f"- `memory_service.py` - AgentCore Memory integration" if self.memory_nodes else ""}
{f"- `gateway_service.py` - AgentCore Gateway integration" if self.gateway_nodes else ""}
{f"- `identity_service.py` - AgentCore Identity integration" if self.identity_nodes else ""}

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
    # 테스트 (AgentCore 서비스 포함)
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
            # AgentCore 서비스 노드들
            {
                "id": "memory-1",
                "type": "memory",
                "position": {"x": 400, "y": 80},
                "data": {
                    "id": "memory-1",
                    "name": "Shared Memory",
                    "type": "long-term",
                    "strategies": ["semantic", "user-preference"],
                    "namespaces": ["/facts/{actorId}", "/preferences/{actorId}"],
                },
            },
            {
                "id": "gateway-1",
                "type": "gateway",
                "position": {"x": 400, "y": 260},
                "data": {
                    "id": "gateway-1",
                    "name": "Tool Gateway",
                    "targets": [
                        {"type": "lambda", "name": "data-query-lambda", "config": {}},
                        {"type": "rest-api", "name": "external-api", "config": {}},
                    ],
                },
            },
        ],
        "edges": [
            # 워크플로우 edges
            {"id": "e1", "source": "agent-1", "target": "agent-2"},
            # 서비스 edges (Agent → Service)
            {"id": "e-mem-1", "source": "agent-1", "target": "memory-1", "label": "memory", "type": "service"},
            {"id": "e-mem-2", "source": "agent-2", "target": "memory-1", "label": "memory", "type": "service"},
            {"id": "e-gw-1", "source": "agent-2", "target": "gateway-1", "label": "tools", "type": "service"},
        ],
        "entryPoint": "agent-1",
        "agentCoreConfig": {
            "runtime": {"enabled": True, "timeout": 900, "concurrency": 1000},
            "memory": {"enabled": True, "strategies": ["semantic", "user-preference"]},
            "gateway": {"enabled": True, "targets": ["data-query-lambda", "external-api"]},
            "identity": {"enabled": False, "providers": []},
        },
        "metadata": {
            "pattern": "Graph Pattern with AgentCore",
            "version": "1.0.0",
        },
    }

    files = generate_code_from_canvas(sample_canvas)
    for filename, content in files.items():
        print(f"\n{'='*50}")
        print(f"File: {filename}")
        print("=" * 50)
        print(content[:800] + "..." if len(content) > 800 else content)

    print(f"\n\n=== Generated {len(files)} files ===")
    for filename in files.keys():
        print(f"  - {filename}")
