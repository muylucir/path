import { NextRequest, NextResponse } from "next/server";
import { getIntegrationFull, updateIntegration } from "@/lib/aws/integrations-dynamodb";
import type { GatewayIntegration, IdentityIntegration, GatewayTarget } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Resolve credential provider IDs to ARNs for targets
async function resolveCredentialProviders(
  targets: GatewayTarget[]
): Promise<{ enrichedTargets: Record<string, unknown>[]; errors: string[] }> {
  const enrichedTargets: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (const target of targets) {
    // Start with base target data
    const enrichedTarget: Record<string, unknown> = {
      ...target,
    };

    // Determine auth type and credential provider ID
    const authType = target.outboundAuth?.type || (target.credentialProviderId ? 'api-key' : 'iam');
    const credentialProviderId = target.outboundAuth?.credentialProviderId || target.credentialProviderId;
    const oauthScopes = target.outboundAuth?.oauthScopes;

    // Set the auth type for backend
    enrichedTarget.outboundAuthType = authType;

    // IAM type doesn't need credential resolution
    if (authType === 'iam') {
      enrichedTarget.credentialProviderArn = null;
      enrichedTarget.credentialProviderType = null;
      enrichedTargets.push(enrichedTarget);
      continue;
    }

    // For api-key and oauth types, resolve credential provider
    if (credentialProviderId) {
      try {
        // Fetch the identity integration
        const identityIntegration = await getIntegrationFull(
          credentialProviderId
        ) as IdentityIntegration | null;

        if (!identityIntegration) {
          errors.push(
            `Identity provider not found: ${credentialProviderId} (target: ${target.name})`
          );
          // Fallback to IAM
          enrichedTarget.outboundAuthType = 'iam';
          enrichedTargets.push(enrichedTarget);
          continue;
        }

        if (identityIntegration.type !== "identity") {
          errors.push(
            `Invalid integration type for credential provider: ${identityIntegration.type} (target: ${target.name})`
          );
          enrichedTarget.outboundAuthType = 'iam';
          enrichedTargets.push(enrichedTarget);
          continue;
        }

        // Check if provider has been created in AgentCore
        if (!identityIntegration.config.providerArn) {
          errors.push(
            `Identity provider "${identityIntegration.name}" has not been created in AgentCore yet (target: ${target.name})`
          );
          enrichedTarget.outboundAuthType = 'iam';
          enrichedTargets.push(enrichedTarget);
          continue;
        }

        // Check provider status
        if (identityIntegration.config.providerStatus !== "active") {
          errors.push(
            `Identity provider "${identityIntegration.name}" is not active (status: ${identityIntegration.config.providerStatus || "unknown"}) (target: ${target.name})`
          );
          enrichedTarget.outboundAuthType = 'iam';
          enrichedTargets.push(enrichedTarget);
          continue;
        }

        // Add resolved credential info to target
        enrichedTarget.credentialProviderArn = identityIntegration.config.providerArn;
        enrichedTarget.credentialProviderType = identityIntegration.config.providerType;

        // For API key providers, include header name config
        if (
          identityIntegration.config.providerType === "api-key" &&
          identityIntegration.config.apiKey
        ) {
          enrichedTarget.apiKeyConfig = {
            headerName: identityIntegration.config.apiKey.headerName || "X-API-Key",
          };
        }

        // For OAuth providers, include scopes
        if (identityIntegration.config.providerType === "oauth2") {
          // Combine provider's default scopes with target-specific scopes
          const providerScopes = identityIntegration.config.oauth2?.scopes || [];
          const allScopes = [...new Set([...providerScopes, ...(oauthScopes || [])])];
          if (allScopes.length > 0) {
            enrichedTarget.oauthScopes = allScopes;
          }
        }

        console.log(
          `Resolved credential provider for target "${target.name}": ${identityIntegration.config.providerArn} (type: ${authType})`
        );
      } catch (err) {
        console.error(
          `Failed to resolve credential provider for target "${target.name}":`,
          err
        );
        errors.push(
          `Failed to resolve credential provider for target "${target.name}": ${String(err)}`
        );
        enrichedTarget.outboundAuthType = 'iam';
      }
    } else {
      // No credential provider specified for api-key/oauth type - this is an error
      errors.push(
        `Credential provider required for ${authType} authentication (target: ${target.name})`
      );
      enrichedTarget.outboundAuthType = 'iam';
    }

    enrichedTargets.push(enrichedTarget);
  }

  return { enrichedTargets, errors };
}

// POST /api/gateways/[id]/create - Create Gateway in AgentCore
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Get integration from DynamoDB
    const integration = await getIntegrationFull(id) as GatewayIntegration | null;

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    if (integration.type !== "gateway") {
      return NextResponse.json(
        { error: "Integration is not a gateway" },
        { status: 400 }
      );
    }

    // Resolve credential provider IDs to ARNs
    const { enrichedTargets, errors } = await resolveCredentialProviders(
      integration.config.targets || []
    );

    // If there are errors with required credential providers, fail early
    if (errors.length > 0) {
      console.warn("Credential provider resolution warnings:", errors);
      // Continue with warnings - don't block Gateway creation
      // Targets with unresolved credentials will use IAM role fallback
    }

    // Call backend to create Gateway in AgentCore
    const response = await fetch(`${BACKEND_URL}/gateways`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        integration_id: id,
        name: integration.name,
        enable_semantic_search: integration.config.enableSemanticSearch,
        targets: enrichedTargets,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create gateway");
    }

    const result = await response.json();

    // Update integration with gateway info
    await updateIntegration(id, {
      config: {
        ...integration.config,
        gatewayId: result.gateway_id,
        gatewayUrl: result.gateway_url,
        gatewayStatus: "ready",
        cognitoPoolId: result.cognito_pool_id,
        cognitoClientId: result.cognito_client_id,
      },
    });

    return NextResponse.json({
      gatewayId: result.gateway_id,
      gatewayUrl: result.gateway_url,
      // 공용 Cognito Pool 정보 (path-agent-shared-pool)
      cognitoPoolId: result.cognito_pool_id,
      cognitoClientId: result.cognito_client_id,
    });
  } catch (error) {
    console.error("Failed to create gateway:", error);

    // Try to update status to failed
    try {
      const { id } = await context.params;
      const integration = await getIntegrationFull(id) as GatewayIntegration | null;
      if (integration) {
        await updateIntegration(id, {
          config: {
            ...integration.config,
            gatewayStatus: "failed",
          },
        });
      }
    } catch {
      // Ignore update error
    }

    return NextResponse.json(
      { error: "Failed to create gateway", details: String(error) },
      { status: 500 }
    );
  }
}
