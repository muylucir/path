import { NextRequest } from "next/server";
import { z } from "zod";
import { createSSEProxy } from "../../_shared/proxy-utils";

const patternChatSchema = z.object({
  conversation: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(100),
  userMessage: z.string().min(1).max(4000),
  formData: z.record(z.string(), z.unknown()).optional(),
  feasibility: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  return createSSEProxy(req, "/pattern/chat", {
    schema: patternChatSchema,
    errorMessage: "패턴 대화 중 오류가 발생했습니다",
  });
}
