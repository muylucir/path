import { NextRequest } from "next/server";
import { z } from "zod";
import { createSSEProxy } from "../../_shared/proxy-utils";
import { formSchema } from "@/lib/schema";

const patternAnalyzeSchema = z.object({
  formData: formSchema,
  feasibility: z.object({
    feasibility_score: z.number(),
    feasibility_breakdown: z.record(z.string(), z.unknown()),
    judgment: z.string(),
    summary: z.string(),
    weak_items: z.array(z.unknown()),
    risks: z.array(z.string()),
  }),
  improvementPlans: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  return createSSEProxy(req, "/pattern/analyze", {
    schema: patternAnalyzeSchema,
    errorMessage: "패턴 분석 중 오류가 발생했습니다",
  });
}
