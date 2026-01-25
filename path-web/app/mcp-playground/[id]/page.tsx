"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { MCPServerIntegration } from "@/lib/types";

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, {
      type: string;
      description?: string;
    }>;
    required?: string[];
  };
}

interface InvokeResult {
  tool: string;
  result?: unknown;
  error?: { message: string; code?: number };
  metadata?: { latency_ms: number };
}

export default function MCPPlaygroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [server, setServer] = useState<MCPServerIntegration | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [invoking, setInvoking] = useState(false);
  const [result, setResult] = useState<InvokeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServer();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (server?.deployment?.status === "ready") {
      fetchTools();
    }
  }, [server]);

  const fetchServer = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mcp-servers/${resolvedParams.id}`);
      const data = await response.json();
      if (data.success) {
        setServer(data.server);
      } else {
        setError(data.error || "서버를 찾을 수 없습니다");
      }
    } catch (err) {
      setError("서버 정보를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const fetchTools = async () => {
    try {
      const response = await fetch(`/api/mcp-servers/${resolvedParams.id}/tools`);
      const data = await response.json();
      if (data.success) {
        setTools(data.tools || []);
      }
    } catch (err) {
      console.error("Failed to fetch tools:", err);
    }
  };

  const handleSelectTool = (tool: MCPTool) => {
    setSelectedTool(tool);
    setToolArgs({});
    setResult(null);
  };

  const handleInvoke = async () => {
    if (!selectedTool) return;

    setInvoking(true);
    setResult(null);

    try {
      // Convert string arguments to proper types based on schema
      const parsedArgs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(toolArgs)) {
        const propSchema = selectedTool.inputSchema?.properties?.[key];
        if (propSchema?.type === "number" || propSchema?.type === "integer") {
          parsedArgs[key] = Number(value);
        } else if (propSchema?.type === "boolean") {
          parsedArgs[key] = value.toLowerCase() === "true";
        } else if (propSchema?.type === "object" || propSchema?.type === "array") {
          try {
            parsedArgs[key] = JSON.parse(value);
          } catch {
            parsedArgs[key] = value;
          }
        } else {
          parsedArgs[key] = value;
        }
      }

      const response = await fetch(`/api/mcp-servers/${resolvedParams.id}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: selectedTool.name,
          arguments: parsedArgs,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult({
          tool: data.tool,
          result: data.result,
          error: data.error,
          metadata: data.metadata,
        });
      } else {
        setResult({
          tool: selectedTool.name,
          error: { message: data.error || "호출 실패" },
        });
      }
    } catch (err) {
      setResult({
        tool: selectedTool.name,
        error: { message: err instanceof Error ? err.message : "알 수 없는 오류" },
      });
    } finally {
      setInvoking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold mb-2">오류</h2>
            <p className="text-slate-500">{error || "서버를 찾을 수 없습니다"}</p>
            <Button className="mt-4" onClick={() => router.push("/settings")}>
              설정으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (server.deployment?.status !== "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-lg font-semibold mb-2">배포 필요</h2>
            <p className="text-slate-500">
              MCP 서버가 아직 배포되지 않았습니다.
              <br />
              설정에서 서버를 먼저 배포해주세요.
            </p>
            <Badge variant="outline" className="mt-3">
              상태: {server.deployment?.status || "none"}
            </Badge>
            <Button className="mt-4" onClick={() => router.push("/settings")}>
              설정으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{server.name}</h1>
              <p className="text-sm text-slate-500">MCP 서버 플레이그라운드</p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              v{server.deployment?.version || 1}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tools List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">도구 목록</CardTitle>
              <CardDescription>
                {tools.length}개의 도구를 사용할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tools.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  도구가 없습니다
                </p>
              ) : (
                tools.map((tool) => (
                  <Button
                    key={tool.name}
                    variant={selectedTool?.name === tool.name ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleSelectTool(tool)}
                  >
                    <div>
                      <div className="font-medium">{tool.name}</div>
                      {tool.description && (
                        <div className="text-xs opacity-70 mt-1 line-clamp-2">
                          {tool.description}
                        </div>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tool Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedTool ? selectedTool.name : "도구 선택"}
              </CardTitle>
              <CardDescription>
                {selectedTool?.description || "왼쪽에서 도구를 선택하세요"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTool ? (
                <div className="space-y-4">
                  {selectedTool.inputSchema?.properties ? (
                    Object.entries(selectedTool.inputSchema.properties).map(
                      ([key, schema]) => (
                        <div key={key}>
                          <label className="text-sm font-medium mb-1.5 block">
                            {key}
                            {selectedTool.inputSchema?.required?.includes(key) && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          {schema.description && (
                            <p className="text-xs text-slate-500 mb-1.5">
                              {schema.description}
                            </p>
                          )}
                          {schema.type === "object" || schema.type === "array" ? (
                            <Textarea
                              placeholder={`${schema.type} (JSON 형식)`}
                              value={toolArgs[key] || ""}
                              onChange={(e) =>
                                setToolArgs({ ...toolArgs, [key]: e.target.value })
                              }
                              rows={3}
                            />
                          ) : (
                            <Input
                              type={schema.type === "number" || schema.type === "integer" ? "number" : "text"}
                              placeholder={`${schema.type}`}
                              value={toolArgs[key] || ""}
                              onChange={(e) =>
                                setToolArgs({ ...toolArgs, [key]: e.target.value })
                              }
                            />
                          )}
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      이 도구는 입력 매개변수가 없습니다
                    </p>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleInvoke}
                    disabled={invoking}
                  >
                    {invoking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        실행 중...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        실행
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  도구를 선택하면 여기에 입력 필드가 표시됩니다
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                결과
                {result && (
                  result.error ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )
                )}
              </CardTitle>
              {result?.metadata?.latency_ms && (
                <CardDescription>
                  응답 시간: {result.metadata.latency_ms}ms
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {result.error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        오류: {result.error.message}
                      </p>
                      {result.error.code && (
                        <p className="text-xs text-red-500 mt-1">
                          코드: {result.error.code}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                        {typeof result.result === "string"
                          ? result.result
                          : JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  도구를 실행하면 여기에 결과가 표시됩니다
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
