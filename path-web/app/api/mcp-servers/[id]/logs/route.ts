import { NextRequest, NextResponse } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

// GET - Get MCP server deployment logs
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const limit = searchParams.get("limit") || "100";
    const level = searchParams.get("level");
    const stage = searchParams.get("stage");
    const offset = searchParams.get("offset") || "0";
    const stream = searchParams.get("stream") === "true";

    // Streaming logs (SSE)
    if (stream) {
      const response = await fetch(
        `${STRANDS_API_URL}/mcp-servers/${id}/logs/stream`,
        {
          headers: { Accept: "text/event-stream" },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to stream logs" },
          { status: response.status }
        );
      }

      // Forward SSE stream
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Regular logs fetch
    const queryParams = new URLSearchParams({ limit, offset });
    if (level) queryParams.append("level", level);
    if (stage) queryParams.append("stage", stage);

    const response = await fetch(
      `${STRANDS_API_URL}/mcp-servers/${id}/logs?${queryParams}`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.detail || "Failed to fetch logs" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Error fetching MCP server logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
