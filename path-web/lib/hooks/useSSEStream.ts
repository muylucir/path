"use client";

import { useCallback, useRef, useState } from "react";

export interface UseSSEStreamOptions {
  url: string;
  body: Record<string, unknown>;
  onChunk?: (data: any) => void;
  onProgress?: (progress: number, stage: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

export interface UseSSEStreamReturn {
  start: () => Promise<void>;
  abort: () => void;
  isStreaming: boolean;
  error: string | null;
}

/**
 * Custom hook for consuming SSE (Server-Sent Events) streams.
 *
 * Extracts the duplicated SSE parsing pattern from Step2Readiness,
 * Step3PatternAnalysis, and Step3Results into a reusable hook.
 *
 * Features:
 * - AbortController support for cleanup
 * - response.ok check before reading stream
 * - Handles SSE line parsing, `data:` prefix, and `[DONE]` sentinel
 * - JSON parsing with SyntaxError tolerance for incomplete chunks
 */
export function useSSEStream(options: UseSSEStreamOptions): UseSSEStreamReturn {
  const { url, body, onChunk, onProgress, onDone, onError } = options;
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const start = useCallback(async () => {
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = `HTTP ${response.status}: ${response.statusText}`;
        setError(errorText);
        onError?.(errorText);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                onDone?.();
                setIsStreaming(false);
                return;
              }
              try {
                const parsed = JSON.parse(data);

                // Progress updates
                if (parsed.progress !== undefined && parsed.stage !== undefined) {
                  onProgress?.(parsed.progress, parsed.stage);
                } else if (parsed.progress !== undefined) {
                  onProgress?.(parsed.progress, "");
                }

                // Error from server
                if (parsed.error) {
                  const errMsg = parsed.error;
                  setError(errMsg);
                  onError?.(errMsg);
                  setIsStreaming(false);
                  return;
                }

                // Forward parsed data to consumer
                onChunk?.(parsed);
              } catch (e) {
                if (e instanceof SyntaxError) {
                  // Ignore incomplete JSON chunks
                } else {
                  throw e;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Stream was intentionally aborted
        return;
      }
      const message = err instanceof Error ? err.message : "SSE stream error";
      setError(message);
      onError?.(message);
    } finally {
      setIsStreaming(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [url, body, onChunk, onProgress, onDone, onError]);

  return { start, abort, isStreaming, error };
}

export default useSSEStream;
