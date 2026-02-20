"use client";

// TokenUsageBadge is now integrated into AppLayoutShell TopNavigation utility.
// This file is kept as an empty export for backwards compatibility during migration.

import type { TokenUsage } from "@/lib/types";

interface TokenUsageBadgeProps {
  usage: TokenUsage;
}

export function TokenUsageBadge(_props: TokenUsageBadgeProps) {
  return null;
}
