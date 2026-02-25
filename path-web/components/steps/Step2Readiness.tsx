"use client";

import { useState, useEffect, useCallback } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ProgressBar from "@cloudscape-design/components/progress-bar";
import Spinner from "@cloudscape-design/components/spinner";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import FormField from "@cloudscape-design/components/form-field";
import Textarea from "@cloudscape-design/components/textarea";
import Alert from "@cloudscape-design/components/alert";
import Popover from "@cloudscape-design/components/popover";
import Badge from "@cloudscape-design/components/badge";
import {
  FEASIBILITY_ITEM_NAMES,
  READINESS_ITEM_DETAILS,
  AUTONOMY_REQUIREMENT_INFO,
} from "@/lib/constants";
import { getReadinessLevel, getStatusIndicatorType } from "@/lib/readiness";
import { useSSEStream } from "@/lib/hooks/useSSEStream";
import type { FormData, FeasibilityEvaluation, FeasibilityItemDetail, ImprovementPlans, TokenUsage } from "@/lib/types";

interface Step2ReadinessProps {
  formData: FormData;
  initialFeasibility: FeasibilityEvaluation | null;
  initialImprovementPlans?: ImprovementPlans;
  onComplete: (feasibility: FeasibilityEvaluation, improvementPlans: ImprovementPlans) => void;
  onFormDataUpdate?: (updatedFormData: FormData) => void;
  onUsage?: (usage: TokenUsage) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  completeRef?: React.MutableRefObject<(() => void) | null>;
}

type ReadinessKey = keyof typeof FEASIBILITY_ITEM_NAMES;

export function Step2Readiness({
  formData,
  initialFeasibility,
  initialImprovementPlans,
  onComplete,
  onFormDataUpdate,
  onUsage,
  onLoadingChange,
  completeRef,
}: Step2ReadinessProps) {
  const [feasibility, setFeasibility] = useState<FeasibilityEvaluation | null>(initialFeasibility);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlans>(initialImprovementPlans || {});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  const [additionalInfo, setAdditionalInfo] = useState({
    additionalSources: formData.additionalSources || "",
    additionalContext: formData.additionalContext || "",
  });

  const { start: startEvaluation, isStreaming: isLoading } = useSSEStream({
    url: "/api/bedrock/feasibility",
    body: formData as unknown as Record<string, unknown>,
    onChunk: useCallback((parsed: any) => {
      if (parsed.progress !== undefined) setProgress(parsed.progress);
      if (parsed.stage) setStage(parsed.stage);
      if (parsed.result) setFeasibility(parsed.result);
    }, []),
    onProgress: useCallback((p: number, s: string) => {
      setProgress(p);
      if (s) setStage(s);
    }, []),
    onUsage: useCallback((usage: TokenUsage) => {
      onUsage?.(usage);
    }, [onUsage]),
    onDone: useCallback(() => {}, []),
    onError: useCallback((err: string) => {
      setError(err);
    }, []),
  });

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Expose complete trigger to parent (Wizard)
  useEffect(() => {
    if (completeRef) {
      completeRef.current = () => {
        if (!feasibility) return;
        if (additionalInfo.additionalSources || additionalInfo.additionalContext) {
          const updatedFormData = {
            ...formData,
            additionalSources: additionalInfo.additionalSources || formData.additionalSources,
            additionalContext: additionalInfo.additionalContext || formData.additionalContext,
          };
          sessionStorage.setItem("formData", JSON.stringify(updatedFormData));
          onFormDataUpdate?.(updatedFormData);
        }
        onComplete(feasibility, improvementPlans);
      };
    }
  });

  const evaluateFeasibility = useCallback(() => {
    setError(null);
    setProgress(0);
    setStage("준비 중...");
    startEvaluation();
  }, [startEvaluation]);

  useEffect(() => {
    if (!initialFeasibility) {
      evaluateFeasibility();
    }
  }, []);

  const getLevelCounts = () => {
    if (!feasibility) return { ready: 0, good: 0, needsWork: 0, prepare: 0, total: 5 };
    const items = Object.values(feasibility.feasibility_breakdown);
    return {
      ready: items.filter((item) => item.score >= 8).length,
      good: items.filter((item) => item.score >= 6 && item.score < 8).length,
      needsWork: items.filter((item) => item.score >= 4 && item.score < 6).length,
      prepare: items.filter((item) => item.score < 4).length,
      total: items.length,
    };
  };

  const needsImprovement = (score: number) => score < 6;

  if (isLoading) {
    return (
      <Container>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
          <Spinner size="large" />
          <Box variant="h3">준비도 점검 중...</Box>
          <Box variant="small" color="text-body-secondary">{stage}</Box>
          <div style={{ width: 300 }}>
            <ProgressBar
              value={progress}
              additionalInfo={`${progress}%`}
            />
          </div>
        </div>
      </Container>
    );
  }

  if (!feasibility) {
    return (
      <Container>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
          <Alert type="error" header="점검 실패">
            {error || "점검 결과를 불러올 수 없습니다"}
          </Alert>
          <Button onClick={evaluateFeasibility}>다시 시도</Button>
        </div>
      </Container>
    );
  }

  const levelCounts = getLevelCounts();
  const proceedableCount = levelCounts.ready + levelCounts.good;
  const proceedablePercentage = (proceedableCount / levelCounts.total) * 100;

  return (
    <SpaceBetween size="l">
      {/* Overall Readiness Summary */}
      <Container header={<Header variant="h2">전체 준비도</Header>}>
        <SpaceBetween size="m">
          {/* Level Breakdown */}
          <SpaceBetween direction="horizontal" size="s">
            {levelCounts.ready > 0 && (
              <StatusIndicator type="success">준비됨 {levelCounts.ready}개</StatusIndicator>
            )}
            {levelCounts.good > 0 && (
              <StatusIndicator type="info">양호 {levelCounts.good}개</StatusIndicator>
            )}
            {levelCounts.needsWork > 0 && (
              <StatusIndicator type="warning">보완 필요 {levelCounts.needsWork}개</StatusIndicator>
            )}
            {levelCounts.prepare > 0 && (
              <StatusIndicator type="error">준비 필요 {levelCounts.prepare}개</StatusIndicator>
            )}
          </SpaceBetween>

          {/* Progress Bar */}
          <ProgressBar
            value={proceedablePercentage}
            additionalInfo={`${proceedableCount}/${levelCounts.total} 항목 진행 가능`}
            description={`${Math.round(proceedablePercentage)}%`}
          />

          {/* Score Change */}
          {feasibility.score_change !== undefined && (
            <StatusIndicator type={feasibility.score_change >= 0 ? "success" : "error"}>
              {feasibility.score_change >= 0 ? "+" : ""}{feasibility.score_change}점 변화 (이전: {feasibility.previous_score}점)
            </StatusIndicator>
          )}

          <Box variant="p" color="text-body-secondary">{feasibility.summary}</Box>
        </SpaceBetween>
      </Container>

      {/* Item Breakdown */}
      <SpaceBetween size="m">
      {(Object.entries(feasibility.feasibility_breakdown) as [ReadinessKey, FeasibilityItemDetail][]).map(([key, item]) => {
        const level = getReadinessLevel(item.score);
        const details = READINESS_ITEM_DETAILS[key];
        const showImprovement = needsImprovement(item.score);

        return (
          <Container
            key={key}
            header={
              <Header
                variant="h3"
                info={
                  <Popover
                    dismissButton={false}
                    position="top"
                    size="medium"
                    triggerType="text"
                    content={
                      <SpaceBetween size="xs">
                        <Box variant="small" fontWeight="bold">{details.description}</Box>
                        <Box variant="small">평가 기준: {details.criteria}</Box>
                      </SpaceBetween>
                    }
                  >
                    <Box variant="small" color="text-status-info">정보</Box>
                  </Popover>
                }
              >
                <SpaceBetween direction="horizontal" size="xs">
                  <StatusIndicator type={getStatusIndicatorType(level.color)}>
                    {level.label}
                  </StatusIndicator>
                  {details.name}
                </SpaceBetween>
              </Header>
            }
          >
            <SpaceBetween size="s">
              <Box variant="small" color="text-body-secondary">{item.current_state}</Box>
              <Box variant="p">{item.reason}</Box>

              {item.changed && item.change_reason && (
                <Alert type="success">
                  {item.change_reason}
                </Alert>
              )}

              {showImprovement && (
                <Alert type="warning" header="개선 제안">
                  <SpaceBetween size="s">
                    <Box variant="p">
                      {feasibility.weak_items.find(
                        (w) =>
                          w.item.includes(FEASIBILITY_ITEM_NAMES[key]) ||
                          w.item.toLowerCase().includes(key.replace("_", " "))
                      )?.improvement_suggestion ||
                        "이 항목을 보완하면 준비도가 향상됩니다."}
                    </Box>
                    <FormField label="개선 방안 (선택)">
                      <Textarea
                        value={improvementPlans[key] || ""}
                        onChange={({ detail }) =>
                          setImprovementPlans((prev) => ({
                            ...prev,
                            [key]: detail.value,
                          }))
                        }
                        placeholder="계획하고 있는 개선 방안을 입력하세요..."
                        rows={2}
                      />
                    </FormField>
                  </SpaceBetween>
                </Alert>
              )}
            </SpaceBetween>
          </Container>
        );
      })}
      </SpaceBetween>

      {/* Autonomy Requirement (별도 평가 축) */}
      {feasibility.autonomy_requirement && (
        <Container
          header={
            <Header
              variant="h2"
              description="준비도 50점과는 별도의 독립 평가 축입니다. 이 업무에 에이전트의 자율적 판단이 얼마나 필요한지를 나타냅니다."
              info={
                <Popover
                  dismissButton={false}
                  position="top"
                  size="medium"
                  triggerType="text"
                  content={
                    <SpaceBetween size="xs">
                      <Box variant="small" fontWeight="bold">{AUTONOMY_REQUIREMENT_INFO.description}</Box>
                      <Box variant="small">평가 기준: {AUTONOMY_REQUIREMENT_INFO.criteria}</Box>
                    </SpaceBetween>
                  }
                >
                  <Box variant="small" color="text-status-info">정보</Box>
                </Popover>
              }
            >
              {AUTONOMY_REQUIREMENT_INFO.name}
            </Header>
          }
        >
          <SpaceBetween size="s">
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={feasibility.autonomy_requirement.score >= 6 ? "blue" : "grey"}>
                {feasibility.autonomy_requirement.score >= 6 ? "Agentic AI 권장" : "AI-Assisted Workflow 가능"}
              </Badge>
              <Box variant="small" color="text-body-secondary">
                자율성 점수: {feasibility.autonomy_requirement.score}/10
              </Box>
            </SpaceBetween>
            <Box variant="small" color="text-body-secondary">{feasibility.autonomy_requirement.current_state}</Box>
            <Box variant="p">{feasibility.autonomy_requirement.reason}</Box>
            {feasibility.autonomy_requirement.changed && feasibility.autonomy_requirement.change_reason && (
              <Alert type="success">
                {feasibility.autonomy_requirement.change_reason}
              </Alert>
            )}
          </SpaceBetween>
        </Container>
      )}

      {/* Risks */}
      {feasibility.risks.length > 0 && (
        <Alert type="warning" header="주요 리스크">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {feasibility.risks.map((risk, idx) => (
              <li key={idx}>{risk}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Additional Information */}
      <Container
        header={
          <Header variant="h3" description="Step 1에서 미처 입력하지 못한 내용을 여기에 추가할 수 있습니다. 입력한 내용은 다음 단계 분석에 자동으로 반영됩니다.">
            추가 정보
          </Header>
        }
      >
        <SpaceBetween size="m">
          <FormField label="추가 데이터소스 (선택)">
            <Textarea
              value={additionalInfo.additionalSources}
              onChange={({ detail }) =>
                setAdditionalInfo((prev) => ({
                  ...prev,
                  additionalSources: detail.value,
                }))
              }
              placeholder="예: 내부 CRM API, 외부 날씨 API, S3 버킷 등"
              rows={2}
            />
          </FormField>
          <FormField label="추가 컨텍스트 (선택)">
            <Textarea
              value={additionalInfo.additionalContext}
              onChange={({ detail }) =>
                setAdditionalInfo((prev) => ({
                  ...prev,
                  additionalContext: detail.value,
                }))
              }
              placeholder="예: 기존 시스템 연동 방식, 보안 요구사항, 특수 제약조건 등"
              rows={2}
            />
          </FormField>
        </SpaceBetween>
      </Container>

      {/* Error */}
      {error && (
        <Alert type="error">{error}</Alert>
      )}

    </SpaceBetween>
  );
}
