"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, type FormValues } from "@/lib/schema";
import {
  INPUT_TYPES,
  PROCESS_STEPS,
  OUTPUT_TYPES,
  HUMAN_LOOP_OPTIONS,
  ERROR_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Download,
  Settings,
  Upload,
  Database,
  Users,
  AlertCircle,
  FileText,
  MessageCircleQuestion,
  Sliders,
  X,
  Globe,
  Server,
  HardDrive,
  Zap,
  Network,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { GatewayIntegration, GatewayTarget, IntegrationDetail, MCPServerIntegration } from "@/lib/types";
import { IntegrationPicker } from "./IntegrationPicker";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Step1FormProps {
  onSubmit: (data: FormValues) => void;
}

export function Step1Form({ onSubmit }: Step1FormProps) {
  // 카테고리별 선택
  const [selectedGateways, setSelectedGateways] = useState<string[]>([]);
  const [selectedRAGs, setSelectedRAGs] = useState<string[]>([]);
  const [selectedS3s, setSelectedS3s] = useState<string[]>([]);
  const [selectedMCPServers, setSelectedMCPServers] = useState<string[]>([]);
  const [additionalSources, setAdditionalSources] = useState("");

  // Gateway 상세 정보 (Target 목록 표시용)
  const [gatewayData, setGatewayData] = useState<Record<string, GatewayIntegration>>({});
  // MCP Server 상세 정보 (배포 상태 표시용)
  const [mcpServerData, setMCPServerData] = useState<Record<string, MCPServerIntegration>>({});
  // 모든 통합 상세 정보
  const [integrationData, setIntegrationData] = useState<Record<string, {
    name: string;
    type: string;
    description?: string;
    config?: Record<string, unknown>;
  }>>({});
  // Gateway 확장/축소 상태
  const [expandedGateways, setExpandedGateways] = useState<Set<string>>(new Set());

  const typeIcons: Record<string, typeof Globe> = {
    gateway: Network,
    api: Globe,
    mcp: Server,
    lambda: Zap,
    rag: Database,
    s3: HardDrive,
    'mcp-server': Server,
  };

  // 통합 타입별 요약 생성
  const getIntegrationSummary = (type: string, name: string, config?: Record<string, unknown>): string => {
    if (!config) return `[${type.toUpperCase()}] ${name}`;

    switch (type) {
      case 'gateway': {
        const targets = (config.targets as GatewayTarget[]) || [];
        const apiCount = targets.filter(t => t.type === 'api').length;
        const mcpCount = targets.filter(t => t.type === 'mcp').length;
        const lambdaCount = targets.filter(t => t.type === 'lambda').length;
        const parts = [];
        if (apiCount > 0) parts.push(`API ${apiCount}`);
        if (mcpCount > 0) parts.push(`MCP ${mcpCount}`);
        if (lambdaCount > 0) parts.push(`Lambda ${lambdaCount}`);
        return `[Gateway] ${name}: ${parts.join(', ') || '타겟 없음'}`;
      }
      case 'rag': {
        const provider = config.provider as string || '';
        const bedrockKb = config.bedrockKb as { knowledgeBaseId?: string } | undefined;
        const pinecone = config.pinecone as { indexName?: string } | undefined;
        const opensearch = config.opensearch as { indexName?: string } | undefined;
        const indexId = bedrockKb?.knowledgeBaseId || pinecone?.indexName || opensearch?.indexName || '';
        return `[RAG] ${name}: ${provider} - ${indexId}`;
      }
      case 's3': {
        const bucketName = config.bucketName as string || '';
        const accessType = config.accessType as string || '';
        return `[S3] ${name}: s3://${bucketName} (${accessType})`;
      }
      case 'mcp-server': {
        const source = config.source as { type?: string } | undefined;
        const sourceType = source?.type || 'external';
        const deployment = config.deployment as { status?: string; endpointUrl?: string } | undefined;
        const tools = config.tools as Array<{ name?: string }> | undefined;
        const toolCount = tools?.length || 0;
        if (sourceType === 'self-hosted' && deployment?.status === 'ready') {
          return `[MCP Server - deployed] ${name}: ${deployment.endpointUrl || 'endpoint'} (${toolCount} tools)`;
        }
        return `[MCP Server - ${sourceType}] ${name}: ${toolCount} tools`;
      }
      default:
        return `[${type.toUpperCase()}] ${name}`;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      painPoint: "",
      inputType: "",
      processSteps: [],
      outputTypes: [],
      humanLoop: "",
      errorTolerance: "",
      additionalContext: "",
      useAgentCore: true,
      selectedGateways: [],
      selectedRAGs: [],
      selectedS3s: [],
      selectedMCPServers: [],
      additionalSources: "",
    },
  });

  // 통합 상세 정보 가져오기
  const fetchIntegrationDetails = async (ids: string[], type: string) => {
    for (const id of ids) {
      if (!integrationData[id]) {
        try {
          const response = await fetch(`/api/integrations/${id}?full=true`);
          if (response.ok) {
            const result = await response.json();
            const integration = result.integration;
            setIntegrationData((prev) => ({
              ...prev,
              [id]: {
                name: integration?.name || id,
                type: integration?.type || type,
                description: integration?.description,
                config: integration?.config,
              },
            }));
            // Gateway인 경우 별도 저장
            if (integration?.type === 'gateway') {
              setGatewayData((prev) => ({
                ...prev,
                [id]: integration as GatewayIntegration,
              }));
              // 자동 확장
              setExpandedGateways((prev) => new Set([...prev, id]));
            }
            // MCP Server인 경우 별도 저장
            if (integration?.type === 'mcp-server') {
              setMCPServerData((prev) => ({
                ...prev,
                [id]: integration as MCPServerIntegration,
              }));
            }
          }
        } catch {
          setIntegrationData((prev) => ({
            ...prev,
            [id]: { name: id, type },
          }));
        }
      }
    }
  };

  // Gateway 선택 변경
  const handleGatewayChange = (ids: string[]) => {
    setSelectedGateways(ids);
    setValue("selectedGateways", ids);
    fetchIntegrationDetails(ids, "gateway");
  };

  // RAG 선택 변경
  const handleRAGChange = (ids: string[]) => {
    setSelectedRAGs(ids);
    setValue("selectedRAGs", ids);
    fetchIntegrationDetails(ids, "rag");
  };

  // S3 선택 변경
  const handleS3Change = (ids: string[]) => {
    setSelectedS3s(ids);
    setValue("selectedS3s", ids);
    fetchIntegrationDetails(ids, "s3");
  };

  // MCP Server 선택 변경
  const handleMCPServerChange = (ids: string[]) => {
    setSelectedMCPServers(ids);
    setValue("selectedMCPServers", ids);
    fetchIntegrationDetails(ids, "mcp-server");
  };

  // 통합 제거
  const removeIntegration = (id: string, type: string) => {
    if (type === 'gateway') {
      const updated = selectedGateways.filter((i) => i !== id);
      setSelectedGateways(updated);
      setValue("selectedGateways", updated);
    } else if (type === 'rag') {
      const updated = selectedRAGs.filter((i) => i !== id);
      setSelectedRAGs(updated);
      setValue("selectedRAGs", updated);
    } else if (type === 's3') {
      const updated = selectedS3s.filter((i) => i !== id);
      setSelectedS3s(updated);
      setValue("selectedS3s", updated);
    } else if (type === 'mcp-server') {
      const updated = selectedMCPServers.filter((i) => i !== id);
      setSelectedMCPServers(updated);
      setValue("selectedMCPServers", updated);
    }
  };

  // Gateway 확장/축소 토글
  const toggleGatewayExpand = (id: string) => {
    setExpandedGateways((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const processSteps = watch("processSteps");
  const outputTypes = watch("outputTypes");

  const toggleProcessStep = (step: string) => {
    const current = processSteps || [];
    const updated = current.includes(step)
      ? current.filter((s) => s !== step)
      : [...current, step];
    setValue("processSteps", updated);
  };

  const toggleOutputType = (type: string) => {
    const current = outputTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setValue("outputTypes", updated);
  };

  // additionalSources 업데이트
  useEffect(() => {
    setValue("additionalSources", additionalSources);
  }, [additionalSources, setValue]);

  // Gateway Target 아이콘
  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'api': return Globe;
      case 'mcp': return Server;
      case 'lambda': return Zap;
      default: return Globe;
    }
  };

  // Target 도구 목록 문자열
  const getTargetTools = (target: GatewayTarget): string => {
    if (target.type === 'api' && target.apiConfig?.endpoints) {
      const methods = target.apiConfig.endpoints.slice(0, 3).map(e => `${e.method} ${e.path}`);
      const suffix = target.apiConfig.endpoints.length > 3 ? ` 외 ${target.apiConfig.endpoints.length - 3}개` : '';
      return methods.join(', ') + suffix;
    }
    if (target.type === 'mcp' && target.mcpConfig?.tools) {
      const names = target.mcpConfig.tools.slice(0, 3).map(t => t.name);
      const suffix = target.mcpConfig.tools.length > 3 ? ` 외 ${target.mcpConfig.tools.length - 3}개` : '';
      return names.join(', ') + suffix;
    }
    if (target.type === 'lambda') {
      return target.lambdaConfig?.functionArn?.split(':').pop() || 'Lambda Function';
    }
    return '';
  };

  const handleFormSubmit = (data: FormValues) => {
    // 모든 선택된 통합의 상세 정보 생성
    const allSelectedIds = [...selectedGateways, ...selectedRAGs, ...selectedS3s, ...selectedMCPServers];
    const integrationDetails: IntegrationDetail[] = allSelectedIds.map((id) => {
      const info = integrationData[id];
      // MCP Server인 경우 추가 정보 포함
      let config = info?.config;
      if (info?.type === 'mcp-server') {
        const mcpServer = mcpServerData[id];
        if (mcpServer) {
          config = {
            ...config,
            source: mcpServer.source,
            mcpConfig: mcpServer.mcpConfig,
            tools: mcpServer.tools,
            deployment: mcpServer.deployment,
          };
        }
      }
      return {
        id,
        type: info?.type || 'gateway',
        name: info?.name || id,
        description: info?.description,
        summary: getIntegrationSummary(info?.type || 'gateway', info?.name || id, config),
        config,
      };
    });

    onSubmit({
      ...data,
      selectedGateways,
      selectedRAGs,
      selectedS3s,
      selectedMCPServers,
      integrationDetails,
      additionalSources,
    });
  };

  // 에러 메시지 (최소 하나의 통합 필요)
  const hasDataSource = selectedGateways.length > 0 || selectedRAGs.length > 0 ||
                        selectedS3s.length > 0 || selectedMCPServers.length > 0 || additionalSources.trim().length > 0;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Pain Point */}
      <Card>
        <CardHeader>
          <CardTitle>
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
            해결하고 싶은 문제
          </CardTitle>
          <CardDescription>
            AI Agent로 자동화하고 싶은 Pain Point를 구체적으로 작성하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="예: 하루 100건 고객 이메일 답변에 2시간 소요"
            className="min-h-[120px] text-base"
            {...register("painPoint")}
          />
          {errors.painPoint && (
            <p className="text-sm text-red-500 mt-2">{errors.painPoint.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Core Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Settings className="h-5 w-5 text-primary" />
            핵심 설정
          </CardTitle>
          <CardDescription>INPUT, PROCESS, OUTPUT을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            {/* INPUT */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Download className="h-5 w-5" />
                INPUT: 언제 실행되나요?
              </Label>
              <Select onValueChange={(value) => setValue("inputType", value)}>
                <SelectTrigger className="h-11 w-100">
                  <SelectValue placeholder="트리거 타입을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.inputType && (
                <p className="text-sm text-red-500">{errors.inputType.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* PROCESS & OUTPUT */}
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6">
            {/* PROCESS */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                PROCESS: 어떤 작업이 필요한가요?
              </Label>
              <p className="text-sm text-muted-foreground">복수 선택 가능</p>
              <div className="space-y-2">
                {PROCESS_STEPS.map((step) => (
                  <div
                    key={step}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={step}
                      checked={processSteps?.includes(step)}
                      onCheckedChange={() => toggleProcessStep(step)}
                      className="mt-0.5"
                    />
                    <label htmlFor={step} className="text-sm cursor-pointer flex-1">
                      {step}
                    </label>
                  </div>
                ))}
              </div>
              {errors.processSteps && (
                <p className="text-sm text-red-500">{errors.processSteps.message}</p>
              )}
            </div>

            <Separator orientation="vertical" className="hidden md:block h-auto" />

            {/* OUTPUT */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                OUTPUT: 최종 결과물은?
              </Label>
              <p className="text-sm text-muted-foreground">복수 선택 가능</p>
              <div className="space-y-2">
                {OUTPUT_TYPES.map((type) => (
                  <div
                    key={type}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={`output-${type}`}
                      checked={outputTypes?.includes(type)}
                      onCheckedChange={() => toggleOutputType(type)}
                      className="mt-0.5"
                    />
                    <label htmlFor={`output-${type}`} className="text-sm cursor-pointer flex-1">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
              {errors.outputTypes && (
                <p className="text-sm text-red-500">{errors.outputTypes.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources & Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Database className="h-5 w-5 text-primary" />
            데이터 소스 및 통합 설정
          </CardTitle>
          <CardDescription>
            Agent가 사용할 데이터소스와 통합을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gateway Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                Gateway (API, MCP, Lambda)
              </Label>
              <IntegrationPicker
                selectedIds={selectedGateways}
                onSelectionChange={handleGatewayChange}
                filterType="gateway"
              />
            </div>

            {/* Selected Gateways with Target Details */}
            {selectedGateways.length > 0 ? (
              <div className="space-y-2">
                {selectedGateways.map((id) => {
                  const gateway = gatewayData[id];
                  const info = integrationData[id];
                  const isExpanded = expandedGateways.has(id);
                  const targets = gateway?.config?.targets || [];

                  return (
                    <Collapsible
                      key={id}
                      open={isExpanded}
                      onOpenChange={() => toggleGatewayExpand(id)}
                    >
                      <div className="border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 p-3 text-left hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded-t-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-blue-600" />
                            )}
                            <Network className="w-4 h-4 text-blue-600" />
                            <span className="font-medium flex-1">{info?.name || id.slice(0, 8)}</span>
                            <Badge variant="secondary" className="text-xs">
                              {targets.length} 타겟
                            </Badge>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeIntegration(id, 'gateway');
                              }}
                              className="ml-2 text-slate-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-3 pb-3 space-y-1.5">
                            {targets.map((target) => {
                              const Icon = getTargetIcon(target.type);
                              const tools = getTargetTools(target);
                              return (
                                <div
                                  key={target.id}
                                  className="flex items-start gap-2 pl-6 py-1.5 text-sm text-slate-600 dark:text-slate-400"
                                >
                                  <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">{target.name}</span>
                                    <span className="text-xs text-slate-400 ml-2">
                                      ({target.type.toUpperCase()})
                                    </span>
                                    {tools && (
                                      <p className="text-xs text-slate-500 truncate mt-0.5">
                                        {tools}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {targets.length === 0 && (
                              <p className="text-sm text-slate-500 pl-6">
                                등록된 타겟이 없습니다
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-1">
                선택된 Gateway가 없습니다
              </p>
            )}
          </div>

          <Separator />

          {/* RAG Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                RAG / Knowledge Base
              </Label>
              <IntegrationPicker
                selectedIds={selectedRAGs}
                onSelectionChange={handleRAGChange}
                filterType="rag"
              />
            </div>

            {selectedRAGs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedRAGs.map((id) => {
                  const info = integrationData[id];
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      <Database className="w-3 h-3" />
                      {info?.name || id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() => removeIntegration(id, 'rag')}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-1">
                선택된 RAG가 없습니다
              </p>
            )}
          </div>

          <Separator />

          {/* S3 Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-orange-600" />
                S3 저장소
              </Label>
              <IntegrationPicker
                selectedIds={selectedS3s}
                onSelectionChange={handleS3Change}
                filterType="s3"
              />
            </div>

            {selectedS3s.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedS3s.map((id) => {
                  const info = integrationData[id];
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="flex items-center gap-1.5 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                    >
                      <HardDrive className="w-3 h-3" />
                      {info?.name || id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() => removeIntegration(id, 's3')}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-1">
                선택된 S3 저장소가 없습니다
              </p>
            )}
          </div>

          <Separator />

          {/* MCP Server Selection - Self-hosted only (AgentCore deployable) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Server className="h-5 w-5 text-violet-600" />
                  Self-hosted MCP (커스텀 코드)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  AgentCore Runtime에 배포 가능한 MCP만 표시됩니다
                </p>
              </div>
              <IntegrationPicker
                selectedIds={selectedMCPServers}
                onSelectionChange={handleMCPServerChange}
                filterType="mcp-server"
                filterDeployableOnly
              />
            </div>

            {selectedMCPServers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMCPServers.map((id) => {
                  const info = integrationData[id];
                  const mcpServer = mcpServerData[id];
                  const sourceType = mcpServer?.source?.type || 'external';
                  const deploymentStatus = mcpServer?.deployment?.status;
                  const isDeployed = sourceType === 'self-hosted' && deploymentStatus === 'ready';
                  const isPending = sourceType === 'self-hosted' && deploymentStatus !== 'ready';
                  // AWS 역할 정보 추출
                  const awsRole = mcpServer?.mcpConfig?.env?.AWS_MCP_ROLE;
                  const awsRoleLabels: Record<string, string> = {
                    'solutions-architect': 'Architect',
                    'software-developer': 'Developer',
                    'devops-engineer': 'DevOps',
                    'data-engineer': 'Data',
                    'security-engineer': 'Security',
                  };

                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className={`flex items-center gap-1.5 ${
                        isPending
                          ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                          : sourceType === 'aws'
                          ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                          : "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                      }`}
                    >
                      <Server className="w-3 h-3" />
                      {info?.name || id.slice(0, 8)}
                      {sourceType === 'aws' && awsRole && (
                        <span className="text-xs text-orange-600 font-medium">
                          [{awsRoleLabels[awsRole] || awsRole}]
                        </span>
                      )}
                      {isDeployed && (
                        <span className="text-xs text-green-600">(Ready)</span>
                      )}
                      {isPending && (
                        <span className="text-xs text-yellow-600">(배포 필요)</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeIntegration(id, 'mcp-server')}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <div className="pl-1">
                <p className="text-sm text-muted-foreground">
                  선택된 Self-hosted MCP가 없습니다
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  외부 MCP 서버(uvx, npx)는 Gateway 타겟으로 추가하세요
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Data Sources */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              추가 데이터 소스 (선택)
            </Label>
            <Textarea
              placeholder="예: PostgreSQL 데이터베이스 연결, 외부 웹사이트 스크래핑, 실시간 센서 데이터 등"
              className="min-h-[80px]"
              value={additionalSources}
              onChange={(e) => setAdditionalSources(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              위에서 선택할 수 없는 추가 데이터소스가 있다면 자유롭게 입력하세요
            </p>
          </div>

          {/* Validation Error */}
          {errors.selectedGateways && (
            <p className="text-sm text-red-500">{errors.selectedGateways.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Sliders className="h-5 w-5 text-primary" />
            추가 설정
          </CardTitle>
          <CardDescription>Human-in-Loop, 오류 허용도를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Human-in-Loop & Error Tolerance */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Human-in-Loop
              </Label>
              <Select onValueChange={(value) => setValue("humanLoop", value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="사람 개입 시점" />
                </SelectTrigger>
                <SelectContent className="w-[400px]">
                  {HUMAN_LOOP_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.humanLoop && (
                <p className="text-sm text-red-500">{errors.humanLoop.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                오류 허용도
              </Label>
              <Select onValueChange={(value) => setValue("errorTolerance", value)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="오류 허용도" />
                </SelectTrigger>
                <SelectContent className="w-[400px]">
                  {ERROR_TOLERANCE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.errorTolerance && (
                <p className="text-sm text-red-500">{errors.errorTolerance.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional: Additional Context */}
      <Card>
        <CardHeader>
          <CardTitle>
            <FileText className="h-5 w-5 text-primary" />
            추가 정보
          </CardTitle>
          <CardDescription>선택사항: 추가로 알려주고 싶은 내용이 있다면 작성하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="예: 과거 데이터 1000건 있음, 법무팀 검토 필수, 실시간 처리 필요 등"
            className="min-h-[100px]"
            {...register("additionalContext")}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          size="lg"
          className="w-full max-w-md gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300"
        >
          <Sparkles className="h-5 w-5" />
          Claude 분석 시작
        </Button>
      </div>
    </form>
  );
}
