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
  APIIntegration,
  MCPIntegration,
  RAGIntegration,
  S3Integration,
  IntegrationListItem,
} from "@/lib/types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "path-agent-integrations";

export async function createIntegration(
  integrationData: Omit<Integration, "id" | "createdAt" | "updatedAt">
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
  integrationData: Partial<Omit<Integration, "id" | "createdAt" | "updatedAt">>
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
  type?: "api" | "mcp" | "rag" | "s3",
  limit: number = 50
): Promise<IntegrationListItem[]> {
  let response;

  if (type) {
    // Use scan with filter for type
    response = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#type = :type",
        ExpressionAttributeNames: { "#type": "type", "#name": "name" },
        ExpressionAttributeValues: { ":type": type },
        Limit: limit,
        ProjectionExpression: "id, #type, #name, description, createdAt, updatedAt",
      })
    );
  } else {
    response = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: limit,
        ProjectionExpression: "id, #type, #name, description, createdAt, updatedAt",
        ExpressionAttributeNames: { "#type": "type", "#name": "name" },
      })
    );
  }

  const items = (response.Items || []) as IntegrationListItem[];
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

  if (masked.type === "api") {
    const apiIntegration = masked as APIIntegration;
    if (apiIntegration.config.authConfig) {
      apiIntegration.config.authConfig = {
        ...apiIntegration.config.authConfig,
        apiKeyValue: apiIntegration.config.authConfig.apiKeyValue ? "***" : undefined,
        basicPassword: apiIntegration.config.authConfig.basicPassword ? "***" : undefined,
      };
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
  endpoints: APIIntegration["config"]["endpoints"];
} {
  const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;
  const servers = (spec.servers || []) as { url: string }[];
  const baseUrl = servers[0]?.url || "";

  const endpoints: APIIntegration["config"]["endpoints"] = [];

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
