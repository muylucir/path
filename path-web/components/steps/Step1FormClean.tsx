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
  FileText
} from "lucide-react";
import type { DataSource } from "@/lib/types";

interface Step1FormCleanProps {
  onSubmit: (data: FormValues) => void;
}

export function Step1FormClean({ onSubmit }: Step1FormCleanProps) {
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
    onSubmit({ ...data, dataSources });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-4xl mx-auto">
      {/* Pain Point */}
      <Card>
        <CardHeader>
          <CardTitle>해결하고 싶은 문제</CardTitle>
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
          <CardTitle>핵심 설정</CardTitle>
          <CardDescription>INPUT, PROCESS, OUTPUT을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* INPUT */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Download className="h-5 w-5" />
              INPUT: 언제 실행되나요?
            </Label>
            <Select onValueChange={(value) => setValue("inputType", value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="트리거 타입을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="w-[400px]">
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

          <Separator />

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

          <Separator />

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
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>추가 설정</CardTitle>
          <CardDescription>데이터 소스, Human-in-Loop, 오류 허용도를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Sources */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터 소스
            </Label>
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
        <Button type="submit" size="lg" className="w-full max-w-md gap-2">
          <Sparkles className="h-5 w-5" />
          Claude 분석 시작
        </Button>
      </div>
    </form>
  );
}
