import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 600; // 10분 타임아웃

export async function POST(req: NextRequest) {
  try {
    const { pathSpec, integrationDetails } = await req.json();

    // Strands Agent API 호출 (코드 다운로드)
    // 타임아웃: 5분 (코드 생성은 2-3분 소요)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5분

    const response = await fetch(`${STRANDS_API_URL}/code/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path_spec: pathSpec,
        integration_details: integrationDetails
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    // ZIP 파일 스트림 반환
    const blob = await response.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=strands-agent-code.zip",
      },
    });
  } catch (error: any) {
    console.error("Error in code-download API:", error);
    return new Response(
      JSON.stringify({
        error: "코드 다운로드 중 오류가 발생했습니다",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
