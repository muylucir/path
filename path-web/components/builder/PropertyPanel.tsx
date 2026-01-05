"use client";

import { useState, useEffect, useCallback } from "react";
import type { Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Brain, GitBranch, Database, Link, Shield, Plus, Loader2, Globe, Server } from "lucide-react";
import type { IntegrationListItem } from "@/lib/types";

interface PropertyPanelProps {
  node: Node | null;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  readOnly?: boolean;
}

export function PropertyPanel({
  node,
  onUpdate,
  onDelete,
  readOnly = false,
}: PropertyPanelProps) {
  const [editedData, setEditedData] = useState<Record<string, unknown>>({});
  const [integrations, setIntegrations] = useState<IntegrationListItem[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    setLoadingIntegrations(true);
    try {
      const response = await fetch("/api/integrations");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  useEffect(() => {
    if (node) {
      setEditedData(node.data as Record<string, unknown>);
      // Fetch integrations when gateway node is selected
      if (node.type === "gateway") {
        fetchIntegrations();
      }
    }
  }, [node, fetchIntegrations]);

  if (!node) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          노드를 선택하면
          <br />
          속성을 확인할 수 있습니다
        </p>
      </div>
    );
  }

  const handleChange = (key: string, value: unknown) => {
    if (readOnly) return;
    const newData = { ...editedData, [key]: value };
    setEditedData(newData);
    onUpdate(node.id, newData);
  };

  const handleNestedChange = (parentKey: string, key: string, value: unknown) => {
    if (readOnly) return;
    const parentObj = (editedData[parentKey] as Record<string, unknown>) || {};
    const newParent = { ...parentObj, [key]: value };
    handleChange(parentKey, newParent);
  };

  const getIcon = () => {
    switch (node.type) {
      case "agent":
        return <Brain className="w-5 h-5 text-blue-500" />;
      case "router":
        return <GitBranch className="w-5 h-5 text-orange-500" />;
      case "memory":
        return <Database className="w-5 h-5 text-purple-500" />;
      case "gateway":
        return <Link className="w-5 h-5 text-emerald-500" />;
      case "identity":
        return <Shield className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getNodeTypeLabel = () => {
    switch (node.type) {
      case "agent":
        return "Agent";
      case "router":
        return "Router";
      case "memory":
        return "Memory";
      case "gateway":
        return "Gateway";
      case "identity":
        return "Identity";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {getNodeTypeLabel()}
            </span>
          </div>
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Properties */}
      <div className="p-4 space-y-4">
        {/* Common: Name */}
        <div className="space-y-2">
          <Label>이름</Label>
          <Input
            value={(editedData.name as string) || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={readOnly}
          />
        </div>

        {/* Agent specific */}
        {node.type === "agent" && (
          <>
            <div className="space-y-2">
              <Label>역할</Label>
              <Input
                value={(editedData.role as string) || ""}
                onChange={(e) => handleChange("role", e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>시스템 프롬프트</Label>
              <Textarea
                value={(editedData.systemPrompt as string) || ""}
                onChange={(e) => handleChange("systemPrompt", e.target.value)}
                disabled={readOnly}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>LLM 모델</Label>
              <Select
                value={
                  ((editedData.llm as Record<string, unknown>)?.model as string) ||
                  "claude-sonnet-4.5"
                }
                onValueChange={(value) => handleNestedChange("llm", "model", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
                  <SelectItem value="claude-haiku-4.5">Claude Haiku 4.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Input</Label>
              <Input
                value={(editedData.input as string) || ""}
                onChange={(e) => handleChange("input", e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Output</Label>
              <Input
                value={(editedData.output as string) || ""}
                onChange={(e) => handleChange("output", e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Tools (쉼표로 구분)</Label>
              <Input
                value={((editedData.tools as string[]) || []).join(", ")}
                onChange={(e) =>
                  handleChange(
                    "tools",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                disabled={readOnly}
                placeholder="tool1, tool2, tool3"
              />
            </div>
          </>
        )}

        {/* Router specific */}
        {node.type === "router" && (
          <>
            <div className="space-y-2">
              <Label>조건</Label>
              <Textarea
                value={(editedData.condition as string) || ""}
                onChange={(e) => handleChange("condition", e.target.value)}
                disabled={readOnly}
                rows={3}
                placeholder="분기 조건을 입력하세요"
              />
            </div>
          </>
        )}

        {/* Memory specific */}
        {node.type === "memory" && (
          <>
            <div className="space-y-2">
              <Label>메모리 타입</Label>
              <Select
                value={(editedData.type as string) || "short-term"}
                onValueChange={(value) => handleChange("type", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-term">Short-term (STM)</SelectItem>
                  <SelectItem value="long-term">Long-term (LTM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>전략 (쉼표로 구분)</Label>
              <Input
                value={((editedData.strategies as string[]) || []).join(", ")}
                onChange={(e) =>
                  handleChange(
                    "strategies",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                disabled={readOnly}
                placeholder="semantic, user-preference"
              />
            </div>
          </>
        )}

        {/* Gateway specific */}
        {node.type === "gateway" && (
          <>
            <div className="space-y-2">
              <Label>연결된 타겟</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {((editedData.targets as unknown[]) || []).length} target(s) 연결됨
              </p>
            </div>

            {/* Integration Selection */}
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Label className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                등록된 통합에서 추가
              </Label>

              {loadingIntegrations ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : integrations.length === 0 ? (
                <p className="text-xs text-gray-500">
                  등록된 통합이 없습니다.{" "}
                  <a href="/settings" className="text-blue-500 hover:underline">
                    설정 페이지
                  </a>
                  에서 추가하세요.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {integrations
                    .filter((i) => i.type === "api" || i.type === "mcp")
                    .map((integration) => {
                      const targets = (editedData.targets as { integrationId?: string }[]) || [];
                      const isSelected = targets.some((t) => t.integrationId === integration.id);

                      return (
                        <div
                          key={integration.id}
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                          onClick={() => {
                            if (readOnly) return;
                            const currentTargets = (editedData.targets as { integrationId?: string; type: string; name: string; config: Record<string, unknown> }[]) || [];
                            if (isSelected) {
                              // Remove
                              handleChange(
                                "targets",
                                currentTargets.filter((t) => t.integrationId !== integration.id)
                              );
                            } else {
                              // Add
                              handleChange("targets", [
                                ...currentTargets,
                                {
                                  integrationId: integration.id,
                                  type: integration.type === "api" ? "rest-api" : "mcp-server",
                                  name: integration.name,
                                  config: {},
                                },
                              ]);
                            }
                          }}
                        >
                          <Checkbox checked={isSelected} disabled={readOnly} />
                          {integration.type === "api" ? (
                            <Globe className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Server className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="text-sm flex-1 truncate">{integration.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {integration.type.toUpperCase()}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Identity specific */}
        {node.type === "identity" && (
          <>
            <div className="space-y-2">
              <Label>인증 타입</Label>
              <Select
                value={(editedData.authType as string) || "api-key"}
                onValueChange={(value) => handleChange("authType", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="oauth2-2lo">OAuth 2.0 (2LO)</SelectItem>
                  <SelectItem value="oauth2-3lo">OAuth 2.0 (3LO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input
                value={(editedData.provider as string) || ""}
                onChange={(e) => handleChange("provider", e.target.value)}
                disabled={readOnly}
                placeholder="예: Google, GitHub"
              />
            </div>
            <div className="space-y-2">
              <Label>Scopes (쉼표로 구분)</Label>
              <Input
                value={((editedData.scopes as string[]) || []).join(", ")}
                onChange={(e) =>
                  handleChange(
                    "scopes",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                disabled={readOnly}
                placeholder="read, write"
              />
            </div>
          </>
        )}

        {/* Node ID (readonly) */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400">
            ID: {node.id}
          </p>
        </div>
      </div>
    </div>
  );
}
