// P.A.T.H Agent Designer Types

export interface FormData {
  painPoint: string;
  inputType: string;
  processSteps: string[];
  outputTypes: string[];
  humanLoop: string;
  errorTolerance: string;
  additionalContext: string;
  // 데이터소스 (자유 텍스트)
  additionalSources?: string;
  // 하위 호환성용 (deprecated)
  integrationDetails?: IntegrationDetail[];
}

/** @deprecated 하위 호환성용 - 새 코드에서는 사용하지 마세요 */
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
  // 하위 호환성용 (deprecated) - 기존 세션에서 통합 정보 표시
  integration_details?: IntegrationDetail[];
}

export interface SessionListItem {
  session_id: string;
  timestamp: string;
  pain_point: string;
  feasibility_score: number;
}
