import { NextRequest, NextResponse } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id } = await params;

    console.log("[Next.js SDD Files] Fetching files for session:", session_id);

    const response = await fetch(`${STRANDS_API_URL}/sdd/files/${session_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "SDD 파일 조회 실패", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching SDD files:", error);
    return NextResponse.json(
      { error: "SDD 파일 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
