// P.A.T.H Agent Designer Types

export interface DataSource {
  type: string;
  description: string;
}

export interface FormData {
  painPoint: string;
  inputType: string;
  processSteps: string[];
  outputTypes: string[];
  humanLoop: string;
  dataSources: DataSource[];
  errorTolerance: string;
  additionalContext: string;
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

export interface APIIntegration {
  id: string;
  type: 'api';
  name: string;
  description?: string;
  config: {
    baseUrl: string;
    authType: 'none' | 'api-key' | 'oauth2' | 'basic';
    authConfig?: {
      apiKeyHeader?: string;
      apiKeyValue?: string;
      oauth2TokenUrl?: string;
      oauth2ClientId?: string;
      oauth2Scopes?: string[];
      basicUsername?: string;
      basicPassword?: string;
    };
    endpoints: APIEndpoint[];
    openApiSpec?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPIntegration {
  id: string;
  type: 'mcp';
  name: string;
  description?: string;
  config: {
    serverUrl: string;
    transport: 'stdio' | 'sse' | 'websocket' | 'http';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    tools: MCPTool[];
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

export type Integration = APIIntegration | MCPIntegration | RAGIntegration | S3Integration;

export interface IntegrationListItem {
  id: string;
  type: 'api' | 'mcp' | 'rag' | 's3';
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
