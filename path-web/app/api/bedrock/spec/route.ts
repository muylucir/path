import { NextRequest } from "next/server";
import { z } from "zod";
import { createSSEProxy } from "../_shared/proxy-utils";

export const maxDuration = 600;

const specSchema = z.object({
  analysis: z.record(z.string(), z.unknown()),
  improvementPlans: z.record(z.string(), z.string()).optional(),
  chatHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(100).optional(),
  additionalContext: z
    .object({
      sources: z.string().optional(),
      context: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  return createSSEProxy(req, "/spec", {
    schema: specSchema,
    transformBody: (body) => ({
      analysis: body.analysis,
      improvement_plans: body.improvementPlans,
      chat_history: body.chatHistory,
      additional_context: body.additionalContext,
    }),
    errorMessage: "명세서 생성 중 오류가 발생했습니다",
  });
}
