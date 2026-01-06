"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, type FormValues } from "@/lib/schema";
import {
  INPUT_TYPES,
  PROCESS_STEPS,
  OUTPUT_TYPES,
  HUMAN_LOOP_OPTIONS,
  ERROR_TOLERANCE_OPTIONS,
  DATA_SOURCE_TYPES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Plus,
  Trash2,
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
} from "lucide-react";
import type { DataSource } from "@/lib/types";
import { IntegrationPicker } from "./IntegrationPicker";
import { Badge } from "@/components/ui/badge";

interface Step1FormProps {
  onSubmit: (data: FormValues) => void;
}

export function Step1Form({ onSubmit }: Step1FormProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    { type: "", description: "" },
  ]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [integrationData, setIntegrationData] = useState<Record<string, {
    name: string;
    type: string;
    description?: string;
    config?: Record<string, unknown>;
  }>>({});

  const typeIcons: Record<string, typeof Globe> = {
    api: Globe,
    mcp: Server,
    rag: Database,
    s3: HardDrive,
  };

  // 통합 타입별 요약 생성
  const getIntegrationSummary = (type: string, name: string, config?: Record<string, unknown>): string => {
    if (!config) return `[${type.toUpperCase()}] ${name}`;

    switch (type) {
      case 'api': {
        const baseUrl = config.baseUrl as string || '';
        const endpoints = (config.endpoints as unknown[]) || [];
        return `[API] ${name}: ${baseUrl} - ${endpoints.length}개 엔드포인트`;
      }
      case 'mcp': {
        const tools = (config.tools as { name: string }[]) || [];
        const toolNames = tools.slice(0, 3).map(t => t.name).join(', ');
        const suffix = tools.length > 3 ? ` 외 ${tools.length - 3}개` : '';
        return `[MCP] ${name}: ${tools.length}개 도구 (${toolNames}${suffix})`;
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
      dataSources: [{ type: "", description: "" }],
      errorTolerance: "",
      additionalContext: "",
      useAgentCore: true,  // AgentCore 고정
      selectedIntegrations: [],
    },
  });

  // Fetch integration data when selection changes (full data for Claude analysis)
  const fetchIntegrationData = async (ids: string[]) => {
    const data: Record<string, { name: string; type: string; description?: string; config?: Record<string, unknown> }> = {};
    for (const id of ids) {
      if (!integrationData[id]) {
        try {
          // full=true로 config 포함된 전체 데이터 가져오기
          const response = await fetch(`/api/integrations/${id}?full=true`);
          if (response.ok) {
            const result = await response.json();
            const integration = result.integration;
            data[id] = {
              name: integration?.name || id,
              type: integration?.type || "api",
              description: integration?.description,
              config: integration?.config,
            };
          }
        } catch {
          data[id] = { name: id, type: "api" };
        }
      } else {
        data[id] = integrationData[id];
      }
    }
    setIntegrationData((prev) => ({ ...prev, ...data }));
  };

  const handleIntegrationChange = (ids: string[]) => {
    setSelectedIntegrations(ids);
    setValue("selectedIntegrations", ids);
    fetchIntegrationData(ids);
  };

  const removeIntegration = (id: string) => {
    const updated = selectedIntegrations.filter((i) => i !== id);
    setSelectedIntegrations(updated);
    setValue("selectedIntegrations", updated);
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

  const handleDataSourcesChange = (sources: DataSource[]) => {
    setDataSources(sources);
    setValue("dataSources", sources);
  };

  const addDataSource = () => {
    handleDataSourcesChange([...dataSources, { type: "", description: "" }]);
  };

  const removeDataSource = (index: number) => {
    handleDataSourcesChange(dataSources.filter((_, i) => i !== index));
  };

  const updateDataSource = (index: number, field: keyof DataSource, value: string) => {
    const updated = dataSources.map((source, i) =>
      i === index ? { ...source, [field]: value } : source
    );
    handleDataSourcesChange(updated);
  };

  const handleFormSubmit = (data: FormValues) => {
    // 통합 상세 정보 생성 (Claude 분석에 사용)
    const integrationDetails = selectedIntegrations.map((id) => {
      const info = integrationData[id];
      return {
        id,
        type: info?.type || 'api',
        name: info?.name || id,
        description: info?.description,
        summary: getIntegrationSummary(info?.type || 'api', info?.name || id, info?.config),
      };
    });

    onSubmit({ ...data, dataSources, selectedIntegrations, integrationDetails });
  };

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

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Sliders className="h-5 w-5 text-primary" />
            추가 설정
          </CardTitle>
          <CardDescription>데이터 소스, Human-in-Loop, 오류 허용도를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Sources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                데이터 소스
              </Label>
              <IntegrationPicker
                selectedIds={selectedIntegrations}
                onSelectionChange={handleIntegrationChange}
              />
            </div>

            {/* Selected Integrations */}
            {selectedIntegrations.length > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">선택된 통합:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedIntegrations.map((id) => {
                    const info = integrationData[id];
                    const Icon = info?.type ? typeIcons[info.type] : Globe;
                    return (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1.5">
                        {Icon && <Icon className="w-3 h-3" />}
                        {info?.name || id.slice(0, 8)}
                        <button
                          type="button"
                          onClick={() => removeIntegration(id)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {dataSources.map((source, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  value={source.type}
                  onValueChange={(value) => updateDataSource(index, "type", value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="소스 타입" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={source.description}
                  onChange={(e) => updateDataSource(index, "description", e.target.value)}
                  placeholder="예: Gmail API, DynamoDB users 테이블"
                  className="flex-1"
                />

                {dataSources.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDataSource(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDataSource}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              데이터 소스 추가
            </Button>
            {errors.dataSources && (
              <p className="text-sm text-red-500">{errors.dataSources.message}</p>
            )}
          </div>

          <Separator />

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
