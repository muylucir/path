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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataSourceInput } from "./DataSourceInput";
import { ChevronDown, Info } from "lucide-react";
import type { DataSource } from "@/lib/types";

interface Step1FormProps {
  onSubmit: (data: FormValues) => void;
}

export function Step1Form({ onSubmit }: Step1FormProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    { type: "", description: "" },
  ]);

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
    },
  });

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

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({ ...data, dataSources });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            1️⃣ 기본 정보 입력
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            핵심 정보만 입력하세요. Claude가 나머지를 분석합니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">💡 이 단계에서는:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>AI Agent로 해결하고 싶은 문제를 입력합니다</li>
                  <li>INPUT (트리거), PROCESS (작업), OUTPUT (결과물), Human-in-Loop을 선택합니다</li>
                  <li>입력한 정보를 바탕으로 Claude가 상세 분석을 진행합니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pain Point */}
          <div className="space-y-2">
            <Label htmlFor="painPoint">
              해결하고 싶은 문제 (Pain Point) <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="painPoint"
              placeholder="예: 하루 100건 고객 이메일 답변에 2시간 소요"
              className="min-h-[100px]"
              {...register("painPoint")}
            />
            {errors.painPoint && (
              <p className="text-sm text-red-500">{errors.painPoint.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              구체적으로 작성할수록 정확한 분석이 가능합니다
            </p>
          </div>

          {/* INPUT Type */}
          <div className="space-y-2">
            <Label htmlFor="inputType">
              INPUT: 언제 실행되나요? <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => setValue("inputType", value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="선택하세요" />
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

          {/* PROCESS Steps */}
          <div className="space-y-2">
            <Label>
              PROCESS: 어떤 작업이 필요한가요? (복수선택 가능) <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-muted/30">
              {PROCESS_STEPS.map((step) => (
                <div key={step} className="flex items-start space-x-3 p-2 rounded hover:bg-accent/50">
                  <Checkbox
                    id={step}
                    checked={processSteps?.includes(step)}
                    onCheckedChange={() => toggleProcessStep(step)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={step}
                    className="text-sm leading-tight cursor-pointer flex-1"
                  >
                    {step}
                  </label>
                </div>
              ))}
            </div>
            {errors.processSteps && (
              <p className="text-sm text-red-500">{errors.processSteps.message}</p>
            )}
          </div>

          {/* OUTPUT Types */}
          <div className="space-y-2">
            <Label>
              OUTPUT: 최종 결과물은? (복수선택 가능) <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-muted/30">
              {OUTPUT_TYPES.map((type) => (
                <div key={type} className="flex items-start space-x-3 p-2 rounded hover:bg-accent/50">
                  <Checkbox
                    id={`output-${type}`}
                    checked={outputTypes?.includes(type)}
                    onCheckedChange={() => toggleOutputType(type)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`output-${type}`}
                    className="text-sm leading-tight cursor-pointer flex-1"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
            {errors.outputTypes && (
              <p className="text-sm text-red-500">{errors.outputTypes.message}</p>
            )}
          </div>

          {/* Human-in-Loop */}
          <div className="space-y-2">
            <Label htmlFor="humanLoop">
              HUMAN-IN-LOOP: 사람 개입 시점은? <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => setValue("humanLoop", value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
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

          {/* Data Sources */}
          <DataSourceInput
            dataSources={dataSources}
            onChange={handleDataSourcesChange}
            error={errors.dataSources?.message}
          />

          {/* Error Tolerance */}
          <div className="space-y-2">
            <Label htmlFor="errorTolerance">
              오류 허용도는? <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={(value) => setValue("errorTolerance", value)}>
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
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

          {/* Additional Context */}
          <div className="space-y-2">
            <Label htmlFor="additionalContext">📝 추가 정보 (선택사항)</Label>
            <Textarea
              id="additionalContext"
              placeholder="예: 과거 데이터 1000건 있음, 법무팀 검토 필수, 실시간 처리 필요 등"
              className="min-h-[80px]"
              {...register("additionalContext")}
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            🤖 Claude 분석 시작
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
