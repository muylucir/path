---
name: strands-agent-patterns
description: Strands Agent 핵심 패턴 가이드 - Graph, Agent-as-Tool, Reflection, Planning, Multi-Agent 패턴 개요와 선택 가이드. 상세 구현은 references/ 참조.
license: Apache-2.0
metadata:
  version: "2.0"
  author: path-team
---

# Strands Agent Patterns Guide

Strands Agent의 5가지 핵심 패턴 개요와 선택 가이드를 제공합니다.

**중요: LLM은 Claude Sonnet/Haiku 4.5만 사용**

## 패턴 개요

| 패턴 | 용도 | Reference |
|------|------|-----------|
| **Graph Pattern** | 결정론적 워크플로우, 노드 기반 실행 | `graph-pattern.md` |
| **Agent-as-Tool** | Agent를 다른 Agent의 도구로 사용 | `agent-as-tool.md` |
| **Reflection** | 출력 검증 및 자가 개선 | `reflection-pattern.md` |
| **Planning** | 복잡한 작업의 단계별 분해 | `planning-pattern.md` |
| **Multi-Agent** | 여러 Agent 협업, 병렬 처리 | `multi-agent-pattern.md` |

## 패턴 선택 가이드

| 요구사항 | 추천 패턴 |
|---------|----------|
| 순차적 작업 흐름 | Planning Pattern |
| 품질 검증 필요 | Reflection Pattern |
| 병렬 데이터 수집 | Multi-Agent Pattern |
| 조건부 분기 | Graph + Conditional Edges |
| 전문 도구 호출 | Agent-as-Tool Pattern |
| 복합 워크플로우 | Graph + Multi-Agent 조합 |

## Quick Start

기본 Graph 구조:
```python
from strands import Agent
from strands.multiagent import GraphBuilder

agent1 = Agent(name="agent1", system_prompt="...")
agent2 = Agent(name="agent2", system_prompt="...")

builder = GraphBuilder()
builder.add_node(agent1, "node1")
builder.add_node(agent2, "node2")
builder.add_edge("node1", "node2")
builder.set_entry_point("node1")

graph = builder.build()
result = graph("Your task here")
```

## Available References

상세 구현 가이드가 필요하면 `skill_tool`로 로드:

- `graph-pattern.md` - Graph 기반 워크플로우 상세 (토폴로지, 조건부 분기, 피드백 루프)
- `agent-as-tool.md` - Agent를 도구로 사용하는 방법
- `reflection-pattern.md` - 자기 검증 패턴 구현
- `planning-pattern.md` - 계획 수립 패턴 (동적 Planning 포함)
- `multi-agent-pattern.md` - 다중 에이전트 협업 (Swarm, Invocation State)
- `code-templates.md` - 복사해서 사용할 코드 템플릿

**사용 예시:**
```
skill_tool(skill_name="strands-agent-patterns", reference="graph-pattern.md")
```

## Best Practices

1. 명확한 노드 ID 사용
2. 순환 구조 제한 설정: `set_max_node_executions()`
3. 실행 타임아웃 설정: `set_execution_timeout()`
4. 독립 작업은 병렬 처리
5. 노드 실패 처리 고려
