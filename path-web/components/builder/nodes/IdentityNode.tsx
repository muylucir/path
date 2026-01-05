"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Shield } from "lucide-react";
import type { IdentityNodeData } from "@/lib/types";

interface IdentityNodeProps {
  data: IdentityNodeData;
  selected?: boolean;
}

function IdentityNodeComponent({ data, selected }: IdentityNodeProps) {
  const authTypeLabel = {
    "oauth2-2lo": "OAuth 2.0 (2LO)",
    "oauth2-3lo": "OAuth 2.0 (3LO)",
    "api-key": "API Key",
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-red-50 dark:bg-red-950
        border-red-500 dark:border-red-400 min-w-[160px] max-w-[240px]
        shadow-md transition-all duration-200
        ${selected ? "ring-2 ring-red-300 dark:ring-red-600 shadow-lg" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-red-500 rounded-md">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-red-900 dark:text-red-100 truncate">
          {data.name}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-0.5 rounded">
          {authTypeLabel[data.authType]}
        </span>
      </div>

      {data.provider && (
        <p className="text-xs text-red-700 dark:text-red-300 truncate">
          {data.provider}
        </p>
      )}

      {data.scopes && data.scopes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {data.scopes.slice(0, 2).map((scope, idx) => (
            <span
              key={idx}
              className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-1.5 py-0.5 rounded truncate max-w-[60px]"
            >
              {scope}
            </span>
          ))}
          {data.scopes.length > 2 && (
            <span className="text-xs text-red-600 dark:text-red-400">
              +{data.scopes.length - 2}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
    </div>
  );
}

export const IdentityNode = memo(IdentityNodeComponent);
