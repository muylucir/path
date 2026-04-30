import { NextRequest } from "next/server";
import { z } from "zod";
import { invokeAgentCoreSSE } from "../../_shared/agentcore-client";
import { enrichDataSources } from "@/lib/enterprise/ds-enrichment";
import { getAuthUserId } from "@/lib/auth-helpers";

export const maxDuration = 120;

const feasibilityUpdateSchema = z.object({
  formData: z.record(z.string(), z.unknown()),
  previousEvaluation: z.record(z.string(), z.unknown()),
  improvementPlans: z.record(z.string(), z.string()),
});

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  return invokeAgentCoreSSE(req, {
    schema: feasibilityUpdateSchema,
    actionType: "feasibility_update",
    enrichPayload: (body) =>
      enrichDataSources(body, { step: "feasibility_update", userId }),
    errorMessage: "재평가 중 오류가 발생했습니다",
  });
}
