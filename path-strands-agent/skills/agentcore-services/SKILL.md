---
name: agentcore-services
description: Amazon Bedrock AgentCore 서비스 가이드 - Runtime, Memory, Gateway, Browser, Code Interpreter, Identity 서비스 개요와 선택 가이드. 상세 구현은 references/ 참조.
license: Apache-2.0
metadata:
  version: "2.0"
  author: path-team
---

# Amazon Bedrock AgentCore Services Guide

AgentCore는 AI Agent 개발, 배포, 관리를 가속화하는 관리형 서비스 모음입니다.

## 서비스 개요

| 서비스 | 용도 | Reference |
|--------|------|-----------|
| **Runtime** | 서버리스 Agent 호스팅, 자동 스케일링 | `runtime.md` |
| **Memory** | STM/LTM 기반 대화 기억 | `memory.md` |
| **Gateway** | MCP 서버 변환, Lambda/API 도구화 | `gateway.md` |
| **Browser** | 관리형 Chrome, 웹 자동화 | `browser.md` |
| **Code Interpreter** | 안전한 Python 코드 실행 | `code-interpreter.md` |
| **Identity** | OAuth 2.0, Token Vault, 위임 인증 | `identity.md` |

## AWS 서비스 통합 Quick Decision

Agent에서 AWS 서비스 호출 시 **직접 호출 vs Lambda + Gateway** 결정:

| 기준 | 직접 호출 (boto3) | Lambda + Gateway |
|------|------------------|------------------|
| 작업 특성 | 동기, 단순 | 비동기, 복잡 |
| 재사용 | 단일 Agent | 여러 Agent |
| 예시 | S3 읽기, DynamoDB 조회 | Transcribe STT, RAG 검색 |

**⚠️ 필수 규칙:**
| AWS 서비스 | 통합 방식 | 비고 |
|-----------|----------|------|
| **S3 읽기/쓰기** | 직접 호출 (boto3) | **필수** - Lambda MCP 금지 |
| **Bedrock Knowledge Base** | 직접 호출 (boto3) | **필수** - Gateway 불필요 |
| **DynamoDB 단순 조회** | 직접 호출 (boto3) | 권장 |
| **Transcribe** | Lambda + Gateway | 비동기, 폴링 필요 |
| **Slack/Email** | Lambda + Gateway | 외부 API, 인증 필요 |

**서비스별 권장:**
- **RAG**: Bedrock KB (직접) / OpenSearch, Pinecone (Gateway)
- **AI/ML**: Comprehend 단일 (직접) / Transcribe, 배치 분석 (Gateway)
- **Storage**: S3 단순 (직접) / 트랜잭션, 대용량 (Gateway)

상세: `aws-service-integration.md`

## Runtime Quick Decision (중요)

**⚠️ 핵심 특징:**

| 항목 | 값 |
|------|-----|
| **최대 실행 시간** | 8시간 (비동기 워크로드) |
| **페이로드 크기** | 100MB (멀티모달) |
| **콜드 스타트** | 200ms |
| **세션 격리** | Firecracker MicroVM |

**프로토콜 선택:**
| 프로토콜 | 포트 | 용도 |
|----------|------|------|
| HTTP | 8080 | 표준 요청-응답, SSE 스트리밍 |
| MCP | 8000 | 도구 액세스 (표준 MCP SDK 호환) |
| A2A | 9000 | 에이전트 간 협업 |

**배포 방식:**
- **Starter Toolkit (권장)**: `agentcore configure` → `agentcore launch`
- **FastAPI 직접 구현**: /invocations, /ping 엔드포인트 구현

상세: `runtime.md`

## Multi-Agent 배포 (중요)

**모범 사례**: 1개의 Runtime에서 전체 Multi-Agent Graph 호스팅

| 측면 | 1개 Runtime (권장) | Agent별 Runtime (비권장) |
|------|-------------------|------------------------|
| 비용 | 1개 요금 | N배 요금 |
| 레이턴시 | 메모리 내 통신 | HTTP 오버헤드 |
| 관리 | 단일 배포 | 버전 동기화 필요 |

상세: `multi-agent-deployment.md`

## Memory Quick Decision (중요)

**⚠️ STM vs LTM 핵심 차이:**

| 구분 | STM (Short-term) | LTM (Long-term) |
|------|------------------|-----------------|
| **Namespace** | ❌ 불가 | ✅ 커스텀 가능 |
| **구조** | `memory_id/actor_id/session_id` 3계층만 | Namespace 기반 계층 (`/users/{actorId}/...`) |
| **메모리 전략** | ❌ 불가 (`strategies=[]`) | ✅ Semantic/UserPreference/Summary/Episodic |
| **TTL** | 필수 (1-365일) | 없음 (영구 저장) |

**⚠️ 필수 규칙:**
- STM 사용 시 **커스텀 Namespace 경로 사용 금지** (예: `/sessions/abc/data` ❌)
- STM은 `memory_id`, `actor_id`, `session_id` 3개 식별자로만 데이터 격리
- Namespace와 메모리 전략(Semantic 등)은 **LTM 전용**

상세: `memory.md`

## Quick Start

### Runtime 배포
```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent

app = BedrockAgentCoreApp()
agent = Agent(model="us.anthropic.claude-3-7-sonnet-20250219-v1:0")

@app.entrypoint
def invoke(payload, context):
    return agent(payload.get("prompt")).message['content'][0]['text']
```

### Memory 통합
```python
from bedrock_agentcore.memory.integrations.strands.session_manager import (
    AgentCoreMemorySessionManager
)

session_manager = AgentCoreMemorySessionManager(
    agentcore_memory_config=config,
    region_name="us-west-2"
)
agent = Agent(session_manager=session_manager)
```

## Available References

상세 구현 가이드가 필요하면 `skill_tool`로 로드:

- `runtime.md` - 서버리스 배포, entrypoint, 제약사항
- `memory.md` - STM/LTM, 4가지 전략, Strands 통합, Memory Forking
- `gateway.md` - MCP Gateway 생성, Lambda 도구 추가
- `browser.md` - 웹 자동화, 지원 기능
- `code-interpreter.md` - Python 코드 실행, 샌드박스
- `identity.md` - OAuth 2LO/3LO, Token Vault, 보안 모범 사례
- `multi-agent-deployment.md` - 1개 Runtime으로 Multi-Agent 호스팅
- `aws-service-integration.md` - AWS 서비스 통합 패턴 (직접 호출 vs Lambda+Gateway)

**사용 예시:**
```
skill_tool(skill_name="agentcore-services", reference="memory.md")
```

## 공통 제약사항

| 서비스 | 주요 제한 |
|--------|----------|
| Runtime | 실행 8시간, 페이로드 100MB, 동시 1000개 |
| Memory | 세션당 100MB, 전략 5개 |
| Gateway | 도구 50개, TPS 100 |
| Browser | 세션 10분, 동시 10개 |
| Code Interpreter | 타임아웃 5분, 메모리 2GB |
| Identity | Workload 100개, 스코프 10개 |
