"use client";

import { useMemo, useState } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Badge from "@cloudscape-design/components/badge";
import TextContent from "@cloudscape-design/components/text-content";
import { SimulationGraph } from "@/components/visualization/SimulationGraph";
import { PlaybackControls } from "@/components/visualization/PlaybackControls";
import { buildScenario } from "@/lib/simulation/scenario";
import { usePlayback } from "@/lib/simulation/usePlayback";
import type { Analysis, SpecMeta } from "@/lib/types";

interface SimulationGraphTabProps {
  specMeta: SpecMeta | null;
  analysis: Analysis;
}

export function SimulationGraphTab({ specMeta, analysis }: SimulationGraphTabProps) {
  const scenario = useMemo(() => buildScenario(specMeta, analysis), [specMeta, analysis]);
  const playback = usePlayback({ steps: scenario.steps });
  const [inspectedActorId, setInspectedActorId] = useState<string | null>(null);

  const currentStep = playback.currentIndex >= 0 ? scenario.steps[playback.currentIndex] : null;

  const visitedActorIds = useMemo(() => {
    const set = new Set<string>();
    if (playback.currentIndex < 0) return set;
    for (let i = 0; i <= playback.currentIndex; i++) {
      set.add(scenario.steps[i].actorId);
    }
    return set;
  }, [scenario.steps, playback.currentIndex]);

  if (!specMeta) {
    return (
      <Container header={<Header variant="h2">시뮬레이션 (그래프)</Header>}>
        <Alert type="info" header="명세서 생성이 필요합니다">
          명세서 탭에서 &quot;Claude로 상세 명세서 생성&quot; 버튼을 눌러 명세서를 생성한 뒤, 이
          탭에서 에이전트가 어떻게 동작하는지 시각적으로 확인할 수 있습니다. 이전에 저장된
          세션이라면 명세서를 재생성해주세요.
        </Alert>
      </Container>
    );
  }

  const inspected = inspectedActorId ? resolveInspectTarget(inspectedActorId, specMeta) : null;

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="명세서 기반으로 에이전트 동작 흐름을 재생합니다. 노드를 클릭하면 프롬프트/도구 상세를 볼 수 있습니다."
        >
          시뮬레이션 (그래프)
        </Header>
      }
    >
      <SpaceBetween size="m">
        <Box>
          <TextContent>
            <Box variant="awsui-key-label">사용자 입력</Box>
            <Box variant="p">{scenario.userInput}</Box>
          </TextContent>
        </Box>

        <PlaybackControls playback={playback} totalSteps={scenario.steps.length} />

        <ColumnLayout columns={inspected ? 2 : 1} variant="text-grid">
          <SimulationGraph
            scenario={scenario}
            currentStep={currentStep}
            visitedActorIds={visitedActorIds}
            onNodeClick={(id) => setInspectedActorId(id)}
            height={480}
          />
          {inspected && (
            <Container
              header={
                <Header
                  variant="h3"
                  actions={
                    <Box
                      color="text-body-secondary"
                      variant="small"
                      textAlign="right"
                    >
                      <button
                        onClick={() => setInspectedActorId(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                      >
                        닫기
                      </button>
                    </Box>
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

        {currentStep && (
          <Alert type="info" header={`단계 ${playback.currentIndex + 1} / ${scenario.steps.length}: ${currentStep.summary}`}>
            {currentStep.detail || currentStep.promptExcerpt || "이 단계에서 활성화된 액터가 하이라이트됩니다."}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

function resolveInspectTarget(
  actorId: string,
  specMeta: SpecMeta,
): {
  title: string;
  subtitle: string;
  badgeColor: "blue" | "green" | "grey" | "red";
  bodyLines: { label: string; value: string }[];
} | null {
  if (actorId.startsWith("agent:")) {
    const name = actorId.slice("agent:".length);
    const match = specMeta.agent_prompts.find((p) => p.agent_name === name);
    const comp = specMeta.design_summary.agent_components.find((c) => c.name === name);
    const body: { label: string; value: string }[] = [];
    if (comp?.role) body.push({ label: "역할", value: comp.role });
    if (match?.system_prompt) body.push({ label: "System Prompt", value: match.system_prompt });
    if (match?.example_prompt) body.push({ label: "Example Prompt", value: match.example_prompt });
    if (body.length === 0) body.push({ label: "정보", value: "추가 세부 정보가 없습니다." });
    return { title: name, subtitle: "에이전트", badgeColor: "blue", bodyLines: body };
  }
  if (actorId.startsWith("tool:")) {
    const name = actorId.slice("tool:".length);
    const tool = specMeta.tools.find((t) => t.name === name);
    const body = [
      { label: "Purpose", value: tool?.purpose || "-" },
      { label: "Signature", value: tool?.signature || "-" },
      { label: "When to use", value: tool?.when_to_use || "-" },
    ];
    return { title: name, subtitle: "도구", badgeColor: "grey", bodyLines: body };
  }
  if (actorId.startsWith("data:")) {
    const dsId = actorId.slice("data:".length);
    const ds = specMeta.data_integrations.items.find((d) => d.ds_id === dsId);
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
