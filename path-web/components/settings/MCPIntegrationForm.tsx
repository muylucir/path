"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import type { MCPIntegration, MCPTool } from "@/lib/types";

interface MCPIntegrationFormProps {
  integrationId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function MCPIntegrationForm({
  integrationId,
  onSaved,
  onCancel,
}: MCPIntegrationFormProps) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [transport, setTransport] = useState<"stdio" | "sse" | "websocket">("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState<string[]>([]);
  const [newArg, setNewArg] = useState("");
  const [tools, setTools] = useState<MCPTool[]>([]);

  // Tool editing state
  const [editingToolIdx, setEditingToolIdx] = useState<number | null>(null);
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolInputSchema, setToolInputSchema] = useState("");

  const fetchIntegration = useCallback(async () => {
    if (!integrationId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}?full=true`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const integration = data.integration as MCPIntegration;

      setName(integration.name);
      setDescription(integration.description || "");
      setServerUrl(integration.config.serverUrl);
      setTransport(integration.config.transport);
      setCommand(integration.config.command || "");
      setArgs(integration.config.args || []);
      setTools(integration.config.tools);
    } catch (err) {
      console.error("Failed to fetch integration:", err);
    } finally {
      setLoading(false);
    }
  }, [integrationId]);

  useEffect(() => {
    if (integrationId) {
      fetchIntegration();
    }
  }, [integrationId, fetchIntegration]);

  const handleAddArg = () => {
    if (newArg.trim()) {
      setArgs([...args, newArg.trim()]);
      setNewArg("");
    }
  };

  const handleRemoveArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const handleAddTool = () => {
    setEditingToolIdx(tools.length);
    setToolName("");
    setToolDescription("");
    setToolInputSchema("{}");
  };

  const handleEditTool = (idx: number) => {
    const tool = tools[idx];
    setEditingToolIdx(idx);
    setToolName(tool.name);
    setToolDescription(tool.description);
    setToolInputSchema(JSON.stringify(tool.inputSchema, null, 2));
  };

  const handleSaveTool = () => {
    if (!toolName.trim()) return;

    let inputSchema = {};
    try {
      inputSchema = JSON.parse(toolInputSchema);
    } catch {
      // Keep empty schema if invalid
    }

    const newTool: MCPTool = {
      name: toolName.trim(),
      description: toolDescription.trim(),
      inputSchema,
    };

    if (editingToolIdx !== null && editingToolIdx < tools.length) {
      // Edit existing
      const updated = [...tools];
      updated[editingToolIdx] = newTool;
      setTools(updated);
    } else {
      // Add new
      setTools([...tools, newTool]);
    }

    setEditingToolIdx(null);
    setToolName("");
    setToolDescription("");
    setToolInputSchema("{}");
  };

  const handleRemoveTool = (idx: number) => {
    setTools(tools.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        type: "mcp" as const,
        name,
        description,
        config: {
          serverUrl,
          transport,
          command: command || undefined,
          args: args.length > 0 ? args : undefined,
          tools,
        },
      };

      const url = integrationId
        ? `/api/integrations/${integrationId}`
        : "/api/integrations";
      const method = integrationId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");
      onSaved();
    } catch (err) {
      console.error("Failed to save:", err);
      alert("저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">이름 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="File System MCP Server"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="파일 시스템 접근을 위한 MCP 서버"
          rows={2}
        />
      </div>

      {/* Server URL */}
      <div className="space-y-2">
        <Label htmlFor="serverUrl">서버 URL *</Label>
        <Input
          id="serverUrl"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="npx -y @modelcontextprotocol/server-filesystem"
          required
        />
      </div>

      {/* Transport */}
      <div className="space-y-2">
        <Label htmlFor="transport">Transport</Label>
        <Select
          value={transport}
          onValueChange={(v) => setTransport(v as typeof transport)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stdio">STDIO</SelectItem>
            <SelectItem value="sse">SSE</SelectItem>
            <SelectItem value="websocket">WebSocket</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Command (for stdio) */}
      {transport === "stdio" && (
        <div className="space-y-2">
          <Label htmlFor="command">Command</Label>
          <Input
            id="command"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="npx"
          />
        </div>
      )}

      {/* Args */}
      <div className="space-y-2">
        <Label>Arguments</Label>
        <div className="flex gap-2">
          <Input
            value={newArg}
            onChange={(e) => setNewArg(e.target.value)}
            placeholder="--arg=value"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddArg();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddArg}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {args.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {args.map((arg, idx) => (
              <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                <span className="font-mono text-xs">{arg}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveArg(idx)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Tools ({tools.length}개)</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddTool}>
            <Plus className="w-4 h-4 mr-1" />
            도구 추가
          </Button>
        </div>

        {/* Tool List */}
        {tools.length > 0 && (
          <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
            {tools.map((tool, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <div>
                  <p className="text-sm font-medium">{tool.name}</p>
                  <p className="text-xs text-slate-500 truncate max-w-xs">
                    {tool.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTool(idx)}
                  >
                    수정
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleRemoveTool(idx)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tool Editor */}
        {editingToolIdx !== null && (
          <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
            <div className="space-y-2">
              <Label>도구 이름 *</Label>
              <Input
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="read_file"
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input
                value={toolDescription}
                onChange={(e) => setToolDescription(e.target.value)}
                placeholder="파일 내용을 읽습니다"
              />
            </div>
            <div className="space-y-2">
              <Label>Input Schema (JSON)</Label>
              <Textarea
                value={toolInputSchema}
                onChange={(e) => setToolInputSchema(e.target.value)}
                rows={4}
                className="font-mono text-xs"
                placeholder='{"type": "object", "properties": {}}'
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingToolIdx(null)}
              >
                취소
              </Button>
              <Button type="button" size="sm" onClick={handleSaveTool}>
                저장
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={loading || !name || !serverUrl}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {integrationId ? "수정" : "저장"}
        </Button>
      </div>
    </form>
  );
}
