"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, type FormValues } from "@/lib/schema";
import {
  INPUT_TYPES,
  PROCESS_STEPS,
  OUTPUT_TYPES,
  HUMAN_LOOP_OPTIONS,
  ERROR_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { GlossaryTerm } from "@/components/cloudscape/GlossaryTerm";
import { SelectableTiles } from "@/components/cloudscape/SelectableTiles";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Textarea from "@cloudscape-design/components/textarea";
import Select from "@cloudscape-design/components/select";
import ColumnLayout from "@cloudscape-design/components/column-layout";

interface Step1FormProps {
  onSubmit: (data: FormValues) => void;
  initialData?: FormValues;
  submitRef?: React.MutableRefObject<(() => void) | null>;
}

export function Step1Form({ onSubmit, initialData, submitRef }: Step1FormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
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
      additionalSources: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Expose form submit trigger to parent
  useEffect(() => {
    if (submitRef) {
      submitRef.current = handleSubmit(onSubmit);
    }
  }, [submitRef, handleSubmit, onSubmit]);

  const watchedProcessSteps = watch("processSteps") || [];
  const watchedOutputTypes = watch("outputTypes") || [];

  const processStepTiles = PROCESS_STEPS.map((s) => ({
    value: s.label,
    label: s.label,
    description: s.example,
  }));
  const outputTypeTiles = OUTPUT_TYPES.map((t) => ({
    value: t.label,
    label: t.label,
    description: t.example,
  }));
  const humanLoopTiles = HUMAN_LOOP_OPTIONS.map((o) => ({
    value: o.label,
    label: o.label,
    description: o.example,
  }));
  const errorToleranceTiles = ERROR_TOLERANCE_OPTIONS.map((o) => ({
    value: o.label,
    label: o.label,
    description: o.example,
  }));

  return (
    <SpaceBetween size="l">
      {/* Pain Point - full width */}
      <Container header={<Header variant="h2" description="AI Agent로 자동화하고 싶은 Pain Point를 구체적으로 작성하세요">해결하고 싶은 문제</Header>}>
        <Controller
          name="painPoint"
          control={control}
          render={({ field }) => (
            <div className="full-width-control">
              <FormField
                label={<span>Pain Point <GlossaryTerm glossaryKey="painPoint" /></span>}
                description="현재 상황, 문제점, 소요 시간/비용, 관련 이해관계자를 포함하면 더 정확한 분석이 가능합니다."
                constraintText="필수, 최소 10자"
                errorText={errors.painPoint?.message}
              >
                <Textarea
                  value={field.value}
                  onChange={({ detail }) => field.onChange(detail.value)}
                  placeholder="예: 채용팀 3명이 월 150건 이력서를 수동 검토하며, 1건당 20분 소요. 담당자마다 평가 기준이 달라 일관성이 떨어지고, 우수 후보자가 경쟁사로 이탈하는 경우가 월 5건 이상 발생"
                  rows={5}
                />
              </FormField>
            </div>
          )}
        />
      </Container>

      {/* Trigger + Data Sources - side by side */}
      <Container header={<Header variant="h2" description="Agent의 실행 조건과 활용할 리소스를 설정하세요">실행 환경</Header>}>
        <ColumnLayout columns={2}>
          <Controller
            name="inputType"
            control={control}
            render={({ field }) => (
              <FormField
                label={<span>트리거 타입 <GlossaryTerm glossaryKey="triggerType" /></span>}
                errorText={errors.inputType?.message}
              >
                <Select
                  selectedOption={field.value ? { label: field.value, value: field.value } : null}
                  onChange={({ detail }) => field.onChange(detail.selectedOption.value || "")}
                  options={INPUT_TYPES.map((type) => ({ label: type, value: type }))}
                  placeholder="트리거 타입을 선택하세요"
                />
              </FormField>
            )}
          />
          <Controller
            name="additionalSources"
            control={control}
            render={({ field }) => (
              <FormField
                label="데이터 소스 (선택)"
                description="DB, API, MCP 서버 등"
              >
                <Textarea
                  value={field.value || ""}
                  onChange={({ detail }) => field.onChange(detail.value)}
                  placeholder="예: PostgreSQL 고객 DB, Slack API, S3 버킷, Bedrock KB 등"
                  rows={3}
                />
              </FormField>
            )}
          />
        </ColumnLayout>
      </Container>

      {/* Process Steps - 3 columns */}
      <Container header={<Header variant="h2" description="Agent가 수행할 작업을 선택하세요 (복수 선택)">수행 작업</Header>}>
        <div className="full-width-control">
          <FormField errorText={errors.processSteps?.message}>
            <SelectableTiles
              items={processStepTiles}
              selectedValues={watchedProcessSteps}
              onChange={(values) => setValue("processSteps", values, { shouldValidate: true })}
              selectionType="multi"
              columns={3}
            />
          </FormField>
        </div>
      </Container>

      {/* Output Types - 2 columns */}
      <Container header={<Header variant="h2" description="Agent가 만들어낼 최종 결과물을 선택하세요 (복수 선택)">산출물</Header>}>
        <div className="full-width-control">
          <FormField errorText={errors.outputTypes?.message}>
            <SelectableTiles
              items={outputTypeTiles}
              selectedValues={watchedOutputTypes}
              onChange={(values) => setValue("outputTypes", values, { shouldValidate: true })}
              selectionType="multi"
              columns={2}
            />
          </FormField>
        </div>
      </Container>

      {/* Human-in-Loop + Error Tolerance - side by side */}
      <Container header={<Header variant="h2" description="사람 개입 수준과 오류 허용도를 설정하세요">운영 정책</Header>}>
        <ColumnLayout columns={2}>
          <Controller
            name="humanLoop"
            control={control}
            render={({ field }) => (
              <FormField
                label={<span>Human-in-Loop <GlossaryTerm glossaryKey="humanInLoop" /></span>}
                errorText={errors.humanLoop?.message}
              >
                <SelectableTiles
                  items={humanLoopTiles}
                  selectedValues={field.value ? [field.value] : []}
                  onChange={(values) => field.onChange(values[0] ?? "")}
                  selectionType="single"
                  columns={1}
                />
              </FormField>
            )}
          />
          <Controller
            name="errorTolerance"
            control={control}
            render={({ field }) => (
              <FormField
                label={<span>오류 허용도 <GlossaryTerm glossaryKey="errorTolerance" /></span>}
                errorText={errors.errorTolerance?.message}
              >
                <SelectableTiles
                  items={errorToleranceTiles}
                  selectedValues={field.value ? [field.value] : []}
                  onChange={(values) => field.onChange(values[0] ?? "")}
                  selectionType="single"
                  columns={1}
                />
              </FormField>
            )}
          />
        </ColumnLayout>
      </Container>

      {/* Additional Context - full width */}
      <Container header={<Header variant="h2" description="선택사항: 추가로 알려주고 싶은 내용이 있다면 작성하세요">추가 정보</Header>}>
        <Controller
          name="additionalContext"
          control={control}
          render={({ field }) => (
            <div className="full-width-control">
              <FormField label="추가 컨텍스트 (선택)">
                <Textarea
                  value={field.value || ""}
                  onChange={({ detail }) => field.onChange(detail.value)}
                  placeholder="예: 과거 데이터 1000건 있음, 법무팀 검토 필수, 실시간 처리 필요 등"
                  rows={4}
                />
              </FormField>
            </div>
          )}
        />
      </Container>
    </SpaceBetween>
  );
}
