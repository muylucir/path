import { NextRequest } from "next/server";
import { z } from "zod";
import { invokeAgentCoreSSE } from "../../_shared/agentcore-client";
import { formSchema } from "@/lib/schema";
import { enrichDataSources } from "@/lib/enterprise/ds-enrichment";
import { getAuthUserId } from "@/lib/auth-helpers";

const patternAnalyzeSchema = z.object({
  formData: formSchema,
  feasibility: z.record(z.string(), z.unknown()),
  improvementPlans: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  return invokeAgentCoreSSE(req, {
    schema: patternAnalyzeSchema,
    actionType: "pattern_analyze",
    generateSessionId: true,
    enrichPayload: (body) =>
      enrichDataSources(body, { step: "pattern_analyze", userId }),
    errorMessage: "패턴 분석 중 오류가 발생했습니다",
  });
}
