# AgentCore Runtime

## 개념

AgentCore Runtime은 AI 에이전트의 프로토타입에서 프로덕션으로의 전환을 단순화하는 서버리스 런타임입니다.

**핵심 가치:**
- **프로토타입 트랩 해소**: PoC에서 프로덕션으로 전환 시 발생하는 인프라 복잡성 제거
- **프레임워크 독립성**: Strands Agents, LangGraph, CrewAI, LlamaIndex 등 모든 에이전트 프레임워크 지원
- **모델 유연성**: Amazon Bedrock, Anthropic Claude, OpenAI, Google Gemini 등 모든 모델 지원

## 핵심 특징

| 특징 | 설명 |
|------|------|
| **세션 격리** | Firecracker MicroVM 기반, CPU/메모리/파일시스템 완전 격리 |
| **실행 시간** | 최대 8시간 (비동기 장기 워크로드 지원) |
| **페이로드** | 100MB (텍스트, 이미지, 오디오, 비디오 멀티모달) |
| **콜드 스타트** | 200ms |
| **내장 인증** | AgentCore Identity 통합, Okta/Entra ID/Cognito 지원 |
| **소비 기반 과금** | 실제 사용한 리소스만 과금 |

## 프로토콜 지원

AgentCore Runtime은 3가지 프로토콜을 지원하며, 동시 사용 가능합니다.

### HTTP (포트 8080)
전통적인 요청-응답 패턴을 위한 REST API 엔드포인트입니다.

| 엔드포인트 | 메서드 | 용도 |
|-----------|--------|------|
| `/invocations` | POST | JSON 입력 → JSON/SSE 출력 |
| `/ping` | GET | 헬스체크 (200 반환) |

**사용 사례**: 직접 사용자 상호작용, API 통합, 배치 처리, 스트리밍 응답

### MCP (포트 8000)
도구 및 데이터 소스 액세스를 위한 표준화된 프로토콜입니다.

| 엔드포인트 | 용도 |
|-----------|------|
| `/mcp` | MCP RPC 메시지 처리 |

- Mcp-Session-Id 헤더 자동 관리
- Stateless streamable-HTTP 방식
- 표준 MCP SDK 호환

**사용 사례**: 파일 시스템, 데이터베이스, 외부 API 액세스

### A2A (포트 9000)
에이전트 간 협업을 위한 프로토콜입니다.

| 엔드포인트 | 용도 |
|-----------|------|
| `/` | JSON-RPC 페이로드 처리 |

- OAuth 2.0 및 SigV4 인증
- 완전한 세션 격리

**사용 사례**: 멀티 에이전트 협업, 에이전트 간 통신

## 배포 단계

### 1. Define (에이전트 정의)

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent

app = BedrockAgentCoreApp()
agent = Agent()

@app.entrypoint
def invoke(payload):
    """
    payload: 사용자 입력 {"prompt": "..."}
    """
    user_message = payload.get("prompt", "Hello")
    response = agent(user_message)
    return str(response)

if __name__ == "__main__":
    app.run()  # 로컬: http://localhost:8080
```

### 2. Configure (설정)

```bash
agentcore configure --entrypoint agent.py --region us-east-1
```

생성되는 파일:
- `Dockerfile`: 컨테이너화 설정
- `.bedrock_agentcore.yaml`: 배포 구성 (에이전트명, 리전, IAM 역할, ECR 등)

**OAuth 인증 설정** (선택):
```python
from bedrock_agentcore_starter_toolkit import Runtime

agentcore_runtime = Runtime()
response = agentcore_runtime.configure(
    entrypoint="agent.py",
    execution_role=role_arn,
    auto_create_ecr=True,
    authorizer_configuration={
        "customJWTAuthorizer": {
            "discoveryUrl": discovery_url,
            "allowedClients": [client_id]
        }
    }
)
```

### 3. Launch (배포)

```bash
# 클라우드 배포
agentcore launch

# 로컬 테스트
agentcore launch --local
```

**배포 과정**:
1. Docker 이미지 빌드 (CodeBuild 또는 로컬)
2. Amazon ECR에 이미지 푸시
3. AgentCore Runtime 생성
4. CloudWatch 로그 그룹 구성

### 4. Invoke (호출)

```bash
# 기본 호출
agentcore invoke '{"prompt": "Hello"}'

# 세션 지정
agentcore invoke '{"prompt": "Hello"}' --session-id "session-123"

# OAuth 토큰 사용
agentcore invoke '{"prompt": "Hello"}' --bearer-token <TOKEN>
```

**Python API**:
```python
invoke_response = agentcore_runtime.invoke({"prompt": "How is the weather?"})
```

## 세션 관리

### MicroVM 격리
각 세션은 전용 Firecracker MicroVM에서 실행됩니다:
- 독립된 CPU, 메모리, 파일시스템
- 세션 간 데이터 오염 방지
- 세션 종료 시 메모리 완전 정화

### 세션 상태

| 상태 | 설명 |
|------|------|
| **Active** | 동기 요청 처리 중 또는 백그라운드 작업 수행 중 |
| **Idle** | 요청 처리 완료 후 대기 중 (5분 후 일시 중단, 상태 유지) |
| **Terminated** | 15분 비활성, 8시간 최대 지속, 또는 헬스체크 실패 |

### 세션 지속성
- `runtimeSessionId`로 세션 식별
- 세션 기간 동안 대화 히스토리, 중간 계산 결과 유지
- 세션 종료 후에도 데이터 보존 필요 시 → **AgentCore Memory** 사용

## 버전 관리

- 런타임 생성 시 버전 1 자동 생성
- 구성 변경(이미지, 프로토콜, 네트워크) 시 새 버전 생성
- 이전 버전으로 즉시 롤백 가능
- 카나리/블루-그린 배포 지원

## FastAPI 기반 구현 (Starter Toolkit 없이)

Starter Toolkit 없이 직접 FastAPI로 구현할 수 있습니다.

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from strands import Agent

app = FastAPI()
strands_agent = Agent()

class InvocationRequest(BaseModel):
    input: Dict[str, Any]

@app.post("/invocations")
async def invoke_agent(request: InvocationRequest):
    try:
        user_message = request.input.get("prompt", "")
        if not user_message:
            raise HTTPException(status_code=400, detail="No prompt found")

        result = strands_agent(user_message)
        return {"output": {"message": result.message}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ping")
async def ping():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

**Dockerfile** (ARM64 필수):
```dockerfile
FROM --platform=linux/arm64 ghcr.io/astral-sh/uv:python3.11-bookworm-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache
COPY agent.py ./
EXPOSE 8080
CMD ["uv", "run", "uvicorn", "agent:app", "--host", "0.0.0.0", "--port", "8080"]
```

## 제약사항

| 항목 | 제한 |
|------|------|
| **실행 시간** | 최대 8시간 |
| **페이로드** | 100MB |
| **컨테이너 이미지** | 10GB |
| **동시 실행** | 계정당 1000개 |
| **세션 타임아웃** | 15분 비활성 |
| **세션 최대 지속** | 8시간 |
| **Python** | 3.11 이상 |
| **아키텍처** | ARM64 (linux/arm64) |

## 모니터링

- CloudWatch 통합: 실행 상태, 성능 메트릭, 에러 로그
- OpenTelemetry 호환: LangSmith, Langfuse 등 외부 플랫폼 연동
- 추적(Tracing): 요청 수명 주기, 도구 호출, 성능 병목 식별
