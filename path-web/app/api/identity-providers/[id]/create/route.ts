import { NextRequest, NextResponse } from "next/server";
import { getIntegrationFull, updateIntegration } from "@/lib/aws/integrations-dynamodb";
import type { IdentityIntegration } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/identity-providers/[id]/create - Create Credential Provider in AgentCore
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Get integration from DynamoDB
    const integration = await getIntegrationFull(id) as IdentityIntegration | null;

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    if (integration.type !== "identity") {
      return NextResponse.json(
        { error: "Integration is not an identity provider" },
        { status: 400 }
      );
    }

    // Call backend to create Credential Provider in AgentCore
    const response = await fetch(`${BACKEND_URL}/identity-providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        integration_id: id,
        name: integration.name,
        provider_type: integration.config.providerType,
        api_key: integration.config.apiKey,
        oauth2: integration.config.oauth2,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create identity provider");
    }

    const result = await response.json();

    // Update integration with provider info
    await updateIntegration(id, {
      config: {
        ...integration.config,
        providerArn: result.provider_arn,
        providerStatus: "active",
      },
    });

    return NextResponse.json({
      providerArn: result.provider_arn,
    });
  } catch (error) {
    console.error("Failed to create identity provider:", error);

    // Try to update status to failed
    try {
      const { id } = await context.params;
      const integration = await getIntegrationFull(id) as IdentityIntegration | null;
      if (integration) {
        await updateIntegration(id, {
          config: {
            ...integration.config,
            providerStatus: "failed",
          },
        });
      }
    } catch {
      // Ignore update error
    }

    return NextResponse.json(
      { error: "Failed to create identity provider", details: String(error) },
      { status: 500 }
    );
  }
}
