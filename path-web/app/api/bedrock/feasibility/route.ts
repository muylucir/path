import { NextRequest } from "next/server";
import { invokeAgentCoreSSE } from "../_shared/agentcore-client";
import { formSchema } from "@/lib/schema";
import { enrichDataSources } from "@/lib/enterprise/ds-enrichment";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  return invokeAgentCoreSSE(req, {
    schema: formSchema,
    actionType: "feasibility",
    transformBody: (body) => ({ formData: body }),
    enrichPayload: (body) => enrichDataSources(body, { step: "feasibility" }),
    errorMessage: "Feasibility 평가 중 오류가 발생했습니다",
  });
}
