# tools.py 템플릿 예시

PATH 명세서의 Tools 정보 → tools.py 변환 예시입니다.

## 변환 규칙

### Tools 컬럼 값에 따른 구현 방법

| Tools 값 | 구현 방법 | AgentCore 지원 |
|---------|----------|--------------|
| **boto3 S3** | boto3 직접 호출 | ✅ |
| **boto3 Bedrock KB** | boto3 직접 호출 | ✅ |
| **boto3 DynamoDB** | boto3 직접 호출 | ✅ |
| **Gateway Target** | `MCPClient(lambda: streamablehttp_client(...))` | ✅ |
| **Standalone MCP (배포됨)** | `MCPClient(lambda: streamablehttp_client(...))` | ✅ |
| **stdio MCP (npx/uvx)** | `MCPClient(lambda: stdio_client(...))` | ❌ 로컬 전용 |
| **없음** | tools=[] | ✅ |

### AgentCore Runtime MCP 제한사항

> ⚠️ **AgentCore Runtime에서 stdio MCP 서버 실행 불가**
>
> AgentCore Runtime의 샌드박스 환경은 외부 프로세스(npx, uvx 등)를 실행할 수 없습니다.
> stdio 기반 MCP 서버(mcp.so 레지스트리, AWS MCP 등)는 로컬 개발 환경에서만 사용하세요.
>
> **AgentCore 배포 시 대안:**
> - **Gateway Mode**: Gateway Target (API/Lambda/MCP)으로 외부 서비스 연결
> - **Standalone MCP Mode**: self-hosted MCP 서버를 별도 Runtime에 배포 후 streamablehttp로 연결

---

## 예시 1: boto3 직접 호출 (Bedrock Knowledge Base)

### 입력: PATH 명세서
```markdown
| retrieval_agent | RAG 검색 | 카테고리 | 문서 | Claude Sonnet 4.5 | boto3 Bedrock KB |
```

### 출력: tools.py
```python
"""
Tools Implementation - Bedrock Knowledge Base

boto3 직접 호출로 구현합니다.
"""

import boto3
from typing import List, Dict

# Bedrock Agent Runtime 클라이언트
bedrock_kb_client = boto3.client('bedrock-agent-runtime', region_name='ap-northeast-2')

# Knowledge Base ID (환경 변수로 관리 권장)
KNOWLEDGE_BASE_ID = "YOUR_KB_ID"  # TODO: 실제 KB ID로 변경

def bedrock_kb_search(query: str, max_results: int = 5) -> List[Dict]:
    """
    Bedrock Knowledge Base에서 문서 검색

    Args:
        query: 검색 쿼리
        max_results: 최대 결과 개수

    Returns:
        검색된 문서 리스트
    """
    try:
        response = bedrock_kb_client.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={'text': query},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': max_results
                }
            }
        )

        results = []
        for item in response.get('retrievalResults', []):
            results.append({
                'content': item.get('content', {}).get('text', ''),
                'score': item.get('score', 0.0),
                'location': item.get('location', {}).get('s3Location', {}).get('uri', '')
            })

        return results

    except Exception as e:
        print(f"Error searching Bedrock KB: {e}")
        return []
```

**agent.py에서 사용**:
```python
from tools import bedrock_kb_search

retrieval_agent = Agent(
    name="retrieval_agent",
    system_prompt="문서 검색...",
    tools=[bedrock_kb_search]
)
```

---

## 예시 2: stdio MCP Server (로컬 개발 전용 - AgentCore 미지원)

> ⚠️ **주의**: 이 패턴은 로컬 개발 환경에서만 작동합니다.
> AgentCore Runtime에서는 stdio transport를 사용할 수 없습니다.
> AgentCore 배포 시 Gateway Mode 또는 Standalone MCP Mode를 사용하세요.

### 입력: PATH 명세서
```markdown
| notifier_agent | Slack 알림 발송 | 메시지 | 발송 결과 | Claude Haiku 4.5 | Self-hosted MCP (Slack) |
```

### 출력: tools.py
```python
"""
Tools Implementation - Slack MCP Server

⚠️ 로컬 개발 전용 - AgentCore Runtime에서 실행 불가!
Self-hosted MCP Server 연결로 구현합니다.
strands.tools.mcp.MCPClient 사용
"""

from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters

def get_slack_mcp_client():
    """Slack MCP Client 생성"""
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="npx",
            args=["-y", "@anthropic/slack-mcp-server"],
            env={
                "SLACK_BOT_TOKEN": "xoxb-your-token",  # TODO: 환경변수로 변경
                "SLACK_TEAM_ID": "T0123456789"  # TODO: 환경변수로 변경
            }
        )
    ))

# MCP Client는 main.py에서 with 컨텍스트로 관리해야 함
```

**main.py에서 사용**:
```python
from tools import get_slack_mcp_client

def _initialize():
    global _graph, _initialized
    if _initialized:
        return _graph

    from strands import Agent
    from strands.multiagent import GraphBuilder

    # MCP Client 생성 및 연결
    slack_mcp = get_slack_mcp_client()

    with slack_mcp:  # 반드시 with 컨텍스트 사용
        tools = slack_mcp.list_tools_sync()

        notifier_agent = Agent(
            name="notifier_agent",
            system_prompt="Slack 알림 발송...",
            tools=tools  # MCP Server의 모든 도구 사용 가능
        )

        # ... graph 구성
        _graph = builder.build()

    _initialized = True
    return _graph
```

---

## 예시 3: Gateway Target을 통한 Lambda 호출 (AgentCore 지원 ✅)

### 입력: PATH 명세서
```markdown
| transcription_agent | 음성 → 텍스트 변환 | S3 경로 | 텍스트 | Claude Sonnet 4.5 | Gateway Target (transcribe-lambda) |
```

### 출력: tools.py
```python
"""
Tools Implementation - AWS Transcribe (Gateway Target)

✅ AgentCore Runtime 배포 지원!
Gateway를 통해 Lambda 함수에 접근합니다.
strands.tools.mcp.MCPClient + streamable HTTP transport 사용
"""

from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

def get_transcribe_mcp_client():
    """Transcribe Lambda MCP Client 생성 (streamable HTTP transport)"""
    # AgentCore Gateway를 통해 Lambda MCP에 접근
    gateway_url = "https://gateway.bedrock.aws.com/<GATEWAY_ID>/mcp"  # TODO: 실제 Gateway URL로 변경

    return MCPClient(lambda: streamablehttp_client(url=gateway_url))

# MCP Client는 main.py에서 with 컨텍스트로 관리해야 함
```

**main.py에서 사용**:
```python
from tools import get_transcribe_mcp_client

def _initialize():
    global _graph, _initialized
    if _initialized:
        return _graph

    from strands import Agent
    from strands.multiagent import GraphBuilder

    # MCP Client 생성 및 연결
    transcribe_mcp = get_transcribe_mcp_client()

    with transcribe_mcp:  # 반드시 with 컨텍스트 사용
        tools = transcribe_mcp.list_tools_sync()

        transcription_agent = Agent(
            name="transcription_agent",
            system_prompt="음성을 텍스트로 변환...",
            tools=tools
        )

        # ... graph 구성
        _graph = builder.build()

    _initialized = True
    return _graph
```

---

## 예시 4: boto3 S3 (파일 읽기/쓰기)

### 입력: PATH 명세서
```markdown
| file_processor | S3 파일 처리 | S3 경로 | 처리 결과 | Claude Sonnet 4.5 | boto3 S3 |
```

### 출력: tools.py
```python
"""
Tools Implementation - S3 File Operations

boto3 직접 호출로 구현합니다.
"""

import boto3

s3_client = boto3.client('s3', region_name='ap-northeast-2')

def read_s3_file(bucket: str, key: str) -> str:
    """
    S3에서 파일 읽기

    Args:
        bucket: S3 버킷 이름
        key: 파일 경로

    Returns:
        파일 내용 (텍스트)
    """
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        return content
    except Exception as e:
        print(f"Error reading S3 file: {e}")
        return ""

def write_s3_file(bucket: str, key: str, content: str) -> bool:
    """
    S3에 파일 쓰기

    Args:
        bucket: S3 버킷 이름
        key: 파일 경로
        content: 저장할 내용

    Returns:
        성공 여부
    """
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content.encode('utf-8'),
            ContentType='text/plain'
        )
        return True
    except Exception as e:
        print(f"Error writing S3 file: {e}")
        return False
```

---

## 예시 5: API Integration (Gmail API)

### 입력: Integration Details (등록된 통합)
```json
{
  "type": "api",
  "name": "Gmail API",
  "config": {
    "baseUrl": "https://gmail.googleapis.com",
    "authType": "oauth2",
    "endpoints": [
      {
        "path": "/gmail/v1/users/me/messages/send",
        "method": "POST"
      }
    ]
  }
}
```

### 출력: tools.py
```python
"""
Tools Implementation - Gmail API

requests 라이브러리로 구현합니다.
"""

import requests
import json
import base64
from typing import Dict

GMAIL_API_BASE = "https://gmail.googleapis.com"

# TODO: OAuth2 토큰은 AgentCore Identity로 관리
def get_oauth_token():
    """OAuth2 토큰 가져오기 (AgentCore Identity 연동)"""
    # AgentCore Identity가 자동으로 토큰 관리
    # 실제 구현 시 Identity 설정 필요
    return "YOUR_ACCESS_TOKEN"

def send_gmail(to: str, subject: str, body: str) -> Dict:
    """
    Gmail로 이메일 발송

    Args:
        to: 수신자 이메일
        subject: 제목
        body: 본문

    Returns:
        발송 결과
    """
    try:
        # 이메일 메시지 생성
        message = f"To: {to}\nSubject: {subject}\n\n{body}"
        encoded_message = base64.urlsafe_b64encode(message.encode('utf-8')).decode('utf-8')

        # Gmail API 호출
        url = f"{GMAIL_API_BASE}/gmail/v1/users/me/messages/send"
        headers = {
            "Authorization": f"Bearer {get_oauth_token()}",
            "Content-Type": "application/json"
        }
        data = {
            "raw": encoded_message
        }

        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()

        return {
            "status": "success",
            "message_id": response.json().get("id")
        }

    except Exception as e:
        print(f"Error sending Gmail: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
```

---

## 복합 예시: 여러 도구 혼합

### tools.py
```python
"""
Tools Implementation - Multiple Tools

boto3, MCP, API를 모두 사용하는 경우
"""

import boto3
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters
import requests

# 1. boto3 - Bedrock KB
bedrock_kb_client = boto3.client('bedrock-agent-runtime')
KNOWLEDGE_BASE_ID = "YOUR_KB_ID"

def search_kb(query: str):
    # ... (위 예시 참조)
    pass

# 2. boto3 - S3
s3_client = boto3.client('s3')

def read_s3_file(bucket: str, key: str):
    # ... (위 예시 참조)
    pass

# 3. MCP - Slack (Client Factory)
def get_slack_mcp_client():
    """Slack MCP Client 생성"""
    return MCPClient(lambda: stdio_client(
        StdioServerParameters(
            command="npx",
            args=["-y", "@anthropic/slack-mcp-server"]
        )
    ))

# 4. API - Gmail
GMAIL_API_BASE = "https://gmail.googleapis.com"

def send_gmail(to: str, subject: str, body: str):
    # ... (위 예시 참조)
    pass
```

### main.py (MCP 사용 시)
```python
from tools import search_kb, read_s3_file, get_slack_mcp_client, send_gmail

def _initialize():
    global _graph, _initialized
    if _initialized:
        return _graph

    from strands import Agent
    from strands.multiagent import GraphBuilder

    # MCP Client 연결
    slack_mcp = get_slack_mcp_client()

    with slack_mcp:
        slack_tools = slack_mcp.list_tools_sync()

        # Agent 생성 - boto3 함수와 MCP 도구 혼합 가능
        agent = Agent(
            tools=[search_kb, read_s3_file, send_gmail] + slack_tools
        )

        # ... graph 구성
        _graph = builder.build()

    _initialized = True
    return _graph
```

---

## 예시 6: Standalone MCP (AgentCore Runtime 배포 ✅)

### 입력: PATH 명세서
```markdown
| webhook_agent | 웹훅 처리 | 웹훅 이벤트 | 처리 결과 | Claude Haiku 4.5 | Standalone MCP (webhook-handler) |
```

### 출력: tools.py
```python
"""
Tools Implementation - Standalone MCP Server

✅ AgentCore Runtime 배포 지원!
Self-hosted MCP Server가 별도 Runtime에 배포되어 있음.
streamablehttp_client로 연결합니다.
"""

from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
import os

def get_webhook_mcp_client():
    """Standalone MCP Client 생성 (배포된 MCP Runtime)"""
    # 배포된 MCP Server의 endpoint URL
    mcp_endpoint = os.environ.get("MCP_ENDPOINT_URL", "https://<runtime-id>.runtime.bedrock-agentcore.us-west-2.amazonaws.com/mcp")

    return MCPClient(lambda: streamablehttp_client(url=mcp_endpoint))

# MCP Client는 main.py에서 with 컨텍스트로 관리해야 함
```

**main.py에서 사용**:
```python
from tools import get_webhook_mcp_client

def _initialize():
    global _graph, _initialized
    if _initialized:
        return _graph

    from strands import Agent
    from strands.multiagent import GraphBuilder

    # Standalone MCP Client 연결
    webhook_mcp = get_webhook_mcp_client()

    with webhook_mcp:  # 반드시 with 컨텍스트 사용
        tools = webhook_mcp.list_tools_sync()

        webhook_agent = Agent(
            name="webhook_agent",
            system_prompt="웹훅 이벤트 처리...",
            tools=tools
        )

        # ... graph 구성
        _graph = builder.build()

    _initialized = True
    return _graph
```

---

## 중요 체크리스트

- [ ] Agent Components 테이블의 Tools 컬럼 확인
- [ ] boto3 직접 호출 vs MCP 연결 결정
- [ ] S3, Bedrock KB, DynamoDB는 반드시 boto3 직접 호출
- [ ] **AgentCore 배포 시**: stdio MCP(npx/uvx) 사용 불가
- [ ] **Gateway Mode**: 외부 API/Lambda → Gateway Target으로 연결
- [ ] **Standalone MCP Mode**: 배포된 MCP Server → streamablehttp로 연결
- [ ] Integration Details 정보 반영
- [ ] 에러 처리 포함 (try-except)
- [ ] 환경 변수 or 설정값 주석으로 TODO 표시
- [ ] AgentCore Identity 연동 필요 시 주석 추가
