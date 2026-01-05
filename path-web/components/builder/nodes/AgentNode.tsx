"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Brain, Wrench } from "lucide-react";
import type { AgentNodeData } from "@/lib/types";

interface AgentNodeProps {
  data: AgentNodeData;
  selected?: boolean;
}

function AgentNodeComponent({ data, selected }: AgentNodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-blue-50 dark:bg-blue-950
        border-blue-500 dark:border-blue-400 min-w-[180px] max-w-[280px]
        shadow-md transition-all duration-200
        ${selected ? "ring-2 ring-blue-300 dark:ring-blue-600 shadow-lg" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-500 rounded-md">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-blue-900 dark:text-blue-100 truncate">
          {data.name}
        </span>
      </div>

      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 line-clamp-2">
        {data.role}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">
          {data.llm.model.replace("claude-", "").replace("-4.5", "")}
        </span>
        {data.tools.length > 0 && (
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Wrench className="w-3 h-3" />
            <span>{data.tools.length}</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
