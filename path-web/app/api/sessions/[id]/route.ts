import { NextRequest } from "next/server";
import { loadSession, deleteSession } from "@/lib/aws/dynamodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await loadSession(id);

    if (!session) {
      return new Response(JSON.stringify({ error: "세션을 찾을 수 없습니다" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(session);
  } catch (error) {
    console.error("Error loading session:", error);
    return new Response(
      JSON.stringify({ error: "세션 로드 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSession(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return new Response(
      JSON.stringify({ error: "세션 삭제 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
