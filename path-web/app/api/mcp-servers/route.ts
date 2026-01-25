import { NextRequest, NextResponse } from "next/server";
import {
  createIntegration,
  listIntegrations,
} from "@/lib/aws/integrations-dynamodb";
import type { MCPServerIntegration } from "@/lib/types";

// GET - List MCP servers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceType = searchParams.get("sourceType");

    const integrations = await listIntegrations("mcp-server");

    // Filter by source type if provided
    let filtered = integrations;
    if (sourceType) {
      filtered = integrations.filter(
        (item) => item.mcpSourceType === sourceType
      );
    }

    return NextResponse.json({
      success: true,
      servers: filtered,
    });
  } catch (error) {
    console.error("Error listing MCP servers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list MCP servers" },
      { status: 500 }
    );
  }
}

// POST - Create new MCP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, source, code, mcpConfig, tools, isShared } = body;

    if (!name || !source?.type) {
      return NextResponse.json(
        { success: false, error: "Name and source type are required" },
        { status: 400 }
      );
    }

    // Validate based on source type
    if ((source.type === "self-hosted" || source.type === "template") && !code?.mainPy) {
      return NextResponse.json(
        { success: false, error: "Code is required for self-hosted or template MCP servers" },
        { status: 400 }
      );
    }

    if ((source.type === "external" || source.type === "aws") && !mcpConfig?.command) {
      return NextResponse.json(
        { success: false, error: "MCP config is required for external or AWS MCP servers" },
        { status: 400 }
      );
    }

    const integrationData: Omit<MCPServerIntegration, "id" | "createdAt" | "updatedAt"> = {
      type: "mcp-server",
      name,
      description,
      source,
      code,
      mcpConfig,
      tools: tools || [],
      isShared: isShared || false,
    };

    // Set initial deployment status for self-hosted
    if (source.type === "self-hosted" || source.type === "template") {
      integrationData.deployment = {
        status: "pending",
      };
    }

    const id = await createIntegration(integrationData);

    return NextResponse.json({
      success: true,
      id,
      message: "MCP server created successfully",
    });
  } catch (error) {
    console.error("Error creating MCP server:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create MCP server" },
      { status: 500 }
    );
  }
}
