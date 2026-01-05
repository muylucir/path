"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Link } from "lucide-react";
import type { GatewayNodeData } from "@/lib/types";

interface GatewayNodeProps {
  data: GatewayNodeData;
  selected?: boolean;
}

function GatewayNodeComponent({ data, selected }: GatewayNodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-emerald-50 dark:bg-emerald-950
        border-emerald-500 dark:border-emerald-400 min-w-[160px] max-w-[240px]
        shadow-md transition-all duration-200
        ${selected ? "ring-2 ring-emerald-300 dark:ring-emerald-600 shadow-lg" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-emerald-500 rounded-md">
          <Link className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-100 truncate">
          {data.name}
        </span>
      </div>

      <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
        {data.targets.length} target(s)
      </div>

      {data.targets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.targets.slice(0, 3).map((target, idx) => (
            <span
              key={idx}
              className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded truncate max-w-[80px]"
            >
              {target.name}
            </span>
          ))}
          {data.targets.length > 3 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              +{data.targets.length - 3}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
}

export const GatewayNode = memo(GatewayNodeComponent);
