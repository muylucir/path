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
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Textarea from "@cloudscape-design/components/textarea";
import Select from "@cloudscape-design/components/select";
import Cards from "@cloudscape-design/components/cards";
import Box from "@cloudscape-design/components/box";

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

  // Expose form submit trigger to parent (Wizard)
  useEffect(() => {
    if (submitRef) {
      submitRef.current = handleSubmit(onSubmit);
    }
  }, [submitRef, handleSubmit, onSubmit]);

  const watchedProcessSteps = watch("processSteps") || [];
  const watchedOutputTypes = watch("outputTypes") || [];

  const processStepItems = PROCESS_STEPS.map((s) => ({ label: s.label, example: s.example }));
  const outputTypeItems = OUTPUT_TYPES.map((t) => ({ label: t.label, example: t.example }));
  const humanLoopItems = HUMAN_LOOP_OPTIONS.map((o) => ({ label: o.label, example: o.example }));
  const errorToleranceItems = ERROR_TOLERANCE_OPTIONS.map((o) => ({ label: o.label, example: o.example }));

  return (
    <div style={{ maxWidth: "80%" }}>
    <SpaceBetween size="l">
      {/* Pain Point */}
      <Container header={<Header variant="h2" description="AI Agent로 자동화하고 싶은 Pain Point를 구체적으로 작성하세요">해결하고 싶은 문제</Header>}>
            <Controller
              name="painPoint"
              control={control}
              render={({ field }) => (
                <div className="full-width-control">
                  <FormField
                    label="Pain Point"
                    errorText={errors.painPoint?.message}
                  >
                    <Textarea
                      value={field.value}
                      onChange={({ detail }) => field.onChange(detail.value)}
                      placeholder="예: 하루 100건 고객 이메일 답변에 2시간 소요"
                      rows={5}
                    />
                  </FormField>
                </div>
              )}
            />
          </Container>

          {/* Trigger Settings */}
          <Container header={<Header variant="h2" description="Agent가 언제 실행되나요?">실행 조건</Header>}>
            <Controller
              name="inputType"
              control={control}
              render={({ field }) => (
                <div className="full-width-control">
                  <FormField
                    label="트리거 타입"
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

          {/* Agent Behavior - Process Steps & Output Types */}
          <Container header={<Header variant="h2" description="Agent가 수행할 작업과 산출물을 선택하세요">Agent 동작 정의</Header>}>
            <SpaceBetween size="l">
              {/* Process Steps */}
              <div className="full-width-control">
                <FormField
                  label="수행 작업"
                  description="Agent가 하는 일 (복수 선택)"
                  errorText={errors.processSteps?.message}
                >
                  <div className="equal-height-cards">
                    <Cards
                      selectionType="multi"
                      selectedItems={processStepItems.filter((s) => watchedProcessSteps.includes(s.label))}
                      onSelectionChange={({ detail }) =>
                        setValue("processSteps", detail.selectedItems.map((i) => i.label), { shouldValidate: true })
                      }
                      trackBy="label"
                      cardDefinition={{
                        header: (item) => item.label,
                        sections: [
                          {
                            id: "example",
                            content: (item) => (
                              <Box color="text-body-secondary" variant="small">{item.example}</Box>
                            ),
                          },
                        ],
                      }}
                      items={processStepItems}
                      cardsPerRow={[{ cards: 2 }]}
                    />
                  </div>
                </FormField>
              </div>

              {/* Output Types */}
              <div className="full-width-control">
                <FormField
                  label="산출물"
                  description="최종 결과물 (복수 선택)"
                  errorText={errors.outputTypes?.message}
                >
                  <div className="equal-height-cards">
                    <Cards
                      selectionType="multi"
                      selectedItems={outputTypeItems.filter((t) => watchedOutputTypes.includes(t.label))}
                      onSelectionChange={({ detail }) =>
                        setValue("outputTypes", detail.selectedItems.map((i) => i.label), { shouldValidate: true })
                      }
                      trackBy="label"
                      cardDefinition={{
                        header: (item) => item.label,
                        sections: [
                          {
                            id: "example",
                            content: (item) => (
                              <Box color="text-body-secondary" variant="small">{item.example}</Box>
                            ),
                          },
                        ],
                      }}
                      items={outputTypeItems}
                      cardsPerRow={[{ cards: 2 }]}
                    />
                  </div>
                </FormField>
              </div>
            </SpaceBetween>
          </Container>

          {/* Agent Resources */}
          <Container header={<Header variant="h2" description="Agent가 접근하거나 활용할 외부 시스템, API, 데이터베이스 등을 설명하세요">Agent가 활용할 리소스 (선택)</Header>}>
            <Controller
              name="additionalSources"
              control={control}
              render={({ field }) => (
                <div className="full-width-control">
                  <FormField
                    label="데이터 소스"
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

          {/* Additional Settings - Human Loop & Error Tolerance */}
          <Container header={<Header variant="h2" description="Human-in-Loop, 오류 허용도를 설정하세요">추가 설정</Header>}>
            <SpaceBetween size="l">
              {/* Human-in-Loop */}
              <Controller
                name="humanLoop"
                control={control}
                render={({ field }) => (
                  <div className="full-width-control">
                    <FormField
                      label="Human-in-Loop"
                      description="사람이 언제 개입하나요?"
                      errorText={errors.humanLoop?.message}
                    >
                      <div className="equal-height-cards">
                        <Cards
                          selectionType="single"
                          selectedItems={humanLoopItems.filter((i) => i.label === field.value)}
                          onSelectionChange={({ detail }) => field.onChange(detail.selectedItems[0]?.label ?? "")}
                          trackBy="label"
                          cardDefinition={{
                            header: (item) => item.label,
                            sections: [
                              {
                                id: "example",
                                content: (item) => (
                                  <Box color="text-body-secondary" variant="small">{item.example}</Box>
                                ),
                              },
                            ],
                          }}
                          items={humanLoopItems}
                          cardsPerRow={[{ cards: 2 }]}
                        />
                      </div>
                    </FormField>
                  </div>
                )}
              />

              {/* Error Tolerance */}
              <Controller
                name="errorTolerance"
                control={control}
                render={({ field }) => (
                  <div className="full-width-control">
                    <FormField
                      label="오류 허용도"
                      description="AI 실수의 허용 범위는?"
                      errorText={errors.errorTolerance?.message}
                    >
                      <div className="equal-height-cards">
                        <Cards
                          selectionType="single"
                          selectedItems={errorToleranceItems.filter((i) => i.label === field.value)}
                          onSelectionChange={({ detail }) => field.onChange(detail.selectedItems[0]?.label ?? "")}
                          trackBy="label"
                          cardDefinition={{
                            header: (item) => item.label,
                            sections: [
                              {
                                id: "example",
                                content: (item) => (
                                  <Box color="text-body-secondary" variant="small">{item.example}</Box>
                                ),
                              },
                            ],
                          }}
                          items={errorToleranceItems}
                          cardsPerRow={[{ cards: 2 }]}
                        />
                      </div>
                    </FormField>
                  </div>
                )}
              />
            </SpaceBetween>
          </Container>

          {/* Additional Context */}
          <Container header={<Header variant="h2" description="선택사항: 추가로 알려주고 싶은 내용이 있다면 작성하세요">추가 정보</Header>}>
            <Controller
              name="additionalContext"
              control={control}
              render={({ field }) => (
                <div className="full-width-control">
                  <FormField label="추가 컨텍스트">
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
    </div>
  );
}
