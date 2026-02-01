# Multi-Agent Pattern (다중 에이전트 협업)

## 개념

Multi-Agent 패턴은 여러 전문화된 Agent가 협업하여 작업을 수행하는 방식입니다.
Strands Agents SDK에서는 4가지 주요 협업 패턴을 제공합니다.

## Strands Agents 멀티 에이전트 협업 패턴

### 1. Agents as Tools (도구로서의 에이전트)

상위 에이전트(Orchestrator)가 전문 하위 에이전트를 도구처럼 호출합니다.

```
Orchestrator Agent (관리자)
    ├── Research Agent (전문가1)
    ├── Analysis Agent (전문가2)
    └── Writer Agent (전문가3)
```

#### 특징

| 항목 | 설명 |
|------|------|
| **구조** | 계층적 (Orchestrator → Specialist Agents) |
| **통신** | 단방향 (위→아래), 결과 반환 |
| **적합** | 독립적 서브태스크로 분해 가능한 문제 |
| **장점** | 모듈성, 역할 분리, 확장 용이 |
| **단점** | Orchestrator가 단일 실패점 |

#### 적합한 상황

- 쿼리가 독립적인 서브태스크로 분해되는 경우
- 전문성 분리가 필요한 경우
- 각 Agent가 특정 도메인에 특화된 경우

#### 구현 예시

```python
# Strands Agents - Agents as Tools
from strands import Agent, tool

# 전문 에이전트들을 도구로 정의
@tool
def research_agent(query: str) -> str:
    """Research Agent: 주제 조사 담당"""
    agent = Agent(system_prompt="당신은 리서치 전문가입니다...")
    return agent(query).message['content'][0]['text']

@tool
def analysis_agent(data: str) -> str:
    """Analysis Agent: 데이터 분석 담당"""
    agent = Agent(system_prompt="당신은 데이터 분석 전문가입니다...")
    return agent(data).message['content'][0]['text']

@tool
def writer_agent(content: str) -> str:
    """Writer Agent: 문서 작성 담당"""
    agent = Agent(system_prompt="당신은 콘텐츠 작성 전문가입니다...")
    return agent(content).message['content'][0]['text']

# Orchestrator Agent
orchestrator = Agent(
    system_prompt="""당신은 프로젝트 관리자입니다.
    다음 전문가들을 활용하여 작업을 완료하세요:
    - research_agent: 주제 조사
    - analysis_agent: 데이터 분석
    - writer_agent: 문서 작성
    """,
    tools=[research_agent, analysis_agent, writer_agent]
)
```

#### 실행 흐름

```
User: "AI 트렌드 분석 보고서 작성해줘"

[Orchestrator] 작업 분해
    ├── research_agent("AI 트렌드 조사")
    │       └── 트렌드 데이터 반환
    ├── analysis_agent(트렌드 데이터)
    │       └── 분석 결과 반환
    └── writer_agent(분석 결과)
            └── 최종 보고서 반환

[Final Output] 완성된 보고서
```

---

### 2. Swarm (스웜)

동등한 에이전트들이 handoff(핸드오프)를 통해 상호 협업합니다.

```
Agent A ←→ Agent B
    ↕         ↕
Agent C ←→ Agent D
```

#### 특징

| 항목 | 설명 |
|------|------|
| **구조** | 대등한 관계 (Peer-to-Peer) |
| **통신** | 양방향 handoff |
| **적합** | 브레인스토밍, 반복적 개선, 다양한 관점 필요 |
| **장점** | 분산 처리, 창발적 개선, 단일 실패점 없음 |
| **단점** | 조율 복잡, 타임아웃 관리 필요 |

#### 적합한 상황

- 다양한 관점이 필요한 창의적 작업
- 반복적 개선이 필요한 경우
- 협업을 통한 품질 향상이 필요한 경우

#### 구현 예시

```python
# Strands Agents - Swarm Pattern
from strands import Agent

def create_swarm_agents():
    # 아이디어 생성 에이전트
    idea_generator = Agent(
        system_prompt="""당신은 창의적 아이디어 생성자입니다.
        주제에 대해 혁신적인 아이디어를 제안하세요.
        다른 에이전트의 피드백을 받으면 아이디어를 발전시키세요."""
    )

    # 비평 에이전트
    critic = Agent(
        system_prompt="""당신은 건설적 비평가입니다.
        아이디어의 장점과 개선점을 제시하세요.
        비판적이지만 건설적으로 피드백하세요."""
    )

    # 정제 에이전트
    refiner = Agent(
        system_prompt="""당신은 아이디어 정제 전문가입니다.
        피드백을 반영하여 최종 아이디어를 완성하세요."""
    )

    return idea_generator, critic, refiner

# Swarm 실행 (handoff 기반)
def run_swarm(topic: str, rounds: int = 3):
    generator, critic, refiner = create_swarm_agents()

    # 초기 아이디어 생성
    idea = generator(f"주제: {topic}").message['content'][0]['text']

    for _ in range(rounds):
        # Critic에게 handoff
        feedback = critic(f"아이디어: {idea}").message['content'][0]['text']
        # Generator에게 다시 handoff
        idea = generator(f"피드백 반영: {feedback}").message['content'][0]['text']

    # 최종 정제
    final = refiner(f"최종 정제: {idea}").message['content'][0]['text']
    return final
```

#### 실행 흐름

```
User: "새로운 마케팅 캠페인 아이디어"

Round 1:
  [Generator] 초기 아이디어 생성
  [Critic] 피드백 제공 → handoff
  [Generator] 아이디어 개선

Round 2:
  [Critic] 추가 피드백 → handoff
  [Generator] 아이디어 발전

Round 3:
  [Critic] 최종 검토 → handoff
  [Refiner] 아이디어 정제

[Final Output] 정제된 캠페인 아이디어
```

---

### 3. Graph (그래프)

방향성 그래프(DAG)로 정보 흐름과 실행 경로를 정의합니다.

```
Planner → Agent1 → Agent4 ↘
       → Agent2 → Agent5 → Reporter
       → Agent3 → Agent6 ↗
```

#### 특징

| 항목 | 설명 |
|------|------|
| **구조** | 방향성 비순환 그래프 (DAG) |
| **통신** | 정의된 경로를 따라 흐름 |
| **적합** | 복잡한 다단계 결정, 조건부 분기 필요 |
| **장점** | 세밀한 제어, 예측 가능한 실행 흐름 |
| **단점** | 설계 노력 필요, 유연성 낮음 |

#### 적합한 상황

- 복잡한 계층적 의사결정
- 보안/데이터 흐름 제어가 중요한 경우
- 조건부 분기가 필요한 워크플로우

#### 구현 예시

```python
# Strands Agents - Graph Pattern
from strands import Agent
from typing import Dict, Any

class AgentGraph:
    def __init__(self):
        self.nodes: Dict[str, Agent] = {}
        self.edges: Dict[str, list] = {}
        self.conditions: Dict[str, callable] = {}

    def add_node(self, name: str, agent: Agent):
        self.nodes[name] = agent
        self.edges[name] = []

    def add_edge(self, from_node: str, to_node: str, condition=None):
        self.edges[from_node].append((to_node, condition))

    def execute(self, start: str, input_data: str) -> str:
        current = start
        result = input_data
        visited = set()

        while current and current not in visited:
            visited.add(current)
            agent = self.nodes[current]
            result = agent(result).message['content'][0]['text']

            # 다음 노드 결정 (조건부 분기)
            next_node = None
            for to_node, condition in self.edges[current]:
                if condition is None or condition(result):
                    next_node = to_node
                    break
            current = next_node

        return result

# Graph 구성 예시: 문서 승인 프로세스
graph = AgentGraph()

# 노드 추가
graph.add_node("validator", Agent(system_prompt="문서 유효성 검증..."))
graph.add_node("legal_review", Agent(system_prompt="법률 검토..."))
graph.add_node("finance_review", Agent(system_prompt="재무 검토..."))
graph.add_node("final_approver", Agent(system_prompt="최종 승인..."))
graph.add_node("rejector", Agent(system_prompt="반려 처리..."))

# 엣지 추가 (조건부 분기)
graph.add_edge("validator", "legal_review", lambda r: "유효" in r)
graph.add_edge("validator", "rejector", lambda r: "무효" in r)
graph.add_edge("legal_review", "finance_review")
graph.add_edge("finance_review", "final_approver", lambda r: "승인" in r)
graph.add_edge("finance_review", "rejector", lambda r: "반려" in r)
```

#### 실행 흐름

```
[Input] 계약서 검토 요청

[Validator] 문서 유효성 검증
    ├─ (유효) → [Legal Review]
    └─ (무효) → [Rejector] → 반려

[Legal Review] 법률 검토
    └─ → [Finance Review]

[Finance Review] 재무 검토
    ├─ (승인) → [Final Approver] → 최종 승인
    └─ (반려) → [Rejector] → 반려

[Output] 승인/반려 결과
```

---

### 4. Workflow (워크플로우)

미리 정의된 순서로 태스크를 순차 실행하는 파이프라인입니다.

```
Step1 → Step2 → Step3 → Step4 (순차 실행)
```

#### 특징

| 항목 | 설명 |
|------|------|
| **구조** | 선형 파이프라인 |
| **통신** | 이전 단계 → 다음 단계 (순차) |
| **적합** | 명확한 단계별 프로세스, 데이터 파이프라인 |
| **장점** | 명확한 태스크 순서, 체크포인트 관리 용이 |
| **단점** | 동적 적응 어려움, 병렬화 제한 |

#### 적합한 상황

- 데이터 ETL 파이프라인
- 문서 처리 워크플로우
- CI/CD 자동화

#### 구현 예시

```python
# Strands Agents - Workflow Pattern
from strands import Agent
from typing import List, Callable

class AgentWorkflow:
    def __init__(self):
        self.steps: List[tuple] = []

    def add_step(self, name: str, agent: Agent,
                 pre_hook: Callable = None,
                 post_hook: Callable = None):
        self.steps.append((name, agent, pre_hook, post_hook))

    def execute(self, input_data: str,
                on_progress: Callable = None) -> str:
        result = input_data
        total = len(self.steps)

        for i, (name, agent, pre_hook, post_hook) in enumerate(self.steps):
            # Progress 콜백
            if on_progress:
                on_progress(name, i + 1, total)

            # Pre-hook
            if pre_hook:
                result = pre_hook(result)

            # Agent 실행
            result = agent(result).message['content'][0]['text']

            # Post-hook (체크포인트 저장 등)
            if post_hook:
                result = post_hook(result)

        return result

# Workflow 구성 예시: 데이터 처리 파이프라인
workflow = AgentWorkflow()

workflow.add_step(
    "extract",
    Agent(system_prompt="데이터 추출 전문가. 원본 데이터에서 필요한 정보 추출...")
)
workflow.add_step(
    "transform",
    Agent(system_prompt="데이터 변환 전문가. 추출된 데이터를 분석 가능한 형태로 변환...")
)
workflow.add_step(
    "analyze",
    Agent(system_prompt="데이터 분석 전문가. 변환된 데이터에서 인사이트 도출...")
)
workflow.add_step(
    "report",
    Agent(system_prompt="보고서 작성 전문가. 분석 결과를 보고서 형태로 작성...")
)

# 실행
result = workflow.execute(
    input_data="원본 데이터...",
    on_progress=lambda name, current, total: print(f"[{current}/{total}] {name}")
)
```

#### 실행 흐름

```
[Input] 원본 데이터

[1/4] Extract
    └─ 필요 정보 추출 → checkpoint_1

[2/4] Transform
    └─ 데이터 변환 → checkpoint_2

[3/4] Analyze
    └─ 인사이트 도출 → checkpoint_3

[4/4] Report
    └─ 보고서 작성

[Output] 최종 보고서
```

---

## 패턴 선택 가이드

| 문제 특성 | 권장 패턴 | 이유 |
|----------|----------|------|
| 독립적 서브태스크로 분해 가능 | **Agents as Tools** | 전문 에이전트가 독립적으로 처리 |
| 창의적 작업, 다양한 관점 필요 | **Swarm** | 상호 피드백으로 품질 향상 |
| 복잡한 조건부 분기 필요 | **Graph** | 유연한 실행 경로 정의 |
| 명확한 순차 단계 | **Workflow** | 단순하고 예측 가능한 실행 |

## 패턴 조합

복잡한 시스템에서는 여러 패턴을 조합할 수 있습니다:

```
[Workflow] 전체 파이프라인
    │
    ├─ Step 1: [Agents as Tools] 데이터 수집
    │           Orchestrator → Crawler / Parser / Validator
    │
    ├─ Step 2: [Swarm] 분석 및 개선
    │           Analyzer ↔ Critic ↔ Refiner
    │
    └─ Step 3: [Graph] 승인 프로세스
                Reviewer → Approver1/Approver2 → Publisher
```

## 주의사항

1. **역할 명확화**: 각 Agent의 역할과 책임을 명확히 정의
2. **통신 오버헤드**: Agent 간 통신 비용 고려
3. **실패 처리**: 한 Agent 실패 시 전체 시스템 영향 최소화
4. **타임아웃 관리**: 특히 Swarm 패턴에서 무한 루프 방지
5. **상태 관리**: Agent 간 공유 상태 최소화

## 참고 자료

- [AWS Blog: Multi-Agent collaboration patterns with Strands Agents](https://aws.amazon.com/blogs/machine-learning/multi-agent-collaboration-patterns-with-strands-agents-and-amazon-nova/)
- [Strands Agents SDK Documentation](https://strandsagents.com/latest/documentation/docs/user-guide/concepts/multi-agent/)
