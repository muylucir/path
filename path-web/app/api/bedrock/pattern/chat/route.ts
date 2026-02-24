import { NextRequest } from "next/server";
import { z } from "zod";
import { invokeAgentCoreSSE } from "../../_shared/agentcore-client";

const patternChatSchema = z.object({
  conversation: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(100),
  userMessage: z.string().min(1).max(4000),
  formData: z.record(z.string(), z.unknown()).optional(),
  feasibility: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  return invokeAgentCoreSSE(req, {
    schema: patternChatSchema,
    actionType: "pattern_chat",
    getSessionId: (body) => body.sessionId as string | undefined,
    errorMessage: "패턴 대화 중 오류가 발생했습니다",
  });
}
