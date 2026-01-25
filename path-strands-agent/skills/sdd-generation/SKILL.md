---
name: sdd-generation
description: PATH 기반 스펙 기반 개발(SDD) 문서 생성 가이드. requirements.md, design.md, tasks.md, steering docs 생성을 위한 템플릿과 가이드라인.
license: Apache-2.0
metadata:
  version: "1.0"
  author: path-team
---

# SDD Generation Guide

PATH Agent Designer 명세서를 기반으로 스펙 기반 개발(SDD) 문서를 생성합니다.

## 생성 문서

| 문서 | 용도 | Reference |
|------|------|-----------|
| **requirements.md** | EARS 표기법 요구사항 | `template-requirements.md` |
| **design.md** | 아키텍처, 인터페이스, 테스팅 전략 | `template-design.md` |
| **tasks.md** | 구현 계획, 체크박스 | `template-tasks.md` |
| **steering** | structure.md, tech.md, product.md | `template-steering.md` |

## 생성 순서 (파이프라인)

```
PATH spec.md
     │
     ▼
[Stage 1] → requirements.md (EARS 표기법 요구사항)
     │
     ▼
[Stage 2] → design.md (아키텍처 + 테스팅)
     │
     ▼
[Stage 3] → tasks.md (구현 계획)
     │
     ▼
[Stage 4] → structure.md, tech.md, product.md (Steering)
```

각 Stage는 이전 Stage의 출력을 입력으로 사용합니다.

## 핵심 원칙

1. **모든 문서는 한글로 작성** (코드/기술 용어는 영어 유지)
2. **PATH 명세서 7개 섹션 구조** 참조
3. **EARS 표기법**: "WHEN [조건], THEN the System SHALL [행동]"
4. **Strands SDK 패턴** 준수 (Agent, Graph, TypedDict)
5. **AgentCore 항상 포함** (기본 배포 태스크 생성)

## PATH 명세서 섹션 → SDD 문서 매핑

| PATH 섹션 | requirements.md | design.md | tasks.md | steering |
|-----------|-----------------|-----------|----------|----------|
| 1. Executive Summary | Introduction | Overview | - | product.md |
| 2. Agent Components | Agent Behavior | Interfaces | Phase 2 | structure.md |
| 3. AgentCore | Infra Reqs | Config | Phase 4 | tech.md |
| 4. Architecture | - | 다이어그램 복사 | - | structure.md |
| 5. Problem Decomposition | Functional | Data Flow | Process | product.md |
| 6. Risks | Non-functional | Error Handling | Mitigation | tech.md |
| 7. Next Steps | - | - | Phase 구조 | - |

## Available References

상세 템플릿이 필요하면 `skill_tool`로 로드:

- `template-requirements.md` - Requirements 생성 전체 템플릿
- `template-design.md` - Design 생성 전체 템플릿
- `template-tasks.md` - Tasks 생성 전체 템플릿
- `template-steering.md` - Steering 생성 전체 템플릿
- `template-development.md` - 개발 시작 가이드

**사용 예시:**
```
skill_tool(skill_name="sdd-generation", reference="template-requirements.md")
```

## User Story 주체 (Agent 전용)

일반 웹앱과 달리 AI Agent 시스템에서는 다음 주체 사용:

- **Agent Operator**: Agent를 배포하고 운영하는 사람
- **External System**: Agent를 호출하는 외부 시스템
- **[Agent Name] Agent**: 특정 Agent 자체

## 테스팅 전략

| 단계 | 도구 | 용도 |
|------|------|------|
| Unit | pytest + Mock LLM | 개별 Agent 테스트 |
| Integration | pytest + 실제 MCP | Graph 실행 테스트 |
| E2E | pytest + 실제 LLM | 전체 워크플로우 |

## Best Practices

1. PATH 명세서의 Mermaid 다이어그램은 **그대로 복사** (재생성 금지)
2. 각 Agent에 대해 **TypedDict** 입출력 스키마 정의
3. Graph 구조는 design.md의 명세를 **정확히** 따를 것
4. Checkpoint 태스크로 각 Phase 끝에 검증 포인트
5. Human-in-Loop는 mode가 "Collaborate" 또는 "Supervised"일 때만 포함
