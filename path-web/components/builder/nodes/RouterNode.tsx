"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import type { RouterNodeData } from "@/lib/types";

interface RouterNodeProps {
  data: RouterNodeData;
  selected?: boolean;
}

function RouterNodeComponent({ data, selected }: RouterNodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-orange-50 dark:bg-orange-950
        border-orange-500 dark:border-orange-400 min-w-[160px] max-w-[240px]
        shadow-md transition-all duration-200
        ${selected ? "ring-2 ring-orange-300 dark:ring-orange-600 shadow-lg" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-orange-500 rounded-md">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-orange-900 dark:text-orange-100 truncate">
          {data.name}
        </span>
      </div>

      <p className="text-xs text-orange-700 dark:text-orange-300 mb-2 font-mono bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded truncate">
        {data.condition || "조건 없음"}
      </p>

      <div className="flex flex-wrap gap-1">
        {data.branches.map((branch, idx) => (
          <span
            key={idx}
            className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded"
          >
            {branch.label}
          </span>
        ))}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white"
      />
    </div>
  );
}

export const RouterNode = memo(RouterNodeComponent);
