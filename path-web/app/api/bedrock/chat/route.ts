import { invokeClaudeStream } from "@/lib/aws/bedrock";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { conversation, userMessage } = await req.json();

    // Build conversation context
    const conversationText = conversation
      .map((msg: { role: string; content: string }) => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      )
      .join("\n\n");

    const prompt = `${conversationText}\n\nUSER: ${userMessage}

사용자의 답변을 반영하여:
1. 추가 정보가 더 필요하면 구체적으로 질문 (최대 3개)
2. 충분하면 "이제 최종 분석을 진행할 수 있습니다. '분석 완료'를 입력하세요." 안내

자연스럽게 대화하세요.`;

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
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "대화 중 오류가 발생했습니다" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
