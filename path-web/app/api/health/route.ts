import { NextResponse } from "next/server";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    frontend: {
      status: "healthy" | "unhealthy";
      version: string;
    };
    agentcore: {
      status: "configured" | "not_configured";
      runtimeArn: string;
    };
  };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  const frontendStatus = {
    status: "healthy" as const,
    version: process.env.npm_package_version || "0.1.0",
  };

  const runtimeArn = process.env.AGENT_RUNTIME_ARN || "";
  const agentcoreStatus = {
    status: runtimeArn ? ("configured" as const) : ("not_configured" as const),
    runtimeArn: runtimeArn ? `${runtimeArn.slice(0, 40)}...` : "",
  };

  const overallStatus: HealthStatus["status"] =
    frontendStatus.status === "healthy" && agentcoreStatus.status === "configured"
      ? "healthy"
      : frontendStatus.status === "healthy"
        ? "degraded"
        : "unhealthy";

  const healthResponse: HealthStatus = {
    status: overallStatus,
    timestamp,
    services: {
      frontend: frontendStatus,
      agentcore: agentcoreStatus,
    },
  };

  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(healthResponse, { status: statusCode });
}
