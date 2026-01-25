import { z } from "zod";

export const integrationDetailSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string().optional(),
  summary: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// API Endpoint schema (used in Gateway targets)
export const apiEndpointSchema = z.object({
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  summary: z.string(),
  description: z.string().optional(),
  parameters: z.array(z.object({
    name: z.string(),
    in: z.enum(['query', 'path', 'header', 'body']),
    required: z.boolean(),
    type: z.string(),
    description: z.string().optional(),
  })).optional(),
});

// MCP Tool schema (used in Gateway targets)
export const mcpToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
});

// Gateway Target schema
export const gatewayTargetSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Target 이름을 입력해주세요"),
  type: z.enum(['api', 'mcp', 'lambda']),
  description: z.string().optional(),
  apiConfig: z.object({
    baseUrl: z.string().url("유효한 URL을 입력해주세요"),
    openApiSpec: z.record(z.string(), z.unknown()).optional(),
    endpoints: z.array(apiEndpointSchema).optional(),
  }).optional(),
  mcpConfig: z.object({
    serverUrl: z.string().min(1, "서버 URL을 입력해주세요"),
    transport: z.enum(['stdio', 'sse', 'streamablehttp']),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    tools: z.array(mcpToolSchema).optional(),
  }).optional(),
  lambdaConfig: z.object({
    functionArn: z.string().regex(/^arn:aws:lambda:/, "유효한 Lambda ARN을 입력해주세요"),
    toolSchema: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
  credentialProviderId: z.string().optional(),
});

// Gateway Integration schema
export const gatewayIntegrationSchema = z.object({
  name: z.string().min(1, "Gateway 이름을 입력해주세요"),
  description: z.string().optional(),
  enableSemanticSearch: z.boolean().default(true),
  targets: z.array(gatewayTargetSchema).default([]),
});

// Identity Integration schema
export const identityIntegrationSchema = z.object({
  name: z.string().min(1, "Provider 이름을 입력해주세요"),
  description: z.string().optional(),
  providerType: z.enum(['api-key', 'oauth2']),
  apiKey: z.object({
    headerName: z.string().min(1, "헤더 이름을 입력해주세요"),
    apiKeyValue: z.string().min(1, "API Key를 입력해주세요"),
  }).optional(),
  oauth2: z.object({
    clientId: z.string().min(1, "Client ID를 입력해주세요"),
    clientSecret: z.string().min(1, "Client Secret을 입력해주세요"),
    tokenEndpoint: z.string().url("유효한 Token Endpoint URL을 입력해주세요"),
    scopes: z.array(z.string()).optional(),
  }).optional(),
}).refine(
  (data) => {
    if (data.providerType === 'api-key') {
      return !!data.apiKey?.headerName && !!data.apiKey?.apiKeyValue;
    }
    if (data.providerType === 'oauth2') {
      return !!data.oauth2?.clientId && !!data.oauth2?.clientSecret && !!data.oauth2?.tokenEndpoint;
    }
    return false;
  },
  {
    message: "선택한 인증 방식에 필요한 정보를 모두 입력해주세요",
    path: ["providerType"],
  }
);

export type GatewayTargetValues = z.infer<typeof gatewayTargetSchema>;
export type GatewayIntegrationValues = z.infer<typeof gatewayIntegrationSchema>;
export type IdentityIntegrationValues = z.infer<typeof identityIntegrationSchema>;

// MCP Server Integration schema
export const mcpServerSourceSchema = z.object({
  type: z.enum(['self-hosted', 'template', 'external', 'aws', 'team']),
  templateId: z.string().optional(),
  externalUrl: z.string().optional(),
  awsRole: z.string().optional(),
  sharedBy: z.string().optional(),
});

export const mcpServerCodeSchema = z.object({
  mainPy: z.string().min(1, "Python 코드를 입력해주세요"),
  requirements: z.string(),
});

export const mcpServerConfigSchema = z.object({
  command: z.string().min(1, "실행 명령어를 입력해주세요"),
  args: z.array(z.string()),
  env: z.record(z.string(), z.string()).optional(),
});

export const mcpServerIntegrationSchema = z.object({
  name: z.string().min(1, "서버 이름을 입력해주세요"),
  description: z.string().optional(),
  source: mcpServerSourceSchema,
  code: mcpServerCodeSchema.optional(),
  mcpConfig: mcpServerConfigSchema.optional(),
  tools: z.array(mcpToolSchema).default([]),
  isShared: z.boolean().optional(),
}).refine(
  (data) => {
    // self-hosted와 template은 code 필수
    if (data.source.type === 'self-hosted' || data.source.type === 'template') {
      return !!data.code?.mainPy;
    }
    // external과 aws는 mcpConfig 필수
    if (data.source.type === 'external' || data.source.type === 'aws') {
      return !!data.mcpConfig?.command;
    }
    return true;
  },
  {
    message: "선택한 소스 유형에 필요한 정보를 모두 입력해주세요",
    path: ["source"],
  }
);

export type MCPServerIntegrationValues = z.infer<typeof mcpServerIntegrationSchema>;

export const formSchema = z.object({
  painPoint: z.string().min(10, "최소 10자 이상 입력해주세요"),
  inputType: z.string().min(1, "INPUT 타입을 선택해주세요"),
  processSteps: z.array(z.string()).min(1, "최소 1개 이상 선택해주세요"),
  outputTypes: z.array(z.string()).min(1, "최소 1개 이상 선택해주세요"),
  humanLoop: z.string().min(1, "Human-in-Loop을 선택해주세요"),
  errorTolerance: z.string().min(1, "오류 허용도를 선택해주세요"),
  additionalContext: z.string().optional(),
  useAgentCore: z.boolean(),
  // 통합 선택 (카테고리별)
  selectedGateways: z.array(z.string()),
  selectedRAGs: z.array(z.string()),
  selectedS3s: z.array(z.string()),
  selectedMCPServers: z.array(z.string()),  // MCP Server 선택 추가
  integrationDetails: z.array(integrationDetailSchema).optional(),
  // 추가 데이터소스 (자유 텍스트)
  additionalSources: z.string().optional(),
}).refine(
  (data) => {
    const hasGateway = data.selectedGateways && data.selectedGateways.length > 0;
    const hasRAG = data.selectedRAGs && data.selectedRAGs.length > 0;
    const hasS3 = data.selectedS3s && data.selectedS3s.length > 0;
    const hasMCPServer = data.selectedMCPServers && data.selectedMCPServers.length > 0;
    const hasAdditional = data.additionalSources && data.additionalSources.trim().length > 0;
    return hasGateway || hasRAG || hasS3 || hasMCPServer || hasAdditional;
  },
  {
    message: "최소 하나의 통합 또는 데이터소스를 선택해주세요",
    path: ["selectedGateways"],
  }
);

export type FormValues = z.infer<typeof formSchema>;
