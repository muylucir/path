import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

// 스트리밍은 시간이 오래 걸릴 수 있음
export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { prompt, session_id } = await req.json();

    // 백엔드의 스트리밍 엔드포인트 호출
    const response = await fetch(`${STRANDS_API_URL}/deployments/${id}/invoke/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, session_id }),
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.error || errorData.message || response.statusText;
      } catch {
        // JSON 파싱 실패 시 statusText 사용
      }

      return new Response(
        JSON.stringify({ error: errorDetail }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // SSE 스트림 프록시
    const stream = response.body;
    if (!stream) {
      return new Response(
        JSON.stringify({ error: "No response stream" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 스트림을 그대로 전달
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Error streaming deployment invoke:", error);
    return new Response(
      JSON.stringify({
        error: "Agent 스트리밍 호출 중 오류가 발생했습니다",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
