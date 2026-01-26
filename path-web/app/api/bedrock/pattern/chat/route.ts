import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Strands Agent API 호출
    const response = await fetch(`${STRANDS_API_URL}/pattern/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    // 스트리밍 응답 그대로 전달
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in pattern chat API:", error);
    return new Response(JSON.stringify({ error: "패턴 대화 중 오류가 발생했습니다" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
