"""
CodeGeneratorAgent - PATH 명세서를 Strands Agent SDK 코드로 직접 변환

PATH 명세서 → Strands Agent 코드 (2-3분)
- SDD 우회 (30분 → 3분, 10배 개선)
- 6개 파일 생성: agent.py, tools.py, agentcore_config.py, requirements.txt, Dockerfile, deploy_guide.md
"""

from strands import Agent
from strands.models import BedrockModel
from typing import Dict, Any, Optional, List
import json
import re
from strands_tools import file_read
from agentskills import discover_skills, generate_skills_prompt
from strands_utils import strands_utils


class CodeGeneratorAgent:
    """PATH 명세서 → Strands Agent SDK 코드 생성 전문 Agent"""

    def __init__(self):
        skills = discover_skills("./skills")
        skill_prompt = generate_skills_prompt(skills)

        system_prompt = """당신은 Strands Agent SDK 코드 생성 전문가입니다.
PATH 명세서를 분석하여 실행 가능한 Python 코드를 생성합니다.

**출력 형식**:
6개 파일을 생성하며, 각 파일은 반드시 `### 파일명` 구분자로 시작합니다.

### agent.py
(Agent 정의 + GraphBuilder 코드)

### tools.py
(MCP/API 통합 코드)

### agentcore_config.py
(Runtime/Gateway/Memory 설정)

### requirements.txt
(의존성 목록)

### Dockerfile
(AgentCore Runtime용 Dockerfile)

### deploy_guide.md
(배포 가이드)

**중요 규칙**:
1. 내부 사고 과정이나 메타 코멘트를 출력에 포함하지 마세요
2. "스킬을 읽었으므로", "이제 생성하겠습니다" 같은 문구 금지
3. 바로 코드만 출력하세요
4. 각 파일은 반드시 `### 파일명` 구분자로 시작
5. LLM은 Claude Sonnet 4.5 또는 Haiku 4.5만 사용
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

        # Integration 정보를 프롬프트에 포함
        integration_context = ""
        if integration_details:
            integration_context = "\n\n<registered_integrations>\n"
            integration_context += "사용자가 등록한 통합 정보 (tools.py 생성 시 반영):\n\n"

            for detail in integration_details:
                int_type = detail.get('type', 'api')
                name = detail.get('name', '')
                config = detail.get('config', {})

                integration_context += f"### [{int_type.upper()}] {name}\n"

                if int_type == 'api':
                    base_url = config.get('baseUrl', '')
                    auth_type = config.get('authType', 'none')
                    endpoints = config.get('endpoints', [])

                    integration_context += f"- Base URL: {base_url}\n"
                    integration_context += f"- Auth: {auth_type}\n"
                    integration_context += f"- Endpoints: {len(endpoints)}개\n"
                    for ep in endpoints[:3]:
                        integration_context += f"  - {ep.get('method', 'GET')} {ep.get('path', '')}\n"
                    integration_context += "- **tools.py**: requests 또는 boto3 사용\n\n"

                elif int_type == 'mcp':
                    server_url = config.get('serverUrl', '')
                    tools = config.get('tools', [])

                    integration_context += f"- Server URL: {server_url}\n"
                    integration_context += f"- Tools: {len(tools)}개\n"
                    for tool in tools[:3]:
                        integration_context += f"  - {tool.get('name', '')}\n"
                    integration_context += "- **tools.py**: strands_tools.mcp_server 사용\n\n"

                elif int_type == 'rag':
                    provider = config.get('provider', '')
                    integration_context += f"- Provider: {provider}\n"
                    if provider == 'bedrock-kb':
                        kb_config = config.get('bedrockKb', {})
                        integration_context += f"- Knowledge Base ID: {kb_config.get('knowledgeBaseId', '')}\n"
                    integration_context += "- **tools.py**: boto3 Bedrock KB 직접 호출\n\n"

                elif int_type == 's3':
                    bucket = config.get('bucketName', '')
                    integration_context += f"- Bucket: s3://{bucket}\n"
                    integration_context += "- **tools.py**: boto3 S3 직접 호출\n\n"

            integration_context += "</registered_integrations>\n"

        prompt = f"""다음 PATH 명세서를 기반으로 Strands Agent SDK 코드를 생성하세요:

<path_spec>
{path_spec}
</path_spec>
{integration_context}

**필수 1단계**: file_read로 "strands-agent-patterns" 스킬의 SKILL.md를 읽으세요.
**필수 2단계**: file_read로 "agentcore-services" 스킬의 SKILL.md를 읽으세요.
**필수 3단계**: file_read로 "aws-mcp-servers" 스킬의 SKILL.md를 읽으세요.
**필수 4단계**: 3개 스킬을 종합하여 코드를 생성하세요.

**생성할 파일**:

### agent.py
- Agent Components 테이블의 각 Agent를 Agent() 객체로 정의
- GraphBuilder()로 Graph 구조 구현
- 진입점 설정 (set_entry_point)
- Reflection 패턴 시 조건부 엣지 추가
- FastAPI 엔드포인트 (/invocations, /ping) 포함

### tools.py
- MCP 서버 연결 (strands_tools.mcp_server)
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
- fastapi
- uvicorn
- 기타 필요 라이브러리 (requests 등)

### Dockerfile
- FROM python:3.11
- AgentCore Runtime용 (포트 8080)
- /invocations, /ping 엔드포인트 지원

### deploy_guide.md
- ECR 푸시 명령어
- AgentCore Runtime 생성
- Gateway/Memory/Identity 설정
- 테스트 호출 예시

**중요 참고사항**:
- Agent Components 테이블의 Tools 컬럼 확인 (boto3 vs Lambda MCP)
- Graph 구조의 Python 코드 블록 활용
- AgentCore 구성 테이블의 설정 정확히 반영
- 1개 Runtime으로 전체 Multi-Agent Graph 호스팅 (Agent별 Runtime 분리 금지)
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
        required_files = ['agent.py', 'tools.py', 'agentcore_config.py',
                         'requirements.txt', 'Dockerfile', 'deploy_guide.md']
        missing_files = [f for f in required_files if f not in files]

        if missing_files:
            print(f"⚠️ Warning: 누락된 파일 - {', '.join(missing_files)}")
            # 기본 템플릿으로 채우기
            for missing in missing_files:
                files[missing] = self._get_default_template(missing)

        return files

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
            'agent.py': '''# Agent 정의
from strands import Agent
from strands.multiagent import GraphBuilder

# TODO: Agent Components 테이블 기반으로 Agent 정의 추가
agent1 = Agent(name="agent1", system_prompt="...")

# Graph 구축
builder = GraphBuilder()
builder.add_node(agent1, "node1")
builder.set_entry_point("node1")

graph = builder.build()

# FastAPI 엔드포인트
from fastapi import FastAPI
app = FastAPI()

@app.post("/invocations")
async def invoke(request: dict):
    result = graph(request.get("message", ""))
    return {"result": str(result)}

@app.get("/ping")
async def ping():
    return {"status": "healthy"}
''',
            'tools.py': '''# Tools 정의
import boto3

# TODO: Integration 정보 기반으로 도구 추가
''',
            'agentcore_config.py': '''# AgentCore 구성
AGENTCORE_CONFIG = {
    "runtime": {
        "protocol": "http",
        "port": 8080,
        "agent_count": 1,
        "hosting_mode": "single_runtime"
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
fastapi
uvicorn
''',
            'Dockerfile': '''FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "agent:app", "--host", "0.0.0.0", "--port", "8080"]
''',
            'deploy_guide.md': '''# AgentCore 배포 가이드

## 1. Docker 이미지 빌드
```bash
docker build -t my-agent .
docker tag my-agent:latest <ECR_URI>
docker push <ECR_URI>
```

## 2. AgentCore Runtime 생성
```bash
aws bedrock-agent-runtime create-agent-runtime \\
  --agent-name my-agent \\
  --image-uri <ECR_URI> \\
  --protocol http
```

## 3. 테스트
```bash
curl https://runtime.bedrock.aws.com/agent-xyz \\
  -d '{"message": "테스트 메시지"}'
```
'''
        }

        return templates.get(filename, f"# {filename}\n# TODO: 구현 필요\n")


# Singleton instance (모듈 레벨)
code_generator_agent = CodeGeneratorAgent()
