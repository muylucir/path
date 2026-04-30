"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Button from "@cloudscape-design/components/button";
import Select from "@cloudscape-design/components/select";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Table from "@cloudscape-design/components/table";
import TextContent from "@cloudscape-design/components/text-content";
import { buildScenario } from "@/lib/simulation/scenario";
import type { Analysis, SpecMeta } from "@/lib/types";
import type { SimStep, ActorKind } from "@/lib/simulation/scenario";

interface SimulationL2TabProps {
  specMeta: SpecMeta | null;
  analysis: Analysis;
}

const SPEED_OPTIONS = [
  { label: "0.5x", value: "0.5" },
  { label: "1x", value: "1" },
  { label: "2x", value: "2" },
  { label: "4x", value: "4" },
];

const KIND_BADGE: Record<ActorKind, "blue" | "grey" | "green" | "red"> = {
  user: "blue",
  agent: "blue",
  tool: "grey",
  data: "green",
  output: "red",
};

const KIND_LABEL: Record<ActorKind, string> = {
  user: "사용자",
  agent: "에이전트",
  tool: "도구",
  data: "데이터",
  output: "산출물",
};

/**
 * L2 시뮬레이션: Mermaid 다이어그램 1장 + 스텝 테이블 + 재생 컨트롤.
 * 무거운 ReactFlow/Gantt를 쓰지 않고 인터랙티브만 유지한다.
 */
export function SimulationL2Tab({ specMeta, analysis }: SimulationL2TabProps) {
  const scenario = useMemo(() => buildScenario(specMeta, analysis), [specMeta, analysis]);
  const specIndex = useMemo(() => buildSpecIndex(specMeta), [specMeta]);

  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inspectedActorId, setInspectedActorId] = useState<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    clearTimer();
    if (!playing) return;
    if (activeIndex < 0 || activeIndex >= scenario.steps.length) return;
    const step = scenario.steps[activeIndex];
    const delay = Math.max(200, step.durationMs / Math.max(0.25, rate));
    timerRef.current = setTimeout(() => {
      setActiveIndex((idx) => {
        if (idx + 1 >= scenario.steps.length) {
          setPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, delay);
    return clearTimer;
  }, [playing, activeIndex, scenario.steps, rate, clearTimer]);

  const inspected = useMemo(
    () => (inspectedActorId && specIndex ? resolveInspect(inspectedActorId, specIndex) : null),
    [inspectedActorId, specIndex],
  );

  if (!specMeta) {
    return (
      <Container header={<Header variant="h2">실행 흐름 미리보기</Header>}>
        <Alert type="info" header="명세서 생성이 필요합니다">
          명세서 탭에서 명세서를 생성하면 여기서 에이전트 실행 흐름을 확인할 수 있습니다.
        </Alert>
      </Container>
    );
  }

  const handlePlay = () => {
    if (scenario.steps.length === 0) return;
    if (activeIndex < 0 || activeIndex >= scenario.steps.length - 1) setActiveIndex(0);
    setPlaying(true);
  };
  const handlePause = () => {
    clearTimer();
    setPlaying(false);
  };
  const handleReset = () => {
    clearTimer();
    setPlaying(false);
    setActiveIndex(-1);
  };
  const handleStepClick = (step: SimStep) => {
    clearTimer();
    setPlaying(false);
    setActiveIndex(step.index);
    setInspectedActorId(step.actorId);
  };

  const activeStep = activeIndex >= 0 ? scenario.steps[activeIndex] : null;

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="명세서의 Mermaid 다이어그램과 함께 실행 순서를 단계별로 재생합니다. 표에서 행을 클릭하면 상세 정보를 볼 수 있습니다."
        >
          실행 흐름 미리보기
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Box>
          <TextContent>
            <Box variant="awsui-key-label">사용자 입력</Box>
            <Box variant="p">{scenario.userInput}</Box>
          </TextContent>
        </Box>

        <SpaceBetween direction="horizontal" size="xs">
          {!playing ? (
            <Button variant="primary" iconName="caret-right-filled" onClick={handlePlay}>
              재생
            </Button>
          ) : (
            <Button iconName="status-stopped" onClick={handlePause}>
              일시정지
            </Button>
          )}
          <Button iconName="refresh" onClick={handleReset}>
            처음부터
          </Button>
          <Box padding={{ left: "xs" }}>
            <Select
              selectedOption={{ label: `${rate}x`, value: String(rate) }}
              onChange={({ detail }) => setRate(parseFloat(detail.selectedOption.value ?? "1"))}
              options={SPEED_OPTIONS}
              expandToViewport
            />
          </Box>
          <Box padding={{ left: "s", top: "xs" }} color="text-body-secondary">
            {activeIndex >= 0
              ? `스텝 ${activeIndex + 1} / ${scenario.steps.length}`
              : `스텝 0 / ${scenario.steps.length}`}
          </Box>
        </SpaceBetween>

        <ColumnLayout columns={inspected ? 2 : 1} variant="text-grid">
          <Container header={<Header variant="h3">다이어그램</Header>}>
            {scenario.primaryDiagram?.mermaid_source ? (
              <MermaidBlock
                source={scenario.primaryDiagram.mermaid_source}
                activeLabel={activeStep ? labelForStep(activeStep) : null}
              />
            ) : (
              <Box color="text-body-secondary" variant="p">
                다이어그램이 없습니다.
              </Box>
            )}
          </Container>

          {inspected && (
            <Container
              header={
                <Header
                  variant="h3"
                  actions={
                    <Button iconName="close" variant="icon" onClick={() => setInspectedActorId(null)} ariaLabel="닫기" />
                  }
                >
                  {inspected.title}
                </Header>
              }
            >
              <SpaceBetween size="s">
                <Badge color={inspected.badgeColor}>{inspected.subtitle}</Badge>
                {inspected.bodyLines.map((line, i) => (
                  <Box key={i}>
                    <Box variant="awsui-key-label">{line.label}</Box>
                    <Box variant="code">
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{line.value}</pre>
                    </Box>
                  </Box>
                ))}
              </SpaceBetween>
            </Container>
          )}
        </ColumnLayout>

        <Table
          variant="embedded"
          header={<Header variant="h3">실행 단계</Header>}
          items={scenario.steps}
          trackBy="index"
          columnDefinitions={[
            {
              id: "no",
              header: "#",
              cell: (s) => s.index + 1,
              width: 60,
            },
            {
              id: "kind",
              header: "종류",
              cell: (s) => <Badge color={KIND_BADGE[s.kind]}>{KIND_LABEL[s.kind]}</Badge>,
              width: 110,
            },
            {
              id: "summary",
              header: "내용",
              cell: (s) => s.summary,
            },
            {
              id: "active",
              header: "상태",
              cell: (s) =>
                s.index === activeIndex ? (
                  <Badge color="green">현재</Badge>
                ) : s.index < activeIndex ? (
                  <Box color="text-body-secondary" variant="small">완료</Box>
                ) : (
                  <Box color="text-body-secondary" variant="small">대기</Box>
                ),
              width: 100,
            },
          ]}
          onRowClick={({ detail }) => handleStepClick(detail.item)}
          empty={<Box color="text-body-secondary">표시할 스텝이 없습니다.</Box>}
          wrapLines
        />

        {activeStep && (
          <Alert
            type="info"
            header={`스텝 ${activeIndex + 1}: ${activeStep.summary}`}
          >
            {activeStep.detail || activeStep.promptExcerpt || "이 스텝이 활성화되었습니다. 표 행을 클릭해 다른 스텝으로 이동할 수 있습니다."}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

/**
 * Mermaid 블록. 거대한 specMeta 전체가 아니라 소스 문자열만 의존성으로 갖는다.
 * active label이 바뀔 때 해당 텍스트 노드에 하이라이트 클래스를 더한다 (재렌더 없이).
 */
const MermaidBlock = memo(function MermaidBlock({
  source,
  activeLabel,
}: {
  source: string;
  activeLabel: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const current = containerRef.current;
    if (!current) return;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "strict" });
      const id = `sim-mermaid-${++renderIdRef.current}`;
      try {
        const { svg } = await mermaid.render(id, source);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
      } catch (e) {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = `<pre style="color:#c4321e">다이어그램 렌더 실패: ${String(e)}</pre>`;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  // active 하이라이트: SVG 내부 text 노드 중 label이 포함된 것을 찾아 클래스를 얹음.
  // 렌더 자체는 source에만 의존하므로 activeLabel 변화 시 DOM만 만짐.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nodes = el.querySelectorAll("g.node");
    nodes.forEach((n) => n.classList.remove("sim-active-node"));
    if (!activeLabel) return;
    const target = activeLabel.toLowerCase();
    nodes.forEach((n) => {
      const text = (n.textContent || "").toLowerCase();
      if (text.includes(target)) n.classList.add("sim-active-node");
    });
  }, [activeLabel]);

  return (
    <>
      <style>{`
        .sim-active-node rect, .sim-active-node polygon, .sim-active-node circle, .sim-active-node ellipse {
          stroke: #6c3ad6 !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 0 4px #6c3ad644);
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ overflow: "auto", maxHeight: 520, padding: 8 }}
      />
    </>
  );
});

function labelForStep(step: SimStep): string {
  if (step.actorId.startsWith("agent:")) return step.actorId.slice("agent:".length);
  if (step.actorId.startsWith("tool:")) return step.actorId.slice("tool:".length);
  if (step.actorId.startsWith("data:")) return step.actorId.slice("data:".length);
  if (step.actorId === "__user__") return "사용자";
  if (step.actorId === "__output__") return "산출물";
  return step.summary;
}

interface SpecIndex {
  agentPromptsByName: Map<string, SpecMeta["agent_prompts"][number]>;
  agentComponentsByName: Map<string, SpecMeta["design_summary"]["agent_components"][number]>;
  toolsByName: Map<string, SpecMeta["tools"][number]>;
  dataSourceById: Map<string, SpecMeta["data_integrations"]["items"][number]>;
}

function buildSpecIndex(specMeta: SpecMeta | null): SpecIndex | null {
  if (!specMeta) return null;
  return {
    agentPromptsByName: new Map((specMeta.agent_prompts ?? []).map((p) => [p.agent_name, p])),
    agentComponentsByName: new Map(
      (specMeta.design_summary?.agent_components ?? []).map((c) => [c.name, c]),
    ),
    toolsByName: new Map((specMeta.tools ?? []).map((t) => [t.name, t])),
    dataSourceById: new Map((specMeta.data_integrations?.items ?? []).map((d) => [d.ds_id, d])),
  };
}

function resolveInspect(
  actorId: string,
  idx: SpecIndex,
): {
  title: string;
  subtitle: string;
  badgeColor: "blue" | "green" | "grey" | "red";
  bodyLines: { label: string; value: string }[];
} | null {
  if (actorId.startsWith("agent:")) {
    const name = actorId.slice("agent:".length);
    const match = idx.agentPromptsByName.get(name);
    const comp = idx.agentComponentsByName.get(name);
    const body: { label: string; value: string }[] = [];
    if (comp?.role) body.push({ label: "역할", value: comp.role });
    if (match?.system_prompt) body.push({ label: "System Prompt", value: match.system_prompt });
    if (match?.example_prompt) body.push({ label: "Example Prompt", value: match.example_prompt });
    if (body.length === 0) body.push({ label: "정보", value: "추가 세부 정보가 없습니다." });
    return { title: name, subtitle: "에이전트", badgeColor: "blue", bodyLines: body };
  }
  if (actorId.startsWith("tool:")) {
    const name = actorId.slice("tool:".length);
    const tool = idx.toolsByName.get(name);
    const body = [
      { label: "Purpose", value: tool?.purpose || "-" },
      { label: "Signature", value: tool?.signature || "-" },
      { label: "When to use", value: tool?.when_to_use || "-" },
    ];
    return { title: name, subtitle: "도구", badgeColor: "grey", bodyLines: body };
  }
  if (actorId.startsWith("data:")) {
    const dsId = actorId.slice("data:".length);
    const ds = idx.dataSourceById.get(dsId);
    const body: { label: string; value: string }[] = [];
    if (ds?.connection) body.push({ label: "Connection", value: ds.connection });
    if (ds?.auth_flow) body.push({ label: "Auth Flow", value: ds.auth_flow });
    if (ds?.example_queries?.length) body.push({ label: "Example", value: ds.example_queries[0] });
    if (body.length === 0) body.push({ label: "정보", value: "추가 세부 정보가 없습니다." });
    return { title: ds?.ds_name || dsId, subtitle: "데이터 소스", badgeColor: "green", bodyLines: body };
  }
  if (actorId === "__user__") {
    return { title: "사용자", subtitle: "입력", badgeColor: "blue", bodyLines: [{ label: "입력", value: "시뮬레이션 입력 참조" }] };
  }
  if (actorId === "__output__") {
    return { title: "최종 산출물", subtitle: "출력", badgeColor: "red", bodyLines: [{ label: "형태", value: "분석 결과에 따라 생성됨" }] };
  }
  return null;
}
