import { NextRequest } from "next/server";
import { createSSEProxy } from "../_shared/proxy-utils";
import { formSchema } from "@/lib/schema";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  return createSSEProxy(req, "/feasibility", {
    schema: formSchema,
    errorMessage: "Feasibility 평가 중 오류가 발생했습니다",
  });
}
