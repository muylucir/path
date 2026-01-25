---
name: strands-agentcore
description: |
  Strands Agent SDK 코드 생성 및 AgentCore Runtime 배포를 위한 실제 구현 패턴 가이드.
  CodeGeneratorAgent가 코드 생성 시 이 스킬을 참조하여 올바른 패턴을 사용합니다.

  핵심 패턴:
  - BedrockAgentCoreApp + Lazy Initialization (30초 타임아웃 우회)
  - MCP Client 올바른 사용법 (lambda + context manager)
  - Memory 통합 (AgentCoreMemorySessionManager)
  - 조건부 엣지 (add_edge with condition)
license: Apache-2.0
metadata:
  version: "1.0"
  author: path-team
---

# Strands AgentCore 구현 가이드

이 스킬은 Strands Agent SDK를 사용하여 AgentCore Runtime에 배포 가능한 코드를 생성할 때 참조하는 실제 구현 패턴을 제공합니다.

## Quick Decision Table

| 요구사항 | 참조할 문서 | 핵심 포인트 |
|----------|-------------|-------------|
| AgentCore 배포 | `lazy-initialization.md` | BedrockAgentCoreApp + 지연 초기화 필수 |
| MCP 도구 통합 | `mcp-client-patterns.md` | `MCPClient(lambda: streamablehttp_client(...))` 패턴 |
| 워크플로우 분기 | `strands-agent-patterns.md` | `add_edge(..., condition=func)` 사용 |
| 메모리 활용 | `memory-integration.md` | AgentCoreMemorySessionManager |
| 배포 명령어 | `deployment-workflow.md` | agentcore CLI 사용법 |
| 에러 해결 | `troubleshooting.md` | 일반적인 문제와 해결책 |

## 필수 패턴: Lazy Initialization

AgentCore Runtime은 모듈 로드 시 30초 타임아웃이 있습니다. Agent, Model, MCP Client 등 무거운 객체는 반드시 **첫 호출 시점에 초기화**해야 합니다.

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# ===== Lazy Initialization 패턴 =====
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

# ===== BedrockAgentCoreApp 설정 =====
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict):
    agent = _initialize()
    message = payload.get("prompt", "Hello!")
    result = agent(message)
    return {"response": str(result)}
```

## LLM 모델 선택

AgentCore Runtime에서 사용 가능한 모델 (**이 두 가지만 사용!**):

| 모델 | Model ID | 용도 |
|------|----------|------|
| Claude Sonnet 4.5 | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | 주요 에이전트 (권장) |
| Claude Haiku 4.5 | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | 빠른 응답, 간단한 작업 |

**주의**: `us.anthropic.*` 모델 ID는 사용 금지! 반드시 `global.anthropic.*` 사용.

## 파일 구조

```
project/
├── main.py              # BedrockAgentCoreApp + entrypoint
├── tools.py             # @tool 함수 및 MCP Client 설정
├── agentcore_config.py  # AgentCore 서비스 설정 (Memory, Identity 등)
├── requirements.txt     # 의존성
└── agentcore.yaml       # 배포 설정 (선택)
```

## 필수 Dependencies

```
strands-agents>=0.1.0
strands-agents-tools>=0.1.0
bedrock-agentcore>=0.1.0
```

## Available References

| Reference | 설명 |
|-----------|------|
| `lazy-initialization.md` | Lazy Init 패턴 상세 (Basic, MCP, Memory, Async) |
| `strands-agent-patterns.md` | Agent, Graph, Multi-Agent 패턴 |
| `mcp-client-patterns.md` | MCP Client 올바른 사용법 (stdio, sse/http) |
| `memory-integration.md` | AgentCore Memory 통합 (5가지 전략: Semantic, UserPreference, Summary, Episodic, Custom) |
| `deployment-workflow.md` | CLI 명령어 및 배포 단계 |
| `troubleshooting.md` | 일반적인 에러 및 해결법 |

## Key Principles

1. **1 Runtime 원칙**: Multi-Agent Graph 전체를 단일 Runtime에 배포
2. **Lazy Initialization**: 첫 호출 시까지 무거운 초기화 지연 (30초 타임아웃 우회)
3. **No FastAPI**: BedrockAgentCoreApp만 사용 (uvicorn 금지)
4. **MCP Client 패턴**: 반드시 `lambda` + context manager 사용
5. **올바른 패키지명**: `strands-agents`, `strands-agents-tools`, `bedrock-agentcore`
6. **조건부 엣지 API**: `add_edge(..., condition=func)` 사용 (add_conditional_edge 없음)
