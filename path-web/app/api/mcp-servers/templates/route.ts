import { NextRequest, NextResponse } from "next/server";
import { MCP_TEMPLATES, AWS_CORE_MCP_ROLES } from "@/lib/mcp-templates";

// GET - List available templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    let templates = MCP_TEMPLATES;

    // Filter by category if provided
    if (category) {
      templates = templates.filter((t) => t.category === category);
    }

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        icon: t.icon,
        category: t.category,
        tools: t.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
        })),
        defaultEnv: t.defaultEnv,
      })),
      awsRoles: AWS_CORE_MCP_ROLES,
    });
  } catch (error) {
    console.error("Error listing templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

// POST - Get full template details (including code)
export async function POST(request: NextRequest) {
  try {
    const { templateId } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID is required" },
        { status: 400 }
      );
    }

    const template = MCP_TEMPLATES.find((t) => t.id === templateId);

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("Error getting template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get template" },
      { status: 500 }
    );
  }
}
