import { NextRequest } from "next/server";

const STRANDS_API_URL = process.env.STRANDS_API_URL || "http://localhost:8001";
const PATH_API_KEY = process.env.PATH_API_KEY || "";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { formData, conversation } = await req.json();

    // Strands Agent API 호출
    const response = await fetch(`${STRANDS_API_URL}/finalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PATH_API_KEY,
      },
      body: JSON.stringify({ formData, conversation }),
    });

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const result = await response.json();
    return Response.json(result);
  } catch (error) {
    console.error("Error in finalize API:", error);
    return new Response(
      JSON.stringify({ error: "최종 분석 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
