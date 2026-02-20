// P.A.T.H Agent Designer Types

export interface FormData {
  painPoint: string;
  inputType: string;
  processSteps: string[];
  outputTypes: string[];
  humanLoop: string;
  errorTolerance: string;
  /** Optional additional context provided by the user */
  additionalContext?: string;
  // 데이터소스 (자유 텍스트)
  additionalSources?: string;
  /** @deprecated 하위 호환성용 - 새 코드에서는 사용하지 마세요 */
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

// 기존 FeasibilityBreakdown (단순 점수만)
export interface FeasibilityBreakdown {
  data_access: number;
  decision_clarity: number;
  error_tolerance: number;
  latency: number;
  integration: number;
}

// Step2: Feasibility 상세 항목 (점수 + 근거)
export interface FeasibilityItemDetail {
  score: number;
  reason: string;
  current_state: string;
  changed?: boolean;
  change_reason?: string;
}

// Step2: Feasibility 상세 평가 결과
export interface FeasibilityDetailedBreakdown {
  data_access: FeasibilityItemDetail;
  decision_clarity: FeasibilityItemDetail;
  error_tolerance: FeasibilityItemDetail;
  latency: FeasibilityItemDetail;
  integration: FeasibilityItemDetail;
}

// Step2: 취약 항목
export interface WeakItem {
  item: string;
  score: number;
  improvement_suggestion: string;
}

// Step2: Feasibility 평가 결과
export interface FeasibilityEvaluation {
  feasibility_breakdown: FeasibilityDetailedBreakdown;
  feasibility_score: number;
  judgment: string;
  weak_items: WeakItem[];
  risks: string[];
  summary: string;
  // 재평가 시 추가 필드
  previous_score?: number;
  score_change?: number;
}

// Step2: 사용자 개선 방안 입력
export type ImprovementPlans = Record<string, string>;

// Step4: 개선된 Feasibility 항목
export interface ImprovedFeasibilityItem {
  original_score: number;
  improved_score: number;
  improvement_reason: string;
}

// Step4: 개선된 Feasibility 전체
export interface ImprovedFeasibility {
  score: number;
  score_change: number;
  breakdown: Record<string, ImprovedFeasibilityItem>;
  summary: string;
}

// 멀티 에이전트 협업 패턴 (Strands Agents 기반)
export type MultiAgentPattern = 'agents-as-tools' | 'swarm' | 'graph' | 'workflow';

export interface Analysis {
  pain_point: string;
  input_type: string;
  input_detail?: string;
  process_steps: string[];
  output_types: string[];
  output_detail?: string;
  human_loop: string;
  pattern: string;
  recommended_architecture?: 'single-agent' | 'multi-agent';  // 권장 아키텍처
  multi_agent_pattern?: MultiAgentPattern | null;  // 멀티 에이전트 협업 패턴
  architecture_reason?: string;  // 권장 이유
  pattern_reason: string;
  feasibility_breakdown: FeasibilityBreakdown;
  feasibility_score: number;
  improved_feasibility?: ImprovedFeasibility | null;
  recommendation: string;
  risks: string[];
  next_steps: string[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadInputTokens?: number;
  cacheWriteInputTokens?: number;
  estimatedCostUSD: number;
}

export interface Session {
  session_id: string;
  timestamp: string;
  pain_point: string;
  input_type: string;
  process_steps: string[];
  output_types: string[];
  human_loop: string;
  data_source: string;
  error_tolerance: string;
  additional_context: string;
  pattern: string;
  pattern_reason: string;
  recommended_architecture?: 'single-agent' | 'multi-agent';
  multi_agent_pattern?: MultiAgentPattern | null;
  architecture_reason?: string;
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
  /** @deprecated 하위 호환성용 - 기존 세션에서 통합 정보 표시 */
  integration_details?: IntegrationDetail[];
  // Step 2 상세 준비도 점검 결과 (새 플로우)
  feasibility_evaluation?: FeasibilityEvaluation;
  // Step 2 사용자 개선 방안
  improvement_plans?: ImprovementPlans;
  // Step 3에서 생성된 향상된 점수
  improved_feasibility?: ImprovedFeasibility;
  // 세션 전체 토큰 사용량
  token_usage?: TokenUsage;
}

export interface SessionListItem {
  session_id: string;
  timestamp: string;
  pain_point: string;
  feasibility_score: number;
  improved_feasibility?: ImprovedFeasibility;
  next_steps?: string[];
  token_usage?: TokenUsage;
}
