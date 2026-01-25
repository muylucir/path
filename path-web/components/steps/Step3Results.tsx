"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Download, Loader2, BarChart3, MessageSquare, FileText, Rocket, Sparkles, Save, Settings, CheckCircle, RefreshCw, ClipboardList, Globe, Server, Database, HardDrive, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MDXRenderer } from "@/components/analysis/MDXRenderer";
import type { Analysis, ChatMessage } from "@/lib/types";
import { PROCESS_STEPS } from "@/lib/constants";

interface Step3ResultsProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: any;
  initialSpecification?: string;
  onSave: (specification: string) => Promise<void>;
}

export function Step3Results({
  analysis,
  chatHistory,
  formData,
  initialSpecification,
  onSave,
}: Step3ResultsProps) {
  const { feasibility_score, pattern, feasibility_breakdown, risks, next_steps } = analysis;
  const [specification, setSpecification] = useState<string>(initialSpecification || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

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

    const useAgentCore = formData?.useAgentCore ?? true;  // AgentCore 항상 사용
    const integrationDetails = formData?.integrationDetails || [];

    try {
      const response = await fetch("/api/bedrock/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, useAgentCore, integrationDetails }),
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

  const navigateToCodeGenerator = async () => {
    setIsCreatingJob(true);
    try {
      // 메타데이터: analysis에서 우선, 없으면 formData에서 폴백
      const pain_point = analysis.pain_point || formData?.painPoint || null;
      const pattern = analysis.pattern || null;
      const feasibility_score = analysis.feasibility_score || null;

      console.log("Creating job with metadata:", {
        pain_point,
        pattern,
        feasibility_score,
        from_analysis: {
          pain_point: analysis.pain_point,
          pattern: analysis.pattern,
          feasibility_score: analysis.feasibility_score,
        },
        from_formData: {
          painPoint: formData?.painPoint,
        }
      });

      // 1. 코드 생성 작업 생성 (메타데이터 포함)
      const response = await fetch("/api/bedrock/code-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path_spec: specification,
          integration_details: formData?.integrationDetails || [],
          // 메타데이터 추가 (폴백 포함)
          pain_point,
          pattern,
          feasibility_score,
        }),
      });

      if (!response.ok) {
        throw new Error("작업 생성 실패");
      }

      const { job_id } = await response.json();
      console.log("코드 생성 작업 시작:", job_id);

      // 2. 작업 목록 페이지로 리다이렉트
      window.location.href = "/code-jobs";
    } catch (error) {
      console.error("Error creating code generation job:", error);
      alert("코드 생성 작업 생성 중 오류가 발생했습니다.");
      setIsCreatingJob(false);
    }
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
                <p className="text-base font-medium text-muted-foreground">Feasibility</p>
              </div>
              <p className="text-xl font-bold">{feasibility_score}/50</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-base font-medium text-muted-foreground">판정</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {feasibility_score >= 40 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-xl font-bold">Go</p>
                  </>
                ) : feasibility_score >= 30 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <p className="text-xl font-bold">조건부</p>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 text-red-600" />
                    <p className="text-xl font-bold">개선 필요</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            액션
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
                          PROCESS_STEPS.some(ps => ps === step)
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
                // formData.dataSources가 있으면 사용, 없으면 data_source 문자열 파싱
                const hasDataSources = formData?.dataSources?.length > 0 && formData.dataSources[0]?.type;
                const dataSourceStr = formData?.data_source || formData?.dataSource;

                if (hasDataSources) {
                  return (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">데이터 소스</p>
                        <ul className="text-sm space-y-1">
                          {formData.dataSources.map((ds: { type: string; description: string }, idx: number) => (
                            <li key={idx}>• {ds.type}: {ds.description}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  );
                } else if (dataSourceStr) {
                  return (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">데이터 소스</p>
                        <ul className="text-sm space-y-1">
                          {dataSourceStr.split(", ").map((ds: string, idx: number) => (
                            <li key={idx}>• {ds}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  );
                }
                return null;
              })()}

              {/* Integrations */}
              {formData?.integrationDetails?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">선택한 통합</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.integrationDetails.map((int: { type?: string; name: string }, idx: number) => {
                        const typeIcons: Record<string, typeof Globe> = {
                          api: Globe,
                          mcp: Server,
                          rag: Database,
                          s3: HardDrive,
                        };
                        const Icon = int.type ? typeIcons[int.type] : Globe;
                        return (
                          <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                            {Icon && <Icon className="h-3 w-3" />}
                            {int.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

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

          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Feasibility Breakdown */}
              <div>
                <h3 className="font-semibold mb-4">Feasibility 점수</h3>
                <div className="space-y-3">
                  {feasibility_breakdown && Object.entries(feasibility_breakdown).map(([key, value]) => {
                    const score = typeof value === 'object' && value !== null ? value.score : value;
                    const reason = typeof value === 'object' && value !== null ? value.reason : '';
                    
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{key}</span>
                          <span className="font-semibold">{score}/10</span>
                        </div>
                        <Progress value={(score / 10) * 100} />
                        {reason && (
                          <p className="text-xs text-muted-foreground mt-1">{reason}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

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

              <Separator />

              {/* Risks */}
              {risks && risks.length > 0 && (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Chat History */}
        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
                            명세서 다운로드
                          </Button>
                          <Button
                            onClick={navigateToCodeGenerator}
                            disabled={isCreatingJob}
                            className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                          >
                            {isCreatingJob ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                작업 생성 중...
                              </>
                            ) : (
                              <>
                                <Code2 className="h-4 w-4" />
                                Strands 코드 생성
                              </>
                            )}
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

                  <div className="border rounded-lg p-6 max-h-[600px] overflow-y-auto">
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

        {/* Tab 3: Actions + Next Steps */}
        <TabsContent value="actions" className="mt-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  다음 단계
                </h3>
                <ol className="space-y-2 text-sm">
                  {next_steps?.map((step, idx) => (
                    <li key={idx}>{idx + 1}. {step}</li>
                  ))}
                </ol>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !specification}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      세션 저장
                    </>
                  )}
                </Button>
                {!specification && (
                  <p className="text-sm text-muted-foreground text-center">
                    명세서를 먼저 생성해주세요
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
