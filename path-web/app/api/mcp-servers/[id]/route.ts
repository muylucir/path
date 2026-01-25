import { NextRequest, NextResponse } from "next/server";
import {
  getIntegration,
  updateIntegration,
  deleteIntegration,
} from "@/lib/aws/integrations-dynamodb";

// GET - Get MCP server by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const server = await getIntegration(id);

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

    return NextResponse.json({
      success: true,
      server,
    });
  } catch (error) {
    console.error("Error getting MCP server:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get MCP server" },
      { status: 500 }
    );
  }
}

// PUT - Update MCP server
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, code, mcpConfig, tools, isShared, deployment } = body;

    const existing = await getIntegration(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "MCP server not found" },
        { status: 404 }
      );
    }

    if (existing.type !== "mcp-server") {
      return NextResponse.json(
        { success: false, error: "Invalid integration type" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (code !== undefined) updateData.code = code;
    if (mcpConfig !== undefined) updateData.mcpConfig = mcpConfig;
    if (tools !== undefined) updateData.tools = tools;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (deployment !== undefined) updateData.deployment = deployment;

    await updateIntegration(id, updateData);

    return NextResponse.json({
      success: true,
      message: "MCP server updated successfully",
    });
  } catch (error) {
    console.error("Error updating MCP server:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update MCP server" },
      { status: 500 }
    );
  }
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";

// DELETE - Delete MCP server
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await getIntegration(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "MCP server not found" },
        { status: 404 }
      );
    }

    if (existing.type !== "mcp-server") {
      return NextResponse.json(
        { success: false, error: "Invalid integration type" },
        { status: 400 }
      );
    }

    // Delete AgentCore Runtime first (if deployed)
    let runtimeDeleted = false;
    let runtimeError: string | null = null;

    try {
      const runtimeResponse = await fetch(`${BACKEND_URL}/mcp-servers/${id}/runtime`, {
        method: "DELETE",
      });

      if (runtimeResponse.ok) {
        const runtimeResult = await runtimeResponse.json();
        runtimeDeleted = runtimeResult.runtime_deleted;
        console.log(`MCP Runtime deletion result:`, runtimeResult);
      } else {
        const errorText = await runtimeResponse.text();
        console.warn(`Failed to delete MCP runtime: ${errorText}`);
        runtimeError = errorText;
      }
    } catch (runtimeErr) {
      console.warn(`Error calling runtime delete API:`, runtimeErr);
      runtimeError = String(runtimeErr);
      // Continue with DynamoDB deletion even if runtime deletion fails
    }

    // Delete from DynamoDB
    await deleteIntegration(id);

    const response: {
      success: boolean;
      message: string;
      runtimeDeleted: boolean;
      warning?: string;
    } = {
      success: true,
      message: "MCP server deleted successfully",
      runtimeDeleted,
    };

    if (runtimeError) {
      response.warning = `Runtime deletion may have failed: ${runtimeError}. You may need to manually delete the runtime from AWS console.`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting MCP server:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete MCP server" },
      { status: 500 }
    );
  }
}
