import { NextRequest, NextResponse } from "next/server";
import { parseOpenAPISpec } from "@/lib/aws/integrations-dynamodb";

// POST /api/integrations/parse-openapi - Parse OpenAPI spec
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spec } = body;

    if (!spec) {
      return NextResponse.json(
        { error: "Missing OpenAPI spec" },
        { status: 400 }
      );
    }

    // Validate it's a valid OpenAPI spec
    if (!spec.openapi && !spec.swagger) {
      return NextResponse.json(
        { error: "Invalid OpenAPI/Swagger specification" },
        { status: 400 }
      );
    }

    const { baseUrl, endpoints } = parseOpenAPISpec(spec);

    // Extract title and description from spec
    const info = spec.info as { title?: string; description?: string } | undefined;

    return NextResponse.json({
      title: info?.title || "Untitled API",
      description: info?.description,
      baseUrl,
      endpoints,
      endpointCount: endpoints.length,
    });
  } catch (error) {
    console.error("Failed to parse OpenAPI spec:", error);
    return NextResponse.json(
      { error: "Failed to parse OpenAPI specification" },
      { status: 500 }
    );
  }
}
