import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { job_id, agent_name, region } = await req.json();

    // Strands Agent API 호출 - 배포 생성
    const response = await fetch(`${STRANDS_API_URL}/deployments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id, agent_name, region }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.detail || `API error: ${response.statusText}`,
        }),
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
    console.error("Error creating deployment:", error);
    return new Response(
      JSON.stringify({
        error: "배포 생성 중 오류가 발생했습니다",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "10";

    // 배포 목록 조회
    const response = await fetch(`${STRANDS_API_URL}/deployments?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching deployment list:", error);
    return new Response(
      JSON.stringify({
        error: "배포 목록 조회 중 오류가 발생했습니다",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
