import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";
const PATH_API_KEY = process.env.PATH_API_KEY || "";

export const maxDuration = 120; // 2분 타임아웃

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();

    // Strands Agent API 호출 (SSE 스트리밍)
    const response = await fetch(`${STRANDS_API_URL}/feasibility`, {
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

    // SSE 스트리밍 응답 그대로 전달
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in feasibility API:", error);
    return new Response(
      JSON.stringify({ error: "Feasibility 평가 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
