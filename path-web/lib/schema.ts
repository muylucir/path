import { z } from "zod";

// 길이 제한 상수
const MAX_PAIN_POINT_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 5000;
const MAX_SOURCES_LENGTH = 2000;

// 위험 패턴 (LLM 프롬프트 인젝션 방지)
const DANGEROUS_PATTERNS = [
  /\bSYSTEM\s*:/i,
  /\bASSISTANT\s*:/i,
  /\bHUMAN\s*:/i,
  /\bUSER\s*:/i,
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /disregard\s+(previous|above|all)\s+instructions?/i,
  /forget\s+(previous|above|all)\s+instructions?/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+you\s+are\s+/i,
  /act\s+as\s+if\s+you\s+/i,
  /roleplay\s+as\s+/i,
  /<\s*script\s*>/i,
  /javascript\s*:/i,
  /<\s*\/?\s*(system|prompt|instruction|context)\s*>/i,
];

/**
 * 위험 패턴 필터링 함수
 */
function filterDangerousPatterns(text: string): string {
  let filtered = text;
  for (const pattern of DANGEROUS_PATTERNS) {
    const globalPattern = new RegExp(pattern.source, pattern.flags + "g");
    filtered = filtered.replace(globalPattern, "[FILTERED]");
  }
  return filtered;
}

/**
 * 입력 새니타이징 리파인먼트
 */
const sanitizedString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform((val) => filterDangerousPatterns(val.trim()));

/** @deprecated 하위 호환성용 */
export const integrationDetailSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string().optional(),
  summary: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const formSchema = z.object({
  painPoint: sanitizedString(MAX_PAIN_POINT_LENGTH).refine(
    (val) => val.length >= 10,
    { message: "최소 10자 이상 입력해주세요" }
  ),
  inputType: z.string().min(1, "INPUT 타입을 선택해주세요").max(50),
  processSteps: z
    .array(z.string().max(50))
    .min(1, "최소 1개 이상 선택해주세요")
    .max(10, "최대 10개까지 선택 가능합니다"),
  outputTypes: z
    .array(z.string().max(50))
    .min(1, "최소 1개 이상 선택해주세요")
    .max(10, "최대 10개까지 선택 가능합니다"),
  humanLoop: z.string().min(1, "Human-in-Loop을 선택해주세요").max(50),
  errorTolerance: z.string().min(1, "오류 허용도를 선택해주세요").max(50),
  additionalContext: sanitizedString(MAX_CONTEXT_LENGTH).optional(),
  useAgentCore: z.boolean(),
  // 데이터소스 (자유 텍스트)
  additionalSources: sanitizedString(MAX_SOURCES_LENGTH).optional(),
  // 하위 호환성용 (deprecated)
  integrationDetails: z.array(integrationDetailSchema).optional(),
});

export type FormValues = z.infer<typeof formSchema>;

// 대화 메시지 스키마
export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: sanitizedString(4000),
});

// 대화 히스토리 스키마
export const conversationSchema = z
  .array(messageSchema)
  .max(50, "대화 히스토리가 너무 깁니다");
