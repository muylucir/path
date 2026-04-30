"use client";

import { memo, useMemo } from "react";
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

/** 행이 이보다 많으면 가시 영역(앞쪽)만 렌더 */
const MAX_VISIBLE_ROWS = 30;

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
  // parallelGroup별 최대 duration을 한 번의 순회로 집계
  const maxByGroup = new Map<number, number>();
  for (const s of scenario.steps) {
    const prev = maxByGroup.get(s.parallelGroup) ?? 0;
    if (s.durationMs > prev) maxByGroup.set(s.parallelGroup, s.durationMs);
  }
  const sortedGroups = Array.from(maxByGroup.keys()).sort((a, b) => a - b);
  const groupStart = new Map<number, number>();
  let cursor = 0;
  for (const g of sortedGroups) {
    groupStart.set(g, cursor);
    cursor += maxByGroup.get(g) ?? 0;
  }
  const totalMs = cursor;

  // actor → row 맵을 actors 배열 순서대로 한 번에 초기화
  const rows: GanttRow[] = scenario.actors.map((a) => ({ actor: a, bars: [] as GanttBar[] }));
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
  const width = 100;

  // 활성 bar 위치 룩업을 O(1)로: stepIndex → {startMs, durationMs} 맵
  const barByStepIndex = useMemo(() => {
    const m = new Map<number, { startMs: number; durationMs: number }>();
    for (const r of rows) {
      for (const b of r.bars) m.set(b.stepIndex, { startMs: b.startMs, durationMs: b.durationMs });
    }
    return m;
  }, [rows]);

  const playheadPct = useMemo(() => {
    if (currentIndex < 0) return 0;
    const active = barByStepIndex.get(currentIndex);
    if (!active) return 0;
    const mid = active.startMs + active.durationMs / 2;
    return (mid / Math.max(1, totalMs)) * 100;
  }, [barByStepIndex, currentIndex, totalMs]);

  const truncated = rows.length > MAX_VISIBLE_ROWS;
  const visibleRows = truncated ? rows.slice(0, MAX_VISIBLE_ROWS) : rows;

  return (
    <Container
      header={<Header variant="h3" description="병렬 실행(같은 레인)과 실행 순서를 가로 타임라인으로 표시합니다.">타임라인</Header>}
    >
      {truncated && (
        <Alert type="info">
          행이 {rows.length}개로 많아 상위 {MAX_VISIBLE_ROWS}개만 표시합니다. 그래프 탭에서 전체 구조를 확인하세요.
        </Alert>
      )}
      <div style={{ overflowX: "auto", position: "relative" }}>
        <div style={{ minWidth: 640 }}>
          {visibleRows.map((row) => (
            <GanttRowView
              key={row.actor.id}
              row={row}
              totalMs={totalMs}
              currentIndex={currentIndex}
              onSeek={onSeek}
            />
          ))}
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

interface GanttRowProps {
  row: GanttRow;
  totalMs: number;
  currentIndex: number;
  onSeek: (stepIndex: number) => void;
}

/**
 * 각 row를 memo로 감싸 현재 스텝이 이 row에 속하지 않을 때 리렌더 스킵.
 * stepIndex → row 변환이 없으므로 간접적으로 "현재 스텝이 row의 bar 중 하나인가"를
 * 판정해 active 여부만 반영.
 */
const GanttRowView = memo(function GanttRowView({
  row,
  totalMs,
  currentIndex,
  onSeek,
}: GanttRowProps) {
  const color = KIND_COLOR[row.actor.kind];
  return (
    <div
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
  );
});

function kindLabel(kind: ActorKind): string {
  switch (kind) {
    case "user": return "사용자";
    case "agent": return "에이전트";
    case "tool": return "도구";
    case "data": return "데이터";
    case "output": return "산출물";
  }
}
