"""
CodeGeneratorAgent - PATH 명세서를 Strands Agent SDK 코드로 직접 변환

PATH 명세서 → Strands Agent 코드 (2-3분)
- SDD 우회 (30분 → 3분, 10배 개선)
- 6개 파일 생성: agent.py, tools.py, agentcore_config.py, requirements.txt, Dockerfile, deploy_guide.md
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Dict, Any, Optional, List, AsyncIterator
import json
import re
import asyncio
import logging
from strands_tools import file_read
from agentskills import discover_skills, generate_skills_prompt
from strands_utils import strands_utils
from integration_validator import integration_validator

logger = logging.getLogger(__name__)


class CodeGeneratorAgent:
    """PATH 명세서 → Strands Agent SDK 코드 생성 전문 Agent"""

    def _safe_name(self, name: str) -> str:
        """통합 이름을 Python 함수명으로 변환"""
        safe = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
        return safe.strip('_')

    def _format_integration_context(self, integration_details: List[Dict[str, Any]]) -> str:
        """통합별 상세 컨텍스트 및 구현 패턴 생성"""
        if not integration_details:
            return ""

        context = "\n\n<registered_integrations>\n"
        context += "**중요**: 아래 등록된 통합은 반드시 tools.py에 구현해야 합니다.\n"
        context += "각 통합의 Implementation Pattern 코드를 정확히 따르세요.\n\n"

        for detail in integration_details:
            int_type = detail.get('type', 'api')
            name = detail.get('name', '')
            config = detail.get('config', {})

            if int_type == 'mcp':
                context += self._format_mcp_integration(name, config)
            elif int_type == 'api':
                context += self._format_api_integration(name, config)
            elif int_type == 'rag':
                context += self._format_rag_integration(name, config)
            elif int_type == 's3':
                context += self._format_s3_integration(name, config)
            elif int_type == 'mcp-server':
                context += self._format_mcp_server_integration(name, config)
            elif int_type == 'gateway':
                context += self._format_gateway_integration(name, config)

        context += "</registered_integrations>\n"
        return context

    def _format_mcp_integration(self, name: str, config: Dict[str, Any]) -> str:
        """MCP 통합 포맷팅 (transport별 구현 패턴 포함)"""
        transport = config.get('transport', 'stdio')
        server_url = config.get('serverUrl', '')
        command = config.get('command', '')
        args = config.get('args', [])
        env = config.get('env', {})
        tools = config.get('tools', [])
        safe_name = self._safe_name(name)

        context = f"### [MCP] {name}\n"
        context += f"- Transport: {transport}\n"

        if transport == 'stdio':
            context += f"- Command: {command}\n"
            context += f"- Args: {args}\n"
            if env:
                context += f"- Environment Variables: {json.dumps(env)}\n"

            # stdio 구현 패턴
            context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
            context += "from strands.tools.mcp import MCPClient\n"
            context += "from mcp import stdio_client, StdioServerParameters\n\n"
            context += f"def get_{safe_name}_mcp_client():\n"
            context += "    return MCPClient(lambda: stdio_client(\n"
            context += "        StdioServerParameters(\n"
            context += f"            command=\"{command}\",\n"
            context += f"            args={args}"
            if env:
                context += f",\n            env={json.dumps(env)}"
            context += "\n        )\n    ))\n```\n"

        elif transport in ['sse', 'http']:
            # http transport는 streamablehttp_client 사용 (MCP SDK 1.x)
            context += f"- Server URL: {server_url}\n"

            # streamablehttp 구현 패턴
            context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
            context += "from strands.tools.mcp import MCPClient\n"
            context += "from mcp.client.streamable_http import streamablehttp_client\n\n"
            context += f"def get_{safe_name}_mcp_client():\n"
            context += f"    return MCPClient(lambda: streamablehttp_client(url=\"{server_url}\"))\n```\n"

        # 잘못된 패턴 경고 추가
        context += "\n**⚠️ 잘못된 패턴 - 절대 사용 금지!**\n"
        context += "```python\n"
        context += "# ❌ TypeError 발생 - MCPClient는 keyword arguments를 받지 않음!\n"
        context += "MCPClient(name=\"...\", transport=\"...\", url=\"...\")  # 잘못됨!\n"
        context += "MCPClient(transport=\"http\", url=\"...\")  # 잘못됨!\n"
        context += "```\n"

        # 도구 목록
        if tools:
            context += f"\n- Available Tools ({len(tools)}개):\n"
            for tool in tools:
                tool_name = tool.get('name', '') if isinstance(tool, dict) else str(tool)
                tool_desc = tool.get('description', '') if isinstance(tool, dict) else ''
                context += f"  - `{tool_name}`: {tool_desc}\n"

        # main.py 사용법
        context += f"\n**main.py에서 사용**:\n```python\n"
        context += f"from tools import get_{safe_name}_mcp_client\n\n"
        context += f"mcp_client = get_{safe_name}_mcp_client()\n"
        context += "with mcp_client:\n"
        context += "    tools = mcp_client.list_tools_sync()\n"
        context += "    agent = Agent(tools=tools, ...)\n```\n\n"

        return context

    def _format_api_integration(self, name: str, config: Dict[str, Any]) -> str:
        """API 통합 포맷팅 (인증 타입별 구현 패턴)"""
        base_url = config.get('baseUrl', '')
        auth_type = config.get('authType', 'none')
        auth_config = config.get('authConfig', {})
        endpoints = config.get('endpoints', [])
        safe_name = self._safe_name(name)

        context = f"### [API] {name}\n"
        context += f"- Base URL: {base_url}\n"
        context += f"- Auth Type: {auth_type}\n"

        # 인증 설정
        if auth_type == 'api-key' and auth_config:
            header = auth_config.get('apiKeyHeader', 'X-API-Key')
            context += f"- API Key Header: {header}\n"
        elif auth_type == 'oauth2' and auth_config:
            context += f"- OAuth2 Token URL: {auth_config.get('oauth2TokenUrl', '')}\n"
            context += f"- OAuth2 Scopes: {auth_config.get('oauth2Scopes', [])}\n"
        elif auth_type == 'bearer' and auth_config:
            context += "- Bearer Token Auth\n"

        # 전체 엔드포인트
        context += f"\n- Endpoints ({len(endpoints)}개):\n"
        for ep in endpoints:
            method = ep.get('method', 'GET')
            path = ep.get('path', '')
            summary = ep.get('summary', ep.get('description', ''))
            context += f"  - `{method} {path}`: {summary}\n"
            params = ep.get('parameters', [])
            if params:
                param_names = [p.get('name') for p in params if isinstance(p, dict)]
                context += f"    Parameters: {param_names}\n"
            # Request body
            request_body = ep.get('requestBody', {})
            if request_body:
                context += f"    Request Body: {request_body.get('description', 'JSON payload')}\n"

        # 구현 패턴
        context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
        context += "import requests\nimport os\n"
        context += "from strands import tool\n\n"
        context += f"BASE_URL = \"{base_url}\"\n"

        if auth_type == 'api-key':
            header = auth_config.get('apiKeyHeader', 'X-API-Key')
            env_var = f"{safe_name.upper()}_API_KEY"
            context += f"API_KEY = os.getenv('{env_var}')  # TODO: 환경변수 설정\n\n"
            context += "def get_headers():\n"
            context += f"    return {{\"{header}\": API_KEY, \"Content-Type\": \"application/json\"}}\n"
        elif auth_type == 'bearer':
            env_var = f"{safe_name.upper()}_TOKEN"
            context += f"ACCESS_TOKEN = os.getenv('{env_var}')  # TODO: 환경변수 설정\n\n"
            context += "def get_headers():\n"
            context += "    return {\"Authorization\": f\"Bearer {ACCESS_TOKEN}\", \"Content-Type\": \"application/json\"}\n"
        elif auth_type == 'oauth2':
            context += "# TODO: OAuth2 토큰 관리 구현\n"
            context += "ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')\n\n"
            context += "def get_headers():\n"
            context += "    return {\"Authorization\": f\"Bearer {ACCESS_TOKEN}\", \"Content-Type\": \"application/json\"}\n"
        else:
            context += "\ndef get_headers():\n"
            context += "    return {\"Content-Type\": \"application/json\"}\n"

        # 각 endpoint별 함수 예시 생성
        if endpoints:
            context += "\n# 아래는 각 endpoint를 @tool로 구현한 예시입니다.\n"
            for i, ep in enumerate(endpoints[:3]):  # 최대 3개 예시
                method = ep.get('method', 'GET').lower()
                path = ep.get('path', '')
                op_id = ep.get('operationId', f"{method}_{i}")
                func_name = self._safe_name(op_id)

                context += f"\n@tool\n"
                context += f"def {func_name}("

                # 파라미터 추출
                params = ep.get('parameters', [])
                param_list = []
                for p in params:
                    if isinstance(p, dict):
                        p_name = p.get('name', '')
                        p_required = p.get('required', False)
                        if p_required:
                            param_list.append(f"{p_name}: str")
                        else:
                            param_list.append(f"{p_name}: str = None")
                if param_list:
                    context += ", ".join(param_list)
                context += "):\n"

                summary = ep.get('summary', ep.get('description', f'{method.upper()} {path}'))
                context += f"    \"\"\"{summary}\"\"\"\n"

                # Path parameter 처리
                formatted_path = path
                for p in params:
                    if isinstance(p, dict) and p.get('in') == 'path':
                        p_name = p.get('name', '')
                        formatted_path = formatted_path.replace('{' + p_name + '}', '{' + p_name + '}')

                if method == 'get':
                    context += f"    response = requests.get(f\"{{BASE_URL}}{formatted_path}\", headers=get_headers())\n"
                elif method == 'post':
                    context += f"    response = requests.post(f\"{{BASE_URL}}{formatted_path}\", headers=get_headers(), json={{}})\n"
                elif method == 'put':
                    context += f"    response = requests.put(f\"{{BASE_URL}}{formatted_path}\", headers=get_headers(), json={{}})\n"
                elif method == 'delete':
                    context += f"    response = requests.delete(f\"{{BASE_URL}}{formatted_path}\", headers=get_headers())\n"
                else:
                    context += f"    response = requests.{method}(f\"{{BASE_URL}}{formatted_path}\", headers=get_headers())\n"

                context += "    return response.json()\n"

        context += "```\n\n"
        return context

    def _format_rag_integration(self, name: str, config: Dict[str, Any]) -> str:
        """RAG 통합 포맷팅"""
        provider = config.get('provider', '')
        safe_name = self._safe_name(name)

        context = f"### [RAG] {name}\n"
        context += f"- Provider: {provider}\n"

        if provider == 'bedrock-kb':
            kb_config = config.get('bedrockKb', {})
            kb_id = kb_config.get('knowledgeBaseId', '')
            region = kb_config.get('region', 'us-west-2')
            context += f"- Knowledge Base ID: {kb_id}\n"
            context += f"- Region: {region}\n"

            context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
            context += "import boto3\n"
            context += "from strands import tool\n\n"
            context += f"kb_client = boto3.client('bedrock-agent-runtime', region_name='{region}')\n"
            context += f"KNOWLEDGE_BASE_ID = \"{kb_id}\"\n\n"
            context += "@tool\n"
            context += f"def search_{safe_name}(query: str, max_results: int = 5):\n"
            context += f"    \"\"\"Search {name} knowledge base for relevant information.\"\"\"\n"
            context += "    response = kb_client.retrieve(\n"
            context += "        knowledgeBaseId=KNOWLEDGE_BASE_ID,\n"
            context += "        retrievalQuery={'text': query},\n"
            context += "        retrievalConfiguration={\n"
            context += "            'vectorSearchConfiguration': {'numberOfResults': max_results}\n"
            context += "        }\n"
            context += "    )\n"
            context += "    return [{\n"
            context += "        'content': r.get('content', {}).get('text', ''),\n"
            context += "        'score': r.get('score', 0.0)\n"
            context += "    } for r in response.get('retrievalResults', [])]\n```\n\n"

        elif provider == 'pinecone':
            pinecone_config = config.get('pinecone', {})
            index_name = pinecone_config.get('indexName', '')
            namespace = pinecone_config.get('namespace', '')
            context += f"- Index Name: {index_name}\n"
            context += f"- Namespace: {namespace}\n"

            context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
            context += "import os\n"
            context += "from pinecone import Pinecone\n"
            context += "from strands import tool\n\n"
            context += "pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))\n"
            context += f"index = pc.Index(\"{index_name}\")\n\n"
            context += "@tool\n"
            context += f"def search_{safe_name}(query_vector: list, top_k: int = 5):\n"
            context += f"    \"\"\"Search {name} Pinecone index.\"\"\"\n"
            context += "    results = index.query(\n"
            context += "        vector=query_vector,\n"
            context += "        top_k=top_k,\n"
            if namespace:
                context += f"        namespace=\"{namespace}\"\n"
            context += "    )\n"
            context += "    return results.matches\n```\n\n"

        elif provider == 'opensearch':
            os_config = config.get('opensearch', {})
            endpoint = os_config.get('endpoint', '')
            index_name = os_config.get('indexName', '')
            context += f"- Endpoint: {endpoint}\n"
            context += f"- Index Name: {index_name}\n"

            context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
            context += "from opensearchpy import OpenSearch, RequestsHttpConnection\n"
            context += "from requests_aws4auth import AWS4Auth\n"
            context += "import boto3\n"
            context += "from strands import tool\n\n"
            context += "credentials = boto3.Session().get_credentials()\n"
            context += "awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, 'us-west-2', 'es', session_token=credentials.token)\n"
            context += f"os_client = OpenSearch(\n"
            context += f"    hosts=[{{'host': '{endpoint}', 'port': 443}}],\n"
            context += "    http_auth=awsauth,\n"
            context += "    use_ssl=True,\n"
            context += "    verify_certs=True,\n"
            context += "    connection_class=RequestsHttpConnection\n"
            context += ")\n\n"
            context += "@tool\n"
            context += f"def search_{safe_name}(query: str, size: int = 5):\n"
            context += f"    \"\"\"Search {name} OpenSearch index.\"\"\"\n"
            context += "    response = os_client.search(\n"
            context += f"        index=\"{index_name}\",\n"
            context += "        body={'query': {'match': {'content': query}}, 'size': size}\n"
            context += "    )\n"
            context += "    return [hit['_source'] for hit in response['hits']['hits']]\n```\n\n"

        return context

    def _format_mcp_server_integration(self, name: str, config: Dict[str, Any]) -> str:
        """MCP Server 통합 포맷팅 (external, aws, self-hosted)"""
        source = config.get('source', {})
        source_type = source.get('type', 'external')
        deployment = config.get('deployment', {})
        mcp_config = config.get('mcpConfig', {})
        tools = config.get('tools', [])
        safe_name = self._safe_name(name)

        context = f"### [MCP Server] {name}\n"
        context += f"- Source Type: {source_type}\n"

        if source_type in ['external', 'aws']:
            # External/AWS MCP Server: stdio transport 사용
            command = mcp_config.get('command', '')
            args = mcp_config.get('args', [])
            env = mcp_config.get('env', {})

            # stdio MCP 서버 제한 사항 안내
            context += "\n**⚠️ stdio MCP 서버 제한 사항**\n"
            context += "stdio 기반 MCP 서버 (uvx, npx 등)는 AgentCore Runtime의 샌드박스 환경에서\n"
            context += "외부 프로세스를 실행할 수 없으므로 직접 사용이 불가합니다.\n\n"

            context += "**✅ 대안: AgentCore Gateway 사용**\n"
            context += "1. Settings에서 'Gateway' 통합을 생성하세요\n"
            context += "2. Gateway Target으로 Lambda 함수를 추가하여 MCP 도구를 구현하세요\n"
            context += "3. 또는 OpenAPI/Smithy 스펙을 통해 API를 MCP 도구로 변환하세요\n"
            context += "4. Gateway가 'ready' 상태가 되면 streamablehttp_client로 연결 가능합니다\n\n"

            context += "**코드 생성 지침:**\n"
            context += "- 이 MCP 서버에 대한 stdio_client 코드를 생성하지 마세요\n"
            context += "- Gateway 통합이 있으면 그것을 사용하세요\n"
            context += "- Gateway가 없으면 Agent는 tools=[] 로 LLM 기본 지식만 사용합니다\n\n"

            context += f"- (참고용) Command: {command}\n"
            context += f"- (참고용) Args: {args}\n"
            if env:
                context += f"- (참고용) Environment Variables: {json.dumps(env)}\n"

            # AWS MCP인 경우 역할별 가이드 추가
            if source_type == 'aws':
                aws_role = env.get('AWS_MCP_ROLE', '')
                if aws_role:
                    context += f"- AWS Role: {aws_role}\n"

                    # 역할별 추가 가이드
                    role_guides = {
                        'solutions-architect': '''
**Solutions Architect 도구 활용 가이드**:
- AWS 아키텍처 설계 질문에 활용
- Best Practice 및 Well-Architected Framework 조회
- 서비스 간 통합 패턴 검색
- 비용 최적화 및 확장성 고려사항 제공
''',
                        'software-developer': '''
**Software Developer 도구 활용 가이드**:
- SDK 코드 예제 생성
- API 사용법 및 샘플 코드 검색
- 라이브러리 통합 가이드
- 코드 리뷰 및 디버깅 지원
''',
                        'devops-engineer': '''
**DevOps Engineer 도구 활용 가이드**:
- CI/CD 파이프라인 설계
- CloudFormation/CDK 템플릿 생성
- 모니터링 및 로깅 설정
- 인프라 자동화 스크립트 작성
''',
                        'data-engineer': '''
**Data Engineer 도구 활용 가이드**:
- 데이터 파이프라인 아키텍처
- ETL 작업 설계
- 데이터 레이크/웨어하우스 구성
- 데이터 품질 및 거버넌스 가이드
''',
                        'security-engineer': '''
**Security Engineer 도구 활용 가이드**:
- IAM 정책 및 역할 설계
- 보안 베스트 프랙티스 적용
- 컴플라이언스 체크리스트
- 위협 모델링 및 취약점 분석
''',
                    }

                    if aws_role in role_guides:
                        context += role_guides[aws_role]

            # stdio 구현 패턴
            context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
            context += "from strands.tools.mcp import MCPClient\n"
            context += "from mcp import stdio_client, StdioServerParameters\n\n"
            context += f"def get_{safe_name}_mcp_client():\n"
            context += "    return MCPClient(lambda: stdio_client(\n"
            context += "        StdioServerParameters(\n"
            context += f"            command=\"{command}\",\n"
            context += f"            args={args}"
            if env:
                context += f",\n            env={json.dumps(env)}"
            context += "\n        )\n    ))\n```\n"

        elif source_type == 'self-hosted':
            status = deployment.get('status', 'pending')
            endpoint_url = deployment.get('endpointUrl', '')

            if status == 'ready':
                # 배포된 self-hosted MCP Server: streamablehttp transport 사용
                context += f"- Status: Deployed (Ready)\n"
                context += f"- Endpoint URL: {endpoint_url}\n"

                # streamablehttp 구현 패턴
                context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
                context += "from strands.tools.mcp import MCPClient\n"
                context += "from mcp.client.streamable_http import streamablehttp_client\n\n"
                context += f"def get_{safe_name}_mcp_client():\n"
                context += f"    return MCPClient(lambda: streamablehttp_client(\n"
                context += f"        url=\"{endpoint_url}\"\n"
                context += "    ))\n```\n"
            else:
                # 미배포 self-hosted: 경고 표시
                context += f"- Status: {status} (배포 필요!)\n"
                context += "\n**⚠️ 주의: 이 MCP Server는 아직 배포되지 않았습니다!**\n"
                context += "Settings에서 MCP Server를 먼저 배포해주세요.\n"
                context += "\n배포 완료 후 사용할 패턴:\n```python\n"
                context += "from strands.tools.mcp import MCPClient\n"
                context += "from mcp.client.streamable_http import streamablehttp_client\n\n"
                context += f"def get_{safe_name}_mcp_client():\n"
                context += f"    # TODO: 배포 후 endpoint URL 입력\n"
                context += f"    return MCPClient(lambda: streamablehttp_client(\n"
                context += f"        url=\"<ENDPOINT_URL_AFTER_DEPLOYMENT>\"\n"
                context += "    ))\n```\n"

        else:
            # template 등 기타 타입
            context += f"- 알 수 없는 소스 타입: {source_type}\n"

        # 잘못된 패턴 경고 추가
        context += "\n**⚠️ 잘못된 패턴 - 절대 사용 금지!**\n"
        context += "```python\n"
        context += "# ❌ TypeError 발생 - MCPClient는 keyword arguments를 받지 않음!\n"
        context += "MCPClient(name=\"...\", transport=\"...\", url=\"...\")  # 잘못됨!\n"
        context += "MCPClient(transport=\"http\", url=\"...\")  # 잘못됨!\n"
        context += "```\n"

        # 도구 목록
        if tools:
            context += f"\n- Available Tools ({len(tools)}개):\n"
            for tool in tools:
                tool_name = tool.get('name', '') if isinstance(tool, dict) else str(tool)
                tool_desc = tool.get('description', '') if isinstance(tool, dict) else ''
                context += f"  - `{tool_name}`: {tool_desc}\n"

        # main.py 사용법
        context += f"\n**main.py에서 사용**:\n```python\n"
        context += f"from tools import get_{safe_name}_mcp_client\n\n"
        context += f"mcp_client = get_{safe_name}_mcp_client()\n"
        context += "with mcp_client:\n"
        context += "    tools = mcp_client.list_tools_sync()\n"
        context += "    agent = Agent(tools=tools, ...)\n```\n\n"

        return context

    def _format_s3_integration(self, name: str, config: Dict[str, Any]) -> str:
        """S3 통합 포맷팅"""
        bucket = config.get('bucketName', '')
        region = config.get('region', 'us-west-2')
        prefix = config.get('prefix', '')
        access_type = config.get('accessType', 'read-write')
        safe_name = self._safe_name(name)

        context = f"### [S3] {name}\n"
        context += f"- Bucket: {bucket}\n"
        context += f"- Region: {region}\n"
        context += f"- Prefix: {prefix or '(none)'}\n"
        context += f"- Access Type: {access_type}\n"

        context += "\n**Implementation Pattern (tools.py)**:\n```python\n"
        context += "import boto3\n"
        context += "from strands import tool\n\n"
        context += f"s3_client = boto3.client('s3', region_name='{region}')\n"
        context += f"S3_BUCKET_NAME = \"{bucket}\"\n"
        if prefix:
            context += f"S3_PREFIX = \"{prefix}\"\n"

        if 'read' in access_type:
            context += "\n@tool\n"
            context += f"def read_{safe_name}_file(key: str) -> str:\n"
            context += f"    \"\"\"Read a file from {name} S3 bucket.\"\"\"\n"
            if prefix:
                context += "    full_key = f\"{S3_PREFIX}/{key}\" if S3_PREFIX else key\n"
            else:
                context += "    full_key = key\n"
            context += "    response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=full_key)\n"
            context += "    return response['Body'].read().decode('utf-8')\n"

            context += "\n@tool\n"
            context += f"def list_{safe_name}_files(prefix: str = \"\") -> list:\n"
            context += f"    \"\"\"List files in {name} S3 bucket.\"\"\"\n"
            if prefix:
                context += "    search_prefix = f\"{S3_PREFIX}/{prefix}\" if prefix else S3_PREFIX\n"
            else:
                context += "    search_prefix = prefix\n"
            context += "    response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=search_prefix)\n"
            context += "    return [obj['Key'] for obj in response.get('Contents', [])]\n"

        if 'write' in access_type:
            context += "\n@tool\n"
            context += f"def write_{safe_name}_file(key: str, content: str) -> bool:\n"
            context += f"    \"\"\"Write a file to {name} S3 bucket.\"\"\"\n"
            if prefix:
                context += "    full_key = f\"{S3_PREFIX}/{key}\" if S3_PREFIX else key\n"
            else:
                context += "    full_key = key\n"
            context += "    s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=full_key, Body=content.encode('utf-8'))\n"
            context += "    return True\n"

        context += "```\n\n"
        return context

    def _format_gateway_integration(self, name: str, config: Dict[str, Any]) -> str:
        """AgentCore Gateway 통합 포맷팅 - AgentCore Runtime 배포에 최적화"""
        gateway_id = config.get('gatewayId', '')
        gateway_url = config.get('gatewayUrl', '')
        gateway_status = config.get('gatewayStatus', 'creating')
        enable_semantic_search = config.get('enableSemanticSearch', True)
        targets = config.get('targets', [])
        safe_name = self._safe_name(name)

        context = f"### [AgentCore Gateway] {name}\n"
        context += f"- Gateway ID: {gateway_id or '(pending)'}\n"
        context += f"- Status: {gateway_status}\n"

        if gateway_status == 'ready' and gateway_url:
            # Gateway가 배포되어 사용 가능한 상태
            context += f"- Gateway URL: {gateway_url}\n"
            context += f"- Semantic Search: {'Enabled' if enable_semantic_search else 'Disabled'}\n"

            # Target 정보
            if targets:
                context += f"\n**Available Targets ({len(targets)}개)**:\n"
                for target in targets:
                    target_type = target.get('type', 'unknown')
                    target_name = target.get('name', 'unnamed')
                    target_desc = target.get('description', '')
                    context += f"- [{target_type.upper()}] {target_name}: {target_desc}\n"

                    # Target별 도구 정보
                    if target_type == 'api':
                        endpoints = target.get('apiConfig', {}).get('endpoints', [])
                        for ep in endpoints[:5]:  # 상위 5개만 표시
                            context += f"  - {ep.get('method', 'GET')} {ep.get('path', '')}: {ep.get('description', '')}\n"
                    elif target_type in ['mcp', 'lambda']:
                        tools = target.get('tools', [])
                        for tool in tools[:5]:  # 상위 5개만 표시
                            tool_name = tool.get('name', '') if isinstance(tool, dict) else str(tool)
                            context += f"  - `{tool_name}`\n"

            # AgentCore Gateway 사용 패턴 (streamablehttp_client)
            context += "\n**✅ AgentCore Runtime 배포 지원!**\n"
            context += "Gateway는 HTTP를 통해 접근하므로 AgentCore Runtime에서 정상 동작합니다.\n\n"

            context += "**Implementation Pattern (tools.py)**:\n```python\n"
            context += "from strands.tools.mcp import MCPClient\n"
            context += "from mcp.client.streamable_http import streamablehttp_client\n"
            context += "import os\n\n"
            context += "# Gateway URL (환경변수 또는 직접 지정)\n"
            context += f"GATEWAY_URL = os.getenv('GATEWAY_URL', '{gateway_url}')\n\n"
            context += "# OAuth 토큰 (AgentCore Identity에서 제공)\n"
            context += "ACCESS_TOKEN = os.getenv('ACCESS_TOKEN', '')\n\n"
            context += f"def get_{safe_name}_mcp_client():\n"
            context += "    \"\"\"AgentCore Gateway MCP 클라이언트 생성\"\"\"\n"
            context += "    headers = {}\n"
            context += "    if ACCESS_TOKEN:\n"
            context += "        headers['Authorization'] = f'Bearer {ACCESS_TOKEN}'\n"
            context += "    return MCPClient(lambda: streamablehttp_client(\n"
            context += "        url=GATEWAY_URL,\n"
            context += "        headers=headers\n"
            context += "    ))\n"
            context += "```\n\n"

            # main.py 사용법
            context += f"**main.py에서 사용**:\n```python\n"
            context += f"from tools import get_{safe_name}_mcp_client\n\n"
            context += f"mcp_client = get_{safe_name}_mcp_client()\n"
            context += "with mcp_client:\n"
            context += "    tools = mcp_client.list_tools_sync()\n"
            context += "    agent = Agent(tools=tools, ...)\n```\n\n"

        else:
            # Gateway가 아직 배포되지 않은 상태
            context += "\n**⚠️ Gateway가 아직 배포되지 않았습니다!**\n"
            context += "Settings에서 Gateway를 먼저 배포해주세요.\n\n"
            context += "배포 완료 후 사용할 패턴:\n```python\n"
            context += "from strands.tools.mcp import MCPClient\n"
            context += "from mcp.client.streamable_http import streamablehttp_client\n\n"
            context += f"def get_{safe_name}_mcp_client():\n"
            context += "    # TODO: Gateway 배포 후 URL 입력\n"
            context += "    return MCPClient(lambda: streamablehttp_client(\n"
            context += "        url=\"<GATEWAY_URL_AFTER_DEPLOYMENT>\"\n"
            context += "    ))\n```\n\n"

        return context

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 Strands Agent SDK 코드 생성 전문가입니다.
PATH 명세서를 분석하여 AgentCore Runtime에 배포 가능한 Python 코드를 생성합니다.

**출력 형식**:
6개 파일을 생성하며, 각 파일은 반드시 `### 파일명` 구분자로 시작합니다.

### main.py
(BedrockAgentCoreApp 패턴으로 Agent 정의)
중요: FastAPI가 아닌 BedrockAgentCoreApp 패턴 사용!

### tools.py
(MCP/API 통합 코드)

### agentcore_config.py
(Runtime/Gateway/Memory 설정)

### requirements.txt
(의존성 목록 - bedrock-agentcore 포함, bedrock-agentcore 아님!)

### agentcore.yaml
(AgentCore CLI 배포 설정 파일)

### deploy_guide.md
(AgentCore CLI 배포 가이드)

**BedrockAgentCoreApp 패턴 (main.py) - Lazy Initialization 필수!**:

반드시 아래 패턴을 따르세요:
1. 모듈 레벨에서는 BedrockAgentCoreApp()만 생성
2. _graph, _initialized 전역 변수 선언
3. _initialize() 함수에서 Agent/Model/Graph 생성
4. invoke()에서 _initialize() 호출

예시 구조:
- import os; os.environ["BYPASS_TOOL_CONSENT"] = "true"
- from bedrock_agentcore.runtime import BedrockAgentCoreApp
- _graph = None; _initialized = False
- def _initialize(): 무거운 import와 초기화 수행, _graph 반환
- app = BedrockAgentCoreApp()
- @app.entrypoint def invoke(payload, context): graph = _initialize(); ...
- if __name__ == "__main__": app.run()

**중요: Lazy Initialization이 필요한 이유**
- AgentCore Runtime은 30초 내에 초기화를 완료해야 함
- Agent, Model, Graph 생성은 시간이 오래 걸림
- 모듈 레벨에서 생성하면 타임아웃 발생
- _initialize() 함수로 첫 호출 시에만 생성하면 타임아웃 우회

**agentcore.yaml 형식**:
```yaml
runtime: PYTHON_3_13
entry_point: main.py
agent_name: {agent_name}
network:
  mode: PUBLIC
```

**중요 규칙**:
1. 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
2. "스킬을 읽었으므로", "이제 생성하겠습니다" 같은 문구 금지
3. 바로 코드만 출력하세요
4. 각 파일은 반드시 `### 파일명` 구분자로 시작
5. **LLM 모델 ID는 반드시 다음 두 가지만 사용! (매우 중요!)**
   | 명세서 LLM 값 | model_id | 용도 |
   |--------------|----------|------|
   | Claude Sonnet 4.5 | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | 주요 에이전트 (권장) |
   | Claude Haiku 4.5 | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | 빠른 응답, 간단한 작업 |

   **❌ 절대 사용 금지 모델 ID:**
   - `us.anthropic.*` - 지역 제한 모델
   - `anthropic.claude-3-*` - 구버전 모델
   - `us.anthropic.claude-sonnet-4-5-20250514-v1:0` - 잘못된 버전
   - 다른 모든 모델 ID - 배포 실패 원인!
6. main.py는 반드시 BedrockAgentCoreApp 패턴 사용 (FastAPI 금지!)
7. requirements.txt에 bedrock-agentcore 포함 필수
8. **조건부 엣지는 add_edge(from, to, condition=func) 사용! add_conditional_edge()는 존재하지 않음!**
9. **main.py는 반드시 Lazy Initialization 패턴 사용! 모듈 레벨에서 Agent/Graph 생성 금지!**
10. **MCP 서버 연결 규칙 (AgentCore 배포 시)**
    - **stdio MCP 서버 (uvx, npx)**: AgentCore Runtime에서 실행 불가
      * external/aws 타입 MCP 서버에 대해 stdio_client 코드 생성 금지
      * 이런 MCP 서버만 있으면 Agent는 `tools=[]`로 정의
    - **✅ Gateway 통합 사용 가능**: gateway 타입 통합이 있고 status='ready'면:
      * streamablehttp_client로 Gateway URL에 연결
      * Gateway의 모든 MCP 도구를 Agent에서 사용 가능
    - **✅ self-hosted MCP (status=ready)**: streamablehttp_client 사용 가능
    - deploy_guide.md에 MCP 연결 방법 및 Gateway 대안 안내 포함
"""
        enhanced_prompt = system_prompt + "\n" + skill_prompt

        self.agent = strands_utils.get_agent(
            system_prompts=enhanced_prompt,
            model_id="global.anthropic.claude-opus-4-5-20251101-v1:0",
            max_tokens=32000,
            temperature=0.0,
            tools=[file_read]
        )

    def generate(self, path_spec: str, integration_details: Optional[List[Dict[str, Any]]] = None) -> Dict[str, str]:
        """
        PATH 명세서로부터 Strands Agent SDK 코드 생성

        Args:
            path_spec: PATH 명세서 (Markdown)
            integration_details: 등록된 Integration 정보 (선택)

        Returns:
            파일명 → 내용 딕셔너리
            {
                "agent.py": "...",
                "tools.py": "...",
                "agentcore_config.py": "...",
                "requirements.txt": "...",
                "Dockerfile": "...",
                "deploy_guide.md": "..."
            }
        """

        # Integration 정보를 프롬프트에 포함 (상세 구현 패턴 포함)
        integration_context = self._format_integration_context(integration_details)

        prompt = f"""다음 PATH 명세서를 기반으로 Strands Agent SDK 코드를 생성하세요:

**최우선 요구사항**:
<registered_integrations> 섹션에 등록된 통합이 있다면 반드시 tools.py에 구현하세요.
제공된 Implementation Pattern 코드를 정확히 따르세요.
등록된 통합의 모든 기능을 활용할 수 있도록 함수를 생성하세요.

<path_spec>
{path_spec}
</path_spec>
{integration_context}

**필수 1단계**: file_read로 "strands-agent-patterns" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: file_read로 "agentcore-services" 스킬의 SKILL.md를 읽으세요.
**필수 3단계**: file_read로 "code-generation" 스킬의 SKILL.md를 읽으세요. (코드 생성 규칙)
**필수 4단계**: 3개 스킬을 종합하여 코드를 생성하세요.

**생성할 파일**:

### main.py
- Agent Components 테이블의 각 Agent를 Agent() 객체로 정의
- GraphBuilder()로 Graph 구조 구현
- 진입점 설정 (set_entry_point)
- Reflection 패턴 시 조건부 엣지 추가
- BedrockAgentCoreApp 패턴 사용 (FastAPI 금지!)
- @app.entrypoint 데코레이터로 요청 핸들러 정의

### tools.py
- MCP 서버 연결 (strands.tools.mcp.MCPClient + with 컨텍스트)
- AWS 서비스 직접 호출 (boto3)
- 등록된 Integration 정보 활용 (위 registered_integrations 참조)
- API 클라이언트 (필요 시 requests 사용)

### agentcore_config.py
- AgentCore 구성 테이블 기반 설정
- Runtime: 1개 (전체 Graph 호스팅) - 중요!
- Memory: Namespace 전략
- Gateway: Target 목록 (Lambda, OpenAPI, MCP)
- Identity: OAuth2 자격 증명 (필요 시)

### requirements.txt
- strands-agents
- strands-agents-tools
- boto3
- bedrock-agentcore (필수!)
- 기타 필요 라이브러리 (requests 등)
- fastapi, uvicorn 제거됨 (BedrockAgentCoreApp 사용)

### agentcore.yaml
- runtime: PYTHON_3_13
- entry_point: main.py
- agent_name: (명세서의 Agent 이름)
- network: mode: PUBLIC

### deploy_guide.md
- AgentCore CLI 배포 명령어
- agentcore deploy --region us-west-2
- agentcore status (runtime_id)
- agentcore invoke (runtime_id) --payload (JSON payload)
- 테스트 호출 예시

**중요 참고사항**:
- Agent Components 테이블의 Tools 컬럼 확인 (boto3 vs Lambda MCP)
- Graph 구조의 Python 코드 블록 활용
- AgentCore 구성 테이블의 설정 정확히 반영
- 1개 Runtime으로 전체 Multi-Agent Graph 호스팅 (Agent별 Runtime 분리 금지)
- main.py는 BedrockAgentCoreApp 패턴 필수 (FastAPI 사용 금지!)

**필수 패턴**:
1. **Lazy Initialization**: 모듈 레벨에서 Agent/Model/Graph 생성 금지!
   - _graph = None, _initialized = False 전역 변수 선언
   - def _initialize() 함수에서 모든 초기화 수행
   - invoke()에서 _initialize() 호출
   - 이유: AgentCore Runtime 30초 초기화 타임아웃 우회

2. **조건부 엣지 API**:
   - 올바름: builder.add_edge("from", "to", condition=func)
   - 잘못됨: builder.add_conditional_edge() - 이 메서드는 존재하지 않음!
"""

        print(f"[CodeGeneratorAgent] 코드 생성 시작...")
        print(f"[CodeGeneratorAgent] PATH 명세서 길이: {len(path_spec)} chars")
        if integration_details:
            print(f"[CodeGeneratorAgent] 통합 정보: {len(integration_details)}개")

        result = self.agent(prompt)
        print(f"[CodeGeneratorAgent] LLM 응답 완료")

        text = result.message['content'][0]['text']
        print(f"[CodeGeneratorAgent] 응답 길이: {len(text)} chars")

        # 파일 분리
        files = self._parse_files(text)
        print(f"[CodeGeneratorAgent] 파일 파싱 완료: {len(files)}개 파일")

        # 필수 파일 검증
        required_files = ['main.py', 'tools.py', 'agentcore_config.py',
                         'requirements.txt', 'agentcore.yaml', 'deploy_guide.md']
        missing_files = [f for f in required_files if f not in files]

        if missing_files:
            print(f"⚠️ Warning: 누락된 파일 - {', '.join(missing_files)}")
            # 기본 템플릿으로 채우기
            for missing in missing_files:
                files[missing] = self._get_default_template(missing)

        # Integration 검증 단계
        if integration_details:
            validation = integration_validator.validate(files, integration_details)
            if not validation.is_valid:
                logger.warning(f"Integration validation warnings: {validation.warnings}")
                print(f"⚠️ Integration validation: {len(validation.missing_tools)} missing tools")
                for warning in validation.warnings[:5]:  # 최대 5개 경고만 출력
                    print(f"   - {warning}")

                # 누락된 통합에 대한 템플릿 추가 (tools.py에 주석으로)
                if validation.missing_tools:
                    missing_template = integration_validator.generate_missing_tools_template(
                        integration_details, validation.missing_tools
                    )
                    if missing_template and 'tools.py' in files:
                        files['tools.py'] += f"\n\n# === TODO: 아래 통합 구현 필요 ===\n{missing_template}"
            else:
                print(f"✅ Integration validation: All {len(validation.implemented_tools)} tools implemented")

        return files

    async def generate_stream(self, path_spec: str, integration_details: Optional[List[Dict[str, Any]]] = None) -> AsyncIterator[str]:
        """
        PATH 명세서로부터 Strands Agent SDK 코드 생성 (스트리밍)

        진행 상황을 SSE로 전송하여 연결 유지

        Yields:
            JSON 문자열: {"status": "progress|complete|error", "message": "...", "files": {...}}
        """
        try:
            yield json.dumps({"status": "progress", "progress": 5, "message": "코드 생성 준비 중..."}) + "\n"

            # Integration 정보 처리 (상세 구현 패턴 포함)
            if integration_details:
                yield json.dumps({"status": "progress", "progress": 15, "message": f"{len(integration_details)}개 통합 정보 처리 중..."}) + "\n"

            integration_context = self._format_integration_context(integration_details)

            # 프롬프트 구성
            yield json.dumps({"status": "progress", "progress": 25, "message": "프롬프트 구성 중..."}) + "\n"

            prompt = f"""다음 PATH 명세서를 기반으로 Strands Agent SDK 코드를 생성하세요:

**최우선 요구사항**:
<registered_integrations> 섹션에 등록된 통합이 있다면 반드시 tools.py에 구현하세요.
제공된 Implementation Pattern 코드를 정확히 따르세요.
등록된 통합의 모든 기능을 활용할 수 있도록 함수를 생성하세요.

<path_spec>
{path_spec}
</path_spec>
{integration_context}

**필수 1단계**: file_read로 "strands-agent-patterns" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: file_read로 "agentcore-services" 스킬의 SKILL.md를 읽으세요.
**필수 3단계**: file_read로 "code-generation" 스킬의 SKILL.md를 읽으세요. (코드 생성 규칙)
**필수 4단계**: 3개 스킬을 종합하여 코드를 생성하세요.

**생성할 파일**:

### main.py
- Agent Components 테이블의 각 Agent를 Agent() 객체로 정의
- GraphBuilder()로 Graph 구조 구현
- 진입점 설정 (set_entry_point)
- Reflection 패턴 시 조건부 엣지 추가
- BedrockAgentCoreApp 패턴 사용 (FastAPI 금지!)
- @app.entrypoint 데코레이터로 요청 핸들러 정의

### tools.py
- MCP 서버 연결 (strands.tools.mcp.MCPClient + with 컨텍스트)
- AWS 서비스 직접 호출 (boto3)
- 등록된 Integration 정보 활용 (위 registered_integrations 참조)
- API 클라이언트 (필요 시 requests 사용)

### agentcore_config.py
- AgentCore 구성 테이블 기반 설정
- Runtime: 1개 (전체 Graph 호스팅) - 중요!
- Memory: Namespace 전략
- Gateway: Target 목록 (Lambda, OpenAPI, MCP)
- Identity: OAuth2 자격 증명 (필요 시)

### requirements.txt
- strands-agents
- strands-agents-tools
- boto3
- bedrock-agentcore (필수!)
- 기타 필요 라이브러리 (requests 등)
- fastapi, uvicorn 제거됨 (BedrockAgentCoreApp 사용)

### agentcore.yaml
- runtime: PYTHON_3_13
- entry_point: main.py
- agent_name: (명세서의 Agent 이름)
- network: mode: PUBLIC

### deploy_guide.md
- AgentCore CLI 배포 명령어
- agentcore deploy --region us-west-2
- agentcore status (runtime_id)
- agentcore invoke (runtime_id) --payload (JSON payload)
- 테스트 호출 예시

**중요 참고사항**:
- Agent Components 테이블의 Tools 컬럼 확인 (boto3 vs Lambda MCP)
- Graph 구조의 Python 코드 블록 활용
- AgentCore 구성 테이블의 설정 정확히 반영
- 1개 Runtime으로 전체 Multi-Agent Graph 호스팅 (Agent별 Runtime 분리 금지)
- main.py는 BedrockAgentCoreApp 패턴 필수 (FastAPI 사용 금지!)

**필수 패턴**:
1. **Lazy Initialization**: 모듈 레벨에서 Agent/Model/Graph 생성 금지!
   - _graph = None, _initialized = False 전역 변수 선언
   - def _initialize() 함수에서 모든 초기화 수행
   - invoke()에서 _initialize() 호출
   - 이유: AgentCore Runtime 30초 초기화 타임아웃 우회

2. **조건부 엣지 API**:
   - 올바름: builder.add_edge("from", "to", condition=func)
   - 잘못됨: builder.add_conditional_edge() - 이 메서드는 존재하지 않음!
"""

            yield json.dumps({"status": "progress", "progress": 30, "message": "Claude Opus 4.5로 코드 생성 중... (2-3분 소요)"}) + "\n"

            # LLM 호출 (동기 - Strands Agent는 동기 API만 제공)
            # run_in_executor로 블로킹 방지
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self.agent, prompt)

            yield json.dumps({"status": "progress", "progress": 75, "message": "LLM 응답 완료, 파일 파싱 중..."}) + "\n"

            text = result.message['content'][0]['text']
            files = self._parse_files(text)

            yield json.dumps({"status": "progress", "progress": 85, "message": f"{len(files)}개 파일 파싱 완료"}) + "\n"

            # 필수 파일 검증
            required_files = ['agent.py', 'tools.py', 'agentcore_config.py',
                            'requirements.txt', 'Dockerfile', 'deploy_guide.md']
            missing_files = [f for f in required_files if f not in files]

            if missing_files:
                yield json.dumps({"status": "progress", "progress": 90, "message": f"누락된 파일 {len(missing_files)}개를 기본 템플릿으로 채우는 중..."}) + "\n"
                for missing in missing_files:
                    files[missing] = self._get_default_template(missing)

            # Integration 검증 단계
            validation_warnings = []
            if integration_details:
                yield json.dumps({"status": "progress", "progress": 92, "message": "통합 구현 검증 중..."}) + "\n"
                validation = integration_validator.validate(files, integration_details)
                if not validation.is_valid:
                    validation_warnings = validation.warnings[:5]
                    yield json.dumps({
                        "status": "progress",
                        "progress": 95,
                        "message": f"경고: {len(validation.missing_tools)}개 통합 구현 누락"
                    }) + "\n"

                    # 누락된 통합에 대한 템플릿 추가
                    if validation.missing_tools:
                        missing_template = integration_validator.generate_missing_tools_template(
                            integration_details, validation.missing_tools
                        )
                        if missing_template and 'tools.py' in files:
                            files['tools.py'] += f"\n\n# === TODO: 아래 통합 구현 필요 ===\n{missing_template}"

            # 완료
            yield json.dumps({
                "status": "complete",
                "message": "코드 생성 완료!",
                "files": files,
                "file_count": len(files),
                "validation_warnings": validation_warnings
            }) + "\n"

        except Exception as e:
            yield json.dumps({
                "status": "error",
                "message": f"코드 생성 실패: {str(e)}"
            }) + "\n"

    def _parse_files(self, text: str) -> Dict[str, str]:
        """
        생성된 텍스트를 파일별로 분리

        구분자: ### 파일명
        """
        files = {}

        # ### 파일명 패턴으로 분리
        pattern = r'###\s+(\S+)\s*\n(.*?)(?=###\s+\S+|$)'
        matches = re.findall(pattern, text, re.DOTALL)

        for filename, content in matches:
            # 앞뒤 공백 제거
            cleaned_content = content.strip()

            # 코드 블록 제거 (```python, ``` 등)
            cleaned_content = re.sub(r'^```\w*\n', '', cleaned_content)
            cleaned_content = re.sub(r'\n```$', '', cleaned_content)

            files[filename] = cleaned_content

        return files

    def _get_default_template(self, filename: str) -> str:
        """기본 템플릿 반환 (파일 누락 시 fallback)"""

        templates = {
            'main.py': '''# BedrockAgentCoreApp 패턴 - Lazy Initialization
import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from bedrock_agentcore.runtime import BedrockAgentCoreApp

# 전역 변수로 선언만 (초기화는 첫 호출 시)
_graph = None
_initialized = False

def _initialize():
    """Lazy initialization - 첫 호출 시에만 실행 (30초 타임아웃 우회)"""
    global _graph, _initialized
    if _initialized:
        return _graph

    # 무거운 import는 여기서
    from strands import Agent
    from strands.models.bedrock import BedrockModel
    from strands.multiagent import GraphBuilder

    # LLM 모델 정의 (허용된 모델 ID만 사용!)
    # - Claude Sonnet 4.5: global.anthropic.claude-sonnet-4-5-20250929-v1:0
    # - Claude Haiku 4.5: global.anthropic.claude-haiku-4-5-20251001-v1:0
    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )

    # TODO: Agent Components 테이블 기반으로 Agent 정의 추가
    agent1 = Agent(name="agent1", model=model, system_prompt="...")

    # Graph 구축
    builder = GraphBuilder()
    builder.add_node(agent1, "node1")
    builder.set_entry_point("node1")

    _graph = builder.build()
    _initialized = True
    return _graph

# BedrockAgentCoreApp - 가볍게 유지
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload, context):
    """AgentCore 엔트리포인트 - 첫 호출 시 초기화"""
    graph = _initialize()

    prompt = payload.get("prompt", "")
    result = graph(prompt)
    return {
        "result": str(result.message) if hasattr(result, 'message') else str(result),
        "session_id": context.get("session_id", "default")
    }

if __name__ == "__main__":
    app.run()
''',
            'tools.py': '''# Tools 정의
import boto3

# TODO: Integration 정보 기반으로 도구 추가
''',
            'agentcore_config.py': '''# AgentCore 구성
AGENTCORE_CONFIG = {
    "runtime": {
        "python_version": "PYTHON_3_13",
        "entry_point": "main.py",
        "agent_count": 1,
        "hosting_mode": "single_runtime"
    },
    "network": {
        "mode": "PUBLIC"
    },
    "memory": {
        "enabled": False
    },
    "gateway": {
        "enabled": False
    },
    "identity": {
        "enabled": False
    }
}
''',
            'requirements.txt': '''strands-agents
strands-agents-tools
boto3
bedrock-agentcore
''',
            'agentcore.yaml': '''runtime: PYTHON_3_13
entry_point: main.py
agent_name: my-agent
network:
  mode: PUBLIC
''',
            'deploy_guide.md': '''# AgentCore CLI 배포 가이드

## 1. AgentCore CLI 설치 확인
```bash
pip install bedrock-agentcore-starter-toolkit
agentcore --help
```

## 2. AgentCore 배포
```bash
# 프로젝트 디렉토리에서 실행
agentcore configure -n my_agent -e main.py -dt direct_code_deploy -rt PYTHON_3_13 -dm -ni
agentcore deploy
```

## 3. 배포 상태 확인
```bash
agentcore status -a my_agent
```

## 4. Agent 호출 테스트
```bash
agentcore invoke '{"prompt": "테스트 메시지"}' -a my_agent
```

## 5. 배포 삭제
```bash
agentcore destroy -a my_agent --force
```
'''
        }

        return templates.get(filename, f"# {filename}\n# TODO: 구현 필요\n")


# Singleton instance (모듈 레벨)
code_generator_agent = CodeGeneratorAgent()
