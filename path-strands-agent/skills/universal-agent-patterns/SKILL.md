---
name: universal-agent-patterns
description: 프레임워크 독립적 Agent 설계 패턴 가이드. ReAct, Reflection, Tool Use, Planning, Multi-Agent, Human-in-the-Loop 패턴 개요와 선택 가이드.
license: Apache-2.0
metadata:
  version: "1.0"
  author: path-team
---

# Universal Agent Design Patterns

프레임워크에 독립적인 AI Agent 설계 패턴 가이드입니다.
특정 SDK(Strands, LangGraph, CrewAI 등)에 종속되지 않는 추상적 개념을 다룹니다.

## 패턴 개요

| 패턴 | 개념 | 적합한 상황 | Reference |
|------|------|-------------|-----------|
| **ReAct** | Think -> Act -> Observe -> Repeat | 단계적 추론 + 도구 사용 | `react-pattern.md` |
| **Reflection** | 생성 -> 검토 -> 개선 반복 | 높은 품질의 콘텐츠 생성 | `reflection-pattern.md` |
| **Tool Use** | 외부 도구/API 호출 | 데이터 접근, 시스템 연동 | `tool-use-pattern.md` |
| **Planning** | 작업 분해 -> 순차 실행 | 복잡한 다단계 작업 | `planning-pattern.md` |
| **Multi-Agent** | 전문화된 에이전트 협업 | 다른 전문성, 병렬 처리 | `multi-agent-pattern.md` |
| **Human-in-the-Loop** | 제안 -> 검토 -> 실행 | 중요 결정, 규정 준수 | `human-in-loop-pattern.md` |

## 패턴 선택 가이드

| 요구사항 | 추천 패턴 |
|---------|----------|
| 복잡한 질문에 정보 검색 필요 | ReAct |
| 출력 품질 개선 필요 | Reflection |
| 외부 시스템 연동 | Tool Use |
| 순차적 다단계 작업 | Planning |
| 병렬 처리 또는 다른 전문성 | Multi-Agent |
| 사람 검토 필수 | Human-in-the-Loop |

## 패턴 조합 예시

복잡한 문제는 여러 패턴을 조합하여 해결합니다:

| 조합 | 설명 | 사용 사례 |
|------|------|----------|
| **ReAct + Tool Use** | 추론하면서 도구 활용 | 정보 검색 후 분석 |
| **Planning + Multi-Agent** | 계획 후 전문 에이전트 배분 | 복잡한 프로젝트 실행 |
| **Reflection + Human-in-the-Loop** | 자동 개선 후 최종 검토 | 문서 작성, 코드 리뷰 |
| **Multi-Agent + Reflection** | 협업 후 품질 검증 | 콘텐츠 생성 파이프라인 |

## Quick Reference

### 단순 작업 -> 복잡한 작업

```
단일 Agent (Tool Use)
    |
    v
ReAct (추론 + 도구)
    |
    v
Planning (작업 분해)
    |
    v
Multi-Agent (전문가 협업)
```

### 품질 요구사항별

```
낮음 -> 단일 Agent
중간 -> Reflection
높음 -> Reflection + Human-in-the-Loop
```

## Available References

상세 구현 가이드가 필요하면 `skill_tool`로 로드:

- `react-pattern.md` - ReAct 상세 설계 (Think-Act-Observe 사이클)
- `reflection-pattern.md` - Reflection 상세 설계 (품질 검증 루프)
- `tool-use-pattern.md` - Tool Use 상세 설계 (도구 정의, 호출 전략)
- `planning-pattern.md` - Planning 상세 설계 (작업 분해, 실행 전략)
- `multi-agent-pattern.md` - Multi-Agent 상세 설계 (역할 분담, 협업 방식)
- `human-in-loop-pattern.md` - Human-in-the-Loop 상세 설계 (개입 시점, 승인 흐름)
- `state-management.md` - Agent 간 상태 관리 전략

**사용 예시:**
```
skill_tool(skill_name="universal-agent-patterns", reference="react-pattern.md")
```

## Best Practices

1. **단순함 우선**: 가장 단순한 패턴으로 시작, 필요시 복잡한 패턴 적용
2. **명확한 역할 정의**: 각 Agent의 역할과 책임을 명확히 정의
3. **상태 최소화**: Agent 간 공유 상태를 최소화하여 복잡도 감소
4. **실패 처리**: 각 단계의 실패 시 대응 전략 수립
5. **테스트 가능성**: 개별 Agent 단위로 테스트 가능하도록 설계
