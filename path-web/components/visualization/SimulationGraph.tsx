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
import Alert from "@cloudscape-design/components/alert";
import type { Scenario, SimStep, ActorKind } from "@/lib/simulation/scenario";

/** Fallback threshold — 이보다 노드가 많으면 경량 SVG로 폴백 */
const HEAVY_NODE_THRESHOLD = 50;

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

  // 정적 레이아웃: 재생 상태(active/visited)와 무관하게 한 번만 계산
  const base = useMemo(() => buildGraphBase(scenario), [scenario]);

  // 동적 오버레이: active/visited만 얹어 노드/엣지를 가볍게 갱신
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = base.nodes.map((n) => ({
      ...n,
      data: {
        ...(n.data as NodeData),
        active: n.id === activeActorId,
        visited: visitedActorIds.has(n.id),
      },
    }));
    const edges: Edge[] = base.edges.map((e) => {
      const touches = activeActorId === e.source || activeActorId === e.target;
      return {
        ...e,
        animated: touches,
        style: {
          ...(e.style ?? {}),
          stroke: touches ? "#6c3ad6" : "#8b9199",
          strokeWidth: touches ? 2.2 : 1.4,
        },
      };
    });
    return { nodes, edges };
  }, [base, activeActorId, visitedActorIds]);

  const handleNodeClick = useCallback(
    (_evt: unknown, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  // 거대 그래프는 ReactFlow 대신 경량 SVG 폴백
  if (base.nodes.length > HEAVY_NODE_THRESHOLD) {
    return (
      <Box>
        <Alert type="info">
          노드 {base.nodes.length}개로 그래프가 커서 경량 뷰로 표시합니다. 재생 중 하이라이트만 반영됩니다.
        </Alert>
        <div style={{ height, overflow: "auto", border: "1px solid var(--color-border-divider-default, #e9ebed)", borderRadius: 8 }}>
          <LightweightGraph base={base} activeActorId={activeActorId} visited={visitedActorIds} onNodeClick={onNodeClick} />
        </div>
      </Box>
    );
  }

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

interface GraphBase {
  nodes: Node[];
  edges: Edge[];
}

function LightweightGraph({
  base,
  activeActorId,
  visited,
  onNodeClick,
}: {
  base: GraphBase;
  activeActorId: string | null;
  visited: Set<string>;
  onNodeClick?: (actorId: string) => void;
}) {
  const maxX = Math.max(0, ...base.nodes.map((n) => n.position.x)) + 200;
  const maxY = Math.max(0, ...base.nodes.map((n) => n.position.y)) + 80;
  return (
    <svg width={maxX} height={maxY} style={{ display: "block" }}>
      {base.edges.map((e) => {
        const s = base.nodes.find((n) => n.id === e.source);
        const t = base.nodes.find((n) => n.id === e.target);
        if (!s || !t) return null;
        const touches = activeActorId === e.source || activeActorId === e.target;
        return (
          <line
            key={e.id}
            x1={s.position.x + 60}
            y1={s.position.y + 20}
            x2={t.position.x + 60}
            y2={t.position.y + 20}
            stroke={touches ? "#6c3ad6" : "#8b9199"}
            strokeWidth={touches ? 2 : 1}
          />
        );
      })}
      {base.nodes.map((n) => {
        const d = n.data as NodeData;
        const c = KIND_COLOR[d.kind];
        const isActive = n.id === activeActorId;
        return (
          <g
            key={n.id}
            transform={`translate(${n.position.x},${n.position.y})`}
            style={{ cursor: onNodeClick ? "pointer" : "default" }}
            onClick={() => onNodeClick?.(n.id)}
          >
            <rect
              width={140}
              height={40}
              rx={6}
              fill={c.bg}
              stroke={c.border}
              strokeWidth={isActive ? 2.5 : 1}
              opacity={visited.has(n.id) || isActive ? 1 : 0.65}
            />
            <text x={70} y={24} textAnchor="middle" fontSize={12} fill={c.fg} fontWeight={isActive ? 700 : 500}>
              {d.label.length > 18 ? d.label.slice(0, 17) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * 정적 그래프 베이스. active/visited 상태 없이 한 번만 계산한다.
 * 재생 중 하이라이트는 SimulationGraph의 두 번째 useMemo에서 얹는다.
 */
function buildGraphBase(scenario: Scenario): GraphBase {
  const diagram = scenario.primaryDiagram;
  const actorById = new Map(scenario.actors.map((a) => [a.id, a]));

  // diagram 노드를 스텝 actor와 매핑할 때 쓰는 사전 인덱스:
  // 정확 일치와 substring 포함 각각 O(1) 또는 선형 1회로 처리하기 위해
  // label lowercase를 미리 뽑아둔다.
  const actorsLc = scenario.actors.map((a) => ({ id: a.id, lc: a.label.toLowerCase() }));
  const exactLcIndex = new Map<string, string>();
  for (const a of actorsLc) {
    if (!exactLcIndex.has(a.lc)) exactLcIndex.set(a.lc, a.id);
  }

  const diagramNodeIdToActor = new Map<string, string>();
  if (diagram) {
    for (const dn of diagram.parsed_nodes ?? []) {
      const labelLower = dn.label.toLowerCase();
      let matchedId = exactLcIndex.get(labelLower);
      if (!matchedId) {
        for (const a of actorsLc) {
          if (a.lc.includes(labelLower) || labelLower.includes(a.lc)) {
            matchedId = a.id;
            break;
          }
        }
      }
      diagramNodeIdToActor.set(dn.id, matchedId ?? `diagram:${dn.id}`);
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
          active: false,
          visited: false,
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
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#8b9199", strokeWidth: 1.4 },
      });
    }
  } else {
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
          active: false,
          visited: false,
        },
        position: { x: col * 220, y: row * 110 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }

    for (let i = 0; i < scenario.steps.length - 1; i++) {
      const src = scenario.steps[i].actorId;
      const dst = scenario.steps[i + 1].actorId;
      if (src === dst) continue;
      edges.push({
        id: `seq-${i}`,
        source: src,
        target: dst,
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
