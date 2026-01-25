import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 완료된 작업의 코드 다운로드
    const response = await fetch(`${STRANDS_API_URL}/code/jobs/${id}/download`);

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "작업을 찾을 수 없습니다" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 400) {
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    // ZIP 파일 그대로 전달
    const blob = await response.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=strands-agent-code.zip",
      },
    });
  } catch (error: any) {
    console.error("Error downloading job result:", error);
    return new Response(
      JSON.stringify({
        error: "코드 다운로드 중 오류가 발생했습니다",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
