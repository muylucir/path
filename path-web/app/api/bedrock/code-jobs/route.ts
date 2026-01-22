import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 60; // 작업 생성은 빠르게 완료

export async function POST(req: NextRequest) {
  try {
    const { path_spec, integration_details } = await req.json();

    // Strands Agent API 호출 - 작업 생성
    const response = await fetch(`${STRANDS_API_URL}/code/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path_spec, integration_details }),
    });

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating code generation job:", error);
    return new Response(
      JSON.stringify({
        error: "코드 생성 작업 생성 중 오류가 발생했습니다",
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

    // 최근 작업 목록 조회
    const response = await fetch(`${STRANDS_API_URL}/code/jobs?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching job list:", error);
    return new Response(
      JSON.stringify({
        error: "작업 목록 조회 중 오류가 발생했습니다",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
