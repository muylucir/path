"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Database } from "lucide-react";
import type { MemoryNodeData } from "@/lib/types";

interface MemoryNodeProps {
  data: MemoryNodeData;
  selected?: boolean;
}

function MemoryNodeComponent({ data, selected }: MemoryNodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-purple-50 dark:bg-purple-950
        border-purple-500 dark:border-purple-400 min-w-[160px] max-w-[240px]
        shadow-md transition-all duration-200
        ${selected ? "ring-2 ring-purple-300 dark:ring-purple-600 shadow-lg" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-purple-500 rounded-md">
          <Database className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-purple-900 dark:text-purple-100 truncate">
          {data.name}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded">
          {data.type === "short-term" ? "STM" : "LTM"}
        </span>
      </div>

      {data.strategies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.strategies.map((strategy, idx) => (
            <span
              key={idx}
              className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-1.5 py-0.5 rounded"
            >
              {strategy}
            </span>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
    </div>
  );
}

export const MemoryNode = memo(MemoryNodeComponent);
