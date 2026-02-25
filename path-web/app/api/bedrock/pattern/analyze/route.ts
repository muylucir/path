import { NextRequest } from "next/server";
import { z } from "zod";
import { invokeAgentCoreSSE } from "../../_shared/agentcore-client";
import { formSchema } from "@/lib/schema";

const patternAnalyzeSchema = z.object({
  formData: formSchema,
  feasibility: z.record(z.string(), z.unknown()),
  improvementPlans: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  return invokeAgentCoreSSE(req, {
    schema: patternAnalyzeSchema,
    actionType: "pattern_analyze",
    generateSessionId: true,
    errorMessage: "패턴 분석 중 오류가 발생했습니다",
  });
}
