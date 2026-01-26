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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Sparkles,
  Play,
  Cog,
  PackageOpen,
  Database,
  Users,
  AlertCircle,
  FileText,
  MessageCircleQuestion,
  Sliders,
} from "lucide-react";

interface Step1FormProps {
  onSubmit: (data: FormValues) => void;
}

export function Step1Form({ onSubmit }: Step1FormProps) {
  const [additionalSources, setAdditionalSources] = useState("");
  const [selectedProcessSteps, setSelectedProcessSteps] = useState<string[]>([]);
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
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
      additionalSources: "",
    },
  });

  // Sync local state to form for validation (without using watch to avoid infinite loop)
  useEffect(() => {
    setValue("processSteps", selectedProcessSteps);
  }, [selectedProcessSteps, setValue]);

  useEffect(() => {
    setValue("outputTypes", selectedOutputTypes);
  }, [selectedOutputTypes, setValue]);

  const toggleProcessStep = (label: string) => {
    setSelectedProcessSteps((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : [...prev, label]
    );
  };

  const toggleOutputType = (label: string) => {
    setSelectedOutputTypes((prev) =>
      prev.includes(label)
        ? prev.filter((t) => t !== label)
        : [...prev, label]
    );
  };

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      processSteps: selectedProcessSteps,
      outputTypes: selectedOutputTypes,
      additionalSources,
    });
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

      {/* Trigger Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Play className="h-5 w-5 text-primary" />
            실행 조건
          </CardTitle>
          <CardDescription>Agent가 언제 실행되나요?</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            {...register("inputType")}
            className="h-11 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">트리거 타입을 선택하세요</option>
            {INPUT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.inputType && (
            <p className="text-sm text-red-500 mt-2">{errors.inputType.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Agent Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Cog className="h-5 w-5 text-primary" />
            Agent 동작 정의
          </CardTitle>
          <CardDescription>Agent가 수행할 작업과 산출물을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6">
            {/* PROCESS */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Cog className="h-5 w-5" />
                수행 작업
              </Label>
              <p className="text-sm text-muted-foreground">Agent가 하는 일 (복수 선택)</p>
              <div className="space-y-2">
                {PROCESS_STEPS.map((step) => (
                  <Tooltip key={step.label}>
                    <TooltipTrigger asChild>
                      <label
                        className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedProcessSteps.includes(step.label)
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-accent/50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProcessSteps.includes(step.label)}
                          onChange={() => toggleProcessStep(step.label)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm flex-1">{step.label}</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>{step.example}</p>
                    </TooltipContent>
                  </Tooltip>
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
                <PackageOpen className="h-5 w-5" />
                산출물
              </Label>
              <p className="text-sm text-muted-foreground">최종 결과물 (복수 선택)</p>
              <div className="space-y-2">
                {OUTPUT_TYPES.map((type) => (
                  <Tooltip key={type.label}>
                    <TooltipTrigger asChild>
                      <label
                        className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedOutputTypes.includes(type.label)
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-accent/50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOutputTypes.includes(type.label)}
                          onChange={() => toggleOutputType(type.label)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm flex-1">{type.label}</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>{type.example}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              {errors.outputTypes && (
                <p className="text-sm text-red-500">{errors.outputTypes.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Resources */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Database className="h-5 w-5 text-primary" />
            Agent가 활용할 리소스 (선택)
          </CardTitle>
          <CardDescription>
            Agent가 접근하거나 활용할 외부 시스템, API, 데이터베이스 등을 설명하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="예: PostgreSQL 고객 DB, Slack API로 알림 전송, S3 버킷에서 문서 조회, Bedrock Knowledge Base 검색 등"
            className="min-h-[100px]"
            value={additionalSources}
            onChange={(e) => setAdditionalSources(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-2">
            데이터베이스, API, MCP 서버, 클라우드 서비스 등 Agent가 사용할 리소스를 자유롭게 입력하세요
          </p>
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
              <select
                {...register("humanLoop")}
                className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">사람 개입 시점</option>
                {HUMAN_LOOP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.humanLoop && (
                <p className="text-sm text-red-500">{errors.humanLoop.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                오류 허용도
              </Label>
              <select
                {...register("errorTolerance")}
                className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">오류 허용도</option>
                {ERROR_TOLERANCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
          분석 시작
        </Button>
      </div>
    </form>
  );
}
