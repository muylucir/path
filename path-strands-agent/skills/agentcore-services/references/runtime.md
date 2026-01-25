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

### WebSocket (포트 8080)
양방향 실시간 스트리밍을 위한 프로토콜입니다.

| 엔드포인트 | 용도 |
|-----------|------|
| `/ws` | WebSocket 연결 |

**구현:**
```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.websocket
async def websocket_handler(websocket, context):
    """양방향 실시간 스트리밍 핸들러"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # 처리 로직
            response = process_message(data)
            await websocket.send_json({"response": response})
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()
```

**사용 사례**: 음성 에이전트, 인터럽션 지원 채팅, 실시간 협업

**WebSocket vs HTTP 선택:**
| Use Case | 권장 프로토콜 |
|----------|-------------|
| 음성 에이전트, 인터럽션 지원 채팅 | WebSocket |
| 단순 요청-응답, 단방향 스트리밍 | HTTP SSE |
| 긴 폴링, 서버 푸시 | WebSocket |
| 배치 처리, API 통합 | HTTP |

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
- `.bedrock_agentcore.yaml`: 배포 구성 (에이전트명, 리전, IAM 역할 등)

**OAuth 인증 설정** (선택):
```python
from bedrock_agentcore_starter_toolkit import Runtime

agentcore_runtime = Runtime()
response = agentcore_runtime.configure(
    entrypoint="agent.py",
    execution_role=role_arn,
    authorizer_configuration={
        "customJWTAuthorizer": {
            "discoveryUrl": discovery_url,
            "allowedClients": [client_id]
        }
    }
)
```

### 3. Deploy (배포)

AgentCore는 두 가지 배포 방식을 지원합니다.

#### Direct Code Deploy (기본, 권장)

코드를 직접 업로드하여 배포합니다. Docker 이미지 빌드가 필요 없습니다.

```bash
# 클라우드 배포 (Direct Code Deploy)
agentcore deploy

# 로컬 테스트
agentcore deploy --local
```

**배포 과정**:
1. 소스 코드 패키징
2. S3에 업로드
3. AgentCore Runtime 생성
4. CloudWatch 로그 그룹 구성

**장점:**
- Docker 설정 불필요
- 빠른 배포 (이미지 빌드 생략)
- 간단한 워크플로우

#### Container Deploy

커스텀 Docker 이미지로 배포합니다. 특수 의존성이 필요한 경우 사용합니다.

```bash
# 로컬에서 Docker 이미지 빌드 후 배포
agentcore deploy --local-build
```

**배포 과정**:
1. Docker 이미지 빌드 (로컬 또는 CodeBuild)
2. Amazon ECR에 이미지 푸시
3. AgentCore Runtime 생성
4. CloudWatch 로그 그룹 구성

**CLI 옵션:**

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--local` | 로컬 테스트 모드 | - |
| `--local-build` | 로컬에서 Docker 빌드 | - |
| `--idle-timeout` | 유휴 세션 타임아웃 (초) | 900 |
| `--max-lifetime` | 세션 최대 지속 시간 (초) | 28800 |
| `--protocol` | 프로토콜 (HTTP, MCP, A2A) | HTTP |

**예시:**
```bash
# WebSocket 프로토콜로 배포
agentcore deploy --protocol HTTP

# 세션 타임아웃 설정
agentcore deploy --idle-timeout 1800 --max-lifetime 14400
```

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
| **Idle** | 요청 처리 완료 후 대기 중 (기본 900초 후 종료, 상태 유지) |
| **Terminated** | 유휴 타임아웃, 최대 지속 시간 초과, 또는 헬스체크 실패 |

### 세션 타임아웃 설정

| 설정 | 기본값 | 최대값 | 설명 |
|------|--------|--------|------|
| `idle-timeout` | 900초 (15분) | 28800초 (8시간) | 유휴 상태 유지 시간 |
| `max-lifetime` | 28800초 (8시간) | 28800초 (8시간) | 세션 최대 지속 시간 |

```bash
# 배포 시 타임아웃 설정
agentcore deploy --idle-timeout 1800 --max-lifetime 14400
```

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
| **유휴 타임아웃** | 기본 900초, 최대 28800초 |
| **세션 최대 지속** | 최대 8시간 (28800초) |
| **Python** | 3.11 이상 |
| **아키텍처** | ARM64 (linux/arm64) |
| **프로토콜** | HTTP, WebSocket, MCP, A2A |

## 모니터링

- CloudWatch 통합: 실행 상태, 성능 메트릭, 에러 로그
- OpenTelemetry 호환: LangSmith, Langfuse 등 외부 플랫폼 연동
- 추적(Tracing): 요청 수명 주기, 도구 호출, 성능 병목 식별
