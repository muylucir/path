import { NextRequest } from "next/server";
import { getAuthUserId } from "@/lib/auth-helpers";
import {
  listDataSources,
  makeDataSourceId,
  putDataSource,
} from "@/lib/aws/data-sources";
import { dataSourceCreateSchema } from "@/lib/zod/data-source";
import type { DataSourceEntry } from "@/lib/data-source-catalog";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    const items = await listDataSources();
    return Response.json({ items });
  } catch (err) {
    console.error("[/api/data-sources] GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = dataSourceCreateSchema.safeParse(body);
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
    const entry = { id: makeDataSourceId(), ...parsed.data } as DataSourceEntry;
    const stored = await putDataSource({ entry, owner_id: userId });
    return Response.json({ dataSource: stored }, { status: 201 });
  } catch (err) {
    console.error("[/api/data-sources] POST error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
