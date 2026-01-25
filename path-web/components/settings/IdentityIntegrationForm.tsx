"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Key, Shield, Plus, X } from "lucide-react";
import type { IdentityIntegration, IdentityProviderType } from "@/lib/types";

interface IdentityIntegrationFormProps {
  integrationId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function IdentityIntegrationForm({
  integrationId,
  onSaved,
  onCancel,
}: IdentityIntegrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Identity fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [providerType, setProviderType] = useState<IdentityProviderType>("api-key");
  const [providerArn, setProviderArn] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<'creating' | 'active' | 'failed' | null>(null);

  // API Key fields
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");

  // OAuth2 fields
  const [oauth2ClientId, setOauth2ClientId] = useState("");
  const [oauth2ClientSecret, setOauth2ClientSecret] = useState("");
  const [oauth2TokenEndpoint, setOauth2TokenEndpoint] = useState("");
  const [oauth2Scopes, setOauth2Scopes] = useState<string[]>([]);
  const [newScope, setNewScope] = useState("");

  const fetchIntegration = useCallback(async () => {
    if (!integrationId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}?full=true`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const integration = data.integration as IdentityIntegration;

      setName(integration.name);
      setDescription(integration.description || "");
      setProviderType(integration.config.providerType);
      setProviderArn(integration.config.providerArn || null);
      setProviderStatus(integration.config.providerStatus || null);

      if (integration.config.apiKey) {
        setApiKeyHeaderName(integration.config.apiKey.headerName);
      }

      if (integration.config.oauth2) {
        setOauth2ClientId(integration.config.oauth2.clientId);
        setOauth2TokenEndpoint(integration.config.oauth2.tokenEndpoint);
        setOauth2Scopes(integration.config.oauth2.scopes || []);
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

  const handleAddScope = () => {
    if (newScope.trim() && !oauth2Scopes.includes(newScope.trim())) {
      setOauth2Scopes([...oauth2Scopes, newScope.trim()]);
      setNewScope("");
    }
  };

  const handleRemoveScope = (scope: string) => {
    setOauth2Scopes(oauth2Scopes.filter((s) => s !== scope));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: {
        type: 'identity';
        name: string;
        description: string;
        config: {
          providerType: IdentityProviderType;
          providerArn?: string | null;
          providerStatus?: 'creating' | 'active' | 'failed' | null;
          apiKey?: { headerName: string; apiKeyValue?: string };
          oauth2?: {
            clientId: string;
            clientSecret?: string;
            tokenEndpoint: string;
            scopes?: string[];
          };
        };
      } = {
        type: "identity",
        name,
        description,
        config: {
          providerType,
          providerArn,
          providerStatus,
        },
      };

      if (providerType === "api-key") {
        payload.config.apiKey = {
          headerName: apiKeyHeaderName,
          // Only include apiKeyValue on create, not on update
          ...(apiKeyValue && { apiKeyValue }),
        };
      } else if (providerType === "oauth2") {
        payload.config.oauth2 = {
          clientId: oauth2ClientId,
          tokenEndpoint: oauth2TokenEndpoint,
          scopes: oauth2Scopes.length > 0 ? oauth2Scopes : undefined,
          // Only include clientSecret on create, not on update
          ...(oauth2ClientSecret && { clientSecret: oauth2ClientSecret }),
        };
      }

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

  // Create Identity Provider in AgentCore
  const handleCreateProvider = async () => {
    if (!integrationId) {
      alert("먼저 Provider를 저장해주세요");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/identity-providers/${integrationId}/create`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to create provider");
      const data = await response.json();

      setProviderArn(data.providerArn);
      setProviderStatus("active");

      // Refresh
      fetchIntegration();
    } catch (err) {
      console.error("Failed to create provider:", err);
      setProviderStatus("failed");
      alert("Provider 생성에 실패했습니다");
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = () => {
    if (!providerStatus) return null;
    switch (providerStatus) {
      case "creating":
        return <Badge variant="outline" className="text-yellow-600">생성 중...</Badge>;
      case "active":
        return <Badge variant="outline" className="text-green-600">Active</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-red-600">실패</Badge>;
    }
  };

  const isFormValid = () => {
    if (!name.trim()) return false;

    if (providerType === "api-key") {
      // 새로 생성할 때는 apiKeyValue 필요, 수정할 때는 선택
      if (!integrationId && !apiKeyValue) return false;
      return !!apiKeyHeaderName;
    }

    if (providerType === "oauth2") {
      // 새로 생성할 때는 clientSecret 필요, 수정할 때는 선택
      if (!integrationId && !oauth2ClientSecret) return false;
      return !!oauth2ClientId && !!oauth2TokenEndpoint;
    }

    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Provider 이름 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Weather API Key"
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
          placeholder="날씨 API 접근을 위한 API Key"
          rows={2}
        />
      </div>

      {/* Provider Type */}
      <div className="space-y-2">
        <Label>인증 유형 *</Label>
        <Select
          value={providerType}
          onValueChange={(v) => setProviderType(v as IdentityProviderType)}
          disabled={!!integrationId} // Can't change type after creation
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="api-key">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" /> API Key
              </div>
            </SelectItem>
            <SelectItem value="oauth2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> OAuth 2.0
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API Key Config */}
      {providerType === "api-key" && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="apiKeyHeader">API Key 헤더 이름 *</Label>
            <Input
              id="apiKeyHeader"
              value={apiKeyHeaderName}
              onChange={(e) => setApiKeyHeaderName(e.target.value)}
              placeholder="X-API-Key"
            />
            <p className="text-xs text-slate-500">
              API 요청 시 사용할 헤더 이름 (예: X-API-Key, Authorization)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKeyValue">
              API Key 값 {!integrationId && "*"}
            </Label>
            <Input
              id="apiKeyValue"
              type="password"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder={integrationId ? "(변경하려면 입력)" : "sk-..."}
            />
            {integrationId && (
              <p className="text-xs text-slate-500">
                비워두면 기존 값이 유지됩니다
              </p>
            )}
          </div>
        </div>
      )}

      {/* OAuth2 Config */}
      {providerType === "oauth2" && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="oauth2ClientId">Client ID *</Label>
            <Input
              id="oauth2ClientId"
              value={oauth2ClientId}
              onChange={(e) => setOauth2ClientId(e.target.value)}
              placeholder="your-client-id"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth2ClientSecret">
              Client Secret {!integrationId && "*"}
            </Label>
            <Input
              id="oauth2ClientSecret"
              type="password"
              value={oauth2ClientSecret}
              onChange={(e) => setOauth2ClientSecret(e.target.value)}
              placeholder={integrationId ? "(변경하려면 입력)" : "your-client-secret"}
            />
            {integrationId && (
              <p className="text-xs text-slate-500">
                비워두면 기존 값이 유지됩니다
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="oauth2TokenEndpoint">Token Endpoint *</Label>
            <Input
              id="oauth2TokenEndpoint"
              value={oauth2TokenEndpoint}
              onChange={(e) => setOauth2TokenEndpoint(e.target.value)}
              placeholder="https://oauth.example.com/token"
            />
          </div>

          <div className="space-y-2">
            <Label>Scopes (선택)</Label>
            <div className="flex gap-2">
              <Input
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                placeholder="read:users"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddScope();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddScope}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {oauth2Scopes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {oauth2Scopes.map((scope) => (
                  <Badge key={scope} variant="secondary" className="flex items-center gap-1">
                    {scope}
                    <button
                      type="button"
                      onClick={() => handleRemoveScope(scope)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider Status */}
      {integrationId && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">AgentCore Provider 상태</Label>
            {getStatusBadge()}
          </div>

          {providerArn && (
            <div className="text-xs">
              <p className="text-slate-500">Provider ARN</p>
              <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1 break-all">
                {providerArn}
              </p>
            </div>
          )}

          {!providerArn && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateProvider}
              disabled={creating}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Provider 생성
            </Button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={loading || !isFormValid()}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {integrationId ? "수정" : "저장"}
        </Button>
      </div>
    </form>
  );
}
