"""
Integration Validator - 생성된 코드가 모든 등록된 통합을 구현했는지 검증

Code generation 후 tools.py에 등록된 통합들이 모두 구현되었는지 확인하고,
누락된 항목에 대한 경고를 제공합니다.
"""
import re
import logging
from typing import Dict, List, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """검증 결과"""
    is_valid: bool
    implemented_tools: List[str] = field(default_factory=list)
    missing_tools: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)


class IntegrationValidator:
    """생성된 코드의 통합 구현 검증"""

    def validate(
        self,
        files: Dict[str, str],
        integration_details: List[Dict[str, Any]]
    ) -> ValidationResult:
        """
        생성된 코드가 모든 등록된 통합을 구현했는지 검증

        Args:
            files: 생성된 코드 파일들 {'tools.py': '...', 'main.py': '...'}
            integration_details: 등록된 통합 목록

        Returns:
            ValidationResult with missing tools info
        """
        if not integration_details:
            return ValidationResult(is_valid=True)

        tools_content = files.get('tools.py', '')
        main_content = files.get('main.py', '')
        combined_content = tools_content + main_content

        expected = self._extract_expected_tools(integration_details)
        actual = self._scan_implemented_tools(tools_content)

        # 추가적으로 main.py에서 import 여부 확인
        imported_tools = self._scan_imports(main_content)

        missing = []
        warnings = []
        suggestions = []

        for expected_tool in expected:
            if not self._is_implemented(expected_tool['pattern'], actual, combined_content):
                missing.append(expected_tool['name'])
                warnings.append(f"Missing implementation for: {expected_tool['name']}")
                if expected_tool.get('suggestion'):
                    suggestions.append(expected_tool['suggestion'])

        return ValidationResult(
            is_valid=len(missing) == 0,
            implemented_tools=actual,
            missing_tools=missing,
            warnings=warnings,
            suggestions=suggestions
        )

    def _extract_expected_tools(self, integrations: List[Dict]) -> List[Dict[str, str]]:
        """통합별 예상 도구/함수명 추출"""
        expected = []
        for integration in integrations:
            int_type = integration.get('type', '')
            name = integration.get('name', '')
            safe_name = self._to_snake_case(name)
            config = integration.get('config', {})

            if int_type == 'mcp':
                expected.append({
                    'name': f"MCP client for {name}",
                    'pattern': f"get_{safe_name}_mcp|mcp.*{safe_name}|MCPClient",
                    'suggestion': f"Add get_{safe_name}_mcp_client() function using MCPClient"
                })

            elif int_type == 'api':
                expected.append({
                    'name': f"API calls for {name}",
                    'pattern': f"call_{safe_name}|{safe_name}_api|requests\\.get|requests\\.post",
                    'suggestion': f"Add @tool decorated functions for each API endpoint"
                })

                # 각 endpoint별 확인
                endpoints = config.get('endpoints', [])
                if endpoints:
                    endpoint_names = [e.get('operationId', '') for e in endpoints[:3] if e.get('operationId')]
                    if endpoint_names:
                        expected.append({
                            'name': f"API endpoints for {name}",
                            'pattern': '|'.join([self._to_snake_case(n) for n in endpoint_names]),
                            'suggestion': f"Implement functions for: {', '.join(endpoint_names[:3])}"
                        })

            elif int_type == 'rag':
                provider = config.get('provider', '')
                expected.append({
                    'name': f"RAG search for {name}",
                    'pattern': f"search_{safe_name}|retrieve|knowledge_base|{provider}",
                    'suggestion': f"Add search_{safe_name}(query) function for knowledge base retrieval"
                })

            elif int_type == 's3':
                expected.append({
                    'name': f"S3 operations for {name}",
                    'pattern': f"read_{safe_name}|write_{safe_name}|list_{safe_name}|s3_client|get_object|put_object",
                    'suggestion': f"Add read_{safe_name}_file() and write_{safe_name}_file() functions"
                })

            elif int_type == 'mcp-server':
                source = config.get('source', {})
                source_type = source.get('type', 'external')
                deployment = config.get('deployment', {})

                # self-hosted MCP Server (배포 완료 상태)만 검증
                if source_type == 'self-hosted' and deployment.get('status') == 'ready':
                    expected.append({
                        'name': f"MCP Server client for {name}",
                        'pattern': f"get_{safe_name}_mcp|mcp.*{safe_name}|MCPClient|streamablehttp_client",
                        'suggestion': f"Add get_{safe_name}_mcp_client() function using streamablehttp_client"
                    })
                # external/aws 타입은 AgentCore에서 직접 사용 불가하므로 검증 제외
                # Gateway를 통해 사용하도록 안내
                elif source_type in ['external', 'aws']:
                    # 경고만 추가, 필수 검증에서 제외
                    pass

            elif int_type == 'gateway':
                gateway_status = config.get('gatewayStatus', 'creating')
                gateway_url = config.get('gatewayUrl', '')

                # Gateway가 ready 상태일 때만 MCP 클라이언트 구현 검증
                if gateway_status == 'ready' and gateway_url:
                    expected.append({
                        'name': f"Gateway MCP client for {name}",
                        'pattern': f"get_{safe_name}_mcp|mcp.*{safe_name}|MCPClient|streamablehttp_client|GATEWAY_URL",
                        'suggestion': f"Add get_{safe_name}_mcp_client() function using streamablehttp_client to connect to Gateway"
                    })

        return expected

    def _scan_implemented_tools(self, tools_content: str) -> List[str]:
        """tools.py에서 정의된 함수명 추출"""
        # def 함수명 패턴
        def_pattern = r'^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\('
        functions = re.findall(def_pattern, tools_content, re.MULTILINE)

        # @tool 데코레이터가 붙은 함수도 확인
        tool_pattern = r'@tool\s*\n\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)'
        tool_functions = re.findall(tool_pattern, tools_content)

        # 클래스 메서드 확인
        class_pattern = r'class\s+([a-zA-Z_][a-zA-Z0-9_]*)'
        classes = re.findall(class_pattern, tools_content)

        return list(set(functions + tool_functions + classes))

    def _scan_imports(self, content: str) -> List[str]:
        """import 문에서 가져온 모듈/함수 추출"""
        # from tools import X, Y, Z
        from_import_pattern = r'from\s+tools\s+import\s+(.+)'
        matches = re.findall(from_import_pattern, content)

        imported = []
        for match in matches:
            # 쉼표로 분리된 import 처리
            items = [item.strip() for item in match.split(',')]
            imported.extend(items)

        return imported

    def _is_implemented(self, pattern: str, actual: List[str], content: str) -> bool:
        """예상 패턴이 구현되었는지 확인 (정규식 매칭)"""
        # 함수명 리스트에서 매칭 확인
        for func in actual:
            if re.search(pattern, func, re.IGNORECASE):
                return True

        # 전체 코드에서 패턴 매칭 확인
        if re.search(pattern, content, re.IGNORECASE):
            return True

        return False

    def _to_snake_case(self, name: str) -> str:
        """이름을 snake_case로 변환"""
        # 특수문자를 언더스코어로 변환
        safe = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
        # 연속된 언더스코어 제거
        safe = re.sub(r'_+', '_', safe)
        return safe.strip('_')

    def generate_missing_tools_template(
        self,
        integration_details: List[Dict[str, Any]],
        missing_tools: List[str]
    ) -> str:
        """누락된 도구에 대한 기본 템플릿 생성"""
        templates = []

        for integration in integration_details:
            int_type = integration.get('type', '')
            name = integration.get('name', '')
            safe_name = self._to_snake_case(name)
            config = integration.get('config', {})

            # 해당 통합이 missing_tools에 포함되어 있는지 확인
            is_missing = any(name in mt for mt in missing_tools)
            if not is_missing:
                continue

            if int_type == 'mcp':
                transport = config.get('transport', 'stdio')
                if transport == 'stdio':
                    command = config.get('command', '')
                    args = config.get('args', [])
                    templates.append(f'''
# MCP Client for {name}
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters

def get_{safe_name}_mcp_client():
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="{command}",
            args={args}
        )
    ))
''')
                else:
                    server_url = config.get('serverUrl', '')
                    templates.append(f'''
# MCP Client for {name}
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

def get_{safe_name}_mcp_client():
    return MCPClient(lambda: streamablehttp_client(url="{server_url}"))
''')

            elif int_type == 'api':
                base_url = config.get('baseUrl', '')
                auth_type = config.get('authType', 'none')
                templates.append(f'''
# API Client for {name}
import requests
import os
from strands import tool

BASE_URL_{safe_name.upper()} = "{base_url}"
''')
                if auth_type == 'api-key':
                    templates.append(f'''
{safe_name.upper()}_API_KEY = os.getenv('{safe_name.upper()}_API_KEY')

def get_{safe_name}_headers():
    return {{"X-API-Key": {safe_name.upper()}_API_KEY, "Content-Type": "application/json"}}
''')

            elif int_type == 'rag':
                provider = config.get('provider', '')
                if provider == 'bedrock-kb':
                    kb_config = config.get('bedrockKb', {})
                    kb_id = kb_config.get('knowledgeBaseId', '')
                    region = kb_config.get('region', 'us-west-2')
                    templates.append(f'''
# RAG Search for {name}
import boto3
from strands import tool

kb_client = boto3.client('bedrock-agent-runtime', region_name='{region}')

@tool
def search_{safe_name}(query: str, max_results: int = 5):
    """Search {name} knowledge base."""
    response = kb_client.retrieve(
        knowledgeBaseId="{kb_id}",
        retrievalQuery={{'text': query}},
        retrievalConfiguration={{'vectorSearchConfiguration': {{'numberOfResults': max_results}}}}
    )
    return [r.get('content', {{}}).get('text', '') for r in response.get('retrievalResults', [])]
''')

            elif int_type == 's3':
                bucket = config.get('bucketName', '')
                region = config.get('region', 'us-west-2')
                templates.append(f'''
# S3 Operations for {name}
import boto3
from strands import tool

s3_client_{safe_name} = boto3.client('s3', region_name='{region}')
S3_BUCKET_{safe_name.upper()} = "{bucket}"

@tool
def read_{safe_name}_file(key: str) -> str:
    """Read a file from {name} S3 bucket."""
    response = s3_client_{safe_name}.get_object(Bucket=S3_BUCKET_{safe_name.upper()}, Key=key)
    return response['Body'].read().decode('utf-8')

@tool
def list_{safe_name}_files(prefix: str = "") -> list:
    """List files in {name} S3 bucket."""
    response = s3_client_{safe_name}.list_objects_v2(Bucket=S3_BUCKET_{safe_name.upper()}, Prefix=prefix)
    return [obj['Key'] for obj in response.get('Contents', [])]
''')

            elif int_type == 'mcp-server':
                source = config.get('source', {})
                source_type = source.get('type', 'external')
                deployment = config.get('deployment', {})

                # external/aws 타입은 AgentCore에서 직접 사용 불가 - Gateway 사용 안내
                if source_type in ['external', 'aws']:
                    templates.append(f'''
# ⚠️ {name} ({source_type}) - stdio MCP Server는 AgentCore에서 직접 사용 불가
# 대안: AgentCore Gateway를 통해 MCP 도구를 사용하세요
# 1. Settings에서 Gateway 통합을 생성
# 2. Gateway Target으로 Lambda 또는 OpenAPI 추가
# 3. streamablehttp_client로 Gateway URL에 연결
''')
                elif source_type == 'self-hosted' and deployment.get('status') == 'ready':
                    endpoint_url = deployment.get('endpointUrl', '')
                    templates.append(f'''
# MCP Server Client for {name} (self-hosted - deployed)
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

def get_{safe_name}_mcp_client():
    return MCPClient(lambda: streamablehttp_client(url="{endpoint_url}"))
''')

            elif int_type == 'gateway':
                gateway_status = config.get('gatewayStatus', 'creating')
                gateway_url = config.get('gatewayUrl', '')

                if gateway_status == 'ready' and gateway_url:
                    templates.append(f'''
# AgentCore Gateway Client for {name}
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
import os

GATEWAY_URL = os.getenv('GATEWAY_URL', '{gateway_url}')
ACCESS_TOKEN = os.getenv('ACCESS_TOKEN', '')

def get_{safe_name}_mcp_client():
    """AgentCore Gateway MCP 클라이언트"""
    headers = {{}}
    if ACCESS_TOKEN:
        headers['Authorization'] = f'Bearer {{ACCESS_TOKEN}}'
    return MCPClient(lambda: streamablehttp_client(
        url=GATEWAY_URL,
        headers=headers
    ))
''')
                else:
                    templates.append(f'''
# ⚠️ Gateway {name} - 아직 배포되지 않음 (status: {gateway_status})
# Gateway가 'ready' 상태가 되면 자동으로 코드 생성됩니다.
''')

        return '\n'.join(templates)


# 싱글톤 인스턴스
integration_validator = IntegrationValidator()
