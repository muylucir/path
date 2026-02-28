import { NextRequest } from "next/server";
import { z } from "zod";
import { invokeAgentCoreJSON } from "../../../_shared/agentcore-client";

const feasibilityUpdateSchema = z.object({
  formData: z.record(z.string(), z.unknown()),
  previousEvaluation: z.record(z.string(), z.unknown()),
  improvementPlans: z.record(z.string(), z.string()),
});

export async function POST(req: NextRequest) {
  return invokeAgentCoreJSON(req, {
    schema: feasibilityUpdateSchema,
    actionType: "feasibility_update",
    errorMessage: "재평가 중 오류가 발생했습니다",
  });
}
