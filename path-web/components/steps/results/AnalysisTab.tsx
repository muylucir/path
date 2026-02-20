"use client";

import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Badge from "@cloudscape-design/components/badge";
import TextContent from "@cloudscape-design/components/text-content";
import Icon from "@cloudscape-design/components/icon";
import { getReadinessLevel, getStatusIndicatorType } from "@/lib/readiness";
import type { Analysis, FormData, FeasibilityEvaluation, FeasibilityItemDetail, ImprovementPlans } from "@/lib/types";
import { PROCESS_STEPS, READINESS_ITEM_DETAILS, FEASIBILITY_ITEM_NAMES } from "@/lib/constants";

type ReadinessKey = keyof typeof FEASIBILITY_ITEM_NAMES;

interface AnalysisTabProps {
  analysis: Analysis;
  formData: FormData;
  feasibility?: FeasibilityEvaluation | null;
  improvementPlans?: ImprovementPlans;
}

export function AnalysisTab({ analysis, formData, feasibility, improvementPlans }: AnalysisTabProps) {
  const { risks } = analysis;

  const processSteps = formData?.processSteps || [];
  const isUserSelection = processSteps.some((step: string) =>
    PROCESS_STEPS.some((ps) => ps.label === step)
  );

  return (
    <SpaceBetween size="l">
      {/* Step 1 Input Summary */}
      <Container header={<Header variant="h2">입력 정보 요약</Header>}>
        <SpaceBetween size="l">
          <KeyValuePairs
            columns={1}
            items={[
              {
                label: "해결하려는 문제",
                value: formData?.painPoint || (formData as any)?.pain_point || analysis?.pain_point || "-",
              },
            ]}
          />
          <KeyValuePairs
            columns={3}
            items={[
              {
                label: "INPUT",
                value: formData?.inputType || (formData as any)?.input_type || analysis?.input_type || "-",
              },
              {
                label: "PROCESS (사용자 선택)",
                value: isUserSelection && processSteps.length > 0
                  ? <SpaceBetween direction="horizontal" size="xxs">{processSteps.map((step: string, idx: number) => <Badge key={idx}>{step}</Badge>)}</SpaceBetween>
                  : processSteps.length > 0 ? "아래 Claude 분석 참조" : "-",
              },
              {
                label: "OUTPUT",
                value: (
                  <SpaceBetween direction="horizontal" size="xxs">
                    {(formData?.outputTypes || (formData as any)?.output_types || analysis?.output_types)?.map(
                      (type: string, idx: number) => <Badge key={idx}>{type}</Badge>
                    )}
                  </SpaceBetween>
                ),
              },
            ]}
          />
          <KeyValuePairs
            columns={3}
            items={[
              {
                label: "Human-in-Loop",
                value: formData?.humanLoop || (formData as any)?.human_loop || analysis?.human_loop || "-",
              },
              {
                label: "오류 허용도",
                value: formData?.errorTolerance || (formData as any)?.error_tolerance || "-",
              },
              {
                label: "데이터 소스",
                value: formData?.additionalSources || "-",
              },
            ]}
          />
          {formData?.additionalContext && (
            <KeyValuePairs
              columns={1}
              items={[
                {
                  label: "추가 정보",
                  value: formData.additionalContext,
                },
              ]}
            />
          )}
        </SpaceBetween>
      </Container>

      {/* Step 2: Readiness Results */}
      {feasibility && (
        <SpaceBetween size="m">
          <Container header={<Header variant="h2">준비도 점검 결과</Header>}>
            {analysis.improved_feasibility ? (
              <Alert type="success" header={`${feasibility.feasibility_score}점 → ${analysis.improved_feasibility.score}점 (예상 +${analysis.improved_feasibility.score_change}점)`}>
                {analysis.improved_feasibility.summary}
              </Alert>
            ) : (
              <Box variant="p" color="text-body-secondary">{feasibility.summary}</Box>
            )}
          </Container>

          {(Object.entries(feasibility.feasibility_breakdown) as [ReadinessKey, FeasibilityItemDetail][]).map(([key, item]) => {
            const level = getReadinessLevel(item.score);
            const details = READINESS_ITEM_DETAILS[key];
            const weakItem = feasibility.weak_items?.find(
              (w) => w.item === details.name || w.item.toLowerCase().includes(key.replace("_", " "))
            );
            const userPlan = improvementPlans?.[key];
            const improvedItem = analysis.improved_feasibility?.breakdown?.[key];

            return (
              <Container
                key={key}
                header={
                  <Header variant="h3">
                    <SpaceBetween direction="horizontal" size="xs">
                      <StatusIndicator type={getStatusIndicatorType(level.color)}>{level.label}</StatusIndicator>
                      <span>{details.name}</span>
                      {improvedItem && improvedItem.improved_score > improvedItem.original_score ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                          <Box variant="small" color="text-status-inactive" display="inline-block"><span className="text-line-through">{item.score}</span></Box>
                          <Icon name="caret-right-filled" size="small" />
                          <Box variant="small" color="text-status-success" display="inline-block" fontWeight="bold">{improvedItem.improved_score}/10</Box>
                          {" "}
                          <Badge color="green">+{improvedItem.improved_score - improvedItem.original_score}</Badge>
                        </div>
                      ) : (
                        <Box variant="small" color="text-body-secondary">{item.score}/10</Box>
                      )}
                    </SpaceBetween>
                  </Header>
                }
              >
                <SpaceBetween size="s">
                  <Box variant="p" color="text-body-secondary">{item.reason}</Box>

                  {weakItem && (
                    <Alert type="warning" header="AI 개선 제안">
                      {weakItem.improvement_suggestion}
                    </Alert>
                  )}

                  {userPlan && userPlan.trim() && (
                    <Alert type="success" header="내 개선 계획">
                      {userPlan}
                    </Alert>
                  )}

                  {improvedItem && improvedItem.improvement_reason && (
                    <Alert type="info" header="점수 상향 근거">
                      {improvedItem.improvement_reason}
                    </Alert>
                  )}
                </SpaceBetween>
              </Container>
            );
          })}

          {feasibility.risks && feasibility.risks.length > 0 && (
            <Alert type="warning" header="준비도 리스크">
              <TextContent>
                <ul>
                  {feasibility.risks.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </TextContent>
            </Alert>
          )}
        </SpaceBetween>
      )}

      {/* Claude Process Analysis */}
      <Container header={<Header variant="h2">PROCESS (Claude 분석)</Header>}>
        <TextContent>
          <ol>
            {analysis.process_steps?.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </TextContent>
      </Container>

      {/* Analysis Risks */}
      {risks && risks.length > 0 && (
        <Alert type="warning" header="리스크 및 고려사항">
          <TextContent>
            <ul>
              {risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </TextContent>
        </Alert>
      )}
    </SpaceBetween>
  );
}
