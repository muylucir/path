import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 600; // 10분 타임아웃

export async function POST(req: NextRequest) {
  try {
    const { analysis, useAgentCore } = await req.json();

    // Strands Agent API 호출 (스트리밍)
    const response = await fetch(`${STRANDS_API_URL}/spec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis, useAgentCore }),
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
  } catch (error: any) {
    console.error("Error in spec API:", error);
    return new Response(
      JSON.stringify({ 
        error: "명세서 생성 중 오류가 발생했습니다",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
