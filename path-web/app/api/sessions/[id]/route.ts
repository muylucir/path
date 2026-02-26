import { NextRequest } from "next/server";
import { loadSession, deleteSession, replaceSession } from "@/lib/aws/dynamodb";
import { getAuthUserId } from "@/lib/auth-helpers";
import { sessionSchema } from "@/app/api/sessions/route";
import type { Session } from "@/lib/types";

const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{10,100}$/;

function isValidSessionId(id: string): boolean {
  return SESSION_ID_PATTERN.test(id);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidSessionId(id)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 세션 ID입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const session = await loadSession(id, userId);

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
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidSessionId(id)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 세션 ID입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const deleted = await deleteSession(id, userId);
    if (!deleted) {
      return new Response(JSON.stringify({ error: "세션을 찾을 수 없습니다" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    if (!isValidSessionId(id)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 세션 ID입니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const result = sessionSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const replaced = await replaceSession(id, userId, result.data as unknown as Omit<Session, "session_id" | "user_id" | "timestamp">);
    if (!replaced) {
      return new Response(JSON.stringify({ error: "세션을 찾을 수 없습니다" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
