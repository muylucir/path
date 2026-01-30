"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Download, Loader2, BarChart3, MessageSquare, FileText, Sparkles, Save, Settings, CheckCircle, RefreshCw, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MDXRenderer } from "@/components/analysis/MDXRenderer";
import type { Analysis, ChatMessage, FeasibilityEvaluation, FeasibilityItemDetail, ImprovementPlans, ImprovedFeasibility, ImprovedFeasibilityItem } from "@/lib/types";
import { PROCESS_STEPS, READINESS_LEVELS, FEASIBILITY_ITEM_NAMES, READINESS_ITEM_DETAILS } from "@/lib/constants";

interface Step3ResultsProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: any;
  feasibility?: FeasibilityEvaluation | null;
  improvementPlans?: ImprovementPlans;
  initialSpecification?: string;
  onSave: (specification: string) => Promise<void>;
}

type ReadinessKey = keyof typeof FEASIBILITY_ITEM_NAMES;

// 점수에 따른 레벨 반환
function getReadinessLevel(score: number) {
  if (score >= 8) return READINESS_LEVELS.READY;
  if (score >= 6) return READINESS_LEVELS.GOOD;
  if (score >= 4) return READINESS_LEVELS.NEEDS_WORK;
  return READINESS_LEVELS.PREPARE;
}

// 레벨에 따른 배지 스타일
function getLevelBadgeClass(color: string) {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "orange":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
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
  const { feasibility_score, pattern, feasibility_breakdown, risks, improved_feasibility } = analysis;
  // 최종 점수: improved_feasibility가 있으면 그 점수 사용
  const finalScore = improved_feasibility?.score ?? feasibility_score;
  const [specification, setSpecification] = useState<string>(initialSpecification || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(specification);
    } finally {
      setIsSaving(false);
    }
  };

  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  const generateSpec = async () => {
    setIsGenerating(true);
    setProgress(0);
    setStage("시작 중...");
    let fullSpec = "";

    try {
      const response = await fetch("/api/bedrock/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          improvementPlans: improvementPlans || {},
          chatHistory: chatHistory || [],
          additionalContext: {
            sources: formData?.additionalSources || "",
            context: formData?.additionalContext || "",
          },
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setSpecification(fullSpec);
                sessionStorage.setItem("specification", fullSpec);
                setIsGenerating(false);
                setProgress(100);
                setStage("완료");
                return;
              }
              try {
                const parsed = JSON.parse(data);

                // Progress 업데이트
                if (parsed.progress !== undefined) {
                  setProgress(parsed.progress);
                }

                // Stage 업데이트
                if (parsed.stage) {
                  setStage(parsed.stage);
                }

                // 명세서 텍스트 추가 (text 필드가 있을 때만)
                if (parsed.text) {
                  fullSpec += parsed.text;
                  setSpecification(fullSpec);
                }
              } catch (e) {
                // Ignore
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsGenerating(false);
    }
  };

  const downloadSpec = () => {
    const blob = new Blob([specification], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-spec-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <p className="text-base font-medium text-muted-foreground">추천 패턴</p>
              </div>
              <p className="text-xl font-bold">{pattern}</p>
            </div>
          </CardContent>
        </Card>

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
                {finalScore >= 40 ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 gap-1 text-base py-1 px-3">
                    <span>✅</span>
                    <span>바로 진행</span>
                  </Badge>
                ) : finalScore >= 30 ? (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 gap-1 text-base py-1 px-3">
                    <span>🔵</span>
                    <span>보완 후 진행</span>
                  </Badge>
                ) : finalScore >= 20 ? (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 gap-1 text-base py-1 px-3">
                    <span>🟡</span>
                    <span>재검토 권장</span>
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 gap-1 text-base py-1 px-3">
                    <span>🟠</span>
                    <span>준비 필요</span>
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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

        {/* Tab 1: Analysis + Risks */}
        <TabsContent value="analysis" className="mt-6 space-y-6">
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
                <p className="text-sm">{formData?.painPoint || formData?.pain_point || analysis?.pain_point || "-"}</p>
              </div>

              <Separator />

              {/* INPUT / PROCESS / OUTPUT */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">INPUT</p>
                  <p className="text-sm font-medium">
                    {formData?.inputType || formData?.input_type || analysis?.input_type || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PROCESS (사용자 선택)</p>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const steps = formData?.processSteps || [];
                      if (steps.length > 0) {
                        // 사용자 선택인지 확인 (PROCESS_STEPS 상수와 매칭)
                        const isUserSelection = steps.some((step: string) =>
                          PROCESS_STEPS.some(ps => ps.label === step)
                        );
                        if (isUserSelection) {
                          return steps.map((step: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{step}</Badge>
                          ));
                        }
                        // Claude 분석 결과인 경우 (하위 호환)
                        return <span className="text-sm text-muted-foreground">아래 Claude 분석 참조</span>;
                      }
                      return <span className="text-sm text-muted-foreground">-</span>;
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">OUTPUT</p>
                  <div className="flex flex-wrap gap-1">
                    {(formData?.outputTypes || formData?.output_types || analysis?.output_types)?.map((type: string, idx: number) => (
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
                  <p className="text-sm">{formData?.humanLoop || formData?.human_loop || analysis?.human_loop || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">오류 허용도</p>
                  <p className="text-sm">{formData?.errorTolerance || formData?.error_tolerance || "-"}</p>
                </div>
              </div>

              {/* Data Sources */}
              {(() => {
                const additionalSources = formData?.additionalSources;
                // 레거시: data_source 문자열 (구 세션과의 하위 호환성)
                const legacyDataSource = formData?.data_source || formData?.dataSource;

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
                  // 레거시 데이터소스 표시 (하위 호환성)
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

          {/* Step 2: 준비도 점검 결과 (feasibility 데이터가 있을 때만 표시) */}
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
        </TabsContent>

        {/* Tab 2: Chat History */}
        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[calc(100vh-300px)] min-h-[400px] overflow-y-auto">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-xs font-semibold mb-2">
                        {msg.role === "user" ? "You" : "Claude"}
                      </div>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        <MDXRenderer content={msg.content} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Specification */}
        <TabsContent value="spec" className="mt-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!specification && !isGenerating && (
                <Button
                  onClick={generateSpec}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5" />
                  Claude로 상세 명세서 생성
                </Button>
              )}

              {(specification || isGenerating) && (
                <>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {!isGenerating && (
                        <>
                          <Button onClick={generateSpec} variant="outline" className="flex-1">
                            <Loader2 className="h-4 w-4 mr-2" />
                            재생성
                          </Button>
                          <Button onClick={downloadSpec} variant="outline" className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            다운로드
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {isSaving ? "저장 중..." : "세션 저장"}
                          </Button>
                        </>
                      )}
                      {isGenerating && (
                        <Button disabled className="w-full">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          생성 중...
                        </Button>
                      )}
                    </div>

                    {isGenerating && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{stage}</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg p-6 max-h-[calc(100vh-350px)] min-h-[400px] overflow-y-auto">
                    {isGenerating ? (
                      <>
                        <pre className="text-sm whitespace-pre-wrap font-mono">{specification}</pre>
                      </>
                    ) : (
                      <MDXRenderer content={specification} />
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
