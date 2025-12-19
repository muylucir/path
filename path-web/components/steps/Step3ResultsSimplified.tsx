"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Analysis, ChatMessage } from "@/lib/types";

interface Step3ResultsSimplifiedProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: any;
  initialSpecification?: string;
  onSave: (specification: string) => void;
}

export function Step3ResultsSimplified({
  analysis,
  chatHistory,
  formData,
  initialSpecification,
  onSave,
}: Step3ResultsSimplifiedProps) {
  const { feasibility_score, pattern, feasibility_breakdown, risks, next_steps } = analysis;
  const [specification, setSpecification] = useState<string>(initialSpecification || "");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSpec = async () => {
    setIsGenerating(true);
    let fullSpec = "";

    try {
      const response = await fetch("/api/bedrock/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
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
                return;
              }
              try {
                const parsed = JSON.parse(data);
                fullSpec += parsed.text;
                setSpecification(fullSpec);
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
              <p className="text-sm text-muted-foreground mb-1">추천 패턴</p>
              <p className="text-xl font-bold">{pattern}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Feasibility</p>
              <p className="text-xl font-bold">{feasibility_score}/50</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">판정</p>
              <p className="text-xl font-bold">
                {feasibility_score >= 40
                  ? "✅ Go"
                  : feasibility_score >= 30
                  ? "⚠️ 조건부"
                  : "🔄 개선 필요"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">📊 분석 결과</TabsTrigger>
          <TabsTrigger value="spec">📋 명세서</TabsTrigger>
          <TabsTrigger value="actions">🚀 액션</TabsTrigger>
        </TabsList>

        {/* Tab 1: Analysis + Risks */}
        <TabsContent value="analysis" className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Feasibility Breakdown */}
              <div>
                <h3 className="font-semibold mb-4">Feasibility 점수</h3>
                <div className="space-y-3">
                  {Object.entries(feasibility_breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{key}</span>
                        <span className="font-semibold">{value}/10</span>
                      </div>
                      <Progress value={(value / 10) * 100} />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Problem Decomposition */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">📥 INPUT</h4>
                  <p className="text-sm text-muted-foreground">{analysis.input_type}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📤 OUTPUT</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {analysis.output_types.map((type, idx) => (
                      <li key={idx}>• {type}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚙️ PROCESS</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysis.process_steps.map((step, idx) => (
                    <li key={idx}>{idx + 1}. {step}</li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Risks */}
              {risks.length > 0 && (
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

        {/* Tab 2: Specification */}
        <TabsContent value="spec" className="mt-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!specification && !isGenerating && (
                <Button onClick={generateSpec} className="w-full" size="lg">
                  🤖 Claude로 상세 명세서 생성
                </Button>
              )}

              {(specification || isGenerating) && (
                <>
                  {!isGenerating && (
                    <Button onClick={downloadSpec} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      명세서 다운로드 (Markdown)
                    </Button>
                  )}

                  <div className="border rounded-lg p-6 max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {specification}
                    </ReactMarkdown>
                    {isGenerating && (
                      <div className="flex items-center gap-2 mt-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">생성 중...</span>
                      </div>
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
                <h3 className="font-semibold mb-3">🚀 다음 단계</h3>
                <ol className="space-y-2 text-sm">
                  {next_steps.map((step, idx) => (
                    <li key={idx}>{idx + 1}. {step}</li>
                  ))}
                </ol>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button
                  onClick={() => onSave(specification)}
                  className="w-full"
                  size="lg"
                >
                  💾 이 분석 결과 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
