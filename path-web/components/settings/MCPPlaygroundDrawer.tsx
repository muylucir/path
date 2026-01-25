"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Play, Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
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

interface MCPPlaygroundDrawerProps {
  serverId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MCPPlaygroundDrawer({
  serverId,
  open,
  onOpenChange,
}: MCPPlaygroundDrawerProps) {
  const [server, setServer] = useState<MCPServerIntegration | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [invoking, setInvoking] = useState(false);
  const [result, setResult] = useState<InvokeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchServer = useCallback(async () => {
    if (!serverId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/mcp-servers/${serverId}`);
      const data = await response.json();
      if (data.success) {
        setServer(data.server);
      } else {
        setError(data.error || "Failed to load server");
      }
    } catch (err) {
      setError("Failed to load server");
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  const fetchTools = useCallback(async () => {
    if (!serverId) return;

    try {
      const response = await fetch(`/api/mcp-servers/${serverId}/tools`);
      const data = await response.json();
      if (data.success) {
        setTools(data.tools || []);
      }
    } catch (err) {
      console.error("Failed to fetch tools:", err);
    }
  }, [serverId]);

  useEffect(() => {
    if (open && serverId) {
      fetchServer();
    }
  }, [open, serverId, fetchServer]);

  useEffect(() => {
    if (server?.deployment?.status === "ready") {
      fetchTools();
    }
  }, [server, fetchTools]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setSelectedTool(null);
      setToolArgs({});
      setResult(null);
    }
  }, [open]);

  const handleSelectTool = (tool: MCPTool) => {
    setSelectedTool(tool);
    setToolArgs({});
    setResult(null);
  };

  const handleInvoke = async () => {
    if (!selectedTool || !serverId) return;

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

      const response = await fetch(`/api/mcp-servers/${serverId}/invoke`, {
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
          error: { message: data.error || "Failed to invoke" },
        });
      }
    } catch (err) {
      setResult({
        tool: selectedTool.name,
        error: { message: err instanceof Error ? err.message : "Unknown error" },
      });
    } finally {
      setInvoking(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      );
    }

    if (error || !server) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-slate-500">{error || "Server not found"}</p>
          </div>
        </div>
      );
    }

    if (server.deployment?.status !== "ready") {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-lg font-semibold mb-2">Deployment Required</h2>
            <p className="text-slate-500 mb-3">
              MCP server is not deployed yet.
              <br />
              Please deploy the server first.
            </p>
            <Badge variant="outline">
              Status: {server.deployment?.status || "none"}
            </Badge>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Tools List */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tools</CardTitle>
            <CardDescription className="text-xs">
              {tools.length} tools available
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-1.5 pb-4">
            {tools.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No tools available
              </p>
            ) : (
              tools.map((tool) => (
                <Button
                  key={tool.name}
                  variant={selectedTool?.name === tool.name ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-2.5"
                  onClick={() => handleSelectTool(tool)}
                >
                  <div>
                    <div className="font-medium text-sm">{tool.name}</div>
                    {tool.description && (
                      <div className="text-xs opacity-70 mt-0.5 line-clamp-1">
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
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedTool ? selectedTool.name : "Select Tool"}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {selectedTool?.description || "Select a tool from the list"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pb-4">
            {selectedTool ? (
              <div className="space-y-3">
                {selectedTool.inputSchema?.properties ? (
                  Object.entries(selectedTool.inputSchema.properties).map(
                    ([key, schema]) => (
                      <div key={key}>
                        <label className="text-sm font-medium mb-1 block">
                          {key}
                          {selectedTool.inputSchema?.required?.includes(key) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {schema.description && (
                          <p className="text-xs text-slate-500 mb-1">
                            {schema.description}
                          </p>
                        )}
                        {schema.type === "object" || schema.type === "array" ? (
                          <Textarea
                            placeholder={`${schema.type} (JSON)`}
                            value={toolArgs[key] || ""}
                            onChange={(e) =>
                              setToolArgs({ ...toolArgs, [key]: e.target.value })
                            }
                            rows={2}
                            className="text-sm"
                          />
                        ) : (
                          <Input
                            type={schema.type === "number" || schema.type === "integer" ? "number" : "text"}
                            placeholder={`${schema.type}`}
                            value={toolArgs[key] || ""}
                            onChange={(e) =>
                              setToolArgs({ ...toolArgs, [key]: e.target.value })
                            }
                            className="text-sm"
                          />
                        )}
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-500">
                    No input parameters
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
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                Select a tool to see input fields
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Result
              {result && (
                result.error ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )
              )}
            </CardTitle>
            {result?.metadata?.latency_ms && (
              <CardDescription className="text-xs">
                Response time: {result.metadata.latency_ms}ms
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-auto pb-4">
            {result ? (
              <div className="space-y-3">
                {result.error ? (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      Error: {result.error.message}
                    </p>
                    {result.error.code && (
                      <p className="text-xs text-red-500 mt-1">
                        Code: {result.error.code}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                      {typeof result.result === "string"
                        ? result.result
                        : JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                Run a tool to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-full w-full sm:max-w-5xl">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-2">
                {server?.name || "MCP Playground"}
                {server?.deployment?.status === "ready" && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                    v{server.deployment.version || 1}
                  </Badge>
                )}
              </DrawerTitle>
              <DrawerDescription>
                MCP Server Playground - Test your tools
              </DrawerDescription>
            </div>
            {server?.deployment?.status === "ready" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  fetchServer();
                  fetchTools();
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-auto p-4">
          {renderContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
