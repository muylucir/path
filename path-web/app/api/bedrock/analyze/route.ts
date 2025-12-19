import { invokeClaudeStream } from "@/lib/aws/bedrock";
import { getInitialAnalysisPrompt, SYSTEM_PROMPT } from "@/lib/prompts";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    const prompt = getInitialAnalysisPrompt(formData);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of invokeClaudeStream(prompt, SYSTEM_PROMPT)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in analyze API:", error);
    return new Response(JSON.stringify({ error: "분석 중 오류가 발생했습니다" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
