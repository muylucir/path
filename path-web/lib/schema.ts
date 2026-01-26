import { z } from "zod";

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
  painPoint: z.string().min(10, "최소 10자 이상 입력해주세요"),
  inputType: z.string().min(1, "INPUT 타입을 선택해주세요"),
  processSteps: z.array(z.string()).min(1, "최소 1개 이상 선택해주세요"),
  outputTypes: z.array(z.string()).min(1, "최소 1개 이상 선택해주세요"),
  humanLoop: z.string().min(1, "Human-in-Loop을 선택해주세요"),
  errorTolerance: z.string().min(1, "오류 허용도를 선택해주세요"),
  additionalContext: z.string().optional(),
  useAgentCore: z.boolean(),
  // 데이터소스 (자유 텍스트)
  additionalSources: z.string().optional(),
  // 하위 호환성용 (deprecated)
  integrationDetails: z.array(integrationDetailSchema).optional(),
});

export type FormValues = z.infer<typeof formSchema>;
