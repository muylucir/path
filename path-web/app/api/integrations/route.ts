import { NextRequest, NextResponse } from "next/server";
import {
  createIntegration,
  listIntegrations,
} from "@/lib/aws/integrations-dynamodb";
import type { IntegrationType } from "@/lib/types";

const VALID_TYPES: IntegrationType[] = ["gateway", "identity", "rag", "s3"];

// GET /api/integrations - List all integrations
// Query params:
// - type: filter by integration type
// - full: include full details (e.g., providerArn for identity)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as IntegrationType | null;
    const full = searchParams.get("full") === "true";

    const integrations = await listIntegrations(type || undefined, 50, full);
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Failed to list integrations:", error);
    return NextResponse.json(
      { error: "Failed to list integrations" },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, description, config } = body;

    if (!type || !name || !config) {
      return NextResponse.json(
        { error: "Missing required fields: type, name, config" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const id = await createIntegration({
      type,
      name,
      description,
      config,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create integration:", error);
    return NextResponse.json(
      { error: "Failed to create integration", details: String(error) },
      { status: 500 }
    );
  }
}
