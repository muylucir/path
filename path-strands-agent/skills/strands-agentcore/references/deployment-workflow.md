# AgentCore 배포 워크플로우

AgentCore Runtime에 Strands Agent를 배포하는 단계별 가이드입니다.

## 사전 요구사항

### 1. AWS CLI 설정

```bash
aws configure
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: us-west-2
# Default output format: json
```

### 2. AgentCore Toolkit 설치

```bash
pip install bedrock-agentcore-starter-toolkit
```

### 3. 필요한 IAM 권한

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock-agentcore:*",
        "ecr:*",
        "s3:PutObject",
        "s3:GetObject",
        "sts:AssumeRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## 프로젝트 구조

```
my-agent/
├── main.py              # BedrockAgentCoreApp + entrypoint (필수)
├── tools.py             # @tool 함수 및 MCP Client (선택)
├── agentcore_config.py  # AgentCore 서비스 설정 (선택)
├── requirements.txt     # Python 의존성 (필수)
└── agentcore.yaml       # 배포 설정 (선택, 자동 생성됨)
```

## Step 1: 코드 작성

### main.py (필수)

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

_agent = None
_initialized = False

def _initialize():
    global _agent, _initialized
    if _initialized:
        return _agent

    from strands import Agent
    from strands.models.bedrock import BedrockModel

    model = BedrockModel(
        model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        region_name="us-west-2"
    )
    _agent = Agent(model=model)
    _initialized = True
    return _agent

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent = _initialize()
    message = payload.get("prompt", "Hello!")
    result = agent(message)
    return {"response": str(result)}
```

### requirements.txt (필수)

```
strands-agents>=0.1.0
strands-agents-tools>=0.1.0
bedrock-agentcore>=0.1.0
```

## Step 2: 로컬 테스트

```bash
# 로컬에서 Agent 테스트
python -c "
from main import invoke
result = invoke({'prompt': 'Hello!'}, {})
print(result)
"
```

## Step 3: 배포 설정

```bash
# 배포 설정 초기화 (대화형)
agentcore configure

# 또는 비대화형 모드
agentcore configure --entrypoint main.py --non-interactive
```

### agentcore.yaml (자동 생성됨)

```yaml
runtime:
  name: my-agent-runtime
  entrypoint: main.py
  python_version: "3.11"

environment:
  variables:
    AWS_DEFAULT_REGION: us-west-2
    # AGENTCORE_MEMORY_ID: mem-xxx (Memory 사용 시)
    # MCP_GATEWAY_URL: https://xxx.execute-api.xxx.amazonaws.com/sse (MCP 사용 시)
```

## Step 4: 배포

```bash
# Runtime 배포 (빌드 + 푸시 + 생성)
agentcore launch

# 배포 상태 확인
agentcore status

# 상세 로그 확인
agentcore logs
```

## Step 5: 테스트

```bash
# 배포된 Agent 호출
agentcore invoke '{"prompt": "Hello, how are you?"}'

# JSON 파일로 호출
agentcore invoke --file request.json
```

## Step 6: 관리

### 상태 확인

```bash
# Runtime 상태 확인
agentcore status

# 가능한 상태: CREATING, READY, UPDATING, FAILED, DELETING
```

### 로그 확인

```bash
# 최근 로그
agentcore logs

# 실시간 로그 스트리밍
agentcore logs --follow

# 특정 시간 범위 로그
agentcore logs --start-time "2024-01-01T00:00:00Z"
```

### 업데이트

```bash
# 코드 변경 후 재배포
agentcore launch

# 또는 업데이트만
agentcore update
```

### 삭제

```bash
# Runtime 삭제
agentcore destroy

# 강제 삭제 (확인 없이)
agentcore destroy --force
```

## 환경 변수 관리

### 설정 파일에서

```yaml
# agentcore.yaml
environment:
  variables:
    AGENTCORE_MEMORY_ID: mem-abc123
    MCP_GATEWAY_URL: https://xxx.execute-api.us-west-2.amazonaws.com/sse
    LOG_LEVEL: INFO
```

### CLI에서

```bash
# 환경 변수 추가
agentcore env set AGENTCORE_MEMORY_ID=mem-abc123

# 환경 변수 확인
agentcore env list

# 환경 변수 삭제
agentcore env unset AGENTCORE_MEMORY_ID
```

## Memory 리소스 관리

```bash
# Memory 생성
agentcore memory create --name "my-agent-memory"

# Memory 목록
agentcore memory list

# Memory 상세 정보
agentcore memory describe --memory-id mem-abc123

# Memory 삭제
agentcore memory delete --memory-id mem-abc123
```

## Gateway 관리

```bash
# Gateway 생성 (Lambda 타겟)
agentcore gateway create --name "my-gateway" --target-type lambda --target-arn arn:aws:lambda:...

# Gateway 목록
agentcore gateway list

# Gateway 삭제
agentcore gateway delete --gateway-id gw-abc123
```

## 문제 해결

### 배포 실패 시

```bash
# 상세 상태 확인
agentcore status --verbose

# 빌드 로그 확인
agentcore logs --build

# 설정 검증
agentcore validate
```

### 일반적인 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `Initialization timeout` | 모듈 레벨에서 무거운 초기화 | Lazy Init 패턴 적용 |
| `Module not found` | requirements.txt 누락 | 의존성 추가 |
| `Permission denied` | IAM 권한 부족 | 권한 추가 |
| `FAILED status` | 코드 오류 | 로그 확인 후 수정 |

## 배포 체크리스트

- [ ] `main.py`에 `BedrockAgentCoreApp` 사용
- [ ] `@app.entrypoint` 데코레이터 적용
- [ ] Lazy Initialization 패턴 적용
- [ ] `requirements.txt`에 모든 의존성 포함
- [ ] 로컬 테스트 통과
- [ ] 환경 변수 설정 완료
- [ ] IAM 권한 확인

## 배포 흐름 요약

```
┌─────────────────────────────────────────────────────┐
│  1. 코드 작성 (main.py, requirements.txt)           │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  2. 로컬 테스트                                      │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  3. agentcore configure                             │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  4. agentcore launch                                │
│     → Docker 빌드                                   │
│     → ECR 푸시                                      │
│     → Runtime 생성                                  │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  5. agentcore status (READY 확인)                   │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  6. agentcore invoke (테스트)                       │
└─────────────────────────────────────────────────────┘
```
