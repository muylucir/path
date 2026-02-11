"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, MessageSquare, FileText, Sparkles, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getReadinessLevel, getLevelBadgeClass, getJudgmentBadge } from "@/lib/readiness";
import { AnalysisTab } from "@/components/steps/results/AnalysisTab";
import { ChatHistoryTab } from "@/components/steps/results/ChatHistoryTab";
import { SpecificationTab } from "@/components/steps/results/SpecificationTab";
import type { Analysis, ChatMessage, FormData, FeasibilityEvaluation, ImprovementPlans } from "@/lib/types";
import { MULTI_AGENT_PATTERN_LABELS } from "@/lib/constants";

interface Step3ResultsProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: FormData;
  feasibility?: FeasibilityEvaluation | null;
  improvementPlans?: ImprovementPlans;
  initialSpecification?: string;
  onSave: (specification: string) => Promise<void>;
}

export function Step3Results({
  analysis,
  chatHistory,
  formData,
  feasibility,
  improvementPlans,
  initialSpecification,
  onSave,
}: Step3ResultsProps) {
  const { feasibility_score, pattern, improved_feasibility } = analysis;
  const finalScore = improved_feasibility?.score ?? feasibility_score;
  const judgmentBadge = getJudgmentBadge(finalScore);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="space-y-4">
        {/* 첫 번째 행: 에이전트 패턴 (전체 너비) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="space-y-1 text-center flex-1">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">추천 패턴</p>
                </div>
                <p className="text-xl font-bold">{pattern}</p>
                {analysis.recommended_architecture && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <Badge className={`text-xs ${
                      analysis.recommended_architecture === 'multi-agent'
                        ? "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100"
                        : "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"
                    }`}>
                      {analysis.recommended_architecture === 'multi-agent'
                        ? '🟣 멀티 에이전트'
                        : '🔵 싱글 에이전트'}
                    </Badge>
                    {analysis.multi_agent_pattern && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                        {MULTI_AGENT_PATTERN_LABELS[analysis.multi_agent_pattern]}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {analysis.architecture_reason && (
                <div className="flex-1 md:border-l md:pl-6">
                  <p className="text-sm text-muted-foreground">
                    {analysis.architecture_reason}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 두 번째 행: 준비도 + 다음 단계 */}
        <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <p className="text-base font-medium text-muted-foreground">준비도</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {analysis.improved_feasibility ? (
                  <>
                    <p className="text-lg text-muted-foreground line-through">{feasibility_score}</p>
                    <span className="text-muted-foreground">→</span>
                    <p className="text-xl font-bold text-green-600">{analysis.improved_feasibility.score}/50</p>
                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                      +{analysis.improved_feasibility.score_change}점
                    </Badge>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold">{feasibility_score}/50</p>
                    {(() => {
                      const avgScore = feasibility_score / 5;
                      const level = getReadinessLevel(avgScore);
                      return (
                        <Badge variant="outline" className={`${getLevelBadgeClass(level.color)} gap-1`}>
                          <span>{level.icon}</span>
                          <span className="text-xs">{level.label}</span>
                        </Badge>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-base font-medium text-muted-foreground">다음 단계</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {(() => {
                  const badge = getJudgmentBadge(finalScore);
                  const variantClasses: Record<string, string> = {
                    green: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
                    blue: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
                    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
                    orange: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
                  };
                  const icons: Record<string, string> = {
                    green: "✅",
                    blue: "🔵",
                    yellow: "🟡",
                    orange: "🟠",
                  };
                  return (
                    <Badge className={`${variantClasses[badge.variant] || variantClasses.orange} gap-1 text-base py-1 px-3`}>
                      <span>{icons[badge.variant] || "🟠"}</span>
                      <span>{badge.label}</span>
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            분석 결과
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            대화 내역
          </TabsTrigger>
          <TabsTrigger value="spec" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            명세서
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-6 space-y-6">
          <AnalysisTab
            analysis={analysis}
            formData={formData}
            feasibility={feasibility}
            improvementPlans={improvementPlans}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ChatHistoryTab chatHistory={chatHistory} />
        </TabsContent>

        <TabsContent value="spec" className="mt-6">
          <SpecificationTab
            analysis={analysis}
            chatHistory={chatHistory}
            formData={formData}
            improvementPlans={improvementPlans}
            initialSpecification={initialSpecification}
            onSave={onSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
