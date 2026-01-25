import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  Integration,
  GatewayIntegration,
  IdentityIntegration,
  RAGIntegration,
  S3Integration,
  MCPServerIntegration,
  IntegrationListItem,
  IntegrationType,
  APIEndpoint,
} from "@/lib/types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "path-agent-integrations";

export async function createIntegration(
  integrationData: Record<string, unknown>
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const item = {
    id,
    ...integrationData,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return id;
}

export async function getIntegration(id: string): Promise<Integration | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  if (!response.Item) return null;

  // Mask sensitive data
  const item = response.Item as Integration;
  return maskSensitiveData(item);
}

export async function updateIntegration(
  id: string,
  integrationData: Record<string, unknown>
): Promise<void> {
  const existing = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  if (!existing.Item) {
    throw new Error("Integration not found");
  }

  const updatedItem = {
    ...existing.Item,
    ...integrationData,
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: updatedItem,
    })
  );
}

export async function deleteIntegration(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );
}

export async function listIntegrations(
  type?: IntegrationType,
  limit: number = 50,
  full: boolean = false
): Promise<IntegrationListItem[]> {
  let response;

  if (type) {
    // Use scan with filter for type
    response = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#type = :type",
        ExpressionAttributeNames: {
          "#type": "type",
          "#name": "name",
          "#config": "config",
          "#source": "source",  // Reserved keyword
        },
        ExpressionAttributeValues: { ":type": type },
        Limit: limit,
        ProjectionExpression: "id, #type, #name, description, createdAt, updatedAt, #config, mcpConfig, #source, deployment, tools",
      })
    );
  } else {
    response = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: limit,
        ProjectionExpression: "id, #type, #name, description, createdAt, updatedAt, #config, mcpConfig, #source, deployment, tools",
        ExpressionAttributeNames: {
          "#type": "type",
          "#name": "name",
          "#config": "config",
          "#source": "source",  // Reserved keyword
        },
      })
    );
  }

  const rawItems = (response.Items || []) as Integration[];

  // Transform to list items with additional fields
  const items: IntegrationListItem[] = rawItems.map((item) => {
    const base: IntegrationListItem = {
      id: item.id,
      type: item.type,
      name: item.name,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    if (item.type === "gateway") {
      const gateway = item as GatewayIntegration;
      base.targetCount = gateway.config.targets?.length || 0;
      base.gatewayStatus = gateway.config.gatewayStatus;
    } else if (item.type === "identity") {
      const identity = item as IdentityIntegration;
      base.providerType = identity.config.providerType;
      base.providerStatus = identity.config.providerStatus;
      // Include providerArn when full=true
      if (full && identity.config.providerArn) {
        base.providerArn = identity.config.providerArn;
      }
    } else if (item.type === "mcp-server") {
      const mcpServer = item as MCPServerIntegration;
      base.mcpSourceType = mcpServer.source?.type;
      base.mcpDeploymentStatus = mcpServer.deployment?.status;
      base.mcpToolCount = mcpServer.tools?.length || 0;
      base.mcpConfig = mcpServer.mcpConfig;  // Include for AWS role display
    }

    return base;
  });

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getIntegrationFull(id: string): Promise<Integration | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  return (response.Item as Integration) || null;
}

// Helper to mask sensitive data in responses
function maskSensitiveData(integration: Integration): Integration {
  const masked = { ...integration };

  if (masked.type === "identity") {
    const identityIntegration = masked as IdentityIntegration;
    // Mask API key values (they are stored but never returned)
    if (identityIntegration.config.apiKey) {
      identityIntegration.config.apiKey = {
        ...identityIntegration.config.apiKey,
      };
      // Note: apiKeyValue is not stored in config.apiKey, only headerName
    }
    // Mask OAuth2 client secret
    if (identityIntegration.config.oauth2) {
      identityIntegration.config.oauth2 = {
        ...identityIntegration.config.oauth2,
      };
      // Note: clientSecret is not stored after creation
    }
  } else if (masked.type === "rag") {
    const ragIntegration = masked as RAGIntegration;
    if (ragIntegration.config.pinecone?.apiKey) {
      ragIntegration.config.pinecone.apiKey = "***";
    }
    if (ragIntegration.config.opensearch?.password) {
      ragIntegration.config.opensearch.password = "***";
    }
  }

  return masked;
}

// Parse OpenAPI spec and extract endpoints
export function parseOpenAPISpec(spec: Record<string, unknown>): {
  baseUrl: string;
  endpoints: APIEndpoint[];
} {
  const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;
  const servers = (spec.servers || []) as { url: string }[];
  const baseUrl = servers[0]?.url || "";

  const endpoints: APIEndpoint[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (["get", "post", "put", "delete", "patch"].includes(method.toLowerCase())) {
        const operation = details as Record<string, unknown>;
        endpoints.push({
          path,
          method: method.toUpperCase() as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
          summary: (operation.summary as string) || "",
          description: operation.description as string | undefined,
          parameters: (operation.parameters as unknown[])?.map((param: unknown) => {
            const p = param as Record<string, unknown>;
            return {
              name: p.name as string,
              in: p.in as "query" | "path" | "header" | "body",
              required: (p.required as boolean) || false,
              type: ((p.schema as Record<string, unknown>)?.type as string) || "string",
              description: p.description as string | undefined,
            };
          }),
        });
      }
    }
  }

  return { baseUrl, endpoints };
}
