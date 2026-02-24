import { NextRequest } from "next/server";
import { z } from "zod";
import { invokeAgentCoreJSON } from "../../_shared/agentcore-client";

// conversation에는 assistant 응답(장문)이 포함되므로 sanitizedString 대신 일반 string 사용
const patternFinalizeSchema = z.object({
  formData: z.record(z.string(), z.unknown()),
  feasibility: z.record(z.string(), z.unknown()),
  conversation: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(100),
  improvementPlans: z.record(z.string(), z.string()).optional(),
  sessionId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  return invokeAgentCoreJSON(req, {
    schema: patternFinalizeSchema,
    actionType: "pattern_finalize",
    getSessionId: (body) => body.sessionId as string | undefined,
    errorMessage: "패턴 확정 중 오류가 발생했습니다",
  });
}
