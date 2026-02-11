"use client";

import { Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TokenUsage } from "@/lib/types";

interface TokenUsageBadgeProps {
  usage: TokenUsage;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function TokenUsageBadge({ usage }: TokenUsageBadgeProps) {
  if (!usage.totalTokens) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-background/95 border shadow-lg px-3 py-1.5 text-xs cursor-default backdrop-blur-sm hover:shadow-xl transition-shadow">
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-medium tabular-nums">
            {formatTokens(usage.totalTokens)}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="font-medium tabular-nums text-green-600">
            ${usage.estimatedCostUSD.toFixed(2)}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" align="end" className="text-xs space-y-1 w-56">
        <p className="font-semibold pb-1 border-b mb-1">Token Usage (this session)</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Input</span>
          <span className="tabular-nums">{usage.inputTokens.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Output</span>
          <span className="tabular-nums">{usage.outputTokens.toLocaleString()}</span>
        </div>
        {(usage.cacheReadInputTokens ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cache Read</span>
            <span className="tabular-nums">{(usage.cacheReadInputTokens ?? 0).toLocaleString()}</span>
          </div>
        )}
        {(usage.cacheWriteInputTokens ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cache Write</span>
            <span className="tabular-nums">{(usage.cacheWriteInputTokens ?? 0).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t font-medium">
          <span>Total</span>
          <span className="tabular-nums">{usage.totalTokens.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-medium text-green-600">
          <span>Est. Cost</span>
          <span className="tabular-nums">${usage.estimatedCostUSD.toFixed(4)}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
