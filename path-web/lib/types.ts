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
