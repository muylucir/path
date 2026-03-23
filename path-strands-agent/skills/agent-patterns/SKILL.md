---
name: agent-patterns
description: AI Agent 설계 패턴 종합 가이드. 3계층 택소노미(Agent Pattern × LLM Workflow × Agentic Workflow)를 통해 자동화 수준 판단, 에이전트 유형 선택, 인지 패턴 설계, 멀티 에이전트 협업 구조를 포함.
license: Apache-2.0
metadata:
  version: "4.0"
  author: path-team
---

# Agent Design Patterns — 3-Layer Taxonomy

프레임워크에 독립적인 AI Agent 설계 패턴 가이드입니다.
에이전트 시스템은 3개 계층의 조합으로 설계합니다:

```
Layer 1: Agent Pattern    — 어떤 유형의 에이전트인가?
Layer 2: LLM Workflow      — 에이전트 내부에서 어떻게 추론하는가?
Layer 3: Agentic Workflow  — 여러 에이전트가 어떻게 협업하는가?
```

에이전트 시스템의 핵심 원칙 (3A):
- **Asynchronous** — 느슨하게 결합된 이벤트 기반 환경에서 동작
- **Autonomy** — 외부 개입 없이 독립적으로 판단하고 행동
- **Agency** — 사용자 목표를 향해 목적 지향적으로 행동

---

## 자동화 수준 선택 (최우선 판단)

패턴 선택 전에, Feasibility 평가의 **자율성 요구도 점수**를 기반으로 자동화 수준을 먼저 결정합니다:

| 자율성 점수 | 자동화 수준 | 설명 | 구현 방향 |
|:-----------:|:----------:|------|----------|
| **≤5** | AI-Assisted Workflow | 결정적 파이프라인 + 특정 단계에서 AI 활용 | 워크플로우 엔진이 전체 흐름 제어, AI는 보조 역할 |
| **≥6** | Agentic AI | 에이전트가 자율적으로 도구 선택, 판단, 반복 | LLM 기반 에이전트가 동적으로 경로 결정 |

### AI-Assisted Workflow (자율성 ≤5)
- **핵심**: 전체 흐름은 코드/워크플로우 엔진이 제어, AI는 개별 단계에서만 활용
- **적합 패턴**: Sequential Pipeline, Fan-out/Fan-in, Conditional Pipeline
- **구현**: 워크플로우 엔진, DAG 기반 오케스트레이터, 또는 코드 기반 파이프라인 + LLM API 호출
- **AI 통합 포인트**: 분류/라우팅, 추출/변환, 생성/요약, 검증/평가
- **참조**: `pipeline-patterns.md`

### Agentic AI (자율성 ≥6)
- **핵심**: 에이전트가 상황에 따라 도구와 경로를 동적으로 선택
- **구현**: 아래 3계층 택소노미를 통해 설계

> **중요**: AI-Assisted Workflow는 "열등한" 선택이 아닙니다. 예측 가능성, 디버깅 용이성, 낮은 운영 리스크 측면에서 Agentic AI보다 유리할 수 있습니다.

---

## Layer 1: Agent Patterns (에이전트 유형)

에이전트의 **기본 구조와 상호작용 방식**을 정의합니다. 각 유형은 인지(Perception), 추론(Reasoning), 행동(Action)의 삼각형을 다르게 조합합니다.

| # | Agent Pattern | 핵심 개념 | 복잡도 | Reference |
|---|--------------|---------|:-----:|-----------|
| 1 | **Basic Reasoning** | LLM에 프롬프트를 보내고 응답 받기. 상태/도구 없음 | 낮음 | — |
| 2 | **RAG (Retrieval-Augmented)** | 외부 지식소스 검색 → 컨텍스트 증강 → 응답 생성 | 낮음 | `rag-agent.md` |
| 3 | **Tool-based (Functions)** | LLM이 도구 선택/호출하고 결과를 추론에 활용하는 루프 | 중간 | `tool-agent.md` |
| 4 | **Tool-based (Servers)** | 도구 실행을 외부 서버에 위임. MCP 등 원격 도구 프로토콜 | 중간 | `tool-server-agent.md` |
| 5 | **Computer-use** | 브라우저/터미널/IDE 등 디지털 환경을 VLM으로 관찰/조작 | 높음 | — |
| 6 | **Coding** | IDE 컨텍스트를 읽고 코드를 생성/수정하는 개발 에이전트 | 중간 | `coding-agent.md` |
| 7 | **Speech & Voice** | STT → LLM 추론 → TTS 파이프라인으로 음성 대화 | 중간 | — |
| 8 | **Memory-augmented** | 단기/장기 메모리로 세션 간 컨텍스트 유지, 학습 | 중간 | `memory-agent.md` |
| 9 | **Observer & Monitoring** | 시스템 텔레메트리를 수동 관찰, 이상 감지, 알림 | 중간 | `observer-agent.md` |
| 10 | **Simulation & Test-bed** | 가상 환경에서 행동 시뮬레이션, 정책 학습 | 높음 | — |

### Agent Pattern 선택 기준

| 요구사항 | 추천 Agent Pattern |
|---------|------------------|
| 단순 Q&A, 분류, 요약 | Basic Reasoning |
| 도메인 지식 기반 응답 | RAG |
| 외부 API/DB 연동 | Tool-based (Functions) |
| 원격 도구 서버, MCP 연동 | Tool-based (Servers) |
| 브라우저/GUI 자동화 | Computer-use |
| 코드 생성/수정/디버깅 | Coding |
| 음성 인터페이스 | Speech & Voice |
| 과거 상호작용 기억 필요 | Memory-augmented |
| 시스템 모니터링/이상 감지 | Observer & Monitoring |
| 정책 학습/시나리오 테스트 | Simulation & Test-bed |

---

## Layer 2: LLM Workflows (인지 패턴)

에이전트 **내부의 추론 방식**을 정의합니다. LLM을 어떻게 호출하고 결과를 처리하는가의 패턴입니다.

| # | LLM Workflow | 개념 | 적합 상황 | Reference |
|---|-------------|------|---------|-----------|
| 1 | **ReAct** | Think → Act → Observe 반복 | 정보 검색, 단계적 추론 | `react-pattern.md` |
| 2 | **Reflection** | 생성 → 평가 → 개선 반복 | 고품질 출력, 자기 개선 | `reflection-pattern.md` |
| 3 | **Planning** | 목표 분해 → 순차/병렬 실행 | 복잡한 다단계 작업 | `planning-pattern.md` |
| 4 | **Prompt Chaining** | 순차적 LLM 호출 체인. 이전 출력이 다음 입력 | 구조화된 변환, 단계적 분석 | `prompt-chaining.md` |
| 5 | **Routing** | LLM이 의도 분류 → 전문 처리기로 라우팅 | 멀티도메인 어시스턴트, 분류 기반 처리 | `routing-pattern.md` |
| 6 | **Parallelization** | 독립 서브태스크를 병렬 LLM 호출 → 결과 집계 | 대량 문서 분석, 다관점 평가 | `parallelization.md` |
| 7 | **Human-in-the-Loop** | 자율 작업 → 체크포인트 → 사람 검토 → 계속 | 고위험 결정, 규정 준수 | `human-in-loop-pattern.md` |

### LLM Workflow 선택 기준

| 요구사항 | 추천 LLM Workflow |
|---------|-----------------|
| 정보 검색 + 추론 | ReAct |
| 출력 품질 보장 | Reflection |
| 복잡한 작업 분해 | Planning |
| 순차적 변환/분석 | Prompt Chaining |
| 의도 분류 → 분기 처리 | Routing |
| 독립 작업 병렬 처리 | Parallelization |
| 사람 승인/검토 필요 | Human-in-the-Loop |

---

## Layer 3: Agentic Workflow Patterns (시스템 협업)

**여러 에이전트(또는 LLM 호출)가 어떻게 조율되는가**의 패턴입니다.

### 싱글 vs 멀티 에이전트 판단

| 조건 | 싱글 에이전트 | 멀티 에이전트 |
|------|:----------:|:----------:|
| PROCESS 단계 | ≤3 | 4+ |
| 도구/연동 수 | 1-2 | 3+ |
| 전문성 분리 | 불필요 | 필요 |
| 병렬 처리 | 불필요 | 필요 |
| 의사결정 | 단순 | 복잡/다단계 |

### 멀티 에이전트 협업 패턴

| # | Pattern | 구조 | 적합 상황 | Reference |
|---|---------|------|---------|-----------|
| 1 | **Agents as Tools** | Orchestrator → 전문 Sub-agents | 독립적 서브태스크 분해 | `multi-agent-pattern.md` |
| 2 | **Swarm** | 동등한 에이전트 간 핸드오프 | 브레인스토밍, 반복적 개선 | `multi-agent-pattern.md` |
| 3 | **Graph** | 방향성 그래프로 흐름 정의 | 복잡한 조건부/계층적 흐름 | `multi-agent-pattern.md` |
| 4 | **Workflow** | 사전 정의된 순차 파이프라인 | 명확한 단계별 프로세스 | `multi-agent-pattern.md` |

### 시스템 수준 조합 패턴

대규모 시스템에서 에이전트들을 조율하는 아키텍처 패턴입니다:

| # | Pattern | 전통 아키텍처 대응 | 에이전틱 진화 | Reference |
|---|---------|:---------------:|-----------|-----------|
| 1 | **Saga Orchestration** | 중앙 코디네이터 기반 트랜잭션 | 오케스트레이터 에이전트가 역할별 워커 에이전트 조율 | `saga-orchestration.md` |
| 2 | **Scatter-Gather** | 팬아웃/팬인 메시징 | 병렬 LLM/에이전트 호출 → 지능적 결과 합성 | `scatter-gather.md` |
| 3 | **Dynamic Dispatch** | 이벤트 규칙 기반 라우팅 | LLM이 의미 기반으로 에이전트/도구 동적 선택 | `routing-pattern.md` |
| 4 | **Evaluator Loop** | 피드백 제어 루프 | Generator-Evaluator 반복적 품질 개선 | `reflection-pattern.md` |
| 5 | **Prompt Chaining Saga** | 이벤트 코레오그래피 | 각 LLM 추론 단계가 독립 트랜잭션, 반성적 롤백 | `prompt-chaining.md` |

---

## 3계층 통합 선택 흐름

```
자율성 요구도 확인
    │
    ├─ ≤5: AI-Assisted Workflow
    │       ├─ 순차 처리 → Sequential Pipeline
    │       ├─ 병렬 분석 → Fan-out/Fan-in
    │       ├─ AI 판단 분기 → Conditional Pipeline
    │       └─ 이벤트 반응 → Event-driven Pipeline
    │
    └─ ≥6: Agentic AI
            │
            ├─ Layer 1: Agent Pattern 선택
            │       └─ RAG / Tool-based / Coding / Memory / Observer / ...
            │
            ├─ Layer 2: LLM Workflow 선택
            │       └─ ReAct / Reflection / Planning / Routing / ...
            │
            └─ Layer 3: Agentic Workflow 선택
                    │
                    ├─ PROCESS ≤3, 도구 1-2개
                    │       └─ 싱글 에이전트 (Layer 2 워크플로만 적용)
                    │
                    └─ PROCESS 4+, 도구 3+, 전문성 분리
                            ├─ 독립적 서브태스크 → Agents as Tools
                            ├─ 협업/반복 개선 → Swarm
                            ├─ 계층적/조건부 흐름 → Graph
                            └─ 순차 파이프라인 → Workflow
```

## 패턴 조합 예시

실제 에이전트는 3계층을 조합하여 설계합니다:

| 사례 | Layer 1 | Layer 2 | Layer 3 |
|------|---------|---------|---------|
| 고객지원 봇 | RAG + Tool-based | ReAct + Routing | 싱글 에이전트 |
| 코드 리뷰 시스템 | Coding + Memory | Reflection + Planning | Agents as Tools |
| 연구 보고서 생성 | RAG + Tool-based | Prompt Chaining | Scatter-Gather |
| 실시간 인프라 감시 | Observer + Tool-based | ReAct + Human-in-Loop | Graph |
| 콘텐츠 생성 파이프라인 | Memory + Tool-based | Reflection | Swarm |
| 데이터 ETL + 분석 | Tool-based (Servers) | Planning + Parallelization | Workflow |
| 계약서 검토 자동화 | RAG + Memory | Prompt Chaining + Reflection | Graph + Human-in-Loop |

## Quick Reference

### 자동화 수준별

```
AI-Assisted Workflow (자율성 ≤5)
    ├─ Sequential Pipeline (순차)
    ├─ Fan-out/Fan-in (병렬 분석)
    ├─ Conditional Pipeline (AI 판단 분기)
    └─ Event-driven Pipeline (이벤트 반응)

Agentic AI (자율성 ≥6)
    ├─ 싱글 Agent + LLM Workflow
    │   ├─ ReAct (추론 + 도구)
    │   ├─ Reflection (자기 개선)
    │   ├─ Planning (작업 분해)
    │   ├─ Prompt Chaining (순차 변환)
    │   └─ Routing (의도 분류)
    │
    └─ 멀티 Agent + Agentic Workflow
        ├─ Agents as Tools (계층적 위임)
        ├─ Swarm (피어-투-피어 협업)
        ├─ Graph (조건부 흐름 제어)
        └─ Workflow (순차 파이프라인)
```

### 품질 요구사항별

```
낮음  → 싱글 Agent + Basic Reasoning
중간  → 싱글 Agent + Reflection
높음  → 멀티 Agent + Reflection + Human-in-the-Loop
```

## Available References

상세 구현 가이드가 필요하면 `skill_tool`로 로드:

### Layer 1: Agent Patterns
- `rag-agent.md` — RAG 설계 (검색 전략, 컨텍스트 증강, 재순위화)
- `tool-agent.md` — Tool Use 설계 (도구 정의, 호출 전략, 결과 통합)
- `tool-server-agent.md` — Tool Server/MCP 설계 (원격 도구 프로토콜, 격리 실행)
- `coding-agent.md` — Coding Agent 설계 (환경 컨텍스트, 코드 생성/수정)
- `memory-agent.md` — Memory Agent 설계 (STM/LTM, 메모리 주입 전략)
- `observer-agent.md` — Observer Agent 설계 (텔레메트리 수집, 이상 감지)

### Layer 2: LLM Workflows
- `react-pattern.md` — ReAct 상세 (Think-Act-Observe 사이클)
- `reflection-pattern.md` — Reflection 상세 (Generator-Critic 루프)
- `planning-pattern.md` — Planning 상세 (작업 분해, Static/Dynamic Planning)
- `prompt-chaining.md` — Prompt Chaining 상세 (순차 LLM 체인, 롤백)
- `routing-pattern.md` — Routing 상세 (의도 분류, 동적 디스패치)
- `parallelization.md` — Parallelization 상세 (분산 처리, 결과 합성)

### Layer 3: Agentic Workflows
- `multi-agent-pattern.md` — 멀티 에이전트 상세 (Agents as Tools, Swarm, Graph, Workflow)
- `saga-orchestration.md` — Saga Orchestration 상세 (중앙 오케스트레이터, 보상 트랜잭션)
- `scatter-gather.md` — Scatter-Gather 상세 (병렬 분산, 결과 집계)

### Cross-cutting
- `human-in-loop-pattern.md` — Human-in-the-Loop 상세 (체크포인트, 승인 흐름)
- `state-management.md` — 상태 관리 전략 (Session/Shared/Persistent State)
- `pipeline-patterns.md` — AI-Assisted Workflow 파이프라인 패턴 상세

**사용 예시:**
```
skill_tool(skill_name="agent-patterns", reference="react-pattern.md")
```

## Best Practices

1. **자동화 수준 먼저**: 자율성 요구도로 AI-Assisted Workflow vs Agentic AI 결정
2. **3계층 조합**: Agent Pattern × LLM Workflow × Agentic Workflow를 명시적으로 선택
3. **단순함 우선**: 가장 단순한 조합으로 시작, 필요시 복잡한 패턴으로 확장
4. **패턴은 조합 가능**: 실제 에이전트는 여러 패턴을 혼합 (예: RAG + ReAct + Graph)
5. **역할 명확화**: 각 Agent는 하나의 명확한 책임을 가짐
6. **상태 최소화**: Agent 간 공유 상태를 최소화하여 복잡도 감소
7. **실패 처리**: 각 단계의 실패 시 대응 전략 수립 (재시도, 폴백, 에스컬레이션)
8. **점진적 복잡화**: AI-Assisted → 싱글 에이전트 → 멀티 에이전트 순으로 확장
9. **과도한 자율성 지양**: 업무가 결정적이면 Workflow가 더 안정적
