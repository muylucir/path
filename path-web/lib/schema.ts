import { z } from "zod";

export const dataSourceSchema = z.object({
  type: z.string().min(1, "소스 타입을 선택해주세요"),
  description: z.string().min(1, "설명을 입력해주세요"),
});

export const formSchema = z.object({
  painPoint: z.string().min(10, "최소 10자 이상 입력해주세요"),
  inputType: z.string().min(1, "INPUT 타입을 선택해주세요"),
  processSteps: z.array(z.string()).min(1, "최소 1개 이상 선택해주세요"),
  outputTypes: z.array(z.string()).min(1, "최소 1개 이상 선택해주세요"),
  humanLoop: z.string().min(1, "Human-in-Loop을 선택해주세요"),
  dataSources: z.array(dataSourceSchema).min(1, "최소 1개 이상 데이터 소스를 추가해주세요"),
  errorTolerance: z.string().min(1, "오류 허용도를 선택해주세요"),
  additionalContext: z.string().optional(),
  useAgentCore: z.boolean().optional().default(false),
});

export type DataSource = z.infer<typeof dataSourceSchema>;
export type FormValues = z.infer<typeof formSchema>;
