import { NextRequest } from "next/server";
import { loadSession, deleteSession, updateSessionSpecification } from "@/lib/aws/dynamodb";

const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{10,100}$/;

function isValidSessionId(id: string): boolean {
  return SESSION_ID_PATTERN.test(id);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidSessionId(id)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 세션 ID입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
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
    if (!isValidSessionId(id)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 세션 ID입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidSessionId(id)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 세션 ID입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const body = await req.json();
    const { specification } = body;

    const MAX_SPECIFICATION_LENGTH = 500_000; // 500KB limit

    if (typeof specification !== "string" || specification.length > MAX_SPECIFICATION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `명세서는 ${MAX_SPECIFICATION_LENGTH.toLocaleString()}자 이내여야 합니다` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await updateSessionSpecification(id, specification);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating session:", error);
    return new Response(
      JSON.stringify({ error: "세션 업데이트 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
