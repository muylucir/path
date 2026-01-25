"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Trash2,
  Globe,
  Server,
  Zap,
  ChevronDown,
  ChevronUp,
  FileJson,
  Check,
  AlertCircle,
  Cloud,
  Database,
} from "lucide-react";
import type {
  GatewayIntegration,
  GatewayTarget,
  GatewayTargetType,
  OutboundAuthType,
  APIEndpoint,
  MCPTool,
  IntegrationListItem,
  ApiGatewayToolFilter,
  ApiGatewayToolOverride,
  MCPServerIntegration,
} from "@/lib/types";

// Outbound auth compatibility matrix per target type
const AUTH_COMPATIBILITY: Record<GatewayTargetType, OutboundAuthType[]> = {
  apiGateway: ['iam', 'api-key'],
  lambda: ['iam'],
  mcp: ['oauth'],
  api: ['oauth', 'api-key'],
  smithyModel: ['iam', 'oauth'],
};

// Auth type labels
const AUTH_TYPE_LABELS: Record<OutboundAuthType, string> = {
  'iam': 'IAM Role (GATEWAY_IAM_ROLE)',
  'api-key': 'API Key',
  'oauth': 'OAuth 2.0 (Client Credentials)',
};

interface GatewayIntegrationFormProps {
  integrationId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function GatewayIntegrationForm({
  integrationId,
  onSaved,
  onCancel,
}: GatewayIntegrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Gateway fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enableSemanticSearch, setEnableSemanticSearch] = useState(true);
  const [targets, setTargets] = useState<GatewayTarget[]>([]);
  const [gatewayId, setGatewayId] = useState<string | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<'creating' | 'ready' | 'failed' | null>(null);

  // Target editing state
  const [editingTargetIdx, setEditingTargetIdx] = useState<number | null>(null);
  const [showTargetForm, setShowTargetForm] = useState(false);

  // Target form state
  const [targetName, setTargetName] = useState("");
  const [targetType, setTargetType] = useState<GatewayTargetType>("api");
  const [targetDescription, setTargetDescription] = useState("");

  // Outbound Authentication state
  const [outboundAuthType, setOutboundAuthType] = useState<OutboundAuthType>("iam");
  const [targetCredentialId, setTargetCredentialId] = useState<string>("");
  const [oauthScopes, setOauthScopes] = useState<string[]>([]);
  const [newOauthScope, setNewOauthScope] = useState("");

  // API target state
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);

  // MCP target state
  const [mcpSourceType, setMcpSourceType] = useState<'manual' | 'registry'>('manual');
  const [selectedMcpServerId, setSelectedMcpServerId] = useState<string>("");
  const [mcpServerUrl, setMcpServerUrl] = useState("");
  const [mcpTransport, setMcpTransport] = useState<'stdio' | 'sse' | 'streamablehttp'>('sse');
  const [mcpCommand, setMcpCommand] = useState("");
  const [mcpArgs, setMcpArgs] = useState<string[]>([]);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [newMcpArg, setNewMcpArg] = useState("");

  // MCP Server Registry (for selection)
  const [mcpServers, setMcpServers] = useState<MCPServerIntegration[]>([]);

  // Zap target state
  const [lambdaArn, setZapArn] = useState("");

  // API Gateway target state
  const [apiGatewayRestApiId, setApiGatewayRestApiId] = useState("");
  const [apiGatewayStage, setApiGatewayStage] = useState("");
  const [apiGatewayToolFilters, setApiGatewayToolFilters] = useState<ApiGatewayToolFilter[]>([]);
  const [apiGatewayToolOverrides, setApiGatewayToolOverrides] = useState<ApiGatewayToolOverride[]>([]);
  const [newFilterPath, setNewFilterPath] = useState("");
  const [newFilterMethods, setNewFilterMethods] = useState<string[]>([]);

  // Smithy Model target state
  const [smithySourceType, setSmithySourceType] = useState<'s3' | 'inline'>('s3');
  const [smithyS3Uri, setSmithyS3Uri] = useState("");
  const [smithyS3BucketOwner, setSmithyS3BucketOwner] = useState("");
  const [smithyInlinePayload, setSmithyInlinePayload] = useState("");

  // Identity providers for dropdown (with status info from list endpoint)
  const [identityProviders, setIdentityProviders] = useState<IntegrationListItem[]>([]);

  // Fetch identity providers and MCP servers
  useEffect(() => {
    fetchIdentityProviders();
    fetchMcpServers();
  }, []);

  // Auto-select default auth type when target type changes
  useEffect(() => {
    const compatibleAuthTypes = AUTH_COMPATIBILITY[targetType];
    if (!compatibleAuthTypes.includes(outboundAuthType)) {
      // Current auth type is not compatible, switch to first compatible
      setOutboundAuthType(compatibleAuthTypes[0]);
      setTargetCredentialId("");
      setOauthScopes([]);
    }
  }, [targetType, outboundAuthType]);

  const fetchIdentityProviders = async () => {
    try {
      const response = await fetch("/api/integrations?type=identity");
      if (response.ok) {
        const data = await response.json();
        setIdentityProviders(data.integrations || []);
      }
    } catch (err) {
      console.error("Failed to fetch identity providers:", err);
    }
  };

  const fetchMcpServers = async () => {
    try {
      const response = await fetch("/api/mcp-servers");
      if (response.ok) {
        const data = await response.json();
        setMcpServers(data.servers || []);
      }
    } catch (err) {
      console.error("Failed to fetch MCP servers:", err);
    }
  };

  // Handle MCP server selection from registry
  const handleMcpServerSelect = (serverId: string) => {
    setSelectedMcpServerId(serverId);
    const server = mcpServers.find(s => s.id === serverId);
    if (server) {
      // Use deployment endpoint URL if available, otherwise use mcpConfig
      if (server.deployment?.endpointUrl) {
        setMcpServerUrl(server.deployment.endpointUrl);
        setMcpTransport('streamablehttp');
      } else if (server.mcpConfig) {
        setMcpCommand(server.mcpConfig.command || "");
        setMcpArgs(server.mcpConfig.args || []);
        setMcpTransport('stdio');
      }
      // Set target name from server name
      if (!targetName) {
        setTargetName(server.name);
      }
      // Set tools if available
      if (server.tools?.length) {
        setMcpTools(server.tools);
      }
    }
  };

  const fetchIntegration = useCallback(async () => {
    if (!integrationId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/integrations/${integrationId}?full=true`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const integration = data.integration as GatewayIntegration;

      setName(integration.name);
      setDescription(integration.description || "");
      setEnableSemanticSearch(integration.config.enableSemanticSearch);
      setTargets(integration.config.targets || []);
      setGatewayId(integration.config.gatewayId || null);
      setGatewayUrl(integration.config.gatewayUrl || null);
      setGatewayStatus(integration.config.gatewayStatus || null);
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

  // OpenAPI file upload
  const handleOpenApiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setTargetName(data.title || targetName);
      setTargetDescription(data.description || targetDescription);
      setApiBaseUrl(data.baseUrl || apiBaseUrl);
      setApiEndpoints(data.endpoints || []);
      setParseSuccess(true);
    } catch (err) {
      setParseError((err as Error).message);
    } finally {
      setParsing(false);
    }
  };

  // Reset target form
  const resetTargetForm = () => {
    setTargetName("");
    setTargetType("api");
    setTargetDescription("");
    // Outbound auth
    setOutboundAuthType("iam");
    setTargetCredentialId("");
    setOauthScopes([]);
    setNewOauthScope("");
    // API
    setApiBaseUrl("");
    setApiEndpoints([]);
    // MCP
    setMcpSourceType('manual');
    setSelectedMcpServerId("");
    setMcpServerUrl("");
    setMcpTransport("sse");
    setMcpCommand("");
    setMcpArgs([]);
    setMcpTools([]);
    setZapArn("");
    // API Gateway
    setApiGatewayRestApiId("");
    setApiGatewayStage("");
    setApiGatewayToolFilters([]);
    setApiGatewayToolOverrides([]);
    setNewFilterPath("");
    setNewFilterMethods([]);
    // Smithy Model
    setSmithySourceType('s3');
    setSmithyS3Uri("");
    setSmithyS3BucketOwner("");
    setSmithyInlinePayload("");
    setParseError(null);
    setParseSuccess(false);
  };

  // Open target form for new target
  const handleAddTarget = () => {
    resetTargetForm();
    setEditingTargetIdx(null);
    setShowTargetForm(true);
  };

  // Open target form for editing
  const handleEditTarget = (idx: number) => {
    const target = targets[idx];
    setTargetName(target.name);
    setTargetType(target.type);
    setTargetDescription(target.description || "");

    // Load outbound auth config
    if (target.outboundAuth) {
      setOutboundAuthType(target.outboundAuth.type);
      setTargetCredentialId(target.outboundAuth.credentialProviderId || "");
      setOauthScopes(target.outboundAuth.oauthScopes || []);
    } else if (target.credentialProviderId) {
      // Legacy: credentialProviderId without outboundAuth
      setOutboundAuthType("api-key"); // Assume API key for legacy
      setTargetCredentialId(target.credentialProviderId);
      setOauthScopes([]);
    } else {
      // Default to IAM
      setOutboundAuthType("iam");
      setTargetCredentialId("");
      setOauthScopes([]);
    }

    if (target.type === "api" && target.apiConfig) {
      setApiBaseUrl(target.apiConfig.baseUrl);
      setApiEndpoints(target.apiConfig.endpoints || []);
    } else if (target.type === "mcp" && target.mcpConfig) {
      setMcpServerUrl(target.mcpConfig.serverUrl);
      setMcpTransport(target.mcpConfig.transport);
      setMcpCommand(target.mcpConfig.command || "");
      setMcpArgs(target.mcpConfig.args || []);
      setMcpTools(target.mcpConfig.tools || []);
    } else if (target.type === "lambda" && target.lambdaConfig) {
      setZapArn(target.lambdaConfig.functionArn);
    } else if (target.type === "apiGateway" && target.apiGatewayConfig) {
      setApiGatewayRestApiId(target.apiGatewayConfig.restApiId);
      setApiGatewayStage(target.apiGatewayConfig.stage);
      setApiGatewayToolFilters(target.apiGatewayConfig.apiGatewayToolConfiguration.toolFilters || []);
      setApiGatewayToolOverrides(target.apiGatewayConfig.apiGatewayToolConfiguration.toolOverrides || []);
    } else if (target.type === "smithyModel" && target.smithyModelConfig) {
      if (target.smithyModelConfig.s3) {
        setSmithySourceType('s3');
        setSmithyS3Uri(target.smithyModelConfig.s3.uri);
        setSmithyS3BucketOwner(target.smithyModelConfig.s3.bucketOwnerAccountId || "");
      } else if (target.smithyModelConfig.inlinePayload) {
        setSmithySourceType('inline');
        setSmithyInlinePayload(target.smithyModelConfig.inlinePayload);
      }
    }

    setEditingTargetIdx(idx);
    setShowTargetForm(true);
  };

  // Save target (add or update)
  const handleSaveTarget = () => {
    if (!targetName.trim()) return;

    const newTarget: GatewayTarget = {
      id: editingTargetIdx !== null && targets[editingTargetIdx]
        ? targets[editingTargetIdx].id
        : `target-${Date.now()}`,
      name: targetName.trim(),
      type: targetType,
      description: targetDescription.trim() || undefined,
    };

    // Set outbound auth config
    if (outboundAuthType === 'iam') {
      newTarget.outboundAuth = { type: 'iam' };
    } else if (outboundAuthType === 'api-key' && targetCredentialId) {
      newTarget.outboundAuth = {
        type: 'api-key',
        credentialProviderId: targetCredentialId,
      };
      // Also set legacy field for backwards compatibility
      newTarget.credentialProviderId = targetCredentialId;
    } else if (outboundAuthType === 'oauth' && targetCredentialId) {
      newTarget.outboundAuth = {
        type: 'oauth',
        credentialProviderId: targetCredentialId,
        oauthScopes: oauthScopes.length > 0 ? oauthScopes : undefined,
      };
      // Also set legacy field for backwards compatibility
      newTarget.credentialProviderId = targetCredentialId;
    }

    if (targetType === "api") {
      newTarget.apiConfig = {
        baseUrl: apiBaseUrl,
        endpoints: apiEndpoints,
      };
    } else if (targetType === "mcp") {
      newTarget.mcpConfig = {
        serverUrl: mcpServerUrl,
        transport: mcpTransport,
        command: mcpCommand || undefined,
        args: mcpArgs.length > 0 ? mcpArgs : undefined,
        tools: mcpTools.length > 0 ? mcpTools : undefined,
      };
    } else if (targetType === "lambda") {
      newTarget.lambdaConfig = {
        functionArn: lambdaArn,
      };
    } else if (targetType === "apiGateway") {
      newTarget.apiGatewayConfig = {
        restApiId: apiGatewayRestApiId,
        stage: apiGatewayStage,
        apiGatewayToolConfiguration: {
          toolFilters: apiGatewayToolFilters,
          toolOverrides: apiGatewayToolOverrides.length > 0 ? apiGatewayToolOverrides : undefined,
        },
      };
    } else if (targetType === "smithyModel") {
      if (smithySourceType === 's3') {
        newTarget.smithyModelConfig = {
          s3: {
            uri: smithyS3Uri,
            bucketOwnerAccountId: smithyS3BucketOwner || undefined,
          },
        };
      } else {
        newTarget.smithyModelConfig = {
          inlinePayload: smithyInlinePayload,
        };
      }
    }

    if (editingTargetIdx !== null && editingTargetIdx < targets.length) {
      const updated = [...targets];
      updated[editingTargetIdx] = newTarget;
      setTargets(updated);
    } else {
      setTargets([...targets, newTarget]);
    }

    setShowTargetForm(false);
    resetTargetForm();
  };

  // Remove target
  const handleRemoveTarget = (idx: number) => {
    setTargets(targets.filter((_, i) => i !== idx));
  };

  // Add MCP argument
  const handleAddMcpArg = () => {
    if (newMcpArg.trim()) {
      setMcpArgs([...mcpArgs, newMcpArg.trim()]);
      setNewMcpArg("");
    }
  };

  // Submit form - 저장 + 자동 Gateway 생성 통합
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate credential providers before saving
    const invalidProviders: string[] = [];
    for (const target of targets) {
      const credProviderId = target.outboundAuth?.credentialProviderId || target.credentialProviderId;
      if (credProviderId) {
        const provider = identityProviders.find(p => p.id === credProviderId);
        if (provider && provider.providerStatus !== "active") {
          invalidProviders.push(`${target.name} → ${provider.name} (${provider.providerStatus || "미생성"})`);
        }
      }
    }

    if (invalidProviders.length > 0) {
      const confirmProceed = window.confirm(
        `다음 Target의 Credential Provider가 아직 AgentCore에 생성되지 않았습니다:\n\n${invalidProviders.join("\n")}\n\n` +
        "저장하시면 해당 Target은 IAM Role 인증으로 대체됩니다.\n계속하시겠습니까?"
      );
      if (!confirmProceed) {
        return;
      }
    }

    setLoading(true);

    try {
      // Step 1: DynamoDB에 저장
      const payload = {
        type: "gateway" as const,
        name,
        description,
        config: {
          enableSemanticSearch,
          targets,
          gatewayId,
          gatewayUrl,
          // Target이 있고 Gateway가 없으면 "creating" 상태로 시작
          gatewayStatus: targets.length > 0 && !gatewayId ? "creating" : gatewayStatus,
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
      const savedData = await response.json();
      const savedId = integrationId || savedData.id;

      // Step 2: Target이 있고 Gateway가 없으면 → 자동 생성
      if (targets.length > 0 && !gatewayId) {
        setCreating(true);
        setGatewayStatus("creating");

        try {
          const createResponse = await fetch(`/api/gateways/${savedId}/create`, {
            method: "POST",
          });

          if (createResponse.ok) {
            const gatewayData = await createResponse.json();
            setGatewayId(gatewayData.gatewayId);
            setGatewayUrl(gatewayData.gatewayUrl);
            setGatewayStatus("ready");
          } else {
            // 실패 시 status를 "failed"로 업데이트
            setGatewayStatus("failed");
            const errorData = await createResponse.json();
            console.error("Gateway creation failed:", errorData);
            alert(`Gateway 생성 실패: ${errorData.error || "알 수 없는 오류"}`);
          }
        } catch (gatewayErr) {
          setGatewayStatus("failed");
          console.error("Gateway creation error:", gatewayErr);
          alert("Gateway 생성 중 오류가 발생했습니다");
        } finally {
          setCreating(false);
        }
      }
      // Step 3: 기존 Gateway가 있으면 → 설정만 저장 (Target 동기화는 별도)

      onSaved();
    } catch (err) {
      console.error("Failed to save:", err);
      alert("저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // Create Gateway in AgentCore
  const handleCreateGateway = async () => {
    if (!integrationId) {
      alert("먼저 Gateway를 저장해주세요");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/gateways/${integrationId}/create`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to create gateway");
      const data = await response.json();

      setGatewayId(data.gatewayId);
      setGatewayUrl(data.gatewayUrl);
      setGatewayStatus("ready");

      // Refresh
      fetchIntegration();
    } catch (err) {
      console.error("Failed to create gateway:", err);
      setGatewayStatus("failed");
      alert("Gateway 생성에 실패했습니다");
    } finally {
      setCreating(false);
    }
  };

  const getTargetIcon = (type: GatewayTargetType) => {
    switch (type) {
      case "api": return <Globe className="w-4 h-4" />;
      case "mcp": return <Server className="w-4 h-4" />;
      case "lambda": return <Zap className="w-4 h-4" />;
      case "apiGateway": return <Cloud className="w-4 h-4" />;
      case "smithyModel": return <Database className="w-4 h-4" />;
    }
  };

  const getStatusBadge = () => {
    if (!gatewayStatus) return null;
    switch (gatewayStatus) {
      case "creating":
        return <Badge variant="outline" className="text-yellow-600">생성 중...</Badge>;
      case "ready":
        return <Badge variant="outline" className="text-green-600">Ready</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-red-600">실패</Badge>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Gateway 이름 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Default Gateway"
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
          placeholder="API, MCP 통합을 위한 기본 Gateway"
          rows={2}
        />
      </div>

      {/* Semantic Search Toggle */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <Label htmlFor="semanticSearch">Semantic Search</Label>
          <p className="text-xs text-slate-500">
            Agent가 도구를 자동으로 검색할 수 있습니다
          </p>
        </div>
        <Switch
          id="semanticSearch"
          checked={enableSemanticSearch}
          onCheckedChange={setEnableSemanticSearch}
        />
      </div>

      {/* Targets Section */}
      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Targets ({targets.length}개)</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddTarget}>
            <Plus className="w-4 h-4 mr-1" />
            Target 추가
          </Button>
        </div>

        {/* Target List */}
        {targets.length > 0 && (
          <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
            {targets.map((target, idx) => (
              <div
                key={target.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {getTargetIcon(target.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{target.name}</p>
                    <p className="text-xs text-slate-500">
                      {target.type === "api" && target.apiConfig?.baseUrl}
                      {target.type === "mcp" && target.mcpConfig?.serverUrl}
                      {target.type === "lambda" && target.lambdaConfig?.functionArn}
                      {target.type === "apiGateway" && target.apiGatewayConfig &&
                        `${target.apiGatewayConfig.restApiId}/${target.apiGatewayConfig.stage}`}
                      {target.type === "smithyModel" && target.smithyModelConfig && (
                        target.smithyModelConfig.s3?.uri || "Inline Smithy Model"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {target.type.toUpperCase()}
                  </Badge>
                  {/* Auth type badge */}
                  {target.outboundAuth?.type === 'iam' && (
                    <Badge variant="outline" className="text-xs text-blue-600">
                      IAM
                    </Badge>
                  )}
                  {target.outboundAuth?.type === 'api-key' && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      API Key
                    </Badge>
                  )}
                  {target.outboundAuth?.type === 'oauth' && (
                    <Badge variant="outline" className="text-xs text-purple-600">
                      OAuth
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTarget(idx)}
                  >
                    수정
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleRemoveTarget(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {targets.length === 0 && !showTargetForm && (
          <div className="text-center py-6 text-slate-400">
            <p className="text-sm">등록된 Target이 없습니다</p>
            <p className="text-xs">Target 추가 버튼을 눌러 API, MCP, Zap를 등록하세요</p>
          </div>
        )}

        {/* Target Form */}
        {showTargetForm && (
          <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {editingTargetIdx !== null ? "Target 수정" : "새 Target"}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTargetForm(false);
                  resetTargetForm();
                }}
              >
                취소
              </Button>
            </div>

            {/* Target Type */}
            <div className="space-y-2">
              <Label>Target 유형</Label>
              <Select
                value={targetType}
                onValueChange={(v) => setTargetType(v as GatewayTargetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" /> API (OpenAPI)
                    </div>
                  </SelectItem>
                  <SelectItem value="mcp">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" /> MCP Server
                    </div>
                  </SelectItem>
                  <SelectItem value="lambda">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Lambda
                    </div>
                  </SelectItem>
                  <SelectItem value="apiGateway">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4" /> API Gateway (REST API)
                    </div>
                  </SelectItem>
                  <SelectItem value="smithyModel">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" /> Smithy Model (AWS Service)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Name */}
            <div className="space-y-2">
              <Label>Target 이름 *</Label>
              <Input
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Weather API"
              />
            </div>

            {/* Target Description */}
            <div className="space-y-2">
              <Label>설명</Label>
              <Input
                value={targetDescription}
                onChange={(e) => setTargetDescription(e.target.value)}
                placeholder="날씨 정보 API"
              />
            </div>

            {/* API Target Config */}
            {targetType === "api" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Base URL *</Label>
                  <Input
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                  />
                </div>

                {/* OpenAPI Upload */}
                <div className="border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                    <FileJson className="w-4 h-4" />
                    <span>OpenAPI 스펙으로 가져오기</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleOpenApiUpload}
                      disabled={parsing}
                      className="flex-1 bg-white dark:bg-slate-900"
                    />
                    {parsing && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {parseSuccess && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                  {parseError && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {parseError}
                    </p>
                  )}
                </div>

                {/* Endpoints Preview */}
                {apiEndpoints.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                    <p className="text-xs text-slate-500">{apiEndpoints.length}개 엔드포인트</p>
                    {apiEndpoints.slice(0, 5).map((ep, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {ep.method}
                        </Badge>
                        <span className="font-mono truncate">{ep.path}</span>
                      </div>
                    ))}
                    {apiEndpoints.length > 5 && (
                      <p className="text-xs text-slate-400">... 외 {apiEndpoints.length - 5}개</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MCP Target Config */}
            {targetType === "mcp" && (
              <div className="space-y-3">
                {/* Source Type Selection */}
                <div className="space-y-2">
                  <Label>MCP 서버 소스</Label>
                  <Select
                    value={mcpSourceType}
                    onValueChange={(v) => {
                      setMcpSourceType(v as 'manual' | 'registry');
                      if (v === 'manual') {
                        setSelectedMcpServerId("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">직접 입력</SelectItem>
                      <SelectItem value="registry">MCP Registry에서 선택</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Registry Selection */}
                {mcpSourceType === 'registry' && (
                  <div className="space-y-2">
                    <Label>MCP Server 선택 *</Label>
                    <Select
                      value={selectedMcpServerId}
                      onValueChange={handleMcpServerSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="등록된 MCP 서버 선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mcpServers.length === 0 ? (
                          <div className="p-2 text-sm text-slate-500">
                            등록된 MCP 서버가 없습니다
                          </div>
                        ) : (
                          mcpServers.map((server) => (
                            <SelectItem key={server.id} value={server.id}>
                              <div className="flex items-center gap-2">
                                <span>{server.name}</span>
                                {server.deployment?.status === 'ready' ? (
                                  <Badge variant="outline" className="text-xs text-green-600">Ready</Badge>
                                ) : server.deployment?.status === 'deploying' ? (
                                  <Badge variant="outline" className="text-xs text-yellow-600">Deploying</Badge>
                                ) : server.source?.type === 'aws' ? (
                                  <Badge variant="outline" className="text-xs text-blue-600">AWS</Badge>
                                ) : server.source?.type === 'external' ? (
                                  <Badge variant="outline" className="text-xs text-purple-600">External</Badge>
                                ) : server.source?.type ? (
                                  <Badge variant="outline" className="text-xs">{server.source.type}</Badge>
                                ) : null}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Selected server info */}
                    {selectedMcpServerId && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-xs space-y-1">
                        {(() => {
                          const server = mcpServers.find(s => s.id === selectedMcpServerId);
                          if (!server) return null;
                          return (
                            <>
                              <p className="text-slate-500">{server.description}</p>
                              {server.deployment?.endpointUrl && (
                                <p className="font-mono text-green-600">
                                  URL: {server.deployment.endpointUrl}
                                </p>
                              )}
                              {server.tools && server.tools.length > 0 && (
                                <p className="text-slate-500">
                                  {server.tools.length}개 도구: {server.tools.slice(0, 3).map(t => t.name).join(', ')}
                                  {server.tools.length > 3 && ` 외 ${server.tools.length - 3}개`}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual URL Input */}
                {mcpSourceType === 'manual' && (
                  <div className="space-y-2">
                    <Label>서버 URL *</Label>
                    <Input
                      value={mcpServerUrl}
                      onChange={(e) => setMcpServerUrl(e.target.value)}
                      placeholder="http://localhost:3001/mcp"
                    />
                  </div>
                )}

                {/* Transport (shown for both modes but auto-set for registry) */}
                <div className="space-y-2">
                  <Label>Transport</Label>
                  <Select
                    value={mcpTransport}
                    onValueChange={(v) => setMcpTransport(v as typeof mcpTransport)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sse">SSE</SelectItem>
                      <SelectItem value="streamablehttp">Streamable HTTP</SelectItem>
                      <SelectItem value="stdio">STDIO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mcpTransport === "stdio" && (
                  <>
                    <div className="space-y-2">
                      <Label>Command</Label>
                      <Input
                        value={mcpCommand}
                        onChange={(e) => setMcpCommand(e.target.value)}
                        placeholder="npx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Arguments</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newMcpArg}
                          onChange={(e) => setNewMcpArg(e.target.value)}
                          placeholder="--arg=value"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddMcpArg();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={handleAddMcpArg}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {mcpArgs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mcpArgs.map((arg, idx) => (
                            <Badge key={idx} variant="secondary">
                              {arg}
                              <button
                                type="button"
                                onClick={() => setMcpArgs(mcpArgs.filter((_, i) => i !== idx))}
                                className="ml-1"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Tools preview */}
                {mcpTools.length > 0 && (
                  <div className="border rounded p-2 space-y-1">
                    <p className="text-xs text-slate-500 font-medium">
                      {mcpTools.length}개 도구 로드됨
                    </p>
                    <div className="max-h-24 overflow-y-auto">
                      {mcpTools.map((tool, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-2">
                          <span className="font-mono text-blue-600">{tool.name}</span>
                          <span className="text-slate-400 truncate">{tool.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lambda Target Config */}
            {targetType === "lambda" && (
              <div className="space-y-2">
                <Label>Lambda ARN *</Label>
                <Input
                  value={lambdaArn}
                  onChange={(e) => setZapArn(e.target.value)}
                  placeholder="arn:aws:lambda:us-west-2:123456789012:function:my-function"
                />
              </div>
            )}

            {/* API Gateway Target Config */}
            {targetType === "apiGateway" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>REST API ID *</Label>
                  <Input
                    value={apiGatewayRestApiId}
                    onChange={(e) => setApiGatewayRestApiId(e.target.value)}
                    placeholder="abc123xyz"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stage *</Label>
                  <Input
                    value={apiGatewayStage}
                    onChange={(e) => setApiGatewayStage(e.target.value)}
                    placeholder="prod"
                  />
                </div>

                {/* Tool Filters */}
                <div className="space-y-2">
                  <Label>Tool Filters</Label>
                  <p className="text-xs text-slate-500">
                    API 경로와 메서드를 필터링하여 도구로 노출합니다
                  </p>

                  <div className="flex gap-2">
                    <Input
                      value={newFilterPath}
                      onChange={(e) => setNewFilterPath(e.target.value)}
                      placeholder="/pets/* 또는 /pets/{petId}"
                      className="flex-1"
                    />
                    <Select
                      value={newFilterMethods.join(",")}
                      onValueChange={(v) => setNewFilterMethods(v ? v.split(",") : [])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="GET,POST">GET, POST</SelectItem>
                        <SelectItem value="GET,POST,PUT,DELETE">ALL</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newFilterPath.trim() && newFilterMethods.length > 0) {
                          setApiGatewayToolFilters([
                            ...apiGatewayToolFilters,
                            {
                              filterPath: newFilterPath.trim(),
                              methods: newFilterMethods as ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[],
                            },
                          ]);
                          setNewFilterPath("");
                          setNewFilterMethods([]);
                        }
                      }}
                      disabled={!newFilterPath.trim() || newFilterMethods.length === 0}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Filter List */}
                  {apiGatewayToolFilters.length > 0 && (
                    <div className="border rounded p-2 space-y-1 max-h-32 overflow-y-auto">
                      {apiGatewayToolFilters.map((filter, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{filter.filterPath}</span>
                            <Badge variant="outline" className="text-xs">
                              {filter.methods.join(", ")}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setApiGatewayToolFilters(
                              apiGatewayToolFilters.filter((_, i) => i !== idx)
                            )}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tool Overrides (Advanced) */}
                <details className="border rounded-lg p-3">
                  <summary className="text-sm cursor-pointer">
                    Tool Overrides (고급)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-slate-500">
                      특정 API 엔드포인트에 대해 커스텀 도구 이름과 설명을 지정합니다
                    </p>
                    {apiGatewayToolOverrides.map((override, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-slate-100 dark:bg-slate-800 rounded">
                        <span className="font-mono">{override.method} {override.path}</span>
                        <span className="text-slate-500">→</span>
                        <span>{override.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-auto"
                          onClick={() => setApiGatewayToolOverrides(
                            apiGatewayToolOverrides.filter((_, i) => i !== idx)
                          )}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setApiGatewayToolOverrides([
                        ...apiGatewayToolOverrides,
                        { path: "/pets/{petId}", method: "GET", name: "get_pet" },
                      ])}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Override 추가
                    </Button>
                  </div>
                </details>
              </div>
            )}

            {/* Smithy Model Target Config */}
            {targetType === "smithyModel" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>소스 유형</Label>
                  <Select
                    value={smithySourceType}
                    onValueChange={(v) => setSmithySourceType(v as 's3' | 'inline')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s3">S3 URI</SelectItem>
                      <SelectItem value="inline">Inline Payload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {smithySourceType === 's3' && (
                  <>
                    <div className="space-y-2">
                      <Label>S3 URI *</Label>
                      <Input
                        value={smithyS3Uri}
                        onChange={(e) => setSmithyS3Uri(e.target.value)}
                        placeholder="s3://my-bucket/models/weather-service.json"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bucket Owner Account ID (선택)</Label>
                      <Input
                        value={smithyS3BucketOwner}
                        onChange={(e) => setSmithyS3BucketOwner(e.target.value)}
                        placeholder="123456789012"
                      />
                    </div>
                  </>
                )}

                {smithySourceType === 'inline' && (
                  <div className="space-y-2">
                    <Label>Smithy Model JSON *</Label>
                    <Textarea
                      value={smithyInlinePayload}
                      onChange={(e) => setSmithyInlinePayload(e.target.value)}
                      placeholder={`{
  "smithy": "2.0",
  "shapes": {
    "example#WeatherService": {
      "type": "service"
    }
  }
}`}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Outbound Authentication */}
            <div className="space-y-3 border rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/50">
              <Label className="text-sm font-medium">Outbound 인증</Label>
              <p className="text-xs text-slate-500">
                외부 서비스 호출 시 사용할 인증 방식
              </p>

              {/* Auth Type Selection */}
              <div className="space-y-2">
                <Label className="text-xs">인증 유형</Label>
                <Select
                  value={outboundAuthType}
                  onValueChange={(v) => {
                    setOutboundAuthType(v as OutboundAuthType);
                    // Reset credential provider when switching to IAM
                    if (v === 'iam') {
                      setTargetCredentialId("");
                      setOauthScopes([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTH_COMPATIBILITY[targetType].map((authType) => (
                      <SelectItem key={authType} value={authType}>
                        {AUTH_TYPE_LABELS[authType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  {targetType === 'lambda' && "Lambda Target은 IAM Role만 지원합니다"}
                  {targetType === 'mcp' && "MCP Server Target은 OAuth만 지원합니다"}
                  {targetType === 'apiGateway' && "API Gateway Target은 IAM과 API Key를 지원합니다"}
                  {targetType === 'api' && "OpenAPI Target은 OAuth와 API Key를 지원합니다"}
                  {targetType === 'smithyModel' && "Smithy Model Target은 IAM과 OAuth를 지원합니다"}
                </p>
              </div>

              {/* Credential Provider Selection (for api-key and oauth) */}
              {(outboundAuthType === 'api-key' || outboundAuthType === 'oauth') && (
                <div className="space-y-2">
                  <Label className="text-xs">Credential Provider *</Label>
                  <Select
                    value={targetCredentialId}
                    onValueChange={setTargetCredentialId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Provider 선택..." />
                    </SelectTrigger>
                    <SelectContent>
                      {identityProviders
                        .filter((provider) => {
                          // Filter providers by matching auth type
                          if (outboundAuthType === 'api-key') {
                            return provider.providerType === 'api-key';
                          } else if (outboundAuthType === 'oauth') {
                            return provider.providerType === 'oauth2';
                          }
                          return true;
                        })
                        .map((provider) => {
                          const isActive = provider.providerStatus === "active";
                          const isCreating = provider.providerStatus === "creating";
                          return (
                            <SelectItem
                              key={provider.id}
                              value={provider.id}
                              disabled={!isActive}
                            >
                              <div className="flex items-center gap-2">
                                <span>{provider.name}</span>
                                {isActive ? (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    Ready
                                  </Badge>
                                ) : isCreating ? (
                                  <Badge variant="outline" className="text-xs text-yellow-600">
                                    생성 중
                                  </Badge>
                                ) : provider.providerStatus === "failed" ? (
                                  <Badge variant="outline" className="text-xs text-red-600">
                                    실패
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-slate-500">
                                    미생성
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      {identityProviders.filter((p) =>
                        outboundAuthType === 'api-key'
                          ? p.providerType === 'api-key'
                          : p.providerType === 'oauth2'
                      ).length === 0 && (
                        <div className="p-2 text-sm text-slate-500">
                          {outboundAuthType === 'api-key'
                            ? "등록된 API Key Provider가 없습니다"
                            : "등록된 OAuth Provider가 없습니다"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {targetCredentialId && (() => {
                    const selectedProvider = identityProviders.find(p => p.id === targetCredentialId);
                    if (selectedProvider && selectedProvider.providerStatus !== "active") {
                      return (
                        <p className="text-xs text-yellow-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          선택한 Provider가 아직 AgentCore에 생성되지 않았습니다.
                          Settings &gt; Identity에서 먼저 생성해주세요.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* OAuth Scopes (for oauth type) */}
              {outboundAuthType === 'oauth' && (
                <div className="space-y-2">
                  <Label className="text-xs">OAuth Scopes (선택)</Label>
                  <p className="text-xs text-slate-400">
                    Provider에 설정된 기본 scope 외에 추가로 요청할 scope
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newOauthScope}
                      onChange={(e) => setNewOauthScope(e.target.value)}
                      placeholder="read:data"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newOauthScope.trim() && !oauthScopes.includes(newOauthScope.trim())) {
                            setOauthScopes([...oauthScopes, newOauthScope.trim()]);
                            setNewOauthScope("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newOauthScope.trim() && !oauthScopes.includes(newOauthScope.trim())) {
                          setOauthScopes([...oauthScopes, newOauthScope.trim()]);
                          setNewOauthScope("");
                        }
                      }}
                      disabled={!newOauthScope.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {oauthScopes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {oauthScopes.map((scope, idx) => (
                        <Badge key={idx} variant="secondary">
                          {scope}
                          <button
                            type="button"
                            onClick={() => setOauthScopes(oauthScopes.filter((_, i) => i !== idx))}
                            className="ml-1"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* IAM Role info */}
              {outboundAuthType === 'iam' && (
                <p className="text-xs text-slate-500 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                  Gateway의 IAM Role을 사용하여 인증합니다.
                  AWS 서비스(Lambda, API Gateway, Smithy Model)에 적합합니다.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSaveTarget}
                disabled={!targetName.trim()}
              >
                {editingTargetIdx !== null ? "수정" : "추가"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Gateway Status */}
      {(integrationId || gatewayStatus) && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">AgentCore Gateway 상태</Label>
            {getStatusBadge()}
          </div>

          {gatewayUrl && (
            <div className="text-xs">
              <p className="text-slate-500">Gateway URL</p>
              <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1 break-all">
                {gatewayUrl}
              </p>
            </div>
          )}

          {/* 실패 시에만 재시도 버튼 표시 */}
          {gatewayStatus === "failed" && integrationId && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateGateway}
              disabled={creating || targets.length === 0}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <AlertCircle className="w-4 h-4 mr-2" />
              Gateway 재시도
            </Button>
          )}

          {/* 생성 중 상태 표시 */}
          {gatewayStatus === "creating" && (
            <div className="flex items-center text-sm text-yellow-600">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gateway를 생성하고 있습니다...
            </div>
          )}

          {/* Gateway 없이 Target만 있는 경우 안내 */}
          {!gatewayId && !gatewayStatus && targets.length > 0 && (
            <p className="text-xs text-slate-500">
              저장 시 Gateway가 자동으로 생성됩니다
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={loading || creating || !name}>
          {(loading || creating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {creating
            ? "Gateway 생성 중..."
            : targets.length > 0 && !gatewayId
              ? "저장 및 Gateway 생성"
              : integrationId
                ? "수정"
                : "저장"
          }
        </Button>
      </div>
    </form>
  );
}
