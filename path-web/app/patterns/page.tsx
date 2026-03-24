"use client";

import Link from "next/link";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextContent from "@cloudscape-design/components/text-content";
import Table from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";

const PATTERN_ANCHORS = [
  { text: "3계층 택소노미 개요", href: "#overview", level: 1 },
  { text: "AI-Assisted vs Agentic", href: "#automation-level", level: 1 },
  { text: "Layer 1: Agent Patterns", href: "#layer1", level: 1 },
  { text: "Layer 2: LLM Workflows", href: "#layer2", level: 1 },
  { text: "Layer 3: Agentic Workflows", href: "#layer3", level: 1 },
  { text: "스케일링 원칙", href: "#scaling-principles", level: 1 },
  { text: "패턴 조합 예시", href: "#combinations", level: 1 },
  { text: "선택 가이드", href: "#selection-guide", level: 1 },
];

export default function PatternsPage() {
  return (
    <AppLayoutShell
      breadcrumbs={[{ text: "에이전트 패턴", href: "/patterns" }]}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "2rem" }}>
      <ContentLayout
        header={
          <Header
            variant="h1"
            description="Agent 시스템을 구조적으로 이해하기 위한 3계층 분류 체계"
          >
            3계층 Agent 패턴 택소노미
          </Header>
        }
      >
        <SpaceBetween size="l">
          {/* Overview */}
          <div id="overview">
            <Container header={<Header variant="h2">3계층 택소노미 개요</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    Agent 시스템은 <strong>3개의 계층(Layer)</strong>을 조합하여 설계합니다.
                    각 계층은 서로 다른 질문에 답하며, 독립적으로 선택하고 조합할 수 있습니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "layer", header: "Layer", cell: (item) => <strong>{item.layer}</strong>, width: 220 },
                    { id: "question", header: "질문", cell: (item) => item.question, width: 220 },
                    { id: "desc", header: "설명", cell: (item) => item.desc },
                  ]}
                  items={[
                    { layer: "Layer 1: Agent Pattern", question: "어떤 유형의 에이전트인가?", desc: "에이전트의 기본 구조와 상호작용 방식" },
                    { layer: "Layer 2: LLM Workflow", question: "어떻게 추론하는가?", desc: "에이전트 내부의 추론/인지 방식" },
                    { layer: "Layer 3: Agentic Workflow", question: "어떻게 협업하는가?", desc: "여러 에이전트 간의 조율 방식" },
                  ]}
                />
                <TextContent>
                  <p>
                    Agent 시스템 설계의 핵심 원칙은 <strong>3A</strong>로 요약됩니다.
                  </p>
                  <ul>
                    <li><strong>Asynchronous(비동기)</strong> — 에이전트는 독립적으로 실행되며, 결과를 기다리지 않고 다음 작업을 수행할 수 있습니다.</li>
                    <li><strong>Autonomy(자율성)</strong> — 에이전트는 주어진 목표 내에서 스스로 판단하고 행동합니다.</li>
                    <li><strong>Agency(주체성)</strong> — 에이전트는 환경을 관찰하고, 도구를 선택하며, 결과에 책임을 갖는 주체입니다.</li>
                  </ul>
                </TextContent>
                <Alert type="info">
                  실제 에이전트는 3계층을 조합합니다. 예: RAG(Layer 1) + ReAct(Layer 2) + Agents as Tools(Layer 3)
                </Alert>
              </SpaceBetween>
            </Container>
          </div>

          {/* Automation Level */}
          <div id="automation-level">
            <Container header={<Header variant="h2">AI-Assisted vs Agentic</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    자율성 점수를 기준으로, Agent 시스템은 크게 두 가지 자동화 수준으로 나뉩니다.
                    자율성 5점 이하는 <strong>AI-Assisted Workflow</strong>, 6점 이상은 <strong>Agentic AI</strong>로 분류합니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "item", header: "항목", cell: (item) => <strong>{item.item}</strong>, width: 150 },
                    { id: "assisted", header: "AI-Assisted Workflow (자율성 5 이하)", cell: (item) => item.assisted },
                    { id: "agentic", header: "Agentic AI (자율성 6 이상)", cell: (item) => item.agentic },
                  ]}
                  items={[
                    { item: "흐름 제어", assisted: "코드/워크플로우 엔진이 결정", agentic: "LLM이 동적으로 결정" },
                    { item: "예측 가능성", assisted: "높음 (결정적)", agentic: "낮음 (확률적)" },
                    { item: "디버깅", assisted: "용이 (단계별 추적)", agentic: "어려움 (동적 경로)" },
                    { item: "유연성", assisted: "낮음 (사전 정의된 경로)", agentic: "높음 (동적 대응)" },
                    { item: "비용 예측", assisted: "용이 (고정 LLM 호출 수)", agentic: "어려움 (가변 호출 수)" },
                  ]}
                />
                <Alert type="info">
                  AI-Assisted Workflow는 &ldquo;열등한&rdquo; 선택이 아닙니다. 예측 가능성, 디버깅 용이성, 낮은 운영 리스크 측면에서 더 유리할 수 있습니다.
                </Alert>
              </SpaceBetween>
            </Container>
          </div>

          {/* Layer 1 */}
          <div id="layer1">
            <Container header={<Header variant="h2">Layer 1: Agent Patterns</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    에이전트의 기본 구조와 상호작용 방식을 정의합니다.
                    &ldquo;이 에이전트는 어떤 유형인가?&rdquo;에 대한 답을 결정하는 계층입니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "pattern", header: "패턴", cell: (item) => <strong>{item.pattern}</strong>, width: 200 },
                    { id: "concept", header: "핵심 개념", cell: (item) => item.concept },
                    { id: "fit", header: "적합 상황", cell: (item) => item.fit },
                  ]}
                  items={[
                    { pattern: "Basic Reasoning", concept: "LLM에 프롬프트를 보내고 응답. 상태/도구 없음", fit: "단순 Q&A, 분류, 요약" },
                    { pattern: "RAG", concept: "외부 지식소스 검색 후 컨텍스트 증강하여 응답", fit: "도메인 지식 기반 응답, 문서 검색" },
                    { pattern: "Tool-based (Functions)", concept: "LLM이 도구를 선택/호출하고 결과를 추론에 활용", fit: "외부 API/DB 연동, 계산" },
                    { pattern: "Tool-based (Servers)", concept: "도구 실행을 외부 서버에 위임 (MCP 등)", fit: "원격 도구 프로토콜 연동" },
                    { pattern: "Coding", concept: "IDE 컨텍스트를 읽고 코드를 생성/수정", fit: "코드 생성, 리팩토링, 디버깅" },
                    { pattern: "Memory-augmented", concept: "단기/장기 메모리로 세션 간 컨텍스트 유지", fit: "대화 기억, 사용자 선호 학습" },
                    { pattern: "Observer", concept: "시스템 텔레메트리를 관찰하고 이상 감지", fit: "모니터링, 이상 탐지, 알림" },
                  ]}
                />
              </SpaceBetween>
            </Container>
          </div>

          {/* Layer 2 */}
          <div id="layer2">
            <Container header={<Header variant="h2">Layer 2: LLM Workflows</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    에이전트 내부의 추론 방식을 정의합니다. LLM을 어떻게 호출하고 결과를 처리하는가의 패턴입니다.
                    하나의 에이전트가 여러 워크플로를 조합하여 사용할 수 있습니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "workflow", header: "워크플로", cell: (item) => <strong>{item.workflow}</strong>, width: 200 },
                    { id: "concept", header: "개념", cell: (item) => item.concept },
                    { id: "fit", header: "적합 상황", cell: (item) => item.fit },
                  ]}
                  items={[
                    { workflow: "ReAct", concept: "생각(Think) → 행동(Act) → 관찰(Observe) 반복", fit: "정보 검색, 단계적 추론" },
                    { workflow: "Reflection", concept: "생성 → 평가 → 개선 반복", fit: "고품질 출력, 자기 개선" },
                    { workflow: "Planning", concept: "목표를 하위 작업으로 분해 후 순차/병렬 실행", fit: "복잡한 다단계 작업" },
                    { workflow: "Prompt Chaining", concept: "순차적 LLM 호출 체인. 이전 출력이 다음 입력", fit: "구조화된 변환, 단계적 분석" },
                    { workflow: "Routing", concept: "LLM이 의도를 분류하고 전문 처리기로 위임", fit: "멀티도메인 어시스턴트" },
                    { workflow: "Parallelization", concept: "독립 서브태스크를 병렬 LLM 호출 후 결과 집계", fit: "대량 문서 분석, 다관점 평가" },
                    { workflow: "Human-in-the-Loop", concept: "자율 작업 → 체크포인트 → 사람 검토", fit: "고위험 결정, 규정 준수" },
                  ]}
                />
              </SpaceBetween>
            </Container>
          </div>

          {/* Layer 3 */}
          <div id="layer3">
            <Container header={<Header variant="h2">Layer 3: Agentic Workflows</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    여러 에이전트(또는 LLM 호출)가 어떻게 조율되는가의 패턴입니다.
                    단일 에이전트로 충분한지, 멀티 에이전트가 필요한지를 먼저 판단한 후 협업 방식을 선택합니다.
                  </p>
                </TextContent>

                <Header variant="h3">싱글 vs 멀티 에이전트 판단</Header>
                <TextContent>
                  <p>
                    멀티 에이전트 도입 여부는 단순히 처리 단계 수나 도구 수로 결정되지 않습니다.
                    가장 중요한 판단 기준은 <strong>태스크의 분해 가능성</strong>과 <strong>순차 의존성</strong>입니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "condition", header: "판단 기준", cell: (item) => <strong>{item.condition}</strong>, width: 200 },
                    { id: "single", header: "싱글 에이전트 유리", cell: (item) => item.single },
                    { id: "multi", header: "멀티 에이전트 유리", cell: (item) => item.multi },
                  ]}
                  items={[
                    { condition: "태스크 분해 가능성", single: "순차 의존성이 높음 (이전 결과가 다음 입력)", multi: "독립적 서브태스크로 병렬 분해 가능" },
                    { condition: "싱글 에이전트 기준 성능", single: "이미 충분한 성능 달성", multi: "싱글로는 부족한 성능" },
                    { condition: "전문성 분리 필요성", single: "단일 역할로 처리 가능", multi: "상이한 도메인 지식/역할이 필요" },
                    { condition: "도구 복잡도", single: "도구가 많더라도 한 흐름에서 순차 사용", multi: "서로 다른 도구를 독립적으로 병렬 활용" },
                  ]}
                />
                <Alert type="warning">
                  단계 수나 도구 수가 많다고 반드시 멀티 에이전트가 유리한 것은 아닙니다.
                  순차적으로 상태가 변하는 태스크(예: 게임 플래닝, 단계별 승인)는 멀티 에이전트로 분리하면
                  조율 오버헤드가 추론 능력을 잠식하여 오히려 성능이 저하됩니다.
                </Alert>

                <Header variant="h3">멀티 에이전트 협업 패턴</Header>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "pattern", header: "패턴", cell: (item) => <strong>{item.pattern}</strong>, width: 160 },
                    { id: "structure", header: "구조", cell: (item) => item.structure },
                    { id: "fit", header: "적합 상황", cell: (item) => item.fit },
                    { id: "caution", header: "주의사항", cell: (item) => item.caution },
                  ]}
                  items={[
                    { pattern: "Agents as Tools", structure: "Orchestrator가 전문 Agent를 도구처럼 호출", fit: "병렬 분해 가능한 분석·조사 태스크", caution: "Orchestrator가 단일 실패점. 결과 검증 로직 필수" },
                    { pattern: "Swarm", structure: "동등한 Agent 간 핸드오프 협업", fit: "탐색적 작업, 다관점 분석, 반복 개선", caution: "합의 수렴에 시간 소요. 타임아웃 관리 필요" },
                    { pattern: "Graph", structure: "방향성 그래프로 흐름 정의 (조건부 분기)", fit: "조건부 분기와 병렬 처리가 모두 필요한 복합 흐름", caution: "조율 오버헤드가 가장 큼. 단순 태스크에는 과도한 설계" },
                    { pattern: "Workflow", structure: "사전 정의된 순차 파이프라인", fit: "단계가 명확한 데이터 처리 파이프라인", caution: "순차 태스크는 싱글 에이전트 + Prompt Chaining이 더 효율적일 수 있음" },
                  ]}
                />
              </SpaceBetween>
            </Container>
          </div>

          {/* Scaling Principles */}
          <div id="scaling-principles">
            <Container header={<Header variant="h2">멀티 에이전트 스케일링 원칙</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    멀티 에이전트 시스템의 효과는 &ldquo;에이전트를 많이 쓸수록 좋다&rdquo;는 단순한 공식을 따르지 않습니다.
                    아래 원칙은 멀티 에이전트 설계 시 흔히 발생하는 실패를 예방하기 위한 가이드입니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "principle", header: "원칙", cell: (item) => <strong>{item.principle}</strong>, width: 200 },
                    { id: "desc", header: "설명", cell: (item) => item.desc },
                    { id: "guidance", header: "실무 가이드", cell: (item) => item.guidance },
                  ]}
                  items={[
                    {
                      principle: "분해 가능성이 핵심",
                      desc: "멀티 에이전트의 효과는 에이전트 수가 아니라 태스크가 독립적 서브태스크로 얼마나 잘 나뉘는지에 달려있습니다.",
                      guidance: "서브태스크 간 데이터 의존성이 낮을수록 멀티 에이전트가 효과적입니다. 순차 의존성이 높으면 싱글 에이전트를 유지하세요.",
                    },
                    {
                      principle: "싱글로 충분하면 싱글 유지",
                      desc: "싱글 에이전트만으로 이미 만족스러운 성능을 달성하고 있다면, 멀티로 전환해도 추가 이점이 거의 없습니다.",
                      guidance: "프로토타입을 싱글 에이전트로 먼저 검증하세요. 성능이 충분하면 복잡도를 높일 이유가 없습니다.",
                    },
                    {
                      principle: "조율 오버헤드는 공짜가 아님",
                      desc: "에이전트 간 메시지 교환, 결과 종합, 상태 동기화에 소비되는 토큰과 시간은 실제 추론에 쓸 자원을 줄입니다.",
                      guidance: "에이전트 수는 3-4개 이하로 시작하세요. 고정 토큰 예산에서 에이전트가 많아질수록 개별 추론 능력이 희석됩니다.",
                    },
                    {
                      principle: "구조 없는 협업은 오류를 증폭",
                      desc: "검증 메커니즘 없이 에이전트 결과를 단순 합산하면, 개별 에이전트의 실수가 걸러지지 않고 최종 결과에 누적됩니다.",
                      guidance: "반드시 구조화된 토폴로지(Orchestrator, Graph 등)를 사용하고, 결과를 검증하는 중앙 지점을 포함하세요.",
                    },
                    {
                      principle: "도구가 많다고 멀티가 아님",
                      desc: "도구 수가 많은 환경에서 멀티 에이전트는 조율에 토큰을 소비하여 정작 도구 활용 능력이 떨어질 수 있습니다.",
                      guidance: "도구가 많은 태스크는 싱글 에이전트가 오히려 효율적입니다. 도구를 도메인별로 분리해야 할 때만 멀티를 고려하세요.",
                    },
                  ]}
                />
                <Alert type="info">
                  이 원칙은 Google DeepMind의 에이전트 시스템 스케일링 연구에 기반합니다.
                  P.A.T.H의 패턴 분석(Step 3)에서 이 원칙들을 자동으로 고려하여 아키텍처를 추천합니다.
                </Alert>
              </SpaceBetween>
            </Container>
          </div>

          {/* Combinations */}
          <div id="combinations">
            <Container header={<Header variant="h2">패턴 조합 예시</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    실제 에이전트는 3계층을 조합하여 설계합니다.
                    아래 표는 대표적인 사례별 조합을 보여줍니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "case", header: "사례", cell: (item) => <strong>{item.case}</strong>, width: 180 },
                    { id: "layer1", header: "Layer 1", cell: (item) => item.layer1 },
                    { id: "layer2", header: "Layer 2", cell: (item) => item.layer2 },
                    { id: "layer3", header: "Layer 3", cell: (item) => item.layer3 },
                  ]}
                  items={[
                    { case: "고객지원 봇", layer1: "RAG + Tool-based", layer2: "ReAct + Routing", layer3: "싱글 에이전트" },
                    { case: "코드 리뷰 시스템", layer1: "Coding + Memory", layer2: "Reflection + Planning", layer3: "Agents as Tools" },
                    { case: "연구 보고서 생성", layer1: "RAG + Tool-based", layer2: "Prompt Chaining", layer3: "Scatter-Gather" },
                    { case: "실시간 인프라 감시", layer1: "Observer + Tool-based", layer2: "ReAct + Human-in-Loop", layer3: "Graph" },
                    { case: "계약서 검토 자동화", layer1: "RAG + Memory", layer2: "Prompt Chaining + Reflection", layer3: "Graph + Human-in-Loop" },
                  ]}
                />
              </SpaceBetween>
            </Container>
          </div>

          {/* Selection Guide */}
          <div id="selection-guide">
            <Container header={<Header variant="h2">선택 가이드</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    자율성 요구도를 기준으로 자동화 수준을 먼저 결정하고, 이후 3계층을 순서대로 선택합니다.
                    아래는 선택 흐름을 정리한 것입니다.
                  </p>
                </TextContent>
                <Container>
                  <TextContent>
                    <h4>자율성 5 이하: AI-Assisted Workflow</h4>
                    <ul>
                      <li>순차 처리가 필요한 경우 &rarr; Sequential Pipeline</li>
                      <li>병렬 분석이 필요한 경우 &rarr; Fan-out/Fan-in</li>
                      <li>AI 판단에 따른 분기가 필요한 경우 &rarr; Conditional Pipeline</li>
                      <li>이벤트에 반응해야 하는 경우 &rarr; Event-driven Pipeline</li>
                    </ul>
                    <h4>자율성 6 이상: Agentic AI</h4>
                    <ul>
                      <li><strong>Layer 1 선택</strong> — 데이터 유형과 환경에 따라 Agent Pattern을 결정합니다 (RAG, Tool-based, Coding 등)</li>
                      <li><strong>Layer 2 선택</strong> — 추론 요구사항에 따라 LLM Workflow를 결정합니다 (ReAct, Reflection, Planning 등)</li>
                      <li>
                        <strong>Layer 3 선택</strong> — 태스크 특성에 따라 판단합니다
                        <ul>
                          <li>순차 의존성이 높은 태스크 &rarr; <strong>싱글 에이전트</strong> (Prompt Chaining으로 해결)</li>
                          <li>독립적으로 분해 가능한 태스크 &rarr; <strong>Agents as Tools</strong> (Orchestrator가 서브태스크 위임)</li>
                          <li>탐색적/다관점 분석이 필요 &rarr; <strong>Swarm</strong> (에이전트 간 핸드오프)</li>
                          <li>조건부 분기 + 병렬 처리 복합 &rarr; <strong>Graph</strong> (단, 조율 오버헤드 주의)</li>
                          <li>고정된 순서의 데이터 파이프라인 &rarr; <strong>Workflow</strong> (싱글로 충분한지 먼저 확인)</li>
                        </ul>
                      </li>
                    </ul>
                    <h4>멀티 에이전트 도입 전 체크리스트</h4>
                    <ul>
                      <li>싱글 에이전트로 프로토타입을 먼저 검증했는가?</li>
                      <li>서브태스크가 독립적으로 실행 가능한가? (순차 의존성 확인)</li>
                      <li>결과를 검증하는 중앙 지점(Orchestrator 등)이 설계에 포함되어 있는가?</li>
                      <li>에이전트 수가 3-4개 이하인가? (그 이상은 조율 오버헤드가 급격히 증가)</li>
                    </ul>
                  </TextContent>
                </Container>
                <Box textAlign="center">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Link href="/guide" style={{ textDecoration: "none" }}>
                      <Button variant="link" iconName="arrow-left" iconAlign="left">
                        P.A.T.H 가이드 보기
                      </Button>
                    </Link>
                    <Link href="/design" style={{ textDecoration: "none" }}>
                      <Button variant="primary" iconName="arrow-right" iconAlign="right">
                        에이전트 디자인 시작하기
                      </Button>
                    </Link>
                  </SpaceBetween>
                </Box>
              </SpaceBetween>
            </Container>
          </div>
        </SpaceBetween>
      </ContentLayout>
      <div style={{ position: "sticky", top: 56, alignSelf: "start" }}>
        <AnchorNavigation anchors={PATTERN_ANCHORS} />
      </div>
      </div>
    </AppLayoutShell>
  );
}
