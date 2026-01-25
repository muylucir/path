// P.A.T.H Agent Designer Types

export interface FormData {
  painPoint: string;
  inputType: string;
  processSteps: string[];
  outputTypes: string[];
  humanLoop: string;
  errorTolerance: string;
  additionalContext: string;
  // 통합 선택 (카테고리별 분리)
  selectedGateways: string[];
  selectedRAGs: string[];
  selectedS3s: string[];
  selectedMCPServers: string[];  // MCP Server 선택 (external, aws, self-hosted)
  // 통합 상세 정보 (fetch 후 저장)
  integrationDetails: IntegrationDetail[];
  // 추가 데이터소스 (자유 텍스트)
  additionalSources?: string;
}

export interface IntegrationDetail {
  id: string;
  type: string;
  name: string;
  description?: string;
  summary?: string;
  config?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FeasibilityBreakdown {
  data_access: number;
  decision_clarity: number;
  error_tolerance: number;
  latency: number;
  integration: number;
}

export interface Analysis {
  pain_point: string;
  input_type: string;
  input_detail?: string;
  process_steps: string[];
  output_types: string[];
  output_detail?: string;
  human_loop: string;
  pattern: string;
  pattern_reason: string;
  feasibility_breakdown: FeasibilityBreakdown;
  feasibility_score: number;
  recommendation: string;
  risks: string[];
  next_steps: string[];
}

export interface Session {
  session_id: string;
  timestamp: string;
  pain_point: string;
  input_type: string;
  process_steps: string[];
  output_type: string;
  human_loop: string;
  data_source: string;
  error_tolerance: string;
  additional_context: string;
  use_agentcore: boolean;
  pattern: string;
  pattern_reason: string;
  feasibility_breakdown: FeasibilityBreakdown;
  feasibility_score: number;
  recommendation: string;
  risks: string[];
  next_steps: string[];
  chat_history: ChatMessage[];
  specification: string;
  // 사용자 원본 입력 (Step 1에서 선택한 값)
  user_input_type?: string;
  user_process_steps?: string[];
  user_output_types?: string[];
  // 선택한 통합 정보
  integration_details?: Array<{
    id: string;
    type: string;
    name: string;
    description?: string;
    summary?: string;
    config?: Record<string, any>;  // API/MCP/RAG/S3 설정 (AgentCore Gateway 매핑 시 사용)
  }>;
}

export interface SessionListItem {
  session_id: string;
  timestamp: string;
  pain_point: string;
  feasibility_score: number;
}

// Integration Types for Settings Page

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description?: string;
  parameters?: {
    name: string;
    in: 'query' | 'path' | 'header' | 'body';
    required: boolean;
    type: string;
    description?: string;
  }[];
  requestBody?: {
    contentType: string;
    schema: Record<string, unknown>;
  };
  responses?: Record<string, {
    description: string;
    schema?: Record<string, unknown>;
  }>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// Gateway Target Types (API, MCP, Lambda, API Gateway, Smithy Model)
export type GatewayTargetType = 'api' | 'mcp' | 'lambda' | 'apiGateway' | 'smithyModel';

// Outbound Authentication Types
// Compatibility matrix:
// - apiGateway: IAM, API Key
// - lambda: IAM only
// - mcp: OAuth only
// - api (OpenAPI): OAuth, API Key
// - smithyModel: IAM, OAuth
export type OutboundAuthType = 'iam' | 'api-key' | 'oauth';

// Outbound Authentication Configuration
export interface OutboundAuthConfig {
  type: OutboundAuthType;
  // For api-key and oauth: Reference to Identity Provider
  credentialProviderId?: string;
  // For oauth: Additional scopes beyond what's configured in the provider
  oauthScopes?: string[];
}

// API Gateway Tool Filter
export interface ApiGatewayToolFilter {
  filterPath: string;  // "/pets/*" or "/pets/{petId}"
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
}

// API Gateway Tool Override
export interface ApiGatewayToolOverride {
  path: string;
  method: string;
  name: string;
  description?: string;
}

// API Gateway Target Config
export interface ApiGatewayTargetConfig {
  restApiId: string;
  stage: string;
  apiGatewayToolConfiguration: {
    toolFilters: ApiGatewayToolFilter[];
    toolOverrides?: ApiGatewayToolOverride[];
  };
}

// S3 Schema Configuration
export interface S3SchemaConfig {
  uri: string;
  bucketOwnerAccountId?: string;
}

// Smithy Model Target Config
export interface SmithyModelTargetConfig {
  s3?: S3SchemaConfig;
  inlinePayload?: string;
}

export interface GatewayTarget {
  id: string;
  name: string;
  type: GatewayTargetType;
  description?: string;
  // API Target configuration
  apiConfig?: {
    baseUrl: string;
    openApiSpec?: Record<string, unknown>;
    endpoints?: APIEndpoint[];
  };
  // MCP Target configuration
  mcpConfig?: {
    serverUrl: string;
    transport: 'stdio' | 'sse' | 'streamablehttp';
    command?: string;
    args?: string[];
    tools?: MCPTool[];
  };
  // Lambda Target configuration
  lambdaConfig?: {
    functionArn: string;
    toolSchema?: Record<string, unknown>;
  };
  // API Gateway Target configuration
  apiGatewayConfig?: ApiGatewayTargetConfig;
  // Smithy Model Target configuration
  smithyModelConfig?: SmithyModelTargetConfig;
  // Outbound Authentication configuration
  outboundAuth?: OutboundAuthConfig;
  // Credential Provider reference (deprecated, use outboundAuth instead)
  credentialProviderId?: string;
}

// Gateway Integration (replaces API + MCP integrations)
export interface GatewayIntegration {
  id: string;
  type: 'gateway';
  name: string;
  description?: string;
  config: {
    gatewayId?: string;
    gatewayUrl?: string;
    gatewayStatus?: 'creating' | 'ready' | 'failed';
    cognitoPoolId?: string;
    cognitoClientId?: string;
    enableSemanticSearch: boolean;
    targets: GatewayTarget[];
  };
  createdAt: string;
  updatedAt: string;
}

// Identity Integration (Credential Providers)
export type IdentityProviderType = 'api-key' | 'oauth2';

export interface IdentityIntegration {
  id: string;
  type: 'identity';
  name: string;
  description?: string;
  config: {
    providerType: IdentityProviderType;
    providerArn?: string;
    providerStatus?: 'creating' | 'active' | 'failed';
    // API Key provider config
    apiKey?: {
      headerName: string;
    };
    // OAuth2 provider config
    oauth2?: {
      clientId: string;
      tokenEndpoint: string;
      scopes?: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface RAGIntegration {
  id: string;
  type: 'rag';
  name: string;
  description?: string;
  config: {
    provider: 'bedrock-kb' | 'pinecone' | 'opensearch';
    bedrockKb?: {
      knowledgeBaseId: string;
      region: string;
    };
    pinecone?: {
      apiKey?: string;
      environment: string;
      indexName: string;
    };
    opensearch?: {
      endpoint: string;
      indexName: string;
      username?: string;
      password?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface S3Integration {
  id: string;
  type: 's3';
  name: string;
  description?: string;
  config: {
    bucketName: string;
    region: string;
    prefix?: string;
    accessType: 'read' | 'write' | 'read-write';
  };
  createdAt: string;
  updatedAt: string;
}

// MCP Server Integration (Self-hosted, Template, External, AWS, Team)
// AgentCore Runtime Deployment Support:
// - 'self-hosted': Custom Python code - AgentCore deployable (streamablehttp)
// - 'template':    Template-based - AgentCore deployable (streamablehttp)
// - 'external':    External registry (mcp.so) - NOT deployable (requires stdio/npx)
// - 'aws':         AWS-provided MCP - NOT deployable (requires stdio/npx)
// - 'team':        Team shared - depends on original source type
export type MCPServerSourceType = 'self-hosted' | 'template' | 'external' | 'aws' | 'team';

export interface MCPServerSource {
  type: MCPServerSourceType;
  templateId?: string;      // template인 경우
  externalUrl?: string;     // external인 경우 (mcp.so URL)
  awsRole?: string;         // aws인 경우 (solutions-architect 등)
  sharedBy?: string;        // team인 경우 (공유자 ID)
}

export interface MCPServerCode {
  mainPy: string;
  requirements: string;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPServerDeploymentHistoryEntry {
  version: number;
  s3Uri?: string;
  deployedAt?: string;
  runtimeArn?: string;
  runtimeId?: string;
}

export interface MCPServerDeployment {
  status: 'pending' | 'deploying' | 'ready' | 'failed';
  runtimeArn?: string;
  runtimeId?: string;
  endpointUrl?: string;
  s3Uri?: string;
  version?: number;
  progress?: number;
  lastDeployedAt?: string;
  error?: string;
  history?: MCPServerDeploymentHistoryEntry[];
}

export interface MCPServerIntegration {
  id: string;
  type: 'mcp-server';
  name: string;
  description?: string;

  // 소스 유형
  source: MCPServerSource;

  // MCP 서버 코드 (self-hosted, template 경우)
  code?: MCPServerCode;

  // 외부 MCP 설정 (external, aws 경우)
  mcpConfig?: MCPServerConfig;

  // 도구 정보
  tools: MCPTool[];

  // 배포 상태 (self-hosted만)
  deployment?: MCPServerDeployment;

  // 메타데이터
  isShared?: boolean;         // 팀에 공유됨
  installCount?: number;      // 설치 횟수
  createdAt: string;
  updatedAt: string;
}

export type Integration = GatewayIntegration | IdentityIntegration | RAGIntegration | S3Integration | MCPServerIntegration;

// Core integration types (used in IntegrationPicker and Step1 form)
// mcp-server는 Settings에서는 별도 탭이지만, Step1에서는 통합 선택에 포함
export type CoreIntegrationType = 'gateway' | 'identity' | 'rag' | 's3' | 'mcp-server';

// All integration types (now identical to CoreIntegrationType since mcp-server is included)
export type IntegrationType = CoreIntegrationType;

export interface IntegrationListItem {
  id: string;
  type: IntegrationType;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Gateway-specific summary fields
  targetCount?: number;
  gatewayStatus?: 'creating' | 'ready' | 'failed';
  // Identity-specific summary fields
  providerType?: IdentityProviderType;
  providerStatus?: 'creating' | 'active' | 'failed';
  providerArn?: string;  // Included when full=true query parameter is used
  // MCP Server-specific summary fields
  mcpSourceType?: MCPServerSourceType;
  mcpDeploymentStatus?: 'pending' | 'deploying' | 'ready' | 'failed';
  mcpToolCount?: number;
  mcpConfig?: MCPServerConfig;  // For AWS MCP role display
}

// MCP Template Types
export interface MCPTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'communication' | 'data' | 'cloud' | 'utility' | 'ai';
  tools: MCPTool[];
  code: MCPServerCode;
  defaultEnv?: Record<string, string>;
}

// External MCP Registry (mcp.so) Types
export interface ExternalMCPServer {
  id: string;
  name: string;
  description: string;
  author: string;
  stars: number;
  downloads?: number;
  repository?: string;
  homepage?: string;
  tools: Array<{
    name: string;
    description: string;
  }>;
  installConfig: MCPServerConfig;
  tags?: string[];
}

// Deployment Types

export type DeploymentStatus =
  | "pending"
  | "building"
  | "pushing"
  | "deploying"
  | "active"
  | "stopped"
  | "failed";

export interface Deployment {
  deployment_id: string;
  job_id: string;
  agent_name: string;
  status: DeploymentStatus;
  progress: number;
  message: string;
  version: number;
  region: string;
  runtime_id?: string;
  runtime_arn?: string;
  ecr_image_uri?: string;
  endpoint_url?: string;
  created_at: number;  // Unix timestamp
  completed_at?: number | null;
  error?: string | null;
  // 메타데이터
  pain_point?: string | null;
  pattern?: string | null;
  feasibility_score?: number | null;
  // Gateway/Identity 필드 (AgentCore 확장)
  gateway_id?: string | null;
  gateway_url?: string | null;
  identity_providers?: string[];
}

export interface PlaygroundMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    latency_ms?: number;
    tokens_used?: number;
  };
}

// Deployment Metrics
export interface DeploymentMetrics {
  deployment_id: string;
  total_invocations: number;
  total_tokens_used: number;
  avg_latency_ms: number;
  last_invocation_at: number | null;
}

// Deployment Version (for rollback)
export interface DeploymentVersion {
  deployment_id: string;
  version: number;
  status: DeploymentStatus;
  created_at: number;
  ecr_image_uri?: string;
  is_current: boolean;
}

// Deployment Log
export interface DeploymentLog {
  timestamp: number;
  level: "info" | "warning" | "error";
  stage: "build" | "push" | "deploy" | "runtime";
  message: string;
}
