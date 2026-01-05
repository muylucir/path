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
import { Loader2, Check, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { APIIntegration, APIEndpoint } from "@/lib/types";

interface APIIntegrationFormProps {
  integrationId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function APIIntegrationForm({
  integrationId,
  onSaved,
  onCancel,
}: APIIntegrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [showOpenApiUpload, setShowOpenApiUpload] = useState(false);
  const [showEndpointForm, setShowEndpointForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<"none" | "api-key" | "oauth2" | "basic">("none");
  const [apiKeyHeader, setApiKeyHeader] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [openApiSpec, setOpenApiSpec] = useState<Record<string, unknown> | null>(null);

  // Manual endpoint entry
  const [newEndpointMethod, setNewEndpointMethod] = useState<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">("GET");
  const [newEndpointPath, setNewEndpointPath] = useState("");
  const [newEndpointSummary, setNewEndpointSummary] = useState("");

  const fetchIntegration = useCallback(async () => {
    if (!integrationId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}?full=true`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const integration = data.integration as APIIntegration;

      setName(integration.name);
      setDescription(integration.description || "");
      setBaseUrl(integration.config.baseUrl);
      setAuthType(integration.config.authType);
      setEndpoints(integration.config.endpoints);
      setOpenApiSpec(integration.config.openApiSpec || null);

      if (integration.config.authConfig) {
        setApiKeyHeader(integration.config.authConfig.apiKeyHeader || "X-API-Key");
        setApiKeyValue(integration.config.authConfig.apiKeyValue || "");
      }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseError(null);
    setParseSuccess(false);

    try {
      const text = await file.text();
      const spec = JSON.parse(text);

      const response = await fetch("/api/integrations/parse-openapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse OpenAPI spec");
      }

      const data = await response.json();

      setName(data.title || name);
      setDescription(data.description || description);
      setBaseUrl(data.baseUrl || baseUrl);
      setEndpoints(data.endpoints);
      setOpenApiSpec(spec);
      setParseSuccess(true);
    } catch (err) {
      setParseError((err as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const addEndpoint = () => {
    if (!newEndpointPath.trim()) return;

    const newEndpoint: APIEndpoint = {
      method: newEndpointMethod,
      path: newEndpointPath.trim(),
      summary: newEndpointSummary.trim() || `${newEndpointMethod} ${newEndpointPath.trim()}`,
    };

    setEndpoints([...endpoints, newEndpoint]);
    setNewEndpointPath("");
    setNewEndpointSummary("");
    setNewEndpointMethod("GET");
  };

  const removeEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        type: "api" as const,
        name,
        description,
        config: {
          baseUrl,
          authType,
          authConfig:
            authType === "api-key"
              ? { apiKeyHeader, apiKeyValue }
              : undefined,
          endpoints,
          openApiSpec,
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
          placeholder="Gmail API"
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
          placeholder="Gmail 메일 관리 API"
          rows={2}
        />
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="baseUrl">Base URL *</Label>
        <Input
          id="baseUrl"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.example.com/v1"
          required
        />
      </div>

      {/* Auth Type */}
      <div className="space-y-2">
        <Label htmlFor="authType">인증 방식</Label>
        <Select value={authType} onValueChange={(v) => setAuthType(v as typeof authType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">없음</SelectItem>
            <SelectItem value="api-key">API Key</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API Key Config */}
      {authType === "api-key" && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="apiKeyHeader">API Key 헤더명</Label>
            <Input
              id="apiKeyHeader"
              value={apiKeyHeader}
              onChange={(e) => setApiKeyHeader(e.target.value)}
              placeholder="X-API-Key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKeyValue">API Key 값</Label>
            <Input
              id="apiKeyValue"
              type="password"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder="sk-..."
            />
          </div>
        </div>
      )}

      {/* Endpoints Section */}
      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">엔드포인트 ({endpoints.length}개)</Label>
          <p className="text-xs text-slate-500">선택사항</p>
        </div>

        {/* OpenAPI Upload (Optional) */}
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            onClick={() => setShowOpenApiUpload(!showOpenApiUpload)}
          >
            {showOpenApiUpload ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            OpenAPI 스펙으로 가져오기
          </button>

          {showOpenApiUpload && (
            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">
                OpenAPI/Swagger JSON 파일을 업로드하면 엔드포인트가 자동으로 추가됩니다
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={parsing}
                  className="flex-1"
                />
                {parsing && <Loader2 className="w-4 h-4 animate-spin" />}
                {parseSuccess && <Check className="w-4 h-4 text-green-500" />}
              </div>
              {parseError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {parseError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Manual Endpoint Entry */}
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            onClick={() => setShowEndpointForm(!showEndpointForm)}
          >
            {showEndpointForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            직접 엔드포인트 추가
          </button>

          {showEndpointForm && (
            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
              <div className="flex gap-2">
                <Select
                  value={newEndpointMethod}
                  onValueChange={(v) => setNewEndpointMethod(v as typeof newEndpointMethod)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newEndpointPath}
                  onChange={(e) => setNewEndpointPath(e.target.value)}
                  placeholder="/users/{id}"
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newEndpointSummary}
                  onChange={(e) => setNewEndpointSummary(e.target.value)}
                  placeholder="설명 (선택)"
                  className="flex-1"
                />
                <Button type="button" size="sm" onClick={addEndpoint} disabled={!newEndpointPath.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Endpoints List */}
        {endpoints.length > 0 && (
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
            {endpoints.map((endpoint, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 group"
              >
                <Badge
                  variant="outline"
                  className={
                    endpoint.method === "GET"
                      ? "text-green-600"
                      : endpoint.method === "POST"
                      ? "text-blue-600"
                      : endpoint.method === "PUT"
                      ? "text-orange-600"
                      : endpoint.method === "DELETE"
                      ? "text-red-600"
                      : "text-purple-600"
                  }
                >
                  {endpoint.method}
                </Badge>
                <span className="font-mono truncate flex-1">{endpoint.path}</span>
                <button
                  type="button"
                  onClick={() => removeEndpoint(idx)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={loading || !name || !baseUrl}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {integrationId ? "수정" : "저장"}
        </Button>
      </div>
    </form>
  );
}
