import { NextRequest, NextResponse } from "next/server";
import { type ZodType, ZodError } from "zod";

function getEnv() {
  return {
    STRANDS_API_URL: process.env.STRANDS_API_URL || "http://localhost:8001",
    PATH_API_KEY: process.env.PATH_API_KEY || "",
  };
}

interface ProxyOptions {
  /** Zod schema to validate the request body before proxying */
  schema?: ZodType;
  /** Transform the parsed body before sending to backend */
  transformBody?: (body: Record<string, unknown>) => Record<string, unknown>;
  /** Error message to return on failure */
  errorMessage?: string;
}

/**
 * Validate request body against a Zod schema.
 * Returns the parsed data on success or a 400 Response on failure.
 */
function validateBody(
  body: unknown,
  schema: ZodType
): { success: true; data: Record<string, unknown> } | { success: false; response: Response } {
  try {
    const data = schema.parse(body) as Record<string, unknown>;
    return { success: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: err.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    throw err;
  }
}

/**
 * Create an SSE streaming proxy to the backend.
 * Wraps the upstream response in a TransformStream that detects mid-stream
 * errors and sends an SSE error event before closing.
 */
export async function createSSEProxy(
  req: NextRequest,
  backendPath: string,
  options: ProxyOptions = {}
): Promise<Response> {
  const { schema, transformBody, errorMessage = "요청 처리 중 오류가 발생했습니다" } = options;

  try {
    let body = await req.json();

    if (schema) {
      const result = validateBody(body, schema);
      if (!result.success) return result.response;
      body = result.data;
    }

    if (transformBody) {
      body = transformBody(body);
    }

    const { STRANDS_API_URL, PATH_API_KEY } = getEnv();
    const response = await fetch(`${STRANDS_API_URL}${backendPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PATH_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    // Wrap in TransformStream for mid-stream error detection
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      const reader = response.body?.getReader();
      if (!reader) {
        const errorEvent = `data: ${JSON.stringify({ error: "No response body from upstream" })}\n\n`;
        await writer.write(new TextEncoder().encode(errorEvent));
        await writer.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
        await writer.close();
      } catch (streamError) {
        // Upstream connection dropped mid-stream
        try {
          const errorEvent = `data: ${JSON.stringify({ error: "스트리밍 연결이 중단되었습니다" })}\n\n`;
          await writer.write(new TextEncoder().encode(errorEvent));
        } catch {
          // Writer may already be closed
        }
        try {
          await writer.close();
        } catch {
          // Ignore close errors
        }
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(`Error in SSE proxy [${backendPath}]:`, error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Create a JSON proxy to the backend.
 * Sends the request and returns the JSON response directly.
 */
export async function createJSONProxy(
  req: NextRequest,
  backendPath: string,
  options: ProxyOptions = {}
): Promise<Response> {
  const { schema, transformBody, errorMessage = "요청 처리 중 오류가 발생했습니다" } = options;

  try {
    let body = await req.json();

    if (schema) {
      const result = validateBody(body, schema);
      if (!result.success) return result.response;
      body = result.data;
    }

    if (transformBody) {
      body = transformBody(body);
    }

    const { STRANDS_API_URL, PATH_API_KEY } = getEnv();
    const response = await fetch(`${STRANDS_API_URL}${backendPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PATH_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Strands API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in JSON proxy [${backendPath}]:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
