import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 버전 목록 조회
    const response = await fetch(`${STRANDS_API_URL}/deployments/${id}/versions`);

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "배포를 찾을 수 없습니다" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching deployment versions:", error);
    return new Response(
      JSON.stringify({
        error: "버전 목록 조회 중 오류가 발생했습니다",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
