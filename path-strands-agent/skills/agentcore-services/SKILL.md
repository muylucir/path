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
| **Memory** | STM/LTM 기반 대화 기억, 3계층 격리 | `memory.md` |
| **Gateway** | MCP 서버 변환, Lambda/API 도구화 | `gateway.md` |
| **Browser** | 관리형 Chrome, 웹 자동화 | `browser.md` |
| **Code Interpreter** | 안전한 Python 코드 실행 | `code-interpreter.md` |
| **Identity** | OAuth 2.0, Token Vault, 위임 인증 | `identity.md` |

## Multi-Agent 배포 (중요)

**모범 사례**: 1개의 Runtime에서 전체 Multi-Agent Graph 호스팅

| 측면 | 1개 Runtime (권장) | Agent별 Runtime (비권장) |
|------|-------------------|------------------------|
| 비용 | 1개 요금 | N배 요금 |
| 레이턴시 | 메모리 내 통신 | HTTP 오버헤드 |
| 관리 | 단일 배포 | 버전 동기화 필요 |

상세: `multi-agent-deployment.md`

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

**사용 예시:**
```
skill_tool(skill_name="agentcore-services", reference="memory.md")
```

## 공통 제약사항

| 서비스 | 주요 제한 |
|--------|----------|
| Runtime | 타임아웃 15분, 동시 1000개 |
| Memory | 세션당 100MB, 전략 5개 |
| Gateway | 도구 50개, TPS 100 |
| Browser | 세션 10분, 동시 10개 |
| Code Interpreter | 타임아웃 5분, 메모리 2GB |
| Identity | Workload 100개, 스코프 10개 |
