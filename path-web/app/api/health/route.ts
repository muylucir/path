import { NextResponse } from "next/server";

const BACKEND_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    frontend: {
      status: "healthy" | "unhealthy";
      version: string;
    };
    backend: {
      status: "healthy" | "unhealthy";
      url: string;
      error?: string;
    };
  };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  // Frontend is always healthy if this endpoint responds
  const frontendStatus = {
    status: "healthy" as const,
    version: process.env.npm_package_version || "0.1.0",
  };

  // Check backend health
  let backendStatus: HealthStatus["services"]["backend"];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      backendStatus = {
        status: "healthy",
        url: BACKEND_URL,
      };
    } else {
      backendStatus = {
        status: "unhealthy",
        url: BACKEND_URL,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    backendStatus = {
      status: "unhealthy",
      url: BACKEND_URL,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Determine overall status
  const overallStatus: HealthStatus["status"] =
    frontendStatus.status === "healthy" && backendStatus.status === "healthy"
      ? "healthy"
      : frontendStatus.status === "healthy" || backendStatus.status === "healthy"
        ? "degraded"
        : "unhealthy";

  const healthResponse: HealthStatus = {
    status: overallStatus,
    timestamp,
    services: {
      frontend: frontendStatus,
      backend: backendStatus,
    },
  };

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(healthResponse, { status: statusCode });
}
