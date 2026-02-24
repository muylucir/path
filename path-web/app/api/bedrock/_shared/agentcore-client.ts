/**
 * AgentCore 클라이언트 — proxy-utils.ts 대체
 *
 * Next.js API Route에서 AWS SDK로 AgentCore Runtime을 호출하고,
 * SSE 또는 JSON 응답을 브라우저에 릴레이한다.
 *
 * 인증: Amplify 실행 역할의 IAM credential (AWS SDK 자동 사용)
 */

import { NextRequest, NextResponse } from "next/server";
import { type ZodType, ZodError } from "zod";
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";

const client = new BedrockAgentCoreClient({
  region: process.env.AWS_DEFAULT_REGION || "ap-northeast-2",
});

function getAgentRuntimeArn(): string {
  return process.env.AGENT_RUNTIME_ARN || "";
}

interface AgentCoreOptions {
  /** Zod schema to validate the request body */
  schema?: ZodType;
  /** Action type sent as payload.type to the entrypoint */
  actionType: string;
  /** Transform the parsed body before building the payload */
  transformBody?: (body: Record<string, unknown>) => Record<string, unknown>;
  /** Error message to return on failure */
  errorMessage?: string;
  /**
   * Extract runtimeSessionId from the request body.
   * Return the session ID string, or undefined for auto-generated.
   */
  getSessionId?: (body: Record<string, unknown>) => string | undefined;
  /**
   * Generate a new runtimeSessionId for this request.
   * Used when getSessionId returns undefined (e.g., pattern/analyze creates new sessions).
   */
  generateSessionId?: boolean;
}

// ────────────────────────────────────────────
// Validation (reused from proxy-utils.ts)
// ────────────────────────────────────────────

function validateBody(
  body: unknown,
  schema: ZodType,
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
          { status: 400 },
        ),
      };
    }
    throw err;
  }
}

// ────────────────────────────────────────────
// Invoke helpers
// ────────────────────────────────────────────

async function invokeRuntime(
  payload: Record<string, unknown>,
  sessionId?: string,
) {
  const command = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: getAgentRuntimeArn(),
    payload: new TextEncoder().encode(JSON.stringify(payload)),
    contentType: "application/json",
    ...(sessionId ? { runtimeSessionId: sessionId } : {}),
  });

  return client.send(command);
}

// ────────────────────────────────────────────
// SSE Proxy (streaming)
// ────────────────────────────────────────────

/**
 * Invoke AgentCore and relay the SSE stream to the browser.
 *
 * AgentCore wraps each yielded event as `data: {...}\n\n`.
 * This function pipes the stream through and appends `data: [DONE]\n\n`.
 */
export async function invokeAgentCoreSSE(
  req: NextRequest,
  options: AgentCoreOptions,
): Promise<Response> {
  const {
    schema,
    actionType,
    transformBody,
    errorMessage = "요청 처리 중 오류가 발생했습니다",
    getSessionId,
    generateSessionId,
  } = options;

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

    // Build payload with action type
    const payload = { type: actionType, ...body };

    // Determine session ID
    let sessionId: string | undefined;
    if (getSessionId) {
      sessionId = getSessionId(body);
    }
    if (!sessionId && generateSessionId) {
      sessionId = crypto.randomUUID();
    }

    const response = await invokeRuntime(payload, sessionId);

    // Get the streaming body
    const responseBody = response.response;
    const contentType = response.contentType || "";

    // Create a TransformStream to relay SSE data
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        if (contentType.includes("text/event-stream") && responseBody) {
          // Stream SSE events from AgentCore → browser
          // AgentCore formats yielded events as `data: {...}\n\n`
          const bodyStream = toReadableStream(responseBody);
          const reader = bodyStream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writer.write(value);
          }
        } else if (responseBody) {
          // Non-streaming: read full body and wrap as SSE events
          const bodyBytes = await collectStream(responseBody);
          const bodyStr = new TextDecoder().decode(bodyBytes);

          // Try to parse as JSON and emit as SSE data event
          try {
            JSON.parse(bodyStr); // validate
            await writer.write(encoder.encode(`data: ${bodyStr}\n\n`));
          } catch {
            await writer.write(encoder.encode(`data: ${bodyStr}\n\n`));
          }
        }

        // Send [DONE] sentinel
        await writer.write(encoder.encode("data: [DONE]\n\n"));
        await writer.close();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          try { await writer.close(); } catch { /* already closed */ }
          return;
        }
        try {
          const errEvent = `data: ${JSON.stringify({ error: "스트리밍 연결이 중단되었습니다" })}\n\n`;
          await writer.write(encoder.encode(errEvent));
        } catch { /* writer closed */ }
        try { await writer.close(); } catch { /* ignore */ }
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
    console.error(`Error in AgentCore SSE [${actionType}]:`, error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ────────────────────────────────────────────
// JSON Proxy (non-streaming)
// ────────────────────────────────────────────

/**
 * Invoke AgentCore and return the JSON response.
 *
 * For JSON actions, the entrypoint yields a single dict.
 * AgentCore wraps it as SSE. We parse the first data event and return as JSON.
 */
export async function invokeAgentCoreJSON(
  req: NextRequest,
  options: AgentCoreOptions,
): Promise<Response> {
  const {
    schema,
    actionType,
    transformBody,
    errorMessage = "요청 처리 중 오류가 발생했습니다",
    getSessionId,
  } = options;

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

    const payload = { type: actionType, ...body };

    let sessionId: string | undefined;
    if (getSessionId) {
      sessionId = getSessionId(body);
    }

    const response = await invokeRuntime(payload, sessionId);
    const responseBody = response.response;

    if (!responseBody) {
      return NextResponse.json({ error: "No response from AgentCore" }, { status: 500 });
    }

    // Collect the full response
    const bodyBytes = await collectStream(responseBody);
    const bodyStr = new TextDecoder().decode(bodyBytes);

    // AgentCore wraps yielded events as SSE. Parse the data event(s).
    const jsonData = extractJsonFromSSE(bodyStr);

    if (jsonData !== null) {
      return NextResponse.json(jsonData);
    }

    // Fallback: try direct JSON parse
    try {
      return NextResponse.json(JSON.parse(bodyStr));
    } catch {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error in AgentCore JSON [${actionType}]:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// ────────────────────────────────────────────
// Stream utilities
// ────────────────────────────────────────────

/**
 * Convert various response body types to a web ReadableStream<Uint8Array>.
 */
function toReadableStream(body: unknown): ReadableStream<Uint8Array> {
  // Already a ReadableStream
  if (body instanceof ReadableStream) {
    return body;
  }

  // Node.js Readable (from AWS SDK)
  if (body && typeof (body as any).pipe === "function") {
    const nodeReadable = body as NodeJS.ReadableStream;
    return new ReadableStream({
      start(controller) {
        nodeReadable.on("data", (chunk: Buffer | Uint8Array) => {
          controller.enqueue(
            chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk),
          );
        });
        nodeReadable.on("end", () => controller.close());
        nodeReadable.on("error", (err) => controller.error(err));
      },
    });
  }

  // SdkStream with transformToWebStream
  if (body && typeof (body as any).transformToWebStream === "function") {
    return (body as any).transformToWebStream();
  }

  // Uint8Array or ArrayBuffer
  if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
    const bytes = body instanceof ArrayBuffer ? new Uint8Array(body) : body;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
  }

  // Fallback: empty stream
  return new ReadableStream({ start(controller) { controller.close(); } });
}

/**
 * Collect a stream body into a single Uint8Array.
 */
async function collectStream(body: unknown): Promise<Uint8Array> {
  const stream = toReadableStream(body);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Extract JSON data from an SSE-formatted string.
 * Returns the parsed object from the first `data: {...}` line, or null.
 */
function extractJsonFromSSE(sseText: string): unknown | null {
  const lines = sseText.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data && data !== "[DONE]") {
        try {
          return JSON.parse(data);
        } catch {
          continue;
        }
      }
    }
  }
  return null;
}
