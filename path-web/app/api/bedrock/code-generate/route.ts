import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 600; // 10분 타임아웃

export async function POST(req: NextRequest) {
  try {
    const { pathSpec, integrationDetails } = await req.json();

    // Strands Agent API 호출 (코드 생성)
    const response = await fetch(`${STRANDS_API_URL}/code/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path_spec: pathSpec,
        integration_details: integrationDetails
      }),
    });

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error: any) {
    console.error("Error in code-generate API:", error);
    return new Response(
      JSON.stringify({
        error: "코드 생성 중 오류가 발생했습니다",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
