"use client";

import { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, X, Brain, GitBranch, Database, Link, Shield } from "lucide-react";

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

  useEffect(() => {
    if (node) {
      setEditedData(node.data as Record<string, unknown>);
    }
  }, [node]);

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
