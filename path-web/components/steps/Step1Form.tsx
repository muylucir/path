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
import Container from "@cloudscape-design/components/container";
import Checkbox from "@cloudscape-design/components/checkbox";
import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Textarea from "@cloudscape-design/components/textarea";
import Select from "@cloudscape-design/components/select";
import Tiles from "@cloudscape-design/components/tiles";
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

      {/* Trigger Type */}
      <Container header={<Header variant="h2" description="Agent가 언제 실행되나요?">실행 조건</Header>}>
        <Controller
          name="inputType"
          control={control}
          render={({ field }) => (
            <div className="full-width-control">
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
            </div>
          )}
        />
      </Container>

      {/* Process Steps - checkbox card grid */}
      <Container header={<Header variant="h2" description="Agent가 수행할 작업을 선택하세요 (복수 선택)">수행 작업</Header>}>
        <div className="full-width-control">
          <FormField errorText={errors.processSteps?.message}>
            <div className="checkbox-card-grid cols-3">
              {PROCESS_STEPS.map((s) => {
                const checked = watchedProcessSteps.includes(s.label);
                return (
                  <label key={s.label} className={`checkbox-card ${checked ? "checked" : ""}`}>
                    <Checkbox
                      checked={checked}
                      onChange={({ detail }) => {
                        const next = detail.checked
                          ? [...watchedProcessSteps, s.label]
                          : watchedProcessSteps.filter((v: string) => v !== s.label);
                        setValue("processSteps", next, { shouldValidate: true });
                      }}
                    >
                      <span className="checkbox-card-label">{s.label}</span>
                    </Checkbox>
                    <Box variant="small" color="text-body-secondary" padding={{ left: "xxl" }}>{s.example}</Box>
                  </label>
                );
              })}
            </div>
          </FormField>
        </div>
      </Container>

      {/* Output Types - checkbox card grid */}
      <Container header={<Header variant="h2" description="Agent가 만들어낼 최종 결과물을 선택하세요 (복수 선택)">산출물</Header>}>
        <div className="full-width-control">
          <FormField errorText={errors.outputTypes?.message}>
            <div className="checkbox-card-grid cols-2">
              {OUTPUT_TYPES.map((t) => {
                const checked = watchedOutputTypes.includes(t.label);
                return (
                  <label key={t.label} className={`checkbox-card ${checked ? "checked" : ""}`}>
                    <Checkbox
                      checked={checked}
                      onChange={({ detail }) => {
                        const next = detail.checked
                          ? [...watchedOutputTypes, t.label]
                          : watchedOutputTypes.filter((v: string) => v !== t.label);
                        setValue("outputTypes", next, { shouldValidate: true });
                      }}
                    >
                      <span className="checkbox-card-label">{t.label}</span>
                    </Checkbox>
                    <Box variant="small" color="text-body-secondary" padding={{ left: "xxl" }}>{t.example}</Box>
                  </label>
                );
              })}
            </div>
          </FormField>
        </div>
      </Container>

      {/* Data Sources */}
      <Container header={<Header variant="h2" description="Agent가 접근하거나 활용할 외부 시스템, API, 데이터베이스 등을 설명하세요">Agent가 활용할 리소스 (선택)</Header>}>
        <Controller
          name="additionalSources"
          control={control}
          render={({ field }) => (
            <div className="full-width-control">
              <FormField
                label="데이터 소스 (선택)"
                description="데이터베이스, API, MCP 서버, 클라우드 서비스 등 Agent가 사용할 리소스를 자유롭게 입력하세요"
              >
                <Textarea
                  value={field.value || ""}
                  onChange={({ detail }) => field.onChange(detail.value)}
                  placeholder="예: PostgreSQL 고객 DB, Slack API로 알림 전송, S3 버킷에서 문서 조회, Bedrock Knowledge Base 검색 등"
                  rows={4}
                />
              </FormField>
            </div>
          )}
        />
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
                <Tiles
                  value={field.value || null}
                  onChange={({ detail }) => field.onChange(detail.value)}
                  columns={1}
                  items={HUMAN_LOOP_OPTIONS.map((o) => ({
                    value: o.label,
                    label: o.label,
                    description: o.example,
                  }))}
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
                <Tiles
                  value={field.value || null}
                  onChange={({ detail }) => field.onChange(detail.value)}
                  columns={1}
                  items={ERROR_TOLERANCE_OPTIONS.map((o) => ({
                    value: o.label,
                    label: o.label,
                    description: o.example,
                  }))}
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
