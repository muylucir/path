"use client";

import { useCallback, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AgentNode } from "./nodes/AgentNode";
import { RouterNode } from "./nodes/RouterNode";
import { MemoryNode } from "./nodes/MemoryNode";
import { GatewayNode } from "./nodes/GatewayNode";
import { IdentityNode } from "./nodes/IdentityNode";
import { PropertyPanel } from "./PropertyPanel";
import { NodePalette } from "./NodePalette";
import type { AgentCanvasState, CanvasNode } from "@/lib/types";

const nodeTypes = {
  agent: AgentNode,
  router: RouterNode,
  memory: MemoryNode,
  gateway: GatewayNode,
  identity: IdentityNode,
};

interface AgentCanvasProps {
  initialState?: AgentCanvasState;
  onStateChange?: (state: AgentCanvasState) => void;
  readOnly?: boolean;
}

export function AgentCanvas({
  initialState,
  onStateChange,
  readOnly = false,
}: AgentCanvasProps) {
  const initialNodes: Node[] = useMemo(() => {
    if (!initialState?.nodes) return [];
    return initialState.nodes.map((node: CanvasNode) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data as unknown as Record<string, unknown>,
    }));
  }, [initialState?.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!initialState?.edges) return [];
    return initialState.edges.map((edge) => {
      const isServiceEdge = edge.type === "service";
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: !isServiceEdge,  // 서비스 edge는 애니메이션 없음
        style: isServiceEdge
          ? { strokeWidth: 2, stroke: "#9ca3af", strokeDasharray: "5 5" }  // 점선, 회색
          : { strokeWidth: 2, stroke: "#6366f1" },  // 실선, 보라색
        type: isServiceEdge ? "smoothstep" : "default",
      };
    });
  }, [initialState?.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { strokeWidth: 2, stroke: "#6366f1" },
          },
          eds
        )
      );
    },
    [setEdges, readOnly]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      if (readOnly) return;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
    },
    [setNodes, readOnly]
  );

  const onNodeDelete = useCallback(
    (nodeId: string) => {
      if (readOnly) return;
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSelectedNode(null);
    },
    [setNodes, setEdges, readOnly]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (readOnly) return;
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, readOnly]
  );

  return (
    <div className="flex h-full w-full">
      {!readOnly && <NodePalette />}

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={readOnly ? null : "Delete"}
          className="bg-gray-50 dark:bg-gray-900"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            className="!bg-gray-100 dark:!bg-gray-800"
          />
          <Controls className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700" />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case "agent":
                  return "#3b82f6";
                case "router":
                  return "#f59e0b";
                case "memory":
                  return "#8b5cf6";
                case "gateway":
                  return "#10b981";
                case "identity":
                  return "#ef4444";
                default:
                  return "#6b7280";
              }
            }}
            className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
          />
          <Panel position="top-left" className="!m-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {nodes.length} nodes, {edges.length} edges
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <PropertyPanel
        node={selectedNode}
        onUpdate={onNodeUpdate}
        onDelete={onNodeDelete}
        readOnly={readOnly}
      />
    </div>
  );
}

function getDefaultNodeData(type: string): Record<string, unknown> {
  switch (type) {
    case "agent":
      return {
        id: `agent-${Date.now()}`,
        name: "New Agent",
        role: "새로운 에이전트",
        systemPrompt: "",
        input: "",
        output: "",
        llm: { model: "claude-sonnet-4.5" },
        tools: [],
      };
    case "router":
      return {
        id: `router-${Date.now()}`,
        name: "Router",
        condition: "",
        branches: [],
      };
    case "memory":
      return {
        id: `memory-${Date.now()}`,
        name: "Memory",
        type: "short-term",
        strategies: [],
        namespaces: [],
      };
    case "gateway":
      return {
        id: `gateway-${Date.now()}`,
        name: "Gateway",
        targets: [],
      };
    case "identity":
      return {
        id: `identity-${Date.now()}`,
        name: "Identity",
        authType: "api-key",
        provider: "",
        scopes: [],
      };
    default:
      return {};
  }
}
