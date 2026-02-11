"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Settings, CheckCircle, ClipboardList } from "lucide-react";
import { getReadinessLevel, getLevelBadgeClass } from "@/lib/readiness";
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

  return (
    <div className="space-y-6">
      {/* Step 1 입력 정보 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            입력 정보 요약
          </h3>

          {/* Pain Point */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">해결하려는 문제</p>
            <p className="text-sm">{formData?.painPoint || (formData as any)?.pain_point || analysis?.pain_point || "-"}</p>
          </div>

          <Separator />

          {/* INPUT / PROCESS / OUTPUT */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">INPUT</p>
              <p className="text-sm font-medium">
                {formData?.inputType || (formData as any)?.input_type || analysis?.input_type || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">PROCESS (사용자 선택)</p>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const steps = formData?.processSteps || [];
                  if (steps.length > 0) {
                    const isUserSelection = steps.some((step: string) =>
                      PROCESS_STEPS.some(ps => ps.label === step)
                    );
                    if (isUserSelection) {
                      return steps.map((step: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{step}</Badge>
                      ));
                    }
                    return <span className="text-sm text-muted-foreground">아래 Claude 분석 참조</span>;
                  }
                  return <span className="text-sm text-muted-foreground">-</span>;
                })()}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">OUTPUT</p>
              <div className="flex flex-wrap gap-1">
                {(formData?.outputTypes || (formData as any)?.output_types || analysis?.output_types)?.map((type: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{type}</Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Human-in-Loop / Error Tolerance */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Human-in-Loop</p>
              <p className="text-sm">{formData?.humanLoop || (formData as any)?.human_loop || analysis?.human_loop || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">오류 허용도</p>
              <p className="text-sm">{formData?.errorTolerance || (formData as any)?.error_tolerance || "-"}</p>
            </div>
          </div>

          {/* Data Sources */}
          {(() => {
            const additionalSources = formData?.additionalSources;
            const legacyDataSource = (formData as any)?.data_source || (formData as any)?.dataSource;

            if (additionalSources) {
              return (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">데이터 소스</p>
                    <p className="text-sm text-muted-foreground">
                      {additionalSources}
                    </p>
                  </div>
                </>
              );
            } else if (legacyDataSource) {
              return (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">데이터 소스</p>
                    <ul className="text-sm space-y-1">
                      {legacyDataSource.split(", ").map((ds: string, idx: number) => (
                        <li key={idx}>• {ds}</li>
                      ))}
                    </ul>
                  </div>
                </>
              );
            }
            return null;
          })()}

          {/* Additional Context */}
          {formData?.additionalContext && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">추가 정보</p>
                <p className="text-sm">{formData.additionalContext}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 2: 준비도 점검 결과 */}
      {feasibility && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                준비도 점검 결과
              </h3>

              {/* Summary with Improved Score */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                {analysis.improved_feasibility ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold">{feasibility.feasibility_score}점</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-lg font-bold text-green-600">{analysis.improved_feasibility.score}점</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">
                        예상 +{analysis.improved_feasibility.score_change}점
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.improved_feasibility.summary}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{feasibility.summary}</p>
                )}
              </div>

              {/* Item Breakdown - Integrated View */}
              <div className="space-y-3">
                {(
                  Object.entries(feasibility.feasibility_breakdown) as [
                    ReadinessKey,
                    FeasibilityItemDetail,
                  ][]
                ).map(([key, item]) => {
                  const level = getReadinessLevel(item.score);
                  const details = READINESS_ITEM_DETAILS[key];
                  const weakItem = feasibility.weak_items?.find(w =>
                    w.item === details.name || w.item.toLowerCase().includes(key.replace('_', ' '))
                  );
                  const userPlan = improvementPlans?.[key];
                  const improvedItem = analysis.improved_feasibility?.breakdown?.[key];

                  return (
                    <div key={key} className="border rounded-lg p-4 space-y-3">
                      {/* Header with Score */}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getLevelBadgeClass(level.color)} gap-1`}
                        >
                          <span>{level.icon}</span>
                          <span>{level.label}</span>
                        </Badge>
                        <span className="font-medium text-sm">{details.name}</span>
                        <div className="ml-auto flex items-center gap-2">
                          {improvedItem && improvedItem.improved_score > improvedItem.original_score ? (
                            <>
                              <span className="text-xs text-muted-foreground line-through">{item.score}</span>
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="text-sm font-semibold text-green-600">{improvedItem.improved_score}/10</span>
                              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs px-1.5">
                                +{improvedItem.improved_score - improvedItem.original_score}
                              </Badge>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">{item.score}/10</span>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <p className="text-sm text-muted-foreground">{item.reason}</p>

                      {/* AI Suggestion (if weak item) */}
                      {weakItem && (
                        <div className="bg-amber-50 dark:bg-amber-950 p-2.5 rounded-md border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 text-sm">💡</span>
                            <div>
                              <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-0.5">AI 개선 제안</p>
                              <p className="text-xs text-amber-700 dark:text-amber-300">{weakItem.improvement_suggestion}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* User Plan */}
                      {userPlan && userPlan.trim() && (
                        <div className="bg-green-50 dark:bg-green-950 p-2.5 rounded-md border border-green-200 dark:border-green-800">
                          <div className="flex items-start gap-2">
                            <span className="text-green-600 text-sm">✏️</span>
                            <div>
                              <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-0.5">내 개선 계획</p>
                              <p className="text-xs text-green-700 dark:text-green-300">{userPlan}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Improvement Reason */}
                      {improvedItem && improvedItem.improvement_reason && (
                        <div className="bg-blue-50 dark:bg-blue-950 p-2.5 rounded-md border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-600 text-sm">📈</span>
                            <div>
                              <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-0.5">점수 상향 근거</p>
                              <p className="text-xs text-blue-700 dark:text-blue-300">{improvedItem.improvement_reason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risks from Feasibility */}
            {feasibility.risks && feasibility.risks.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    준비도 리스크
                  </h4>
                  <ul className="space-y-1">
                    {feasibility.risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500">•</span>
                        <span className="text-red-700 dark:text-red-300">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Claude 분석 PROCESS */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              PROCESS (Claude 분석)
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {analysis.process_steps?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          {risks && risks.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  리스크 및 고려사항
                </h3>
                <div className="space-y-2">
                  {risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm"
                    >
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
