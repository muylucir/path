import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKST(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(/\. /g, "-").replace(".", "");
}

/**
 * Check if an MCP server source type is deployable to AgentCore Runtime.
 *
 * AgentCore Runtime sandbox cannot execute external processes (npx/uvx),
 * so only self-hosted and template MCP servers can be deployed.
 *
 * - self-hosted: Custom Python code → deployable (uses streamablehttp)
 * - template: Template-based → deployable (uses streamablehttp)
 * - external: mcp.so registry → NOT deployable (requires stdio/npx)
 * - aws: AWS MCP servers → NOT deployable (requires stdio/npx)
 * - team: Depends on original source
 */
export function isAgentCoreDeployable(sourceType: string): boolean {
  return sourceType === 'self-hosted' || sourceType === 'template';
}
