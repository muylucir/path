import { NextRequest, NextResponse } from "next/server";
import {
  getIntegration,
  updateIntegration,
  deleteIntegration,
  getIntegrationFull,
} from "@/lib/aws/integrations-dynamodb";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/integrations/[id] - Get a single integration
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeSensitive = searchParams.get("full") === "true";

    const integration = includeSensitive
      ? await getIntegrationFull(id)
      : await getIntegration(id);

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ integration });
  } catch (error) {
    console.error("Failed to get integration:", error);
    return NextResponse.json(
      { error: "Failed to get integration" },
      { status: 500 }
    );
  }
}

// PUT /api/integrations/[id] - Update an integration
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, config } = body;

    await updateIntegration(id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(config && { config }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update integration:", error);
    if ((error as Error).message === "Integration not found") {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/[id] - Delete an integration
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteIntegration(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
