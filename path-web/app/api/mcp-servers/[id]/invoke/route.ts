import { NextRequest, NextResponse } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

// POST - Invoke MCP tool
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.tool) {
      return NextResponse.json(
        { success: false, error: "Tool name is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${STRANDS_API_URL}/mcp-servers/${id}/invoke`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: body.tool,
          arguments: body.arguments || {},
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.detail || "Tool invocation failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Error invoking MCP tool:", error);
    return NextResponse.json(
      { success: false, error: "Tool invocation failed" },
      { status: 500 }
    );
  }
}
