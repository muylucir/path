# agentcore_config.py 템플릿 예시

PATH 명세서의 AgentCore 구성 정보 → agentcore_config.py 변환 예시입니다.

## 변환 규칙

### AgentCore 구성 테이블 → Python 설정

| 구성 요소 | 명세서 컬럼 | Python 코드 |
|----------|----------|------------|
| **Runtime** | Runtime 정보 | `RUNTIME_CONFIG` |
| **Memory** | Memory 전략 | `MEMORY_CONFIG` |
| **Gateway** | Gateway Targets | `GATEWAY_CONFIG` |
| **Identity** | Identity Provider | `IDENTITY_CONFIG` |

---

## 예시 1: 기본 구성 (Runtime만)

### 입력: PATH 명세서

```markdown
| 구성 요소 | 설정 내용 |
|----------|----------|
| Runtime | 1개 (전체 Graph 호스팅) |
| Memory | 없음 |
| Gateway | 없음 |
| Identity | 없음 |
```

### 출력: agentcore_config.py

```python
"""
AgentCore Configuration - Basic Setup

Runtime만 사용하는 단순 구성
"""

# Runtime 설정
RUNTIME_CONFIG = {
    "protocol": "http",
    "port": 8080,
    "agent_count": 3,  # Agent 개수
    "hosting_mode": "single_runtime",  # 1개 Runtime에 모든 Agent 호스팅
    "health_check_path": "/ping"
}

# Memory 설정 (미사용)
MEMORY_CONFIG = {
    "enabled": False
}

# Gateway 설정 (미사용)
GATEWAY_CONFIG = {
    "enabled": False
}

# Identity 설정 (미사용)
IDENTITY_CONFIG = {
    "enabled": False
}

# 전체 설정
AGENTCORE_CONFIG = {
    "runtime": RUNTIME_CONFIG,
    "memory": MEMORY_CONFIG,
    "gateway": GATEWAY_CONFIG,
    "identity": IDENTITY_CONFIG
}
```

---

## 예시 2: Memory 활성화 (Namespace 전략)

### 입력: PATH 명세서

```markdown
| 구성 요소 | 설정 내용 |
|----------|----------|
| Runtime | 1개 (전체 Graph 호스팅) |
| Memory | Namespace 전략 (사용자별 격리) |
| Gateway | 없음 |
| Identity | 없음 |
```

### 출력: agentcore_config.py

```python
"""
AgentCore Configuration - Memory Enabled

Namespace 기반 메모리 전략 사용
"""

# Runtime 설정
RUNTIME_CONFIG = {
    "protocol": "http",
    "port": 8080,
    "agent_count": 3,
    "hosting_mode": "single_runtime"
}

# Memory 설정 (Namespace 전략)
MEMORY_CONFIG = {
    "enabled": True,
    "strategy": "namespace",
    "backend": "dynamodb",  # 또는 "redis", "s3"
    "config": {
        "table_name": "agentcore-memory",  # DynamoDB 테이블
        "namespace_key": "user_id",  # 사용자별 격리
        "ttl_days": 30
    }
}

# Gateway 설정 (미사용)
GATEWAY_CONFIG = {
    "enabled": False
}

# Identity 설정 (미사용)
IDENTITY_CONFIG = {
    "enabled": False
}

AGENTCORE_CONFIG = {
    "runtime": RUNTIME_CONFIG,
    "memory": MEMORY_CONFIG,
    "gateway": GATEWAY_CONFIG,
    "identity": IDENTITY_CONFIG
}
```

---

## 예시 3: Gateway 추가 (Lambda + MCP)

### 입력: PATH 명세서

```markdown
| 구성 요소 | 설정 내용 |
|----------|----------|
| Runtime | 1개 (전체 Graph 호스팅) |
| Memory | Namespace 전략 |
| Gateway | Lambda (transcribe), MCP (slack) |
| Identity | 없음 |
```

### 출력: agentcore_config.py

```python
"""
AgentCore Configuration - Gateway Enabled

Lambda 함수 + MCP 서버 연동
"""

# Runtime 설정
RUNTIME_CONFIG = {
    "protocol": "http",
    "port": 8080,
    "agent_count": 3,
    "hosting_mode": "single_runtime"
}

# Memory 설정
MEMORY_CONFIG = {
    "enabled": True,
    "strategy": "namespace",
    "backend": "dynamodb",
    "config": {
        "table_name": "agentcore-memory",
        "namespace_key": "user_id",
        "ttl_days": 30
    }
}

# Gateway 설정
GATEWAY_CONFIG = {
    "enabled": True,
    "targets": [
        {
            "type": "lambda",
            "name": "transcribe",
            "function_arn": "arn:aws:lambda:ap-northeast-2:123456789012:function:transcribe-mcp",
            "protocol": "mcp",  # Lambda가 MCP 표준 인터페이스 제공
            "timeout": 300
        },
        {
            "type": "mcp",
            "name": "slack",
            "server_url": "http://localhost:3000/mcp/slack",
            "transport": "sse",  # 또는 "stdio", "websocket"
            "auth": {
                "type": "bearer",
                "token_env": "SLACK_MCP_TOKEN"
            }
        }
    ]
}

# Identity 설정 (미사용)
IDENTITY_CONFIG = {
    "enabled": False
}

AGENTCORE_CONFIG = {
    "runtime": RUNTIME_CONFIG,
    "memory": MEMORY_CONFIG,
    "gateway": GATEWAY_CONFIG,
    "identity": IDENTITY_CONFIG
}
```

---

## 예시 4: 전체 활성화 (Runtime + Memory + Gateway + Identity)

### 입력: PATH 명세서

```markdown
| 구성 요소 | 설정 내용 |
|----------|----------|
| Runtime | 1개 (전체 Graph 호스팅) |
| Memory | Namespace 전략 |
| Gateway | Lambda (transcribe), OpenAPI (gmail) |
| Identity | OAuth2 (Google API) |
```

### 출력: agentcore_config.py

```python
"""
AgentCore Configuration - Full Setup

Runtime + Memory + Gateway + Identity 모두 활성화
"""

# Runtime 설정
RUNTIME_CONFIG = {
    "protocol": "http",
    "port": 8080,
    "agent_count": 5,
    "hosting_mode": "single_runtime",
    "health_check_path": "/ping"
}

# Memory 설정
MEMORY_CONFIG = {
    "enabled": True,
    "strategy": "namespace",
    "backend": "dynamodb",
    "config": {
        "table_name": "agentcore-memory",
        "namespace_key": "user_id",
        "ttl_days": 30,
        "region": "ap-northeast-2"
    }
}

# Gateway 설정
GATEWAY_CONFIG = {
    "enabled": True,
    "targets": [
        {
            "type": "lambda",
            "name": "transcribe",
            "function_arn": "arn:aws:lambda:ap-northeast-2:123456789012:function:transcribe-mcp",
            "protocol": "mcp",
            "timeout": 300
        },
        {
            "type": "openapi",
            "name": "gmail",
            "openapi_url": "https://gmail.googleapis.com/.well-known/openapi.json",
            "base_url": "https://gmail.googleapis.com",
            "auth": {
                "type": "oauth2",
                "identity_provider": "google"  # Identity와 연동
            }
        }
    ]
}

# Identity 설정
IDENTITY_CONFIG = {
    "enabled": True,
    "providers": [
        {
            "name": "google",
            "type": "oauth2",
            "client_id_env": "GOOGLE_CLIENT_ID",
            "client_secret_env": "GOOGLE_CLIENT_SECRET",
            "scopes": [
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/gmail.readonly"
            ],
            "token_storage": {
                "backend": "dynamodb",
                "table_name": "agentcore-identity-tokens"
            }
        }
    ]
}

AGENTCORE_CONFIG = {
    "runtime": RUNTIME_CONFIG,
    "memory": MEMORY_CONFIG,
    "gateway": GATEWAY_CONFIG,
    "identity": IDENTITY_CONFIG
}
```

---

## 예시 5: Memory 고급 전략 (Shared + Namespace)

### 입력: PATH 명세서

```markdown
| 구성 요소 | 설정 내용 |
|----------|----------|
| Runtime | 1개 (전체 Graph 호스팅) |
| Memory | Shared (공통 지식베이스) + Namespace (사용자별 대화) |
| Gateway | Bedrock KB (통합 등록) |
| Identity | 없음 |
```

### 출력: agentcore_config.py

```python
"""
AgentCore Configuration - Advanced Memory

Shared + Namespace 하이브리드 전략
"""

# Runtime 설정
RUNTIME_CONFIG = {
    "protocol": "http",
    "port": 8080,
    "agent_count": 4,
    "hosting_mode": "single_runtime"
}

# Memory 설정 (하이브리드)
MEMORY_CONFIG = {
    "enabled": True,
    "strategies": [
        {
            "name": "shared_knowledge",
            "strategy": "shared",
            "backend": "bedrock-kb",
            "config": {
                "knowledge_base_id": "YOUR_KB_ID",
                "region": "ap-northeast-2",
                "description": "전체 사용자가 공유하는 지식베이스"
            }
        },
        {
            "name": "user_conversations",
            "strategy": "namespace",
            "backend": "dynamodb",
            "config": {
                "table_name": "agentcore-memory-conversations",
                "namespace_key": "user_id",
                "ttl_days": 30,
                "description": "사용자별 대화 히스토리"
            }
        }
    ]
}

# Gateway 설정
GATEWAY_CONFIG = {
    "enabled": True,
    "targets": [
        {
            "type": "bedrock-kb",
            "name": "knowledge_base",
            "knowledge_base_id": "YOUR_KB_ID",
            "region": "ap-northeast-2"
        }
    ]
}

# Identity 설정 (미사용)
IDENTITY_CONFIG = {
    "enabled": False
}

AGENTCORE_CONFIG = {
    "runtime": RUNTIME_CONFIG,
    "memory": MEMORY_CONFIG,
    "gateway": GATEWAY_CONFIG,
    "identity": IDENTITY_CONFIG
}
```

---

## 중요 체크리스트

### Runtime
- [ ] 전체 Agent 개수 확인 (`agent_count`)
- [ ] **1개 Runtime 원칙** 준수 (`hosting_mode: single_runtime`)
- [ ] 포트 번호 설정 (기본 8080)
- [ ] Health check 경로 설정 (`/ping`)

### Memory
- [ ] Memory 사용 여부 확인
- [ ] Namespace vs Shared 전략 선택
- [ ] Backend 선택 (DynamoDB, Redis, S3, Bedrock KB)
- [ ] TTL 설정 (필요 시)
- [ ] 하이브리드 전략 시 strategies 리스트 사용

### Gateway
- [ ] Gateway 사용 여부 확인
- [ ] Target 타입별 설정
  - Lambda: function_arn, protocol
  - MCP: server_url, transport, auth
  - OpenAPI: openapi_url, base_url, auth
  - Bedrock KB: knowledge_base_id
- [ ] 인증 정보는 환경 변수로 관리

### Identity
- [ ] Identity 사용 여부 확인
- [ ] OAuth2 Provider 정보 (Google, Microsoft 등)
- [ ] Scope 목록 확인
- [ ] Token 저장소 설정 (DynamoDB 권장)
- [ ] Gateway의 `auth.identity_provider`와 연동

### 보안
- [ ] 모든 민감 정보는 환경 변수 참조 (`_env` 접미사)
- [ ] ARN, URL은 주석으로 TODO 표시
- [ ] Token 저장소는 암호화 활성화 (DynamoDB)

---

## 환경 변수 템플릿

```bash
# Identity (OAuth2)
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"

# Gateway (MCP)
export SLACK_MCP_TOKEN="your-slack-token"

# AWS 리소스
export AWS_REGION="ap-northeast-2"
export KNOWLEDGE_BASE_ID="YOUR_KB_ID"
export DYNAMODB_MEMORY_TABLE="agentcore-memory"
```

---

## 배포 시 참고사항

1. **Runtime**: ECR에 Docker 이미지 푸시 후 AgentCore Runtime 생성
2. **Memory**: DynamoDB 테이블 사전 생성 필요
3. **Gateway**: Lambda 함수 또는 MCP 서버가 이미 배포된 상태여야 함
4. **Identity**: OAuth2 앱 등록 완료 후 Redirect URI 설정

**중요**: AgentCore Console에서 구성 검증 후 배포할 것
