import { NextRequest, NextResponse } from "next/server";
import {
  getIntegrationFull,
  updateIntegration,
} from "@/lib/aws/integrations-dynamodb";
import type { MCPServerIntegration } from "@/lib/types";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

// POST - Deploy MCP server to AgentCore Runtime (비동기)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const server = (await getIntegrationFull(id)) as MCPServerIntegration | null;

    if (!server) {
      return NextResponse.json(
        { success: false, error: "MCP server not found" },
        { status: 404 }
      );
    }

    if (server.type !== "mcp-server") {
      return NextResponse.json(
        { success: false, error: "Invalid integration type" },
        { status: 400 }
      );
    }

    // Only self-hosted and template servers can be deployed
    if (server.source.type !== "self-hosted" && server.source.type !== "template") {
      return NextResponse.json(
        { success: false, error: "Only self-hosted or template MCP servers can be deployed" },
        { status: 400 }
      );
    }

    if (!server.code?.mainPy) {
      return NextResponse.json(
        { success: false, error: "MCP server code is required for deployment" },
        { status: 400 }
      );
    }

    // Check if already deploying
    if (server.deployment?.status === "deploying") {
      return NextResponse.json(
        { success: false, error: "MCP server is already being deployed" },
        { status: 400 }
      );
    }

    // NOTE: 상태 업데이트는 백엔드 Worker에서 단일 포인트로 관리
    // Frontend에서 중복 업데이트하지 않음 (경쟁 상태 방지)

    // Call the Strands API to deploy MCP server (비동기 - 즉시 응답)
    const response = await fetch(`${STRANDS_API_URL}/mcp-servers/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mcp_server_id: id,
        name: server.name,
        code: server.code.mainPy,
        requirements: server.code.requirements || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Update deployment status to failed
      await updateIntegration(id, {
        deployment: {
          status: "failed",
          error: errorData.detail || response.statusText,
        },
      });

      return NextResponse.json(
        { success: false, error: errorData.detail || "Deployment failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 비동기 배포이므로 status: "deploying" 응답
    // 클라이언트는 GET /api/mcp-servers/{id}/deploy로 폴링하여 상태 확인
    return NextResponse.json({
      success: true,
      deployment: {
        status: "deploying",
        message: data.message || "배포가 시작되었습니다.",
      },
    });
  } catch (error) {
    console.error("Error deploying MCP server:", error);

    // Try to update status to failed
    try {
      const { id } = await context.params;
      await updateIntegration(id, {
        deployment: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch {
      // Ignore update errors
    }

    return NextResponse.json(
      { success: false, error: "Failed to deploy MCP server" },
      { status: 500 }
    );
  }
}

// GET - Get deployment status (폴링용)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const server = (await getIntegrationFull(id)) as MCPServerIntegration | null;

    if (!server) {
      return NextResponse.json(
        { success: false, error: "MCP server not found" },
        { status: 404 }
      );
    }

    if (server.type !== "mcp-server") {
      return NextResponse.json(
        { success: false, error: "Invalid integration type" },
        { status: 400 }
      );
    }

    // 배포 중인 경우 백엔드에서 최신 상태 확인
    if (server.deployment?.status === "deploying") {
      try {
        const response = await fetch(
          `${STRANDS_API_URL}/mcp-servers/${id}/deployment`
        );

        if (response.ok) {
          const backendData = await response.json();
          const backendDeployment = backendData.deployment;

          // 백엔드 상태가 변경되었으면 DynamoDB 업데이트
          if (
            backendDeployment.status !== "deploying" &&
            backendDeployment.status !== server.deployment.status
          ) {
            await updateIntegration(id, {
              deployment: {
                status: backendDeployment.status,
                runtimeArn: backendDeployment.runtimeArn,
                endpointUrl: backendDeployment.endpointUrl,
                lastDeployedAt: backendDeployment.lastDeployedAt,
                error: backendDeployment.error,
              },
            });

            return NextResponse.json({
              success: true,
              deployment: {
                status: backendDeployment.status,
                runtimeArn: backendDeployment.runtimeArn,
                endpointUrl: backendDeployment.endpointUrl,
                lastDeployedAt: backendDeployment.lastDeployedAt,
                error: backendDeployment.error,
              },
            });
          }
        }
      } catch (backendError) {
        console.error("Error fetching backend deployment status:", backendError);
        // 백엔드 조회 실패 시 DynamoDB 상태 반환
      }
    }

    return NextResponse.json({
      success: true,
      deployment: server.deployment || { status: "pending" },
    });
  } catch (error) {
    console.error("Error getting deployment status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get deployment status" },
      { status: 500 }
    );
  }
}
