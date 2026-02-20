"use client";

import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Badge from "@cloudscape-design/components/badge";
import Icon from "@cloudscape-design/components/icon";
import { getReadinessLevel, getStatusIndicatorType, getJudgmentBadge } from "@/lib/readiness";
import { AnalysisTab } from "@/components/steps/results/AnalysisTab";
import { ChatHistoryTab } from "@/components/steps/results/ChatHistoryTab";
import { SpecificationTab } from "@/components/steps/results/SpecificationTab";
import type { Analysis, ChatMessage, FormData, FeasibilityEvaluation, ImprovementPlans, TokenUsage } from "@/lib/types";
import { MULTI_AGENT_PATTERN_LABELS } from "@/lib/constants";

interface Step3ResultsProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: FormData;
  feasibility?: FeasibilityEvaluation | null;
  improvementPlans?: ImprovementPlans;
  initialSpecification?: string;
  onSave: (specification: string) => Promise<void>;
  onUsage?: (usage: TokenUsage) => void;
}

export function Step3Results({
  analysis,
  chatHistory,
  formData,
  feasibility,
  improvementPlans,
  initialSpecification,
  onSave,
  onUsage,
}: Step3ResultsProps) {
  const { feasibility_score, pattern, improved_feasibility } = analysis;
  const finalScore = improved_feasibility?.score ?? feasibility_score;
  const judgmentBadge = getJudgmentBadge(finalScore);

  const avgScore = feasibility_score / 5;
  const baseLevel = getReadinessLevel(avgScore);

  return (
    <SpaceBetween size="l">
      {/* Pattern Card (full width) */}
      <Container>
        <SpaceBetween size="xs">
          <SpaceBetween direction="horizontal" size="xs">
            <Box variant="awsui-key-label">추천 패턴</Box>
            {analysis.recommended_architecture && (
              <Badge color={analysis.recommended_architecture === "multi-agent" ? "blue" : "grey"}>
                {analysis.recommended_architecture === "multi-agent" ? "멀티 에이전트" : "싱글 에이전트"}
              </Badge>
            )}
            {analysis.multi_agent_pattern && (
              <Badge color="blue">{MULTI_AGENT_PATTERN_LABELS[analysis.multi_agent_pattern]}</Badge>
            )}
          </SpaceBetween>
          <Box variant="h2">{pattern}</Box>
          {(analysis.pattern_reason || analysis.architecture_reason) && (
            <Box variant="p" color="text-body-secondary">
              {analysis.pattern_reason || analysis.architecture_reason}
            </Box>
          )}
        </SpaceBetween>
      </Container>

      {/* Readiness + Next Step (equal height) */}
      <div className="summary-cards-equal">
        {/* Readiness Score */}
        <Container>
          <SpaceBetween size="xs">
            <Box variant="awsui-key-label">준비도</Box>
            {analysis.improved_feasibility ? (
              <SpaceBetween direction="horizontal" size="xs">
                <Box variant="p" color="text-status-inactive"><span className="text-line-through">{feasibility_score}</span></Box>
                <Icon name="caret-right-filled" />
                <Box variant="h2" color="text-status-success">{analysis.improved_feasibility.score}/50</Box>
                <Badge color="green">+{analysis.improved_feasibility.score_change}점</Badge>
              </SpaceBetween>
            ) : (
              <SpaceBetween direction="horizontal" size="xs">
                <Box variant="h2">{feasibility_score}/50</Box>
                <StatusIndicator type={getStatusIndicatorType(baseLevel.color)}>
                  {baseLevel.label}
                </StatusIndicator>
              </SpaceBetween>
            )}
          </SpaceBetween>
        </Container>

        {/* Next Step */}
        <Container>
          <SpaceBetween size="xs">
            <Box variant="awsui-key-label">다음 단계</Box>
            <StatusIndicator type={judgmentBadge.type}>
              <Box variant="h2">{judgmentBadge.label}</Box>
            </StatusIndicator>
          </SpaceBetween>
        </Container>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            label: "분석 결과",
            id: "analysis",
            content: (
              <Box padding={{ top: "l" }}>
                <AnalysisTab
                  analysis={analysis}
                  formData={formData}
                  feasibility={feasibility}
                  improvementPlans={improvementPlans}
                />
              </Box>
            ),
          },
          {
            label: "대화 내역",
            id: "chat",
            content: (
              <Box padding={{ top: "l" }}>
                <ChatHistoryTab chatHistory={chatHistory} />
              </Box>
            ),
          },
          {
            label: "명세서",
            id: "spec",
            content: (
              <Box padding={{ top: "l" }}>
                <SpecificationTab
                  analysis={analysis}
                  chatHistory={chatHistory}
                  formData={formData}
                  improvementPlans={improvementPlans}
                  initialSpecification={initialSpecification}
                  onSave={onSave}
                  onUsage={onUsage}
                />
              </Box>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}
