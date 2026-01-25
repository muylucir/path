# 문제 해결 가이드

AgentCore 배포 및 Strands Agent 개발 시 발생하는 일반적인 오류와 해결 방법입니다.

## 초기화 관련 오류

### Initialization Timeout

```
Error: Runtime initialization timed out after 30 seconds
```

**원인**: 모듈 레벨에서 Agent, Model, MCP Client 등 무거운 객체를 생성

**잘못된 코드**:
```python
# ⚠️ 모듈 로드 시 즉시 실행됨
from strands import Agent
from strands.models.bedrock import BedrockModel

model = BedrockModel(...)  # 여기서 AWS 연결 시도!
agent = Agent(model=model)  # 타임아웃!
```

**해결책**: Lazy Initialization 패턴 사용
```python
# ✅ 첫 호출 시에만 초기화
_agent = None
_initialized = False

def _initialize():
    global _agent, _initialized
    if _initialized:
        return _agent

    from strands import Agent
    from strands.models.bedrock import BedrockModel

    model = BedrockModel(...)
    _agent = Agent(model=model)
    _initialized = True
    return _agent
```

## 패키지 관련 오류

### ModuleNotFoundError: No module named 'strands'

```
ModuleNotFoundError: No module named 'strands'
```

**원인**: 잘못된 패키지명 사용

**해결책**: 올바른 패키지명 사용
```bash
# ⚠️ 잘못된 패키지명
pip install strands

# ✅ 올바른 패키지명
pip install strands-agents
pip install strands-agents-tools
pip install bedrock-agentcore
```

**requirements.txt**:
```
strands-agents>=0.1.0
strands-agents-tools>=0.1.0
bedrock-agentcore>=0.1.0
```

## MCP Client 관련 오류

### TypeError: MCPClient.__init__() got an unexpected keyword argument

```
TypeError: MCPClient.__init__() got an unexpected keyword argument 'transport'
TypeError: MCPClient.__init__() got an unexpected keyword argument 'url'
TypeError: MCPClient.__init__() got an unexpected keyword argument 'name'
```

**원인**: 잘못된 MCPClient 생성 패턴

**잘못된 코드**:
```python
# ⚠️ 이런 인자는 존재하지 않음!
MCPClient(name="slack", transport="http", url="https://...")
MCPClient(transport="sse", url="https://...")
MCPClient(url="https://...")
```

**해결책**: lambda + transport client 패턴 사용
```python
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client
from mcp import stdio_client, StdioServerParameters

# ✅ HTTP transport (AgentCore Gateway, 원격 MCP 서버)
mcp_client = MCPClient(lambda: streamablehttp_client(url="https://..."))

# ✅ stdio transport (로컬 MCP 서버)
mcp_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(
        command="npx",
        args=["-y", "@anthropic/slack-mcp-server"],
        env={"SLACK_BOT_TOKEN": "..."}
    )
))
```

### MCP Connection Failed

```
Error: Failed to connect to MCP server
ConnectionRefusedError: [Errno 111] Connection refused
```

**원인**: Context manager 미사용 또는 서버 URL 오류

**해결책**:
```python
# ✅ 반드시 context manager 사용
with mcp_client:
    tools = mcp_client.list_tools_sync()
    result = agent(message)

# 환경 변수 확인
import os
print(f"MCP URL: {os.environ.get('MCP_GATEWAY_URL')}")
```

## Graph 관련 오류

### AttributeError: 'GraphBuilder' object has no attribute 'add_conditional_edge'

```
AttributeError: 'GraphBuilder' object has no attribute 'add_conditional_edge'
```

**원인**: 존재하지 않는 메서드 사용

**잘못된 코드**:
```python
# ⚠️ add_conditional_edge는 존재하지 않음!
builder.add_conditional_edge("classify", "simple", condition=is_simple)
```

**해결책**: `add_edge`에 `condition` 파라미터 사용
```python
# ✅ 올바른 조건부 엣지
builder.add_edge("classify", "simple", condition=is_simple)
builder.add_edge("classify", "complex", condition=is_complex)
```

### Infinite Loop / Graph Timeout

```
Error: Graph execution exceeded maximum time limit
Error: Maximum node executions exceeded
```

**원인**: 무한 루프 방지 설정 누락

**해결책**: 실행 제한 설정 추가
```python
builder = GraphBuilder()
# ... 노드 및 엣지 추가 ...

# ✅ 무한 루프 방지 설정
builder.set_max_node_executions(10)  # 노드당 최대 10회
builder.set_execution_timeout(300)    # 전체 5분 제한

graph = builder.compile()
```

## 배포 관련 오류

### Runtime Status: FAILED

```bash
agentcore status
# Status: FAILED
```

**원인**: 코드 오류, 의존성 문제, 권한 부족 등

**해결 단계**:
```bash
# 1. 로그 확인
agentcore logs

# 2. 빌드 로그 확인
agentcore logs --build

# 3. 설정 검증
agentcore validate

# 4. 로컬 테스트
python -c "from main import invoke; print(invoke({'prompt': 'test'}, {}))"
```

### Permission Denied

```
Error: User is not authorized to perform: bedrock-agentcore:CreateRuntime
AccessDeniedException: User: arn:aws:iam::xxx is not authorized
```

**원인**: IAM 권한 부족

**해결책**: 필요한 권한 추가
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:*",
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "ecr:*",
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "*"
    }
  ]
}
```

### ECR Push Failed

```
Error: Failed to push image to ECR
Error: no basic auth credentials
```

**원인**: ECR 인증 실패

**해결책**:
```bash
# ECR 로그인
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# 또는 agentcore CLI로 자동 처리
agentcore launch
```

## Model 관련 오류

### Model Not Found

```
Error: Model with ID 'xxx' not found
ResourceNotFoundException: Could not resolve the foundation model
```

**원인**: 잘못된 모델 ID 또는 리전에서 사용 불가

**해결책**: 올바른 모델 ID 사용
```python
# ✅ 사용 가능한 모델 ID
model = BedrockModel(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",  # Sonnet 4.5
    # model_id="global.anthropic.claude-haiku-4-5-20251001-v1:0",  # Haiku 4.5
    region_name="us-west-2"
)
```

### Throttling / Rate Limit

```
ThrottlingException: Rate exceeded
```

**원인**: API 호출 속도 제한 초과

**해결책**:
```python
import time
from botocore.exceptions import ClientError

def invoke_with_retry(agent, message, max_retries=3):
    for attempt in range(max_retries):
        try:
            return agent(message)
        except ClientError as e:
            if e.response['Error']['Code'] == 'ThrottlingException':
                wait_time = 2 ** attempt
                time.sleep(wait_time)
            else:
                raise
    raise Exception("Max retries exceeded")
```

## Memory 관련 오류

### Memory Not Found

```
Error: Memory with ID 'xxx' not found
ResourceNotFoundException: The specified memory does not exist
```

**원인**: 존재하지 않는 Memory ID 사용

**해결책**:
```bash
# Memory 목록 확인
agentcore memory list

# Memory 생성
agentcore memory create --name "my-agent-memory"

# 환경 변수 설정
export AGENTCORE_MEMORY_ID="mem-abc123"
```

## 디버깅 팁

### 로컬 디버깅

```python
import logging

# 상세 로깅 활성화
logging.basicConfig(level=logging.DEBUG)

# Strands 로거
logging.getLogger("strands").setLevel(logging.DEBUG)

# MCP 로거
logging.getLogger("mcp").setLevel(logging.DEBUG)
```

### 환경 변수 확인

```python
import os

print("=== Environment Variables ===")
print(f"AWS_DEFAULT_REGION: {os.environ.get('AWS_DEFAULT_REGION')}")
print(f"AGENTCORE_MEMORY_ID: {os.environ.get('AGENTCORE_MEMORY_ID')}")
print(f"MCP_GATEWAY_URL: {os.environ.get('MCP_GATEWAY_URL')}")
```

### 단계별 테스트

```python
# 1. Model 테스트
from strands.models.bedrock import BedrockModel
model = BedrockModel(model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0")
print("✅ Model created")

# 2. Agent 테스트
from strands import Agent
agent = Agent(model=model)
print("✅ Agent created")

# 3. 호출 테스트
result = agent("Hello!")
print(f"✅ Result: {result}")
```

## 오류 요약 표

| 오류 | 원인 | 해결책 |
|------|------|--------|
| Initialization timeout | 모듈 레벨 초기화 | Lazy Init 패턴 |
| `strands` not found | 잘못된 패키지명 | `strands-agents` 설치 |
| MCPClient unexpected keyword | 잘못된 생성 패턴 | `MCPClient(lambda: ...)` |
| MCP connection failed | Context manager 미사용 | `with mcp_client:` |
| `add_conditional_edge` not found | 없는 메서드 | `add_edge(..., condition=)` |
| Infinite loop | 제한 설정 누락 | `set_max_node_executions()` |
| Runtime FAILED | 다양한 원인 | `agentcore logs` 확인 |
| Permission denied | IAM 권한 부족 | 권한 정책 추가 |
| Model not found | 잘못된 모델 ID | 올바른 모델 ID 사용 |
| Memory not found | 없는 Memory ID | Memory 생성 후 ID 설정 |
