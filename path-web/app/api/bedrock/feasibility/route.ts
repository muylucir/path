import { NextRequest, NextResponse } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";
const PATH_API_KEY = process.env.PATH_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();

    // Strands Agent API 호출
    const response = await fetch(`${STRANDS_API_URL}/feasibility`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PATH_API_KEY,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in feasibility API:", error);
    return NextResponse.json(
      { error: "Feasibility 평가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
