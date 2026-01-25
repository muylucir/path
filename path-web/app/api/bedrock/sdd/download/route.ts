import { NextRequest, NextResponse } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export const maxDuration = 600; // 10분 타임아웃

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, spec } = body;

    console.log("[Next.js SDD Download] session_id:", session_id || "none");

    // ZIP 파일 다운로드 - session_id로 /tmp에서 읽기
    const response = await fetch(`${STRANDS_API_URL}/sdd/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id, spec }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "SDD 문서 생성 실패", details: error },
        { status: response.status }
      );
    }

    // ZIP 바이너리 응답
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=sdd-documents.zip",
      },
    });
  } catch (error) {
    console.error("Error downloading SDD:", error);
    return NextResponse.json(
      { error: "SDD 문서 다운로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
