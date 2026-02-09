import { NextRequest } from "next/server";
import { saveSession, listSessions } from "@/lib/aws/dynamodb";

export async function POST(req: NextRequest) {
  try {
    const sessionData = await req.json();
    const sessionId = await saveSession(sessionData);
    
    return Response.json({ session_id: sessionId });
  } catch (error) {
    console.error("Error saving session:", error);
    return new Response(
      JSON.stringify({ error: "세션 저장 중 오류가 발생했습니다" }),
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
    const lastKey = searchParams.get('lastKey');
    let parsedLastKey: Record<string, any> | undefined;
    if (lastKey) {
      try {
        const parsed = JSON.parse(decodeURIComponent(lastKey));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          parsedLastKey = parsed;
        }
      } catch {
        // 잘못된 형식 무시, 처음부터 조회
      }
    }

    const result = await listSessions(15, parsedLastKey);
    return Response.json(result);
  } catch (error) {
    console.error("Error listing sessions:", error);
    return new Response(
      JSON.stringify({ error: "세션 목록 조회 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
