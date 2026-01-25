import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

// Playground 호출은 시간이 오래 걸릴 수 있음
export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { prompt, session_id } = await req.json();

    // 배포된 Agent 호출
    const response = await fetch(`${STRANDS_API_URL}/deployments/${id}/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, session_id }),
    });

    if (!response.ok) {
      // 에러 응답에서 상세 메시지 추출
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.error || errorData.message || response.statusText;
      } catch {
        // JSON 파싱 실패 시 statusText 사용
      }

      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "배포를 찾을 수 없습니다" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: errorDetail }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      // 500 및 기타 에러도 상세 메시지 전달
      return new Response(
        JSON.stringify({ error: errorDetail }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error invoking deployment:", error);
    return new Response(
      JSON.stringify({
        error: "Agent 호출 중 오류가 발생했습니다",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
