import { NextRequest } from "next/server";
import { invokeAgentCoreSSE } from "../_shared/agentcore-client";
import { formSchema } from "@/lib/schema";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  return invokeAgentCoreSSE(req, {
    schema: formSchema,
    actionType: "feasibility",
    errorMessage: "Feasibility 평가 중 오류가 발생했습니다",
  });
}
