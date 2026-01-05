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
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<"none" | "api-key" | "oauth2" | "basic">("none");
  const [apiKeyHeader, setApiKeyHeader] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [openApiSpec, setOpenApiSpec] = useState<Record<string, unknown> | null>(null);

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
      {/* OpenAPI Upload */}
      <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
        <Label className="text-sm font-medium">OpenAPI 스펙 업로드</Label>
        <p className="text-xs text-slate-500 mb-2">
          OpenAPI/Swagger JSON 파일을 업로드하면 자동으로 파싱됩니다
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

      {/* Endpoints Preview */}
      {endpoints.length > 0 && (
        <div className="space-y-2">
          <Label>파싱된 엔드포인트 ({endpoints.length}개)</Label>
          <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
            {endpoints.slice(0, 10).map((endpoint, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
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
                      : ""
                  }
                >
                  {endpoint.method}
                </Badge>
                <span className="font-mono truncate">{endpoint.path}</span>
              </div>
            ))}
            {endpoints.length > 10 && (
              <p className="text-xs text-slate-400">
                ... 외 {endpoints.length - 10}개
              </p>
            )}
          </div>
        </div>
      )}

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
