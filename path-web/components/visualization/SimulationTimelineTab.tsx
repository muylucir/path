"use client";

import { useMemo } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import TextContent from "@cloudscape-design/components/text-content";
import { SimulationGraph } from "@/components/visualization/SimulationGraph";
import { PlaybackControls } from "@/components/visualization/PlaybackControls";
import { buildScenario, type SimActor, type ActorKind } from "@/lib/simulation/scenario";
import { usePlayback } from "@/lib/simulation/usePlayback";
import type { Analysis, SpecMeta } from "@/lib/types";

interface SimulationTimelineTabProps {
  specMeta: SpecMeta | null;
  analysis: Analysis;
}

const KIND_COLOR: Record<ActorKind, { bg: string; border: string; fg: string }> = {
  user: { bg: "#e8f2ff", border: "#1168bd", fg: "#0b3d91" },
  agent: { bg: "#f0eaff", border: "#6c3ad6", fg: "#3a1e8a" },
  tool: { bg: "#fff4e5", border: "#d98500", fg: "#7a4a00" },
  data: { bg: "#e8f6ec", border: "#1b8a3a", fg: "#0f5123" },
  output: { bg: "#fdecea", border: "#c4321e", fg: "#7a1c10" },
};

const LABEL_COL_PX = 160;

export function SimulationTimelineTab({ specMeta, analysis }: SimulationTimelineTabProps) {
  const scenario = useMemo(() => buildScenario(specMeta, analysis), [specMeta, analysis]);
  const playback = usePlayback({ steps: scenario.steps });
  const currentStep = playback.currentIndex >= 0 ? scenario.steps[playback.currentIndex] : null;

  const visitedActorIds = useMemo(() => {
    const set = new Set<string>();
    if (playback.currentIndex < 0) return set;
    for (let i = 0; i <= playback.currentIndex; i++) set.add(scenario.steps[i].actorId);
    return set;
  }, [scenario.steps, playback.currentIndex]);

  const gantt = useMemo(() => buildGantt(scenario), [scenario]);

  if (!specMeta) {
    return (
      <Container header={<Header variant="h2">시뮬레이션 (타임라인)</Header>}>
        <Alert type="info" header="명세서 생성이 필요합니다">
          명세서 탭에서 명세서를 생성하면 이 탭에서 타임라인으로 실행 흐름을 볼 수
          있습니다. 이전에 저장된 세션이라면 명세서를 재생성해주세요.
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="상단 그래프는 현재 활성 노드를, 하단 타임라인은 병렬 실행과 진행 상태를 보여줍니다."
        >
          시뮬레이션 (타임라인)
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

        <PlaybackControls playback={playback} totalSteps={scenario.steps.length} compact />

        <SimulationGraph
          scenario={scenario}
          currentStep={currentStep}
          visitedActorIds={visitedActorIds}
          height={300}
          mini
        />

        <Gantt
          actors={gantt.actors}
          rows={gantt.rows}
          totalMs={gantt.totalMs}
          currentIndex={playback.currentIndex}
          onSeek={(idx) => playback.seek(idx)}
        />

        {currentStep && (
          <Alert type="info" header={`단계 ${playback.currentIndex + 1} / ${scenario.steps.length}: ${currentStep.summary}`}>
            {currentStep.detail || currentStep.promptExcerpt || "현재 활성화된 스텝입니다."}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

interface GanttBar {
  stepIndex: number;
  startMs: number;
  durationMs: number;
  summary: string;
}

interface GanttRow {
  actor: SimActor;
  bars: GanttBar[];
}

function buildGantt(scenario: ReturnType<typeof buildScenario>) {
  // parallelGroup별 시작 시간 결정: 같은 그룹은 동일 startMs, 이전 그룹 종료 직후 시작
  const groupStart = new Map<number, number>();
  const groupEnd = new Map<number, number>();
  const groups = Array.from(new Set(scenario.steps.map((s) => s.parallelGroup))).sort((a, b) => a - b);

  let cursor = 0;
  for (const g of groups) {
    const groupSteps = scenario.steps.filter((s) => s.parallelGroup === g);
    const maxDuration = groupSteps.reduce((m, s) => Math.max(m, s.durationMs), 0);
    groupStart.set(g, cursor);
    groupEnd.set(g, cursor + maxDuration);
    cursor += maxDuration;
  }
  const totalMs = cursor;

  const actorOrderedIds = scenario.actors.map((a) => a.id);
  const rows: GanttRow[] = actorOrderedIds
    .map((aid) => ({
      actor: scenario.actors.find((a) => a.id === aid)!,
      bars: [] as GanttBar[],
    }))
    .filter((row): row is GanttRow => !!row.actor);

  const byId = new Map(rows.map((r) => [r.actor.id, r]));

  for (const step of scenario.steps) {
    const row = byId.get(step.actorId);
    if (!row) continue;
    row.bars.push({
      stepIndex: step.index,
      startMs: groupStart.get(step.parallelGroup) ?? 0,
      durationMs: step.durationMs,
      summary: step.summary,
    });
  }

  // 바가 없는 행은 제거
  const nonEmpty = rows.filter((r) => r.bars.length > 0);

  return { actors: scenario.actors, rows: nonEmpty, totalMs };
}

interface GanttProps {
  actors: SimActor[];
  rows: GanttRow[];
  totalMs: number;
  currentIndex: number;
  onSeek: (stepIndex: number) => void;
}

function Gantt({ rows, totalMs, currentIndex, onSeek }: GanttProps) {
  const width = 100; // percent (CSS-driven)
  const playheadPct = useMemo(() => {
    if (currentIndex < 0) return 0;
    // 현재 스텝의 중앙에 플레이헤드 위치
    const allBars = rows.flatMap((r) => r.bars);
    const activeBar = allBars.find((b) => b.stepIndex === currentIndex);
    if (!activeBar) return 0;
    const mid = activeBar.startMs + activeBar.durationMs / 2;
    return (mid / Math.max(1, totalMs)) * 100;
  }, [rows, currentIndex, totalMs]);

  return (
    <Container
      header={<Header variant="h3" description="병렬 실행(같은 레인)과 실행 순서를 가로 타임라인으로 표시합니다.">타임라인</Header>}
    >
      <div style={{ overflowX: "auto", position: "relative" }}>
        <div style={{ minWidth: 640 }}>
          {rows.map((row) => (
            <div
              key={row.actor.id}
              style={{
                display: "grid",
                gridTemplateColumns: `${LABEL_COL_PX}px 1fr`,
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px dashed #e9ebed",
              }}
            >
              <div style={{ paddingRight: 12, fontSize: 12 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#687078", letterSpacing: 0.5 }}>
                  {kindLabel(row.actor.kind)}
                </div>
                <div style={{ fontWeight: 600 }}>{row.actor.label}</div>
              </div>
              <div style={{ position: "relative", height: 28, background: "#f4f4f4", borderRadius: 4 }}>
                {row.bars.map((b) => {
                  const left = (b.startMs / Math.max(1, totalMs)) * 100;
                  const barWidth = (b.durationMs / Math.max(1, totalMs)) * 100;
                  const isActive = b.stepIndex === currentIndex;
                  const isPast = currentIndex >= 0 && b.stepIndex < currentIndex;
                  const color = KIND_COLOR[row.actor.kind];
                  return (
                    <button
                      key={b.stepIndex}
                      title={b.summary}
                      onClick={() => onSeek(b.stepIndex)}
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        width: `${Math.max(barWidth, 2)}%`,
                        top: 3,
                        bottom: 3,
                        background: color.bg,
                        color: color.fg,
                        border: `${isActive ? 2 : 1}px solid ${color.border}`,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        padding: "0 6px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        opacity: isPast || isActive ? 1 : 0.7,
                        boxShadow: isActive ? `0 0 0 3px ${color.border}33` : undefined,
                        transition: "all 150ms ease",
                      }}
                    >
                      {b.summary}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {/* playhead */}
          <div
            style={{
              position: "absolute",
              left: `calc(${LABEL_COL_PX}px + (${width}% - ${LABEL_COL_PX}px) * ${playheadPct / 100})`,
              top: 0,
              bottom: 0,
              width: 2,
              background: "#6c3ad6",
              pointerEvents: "none",
              opacity: currentIndex >= 0 ? 0.9 : 0,
              transition: "left 200ms ease",
            }}
          />
        </div>
      </div>
    </Container>
  );
}

function kindLabel(kind: ActorKind): string {
  switch (kind) {
    case "user": return "사용자";
    case "agent": return "에이전트";
    case "tool": return "도구";
    case "data": return "데이터";
    case "output": return "산출물";
  }
}
