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
}

export interface SessionListItem {
  session_id: string;
  timestamp: string;
  pain_point: string;
  feasibility_score: number;
}

// Agent Builder Canvas Types

export interface LLMConfig {
  model: 'claude-sonnet-4.5' | 'claude-haiku-4.5';
  maxTokens?: number;
  temperature?: number;
}

export interface AgentNodeData {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  input: string;
  output: string;
  llm: LLMConfig;
  tools: string[];
}

export interface RouterNodeData {
  id: string;
  name: string;
  condition: string;
  branches: { label: string; targetNodeId: string }[];
}

export interface MemoryNodeData {
  id: string;
  name: string;
  type: 'short-term' | 'long-term';
  strategies: ('semantic' | 'user-preference' | 'summary' | 'episodic')[];
  namespaces: string[];
}

export interface GatewayNodeData {
  id: string;
  name: string;
  targets: {
    type: 'lambda' | 'rest-api' | 'mcp-server' | 'integration-template';
    name: string;
    config: Record<string, unknown>;
  }[];
}

export interface IdentityNodeData {
  id: string;
  name: string;
  authType: 'oauth2-2lo' | 'oauth2-3lo' | 'api-key';
  provider: string;
  scopes?: string[];
}

export type CanvasNodeData =
  | { type: 'agent'; data: AgentNodeData }
  | { type: 'router'; data: RouterNodeData }
  | { type: 'memory'; data: MemoryNodeData }
  | { type: 'gateway'; data: GatewayNodeData }
  | { type: 'identity'; data: IdentityNodeData };

export interface CanvasNode {
  id: string;
  type: 'agent' | 'router' | 'memory' | 'gateway' | 'identity';
  data: AgentNodeData | RouterNodeData | MemoryNodeData | GatewayNodeData | IdentityNodeData;
  position: { x: number; y: number };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface AgentCoreConfig {
  runtime: {
    enabled: boolean;
    timeout: number;
    concurrency: number;
  };
  memory?: {
    enabled: boolean;
    strategies: string[];
  };
  gateway?: {
    enabled: boolean;
    targets: string[];
  };
  identity?: {
    enabled: boolean;
    providers: string[];
  };
  browser?: { enabled: boolean };
  codeInterpreter?: { enabled: boolean };
}

export interface AgentCanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  entryPoint: string;
  agentCoreConfig?: AgentCoreConfig;
  metadata: {
    pattern: string;
    version: string;
    createdAt: string;
    updatedAt: string;
  };
}
