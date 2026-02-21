import { NextRequest } from "next/server";
import { z } from "zod";
import { saveSession, listSessions } from "@/lib/aws/dynamodb";
import type { Session } from "@/lib/types";

const sessionSchema = z.object({
  pain_point: z.string().min(1),
  input_type: z.string().min(1),
  process_steps: z.array(z.string()).min(1),
  output_types: z.array(z.string()).min(1),
  human_loop: z.string().min(1),
  error_tolerance: z.string().min(1),
  data_source: z.string(),
  additional_context: z.string().optional().default(""),
  additional_sources: z.string().optional().default(""),
  pattern: z.string(),
  pattern_reason: z.string(),
  recommended_architecture: z.enum(["single-agent", "multi-agent"]).nullable().optional(),
  multi_agent_pattern: z.enum(["agents-as-tools", "swarm", "graph", "workflow"]).nullable().optional(),
  architecture_reason: z.string().nullable().optional(),
  feasibility_breakdown: z.record(z.string(), z.number()),
  feasibility_score: z.number(),
  recommendation: z.string(),
  risks: z.array(z.string()),
  next_steps: z.array(z.string()),
  chat_history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  specification: z.string(),
  // Optional fields
  user_input_type: z.string().optional(),
  user_process_steps: z.array(z.string()).optional(),
  user_output_types: z.array(z.string()).optional(),
  integration_details: z.array(z.unknown()).optional(),
  feasibility_evaluation: z.record(z.string(), z.unknown()).nullable().optional(),
  improvement_plans: z.record(z.string(), z.string()).nullable().optional(),
  improved_feasibility: z.record(z.string(), z.unknown()).nullable().optional(),
  token_usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    totalTokens: z.number(),
    cacheReadInputTokens: z.number().optional(),
    cacheWriteInputTokens: z.number().optional(),
    estimatedCostUSD: z.number(),
  }).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = sessionSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const sessionId = await saveSession(result.data as unknown as Omit<Session, "session_id" | "timestamp">);
    return Response.json({ session_id: sessionId });
  } catch (error) {
    console.error("Error saving session:", error);
    return new Response(
      JSON.stringify({ error: "세션 저장 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lastKey = searchParams.get('lastKey');
    let parsedLastKey: Record<string, unknown> | undefined;
    if (lastKey) {
      try {
        const parsed = JSON.parse(decodeURIComponent(lastKey));
        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed) &&
          typeof parsed.session_id === "string" &&
          Object.keys(parsed).length <= 2  // session_id + at most one sort key
        ) {
          parsedLastKey = { session_id: parsed.session_id };
        }
      } catch {
        // Invalid format, start from beginning
      }
    }

    const result = await listSessions(15, parsedLastKey);
    return Response.json(result);
  } catch (error) {
    console.error("Error listing sessions:", error);
    return new Response(
      JSON.stringify({ error: "세션 목록 조회 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
