"use client";

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
import { Input } from "@/components/ui/input";
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
import { ChevronDown, Info } from "lucide-react";

interface Step1FormProps {
  onSubmit: (data: FormValues) => void;
}

export function Step1Form({ onSubmit }: Step1FormProps) {
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
      outputType: "",
      humanLoop: "",
      dataSource: "",
      errorTolerance: "",
      additionalContext: "",
    },
  });

  const processSteps = watch("processSteps");

  const toggleProcessStep = (step: string) => {
    const current = processSteps || [];
    const updated = current.includes(step)
      ? current.filter((s) => s !== step)
      : [...current, step];
    setValue("processSteps", updated);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* INPUT Type */}
            <div className="space-y-2">
              <Label htmlFor="inputType">
                INPUT: 언제 실행되나요? <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("inputType", value)}>
                <SelectTrigger>
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

            {/* OUTPUT Type */}
            <div className="space-y-2">
              <Label htmlFor="outputType">
                OUTPUT: 최종 결과물은? <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("outputType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.outputType && (
                <p className="text-sm text-red-500">{errors.outputType.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* PROCESS Steps */}
            <div className="space-y-2">
              <Label>
                PROCESS: 어떤 작업이 필요한가요? (복수선택 가능) <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2 border rounded-md p-4">
                {PROCESS_STEPS.map((step) => (
                  <div key={step} className="flex items-start space-x-2">
                    <Checkbox
                      id={step}
                      checked={processSteps?.includes(step)}
                      onCheckedChange={() => toggleProcessStep(step)}
                    />
                    <label
                      htmlFor={step}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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

            {/* Human-in-Loop */}
            <div className="space-y-2">
              <Label htmlFor="humanLoop">
                HUMAN-IN-LOOP: 사람 개입 시점은? <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("humanLoop", value)}>
                <SelectTrigger>
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Data Source */}
            <div className="space-y-2">
              <Label htmlFor="dataSource">데이터는 어디서 가져오나요?</Label>
              <Input
                id="dataSource"
                placeholder="예: MCP 서버, Gmail API, S3, DynamoDB, 웹 스크래핑"
                {...register("dataSource")}
              />
            </div>

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
          </div>

          {/* Additional Context */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
              📝 추가 정보 (선택사항)
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Textarea
                placeholder="예: 과거 데이터 1000건 있음, 법무팀 검토 필수, 실시간 처리 필요 등"
                className="min-h-[80px]"
                {...register("additionalContext")}
              />
            </CollapsibleContent>
          </Collapsible>

          <Button type="submit" size="lg" className="w-full">
            🤖 Claude 분석 시작
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
