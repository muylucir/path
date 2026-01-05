"use client";

import { Brain, GitBranch, Database, Link, Shield } from "lucide-react";

const nodeTypes = [
  {
    type: "agent",
    label: "Agent",
    description: "LLM Agent 노드",
    icon: Brain,
    color: "bg-blue-500",
  },
  {
    type: "router",
    label: "Router",
    description: "조건부 분기 노드",
    icon: GitBranch,
    color: "bg-orange-500",
  },
  {
    type: "memory",
    label: "Memory",
    description: "AgentCore Memory",
    icon: Database,
    color: "bg-purple-500",
  },
  {
    type: "gateway",
    label: "Gateway",
    description: "MCP/API 연동",
    icon: Link,
    color: "bg-emerald-500",
  },
  {
    type: "identity",
    label: "Identity",
    description: "OAuth/API Key",
    icon: Shield,
    color: "bg-red-500",
  },
];

export function NodePalette() {
  const onDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        노드 팔레트
      </h3>
      <div className="space-y-2">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-grab hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all active:cursor-grabbing"
            >
              <div className={`p-2 rounded-md ${node.color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {node.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {node.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          노드를 캔버스로 드래그하여 추가하세요
        </p>
      </div>
    </div>
  );
}
