import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";
const PATH_API_KEY = process.env.PATH_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();

    // Strands Agent API 호출
    const response = await fetch(`${STRANDS_API_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PATH_API_KEY,
      },
      body: JSON.stringify(formData),
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
    console.error("Error in analyze API:", error);
    return new Response(JSON.stringify({ error: "분석 중 오류가 발생했습니다" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
