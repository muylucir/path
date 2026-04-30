"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Box from "@cloudscape-design/components/box";
import type { Scenario, SimStep, ActorKind } from "@/lib/simulation/scenario";

type NodeData = {
  label: string;
  kind: ActorKind;
  active: boolean;
  visited: boolean;
};

const KIND_COLOR: Record<ActorKind, { bg: string; border: string; fg: string }> = {
  user:   { bg: "#e8f2ff", border: "#1168bd", fg: "#0b3d91" },
  agent:  { bg: "#f0eaff", border: "#6c3ad6", fg: "#3a1e8a" },
  tool:   { bg: "#fff4e5", border: "#d98500", fg: "#7a4a00" },
  data:   { bg: "#e8f6ec", border: "#1b8a3a", fg: "#0f5123" },
  output: { bg: "#fdecea", border: "#c4321e", fg: "#7a1c10" },
};

function ActorNode({ data }: NodeProps) {
  const d = data as NodeData;
  const color = KIND_COLOR[d.kind];
  const emphasize = d.active;
  return (
    <div
      style={{
        background: color.bg,
        border: `${emphasize ? 3 : 1.5}px solid ${color.border}`,
        color: color.fg,
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: emphasize ? 700 : 500,
        boxShadow: emphasize ? `0 0 0 4px ${color.border}22, 0 4px 12px rgba(0,0,0,0.12)` : "0 1px 3px rgba(0,0,0,0.08)",
        opacity: d.visited || d.active ? 1 : 0.65,
        minWidth: 120,
        textAlign: "center",
        transition: "all 180ms ease",
      }}
    >
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.7 }}>
        {kindLabel(d.kind)}
      </div>
      <div>{d.label}</div>
    </div>
  );
}

const nodeTypes = { actor: ActorNode };

function kindLabel(kind: ActorKind): string {
  switch (kind) {
    case "user": return "사용자";
    case "agent": return "에이전트";
    case "tool": return "도구";
    case "data": return "데이터";
    case "output": return "산출물";
  }
}

interface SimulationGraphProps {
  scenario: Scenario;
  currentStep: SimStep | null;
  visitedActorIds: Set<string>;
  onNodeClick?: (actorId: string) => void;
  height?: number;
  mini?: boolean;
}

/**
 * 공유 그래프 렌더러. 그래프 탭과 타임라인 탭이 동일한 레이아웃을 사용한다.
 * primary diagram이 있으면 그걸 이용, 없으면 actors로 자동 레이아웃.
 */
export function SimulationGraph({
  scenario,
  currentStep,
  visitedActorIds,
  onNodeClick,
  height = 420,
  mini = false,
}: SimulationGraphProps) {
  const activeActorId = currentStep?.actorId ?? null;

  const { nodes, edges } = useMemo(
    () => buildGraphElements(scenario, activeActorId, visitedActorIds),
    [scenario, activeActorId, visitedActorIds],
  );

  const handleNodeClick = useCallback(
    (_evt: unknown, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  return (
    <Box>
      <div style={{ height, border: "1px solid var(--color-border-divider-default, #e9ebed)", borderRadius: 8 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={!mini}
          nodesConnectable={false}
          elementsSelectable={!mini}
          panOnScroll
          onNodeClick={handleNodeClick}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          {!mini && <Controls showInteractive={false} />}
        </ReactFlow>
      </div>
    </Box>
  );
}

function buildGraphElements(
  scenario: Scenario,
  activeActorId: string | null,
  visited: Set<string>,
): { nodes: Node[]; edges: Edge[] } {
  const diagram = scenario.primaryDiagram;
  const actorById = new Map(scenario.actors.map((a) => [a.id, a]));

  // diagram 노드를 스텝 actor와 매핑 (label 기준 퍼지 매칭)
  const diagramNodeIdToActor = new Map<string, string>();
  if (diagram) {
    for (const dn of diagram.parsed_nodes ?? []) {
      const labelLower = dn.label.toLowerCase();
      const matched = scenario.actors.find(
        (a) =>
          a.label.toLowerCase() === labelLower ||
          a.label.toLowerCase().includes(labelLower) ||
          labelLower.includes(a.label.toLowerCase()),
      );
      diagramNodeIdToActor.set(dn.id, matched?.id ?? `diagram:${dn.id}`);
    }
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (diagram && (diagram.parsed_nodes?.length ?? 0) > 0) {
    const positions = layoutDag(diagram.parsed_nodes, diagram.parsed_edges);
    for (const dn of diagram.parsed_nodes) {
      const actorId = diagramNodeIdToActor.get(dn.id)!;
      const actor = actorById.get(actorId);
      const kind: ActorKind = actor?.kind ?? guessKindFromLabel(dn.label);
      const pos = positions.get(dn.id) ?? { x: 0, y: 0 };
      nodes.push({
        id: actorId,
        type: "actor",
        data: {
          label: actor?.label ?? dn.label,
          kind,
          active: actorId === activeActorId,
          visited: visited.has(actorId),
        },
        position: pos,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }
    for (const [i, de] of (diagram.parsed_edges ?? []).entries()) {
      const src = diagramNodeIdToActor.get(de.source);
      const dst = diagramNodeIdToActor.get(de.target);
      if (!src || !dst) continue;
      edges.push({
        id: `de-${i}-${src}-${dst}`,
        source: src,
        target: dst,
        label: de.label || undefined,
        animated: activeActorId === dst || activeActorId === src,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: {
          stroke: activeActorId === dst || activeActorId === src ? "#6c3ad6" : "#8b9199",
          strokeWidth: activeActorId === dst || activeActorId === src ? 2.2 : 1.4,
        },
      });
    }
  } else {
    // Fallback: scenario.actors로 간단한 grid 레이아웃
    const cols: Record<ActorKind, number> = { user: 0, agent: 1, tool: 2, data: 3, output: 4 };
    const colCounts: Record<ActorKind, number> = { user: 0, agent: 0, tool: 0, data: 0, output: 0 };
    for (const actor of scenario.actors) {
      const col = cols[actor.kind];
      const row = colCounts[actor.kind]++;
      nodes.push({
        id: actor.id,
        type: "actor",
        data: {
          label: actor.label,
          kind: actor.kind,
          active: actor.id === activeActorId,
          visited: visited.has(actor.id),
        },
        position: { x: col * 220, y: row * 110 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }

    // 스텝 순서대로 엣지 연결
    for (let i = 0; i < scenario.steps.length - 1; i++) {
      const src = scenario.steps[i].actorId;
      const dst = scenario.steps[i + 1].actorId;
      if (src === dst) continue;
      edges.push({
        id: `seq-${i}`,
        source: src,
        target: dst,
        animated: scenario.steps[i + 1].actorId === activeActorId,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#8b9199", strokeWidth: 1.4 },
      });
    }
  }

  return { nodes, edges };
}

function guessKindFromLabel(label: string): ActorKind {
  const l = label.toLowerCase();
  if (/(user|사용자)/.test(l)) return "user";
  if (/(tool|도구|api)/.test(l)) return "tool";
  if (/(data|데이터|db|source)/.test(l)) return "data";
  if (/(output|결과|산출물|response)/.test(l)) return "output";
  return "agent";
}

/**
 * 간단한 레이어드 DAG 레이아웃. in-degree로 레벨을 나누고 열·행에 배치.
 */
function layoutDag(
  parsedNodes: { id: string; label: string }[],
  parsedEdges: { source: string; target: string; label: string }[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (parsedNodes.length === 0) return positions;

  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const n of parsedNodes) {
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  }
  for (const e of parsedEdges) {
    if (!adj.has(e.source) || !inDeg.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }

  // BFS로 레벨 부여
  const level = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, deg] of inDeg) {
    if (deg === 0) {
      level.set(id, 0);
      queue.push(id);
    }
  }
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curLvl = level.get(cur) ?? 0;
    for (const next of adj.get(cur) ?? []) {
      const nextLvl = Math.max(level.get(next) ?? 0, curLvl + 1);
      if (level.get(next) !== nextLvl) {
        level.set(next, nextLvl);
        queue.push(next);
      }
    }
  }
  // 미방문(사이클) 노드도 레벨 0으로
  for (const n of parsedNodes) {
    if (!level.has(n.id)) level.set(n.id, 0);
  }

  const byLevel = new Map<number, string[]>();
  for (const n of parsedNodes) {
    const lvl = level.get(n.id) ?? 0;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(n.id);
  }

  const colWidth = 220;
  const rowHeight = 110;
  for (const [lvl, ids] of byLevel) {
    ids.forEach((id, i) => {
      positions.set(id, { x: lvl * colWidth, y: i * rowHeight });
    });
  }
  return positions;
}
