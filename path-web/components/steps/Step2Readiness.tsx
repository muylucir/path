"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Info,
  TrendingUp,
  ChevronDown,
  Lightbulb,
  Plus,
} from "lucide-react";
import {
  FEASIBILITY_ITEM_NAMES,
  READINESS_LEVELS,
  READINESS_ITEM_DETAILS,
} from "@/lib/constants";
import { getReadinessLevel, getLevelBadgeClass } from "@/lib/readiness";
import { useSSEStream } from "@/lib/hooks/useSSEStream";
import type { FormData, FeasibilityEvaluation, FeasibilityItemDetail, ImprovementPlans, TokenUsage } from "@/lib/types";

interface Step2ReadinessProps {
  formData: FormData;
  initialFeasibility: FeasibilityEvaluation | null;
  initialImprovementPlans?: ImprovementPlans;
  onComplete: (feasibility: FeasibilityEvaluation, improvementPlans: ImprovementPlans) => void;
  onFormDataUpdate?: (updatedFormData: FormData) => void;
  onUsage?: (usage: TokenUsage) => void;
}

type ReadinessKey = keyof typeof FEASIBILITY_ITEM_NAMES;

export function Step2Readiness({
  formData,
  initialFeasibility,
  initialImprovementPlans,
  onComplete,
  onFormDataUpdate,
  onUsage,
}: Step2ReadinessProps) {
  const router = useRouter();
  const [feasibility, setFeasibility] =
    useState<FeasibilityEvaluation | null>(initialFeasibility);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlans>(
    initialImprovementPlans || {}
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  // 추가 정보 입력
  const [additionalInfo, setAdditionalInfo] = useState({
    additionalSources: formData.additionalSources || "",
    additionalContext: formData.additionalContext || "",
  });
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);

  const { start: startEvaluation, isStreaming: isLoading } = useSSEStream({
    url: "/api/bedrock/feasibility",
    body: formData as unknown as Record<string, unknown>,
    onChunk: useCallback((parsed: any) => {
      if (parsed.progress !== undefined) {
        setProgress(parsed.progress);
      }
      if (parsed.stage) {
        setStage(parsed.stage);
      }
      if (parsed.result) {
        setFeasibility(parsed.result);
      }
    }, []),
    onProgress: useCallback((p: number, s: string) => {
      setProgress(p);
      if (s) setStage(s);
    }, []),
    onUsage: useCallback((usage: TokenUsage) => {
      onUsage?.(usage);
    }, [onUsage]),
    onDone: useCallback(() => {
      // Stream completed
    }, []),
    onError: useCallback((err: string) => {
      setError(err);
    }, []),
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

  // 레벨별 항목 수 계산
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

  // 보완이 필요한 항목인지 확인
  const needsImprovement = (score: number) => score < 6;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">준비도 점검 중...</p>
          <p className="text-sm text-muted-foreground">{stage}</p>
          <div className="w-64 space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (!feasibility) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-lg font-medium text-red-600">
          {error || "점검 결과를 불러올 수 없습니다"}
        </p>
        <Button onClick={evaluateFeasibility}>다시 시도</Button>
      </div>
    );
  }

  const levelCounts = getLevelCounts();
  // 진행 가능 = 준비됨 + 양호 (score >= 6)
  const proceedableCount = levelCounts.ready + levelCounts.good;
  const proceedablePercentage = (proceedableCount / levelCounts.total) * 100;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        이전 단계로
      </Button>

      {/* Overall Readiness Summary */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-xl">📊</span>
          전체 준비도
        </h3>

        {/* Level Breakdown */}
        <div className="flex flex-wrap gap-3 text-sm">
          {levelCounts.ready > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-800">
              <span>{READINESS_LEVELS.READY.icon}</span>
              <span>준비됨 {levelCounts.ready}개</span>
            </span>
          )}
          {levelCounts.good > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-800">
              <span>{READINESS_LEVELS.GOOD.icon}</span>
              <span>양호 {levelCounts.good}개</span>
            </span>
          )}
          {levelCounts.needsWork > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800">
              <span>{READINESS_LEVELS.NEEDS_WORK.icon}</span>
              <span>보완 필요 {levelCounts.needsWork}개</span>
            </span>
          )}
          {levelCounts.prepare > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-800">
              <span>{READINESS_LEVELS.PREPARE.icon}</span>
              <span>준비 필요 {levelCounts.prepare}개</span>
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {proceedableCount}/{levelCounts.total} 항목 진행 가능
            </span>
            <span className="font-medium">{Math.round(proceedablePercentage)}%</span>
          </div>
          <Progress value={proceedablePercentage} className="h-3" />
        </div>

        {/* Score Change Indicator */}
        {feasibility.score_change !== undefined && (
          <div className="flex items-center gap-2 text-sm pt-2 border-t">
            <TrendingUp
              className={`h-4 w-4 ${feasibility.score_change >= 0 ? "text-green-500" : "text-red-500"}`}
            />
            <span
              className={
                feasibility.score_change >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {feasibility.score_change >= 0 ? "+" : ""}
              {feasibility.score_change}점 변화
            </span>
            <span className="text-muted-foreground">
              (이전: {feasibility.previous_score}점)
            </span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{feasibility.summary}</p>
      </div>

      {/* Item Breakdown Accordion */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">항목별 준비도</h3>
        <Accordion
          type="multiple"
          defaultValue={["data_access", "decision_clarity", "error_tolerance", "latency", "integration"]}
          className="space-y-2"
        >
          {(
            Object.entries(feasibility.feasibility_breakdown) as [
              ReadinessKey,
              FeasibilityItemDetail,
            ][]
          ).map(([key, item]) => {
            const level = getReadinessLevel(item.score);
            const details = READINESS_ITEM_DETAILS[key];
            const showImprovement = needsImprovement(item.score);

            return (
              <AccordionItem
                key={key}
                value={key}
                className={`border rounded-lg px-4 ${
                  showImprovement ? "border-yellow-300 bg-yellow-50/50" : ""
                }`}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Level Icon + Badge */}
                    <Badge
                      variant="outline"
                      className={`${getLevelBadgeClass(level.color)} gap-1`}
                    >
                      <span>{level.icon}</span>
                      <span>{level.label}</span>
                    </Badge>

                    {/* Item Name with Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium flex items-center gap-1 cursor-help">
                          {details.name}
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium">{details.description}</p>
                          <p className="text-xs opacity-80">
                            평가 기준: {details.criteria}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Current State Preview */}
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                      • {item.current_state}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="space-y-4 pt-2">
                  {/* Current State & Reason */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        {item.current_state}
                      </span>
                    </div>
                    <p className="text-sm">{item.reason}</p>

                    {/* Change Reason if Re-evaluated */}
                    {item.changed && item.change_reason && (
                      <div className="flex items-start gap-2 text-green-600 bg-green-50 p-2 rounded text-sm">
                        <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{item.change_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Improvement Suggestion for Items Needing Work */}
                  {showImprovement && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800">
                            개선 제안
                          </p>
                          <p className="text-amber-700">
                            {feasibility.weak_items.find(
                              (w) =>
                                w.item.includes(FEASIBILITY_ITEM_NAMES[key]) ||
                                w.item
                                  .toLowerCase()
                                  .includes(key.replace("_", " "))
                            )?.improvement_suggestion ||
                              "이 항목을 보완하면 준비도가 향상됩니다."}
                          </p>
                        </div>
                      </div>

                      {/* Improvement Input */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-amber-800">
                          개선 방안{" "}
                          <span className="font-normal text-amber-600">
                            (선택)
                          </span>
                        </label>
                        <Textarea
                          placeholder="계획하고 있는 개선 방안을 입력하세요..."
                          value={improvementPlans[key] || ""}
                          onChange={(e) =>
                            setImprovementPlans((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="bg-white text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Risks Section */}
      {feasibility.risks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            주요 리스크
          </h4>
          <ul className="space-y-1">
            {feasibility.risks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-red-500">•</span>
                <span className="text-red-700">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Information Section */}
      <Collapsible
        open={isAdditionalInfoOpen}
        onOpenChange={setIsAdditionalInfoOpen}
        className="border rounded-lg"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-medium">추가 정보</span>
              <span className="text-sm text-muted-foreground font-normal">
                (Step 1에서 추가로 입력할 내용)
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isAdditionalInfoOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Step 1에서 미처 입력하지 못한 내용을 여기에 추가할 수 있습니다.
            입력한 내용은 다음 단계 분석에 자동으로 반영됩니다.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                추가 데이터소스{" "}
                <span className="font-normal text-muted-foreground">
                  (선택)
                </span>
              </label>
              <Textarea
                placeholder="예: 내부 CRM API, 외부 날씨 API, S3 버킷 등"
                value={additionalInfo.additionalSources}
                onChange={(e) =>
                  setAdditionalInfo((prev) => ({
                    ...prev,
                    additionalSources: e.target.value,
                  }))
                }
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                추가 컨텍스트{" "}
                <span className="font-normal text-muted-foreground">
                  (선택)
                </span>
              </label>
              <Textarea
                placeholder="예: 기존 시스템 연동 방식, 보안 요구사항, 특수 제약조건 등"
                value={additionalInfo.additionalContext}
                onChange={(e) =>
                  setAdditionalInfo((prev) => ({
                    ...prev,
                    additionalContext: e.target.value,
                  }))
                }
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => {
            // additionalInfo를 formData에 반영하고 sessionStorage 업데이트
            if (additionalInfo.additionalSources || additionalInfo.additionalContext) {
              const updatedFormData = {
                ...formData,
                additionalSources: additionalInfo.additionalSources || formData.additionalSources,
                additionalContext: additionalInfo.additionalContext || formData.additionalContext,
              };
              sessionStorage.setItem("formData", JSON.stringify(updatedFormData));

              // onFormDataUpdate가 있으면 호출하여 부모 컴포넌트에도 반영
              if (onFormDataUpdate) {
                onFormDataUpdate(updatedFormData);
              }
            }
            onComplete(feasibility, improvementPlans);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          패턴 분석으로
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
