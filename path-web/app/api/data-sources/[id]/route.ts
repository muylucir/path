import { NextRequest } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import {
  deleteDataSource,
  getDataSource,
  replaceDataSource,
} from "@/lib/aws/data-sources";
import { dataSourceUpdateSchema } from "@/lib/zod/data-source";
import type { DataSourceEntry } from "@/lib/data-source-catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    const item = await getDataSource(id, userId);
    if (!item) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ dataSource: item });
  } catch (err) {
    console.error("[/api/data-sources/:id] GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = dataSourceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }
    const entry = { id, ...parsed.data } as DataSourceEntry;
    const updated = await replaceDataSource({ entry, owner_id: userId });
    if (!updated) {
      return Response.json(
        { error: "Not found or not owner" },
        { status: 404 },
      );
    }
    return Response.json({ dataSource: updated });
  } catch (err) {
    console.error("[/api/data-sources/:id] PUT error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    const ok = await deleteDataSource(id, userId);
    if (!ok) {
      return Response.json(
        { error: "Not found or not owner" },
        { status: 404 },
      );
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[/api/data-sources/:id] DELETE error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
