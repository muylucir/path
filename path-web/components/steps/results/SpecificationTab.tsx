"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Sparkles, Save } from "lucide-react";
import { MDXRenderer } from "@/components/analysis/MDXRenderer";
import { useSSEStream } from "@/lib/hooks/useSSEStream";
import type { Analysis, ChatMessage, FormData, ImprovementPlans, TokenUsage } from "@/lib/types";

interface SpecificationTabProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: FormData;
  improvementPlans?: ImprovementPlans;
  initialSpecification?: string;
  onSave: (specification: string) => Promise<void>;
  onUsage?: (usage: TokenUsage) => void;
}

export function SpecificationTab({
  analysis,
  chatHistory,
  formData,
  improvementPlans,
  initialSpecification,
  onSave,
  onUsage,
}: SpecificationTabProps) {
  const [specification, setSpecification] = useState<string>(initialSpecification || "");
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const fullSpecRef = useRef("");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(specification);
    } finally {
      setIsSaving(false);
    }
  };

  const { start: startGeneration, isStreaming: isGenerating } = useSSEStream({
    url: "/api/bedrock/spec",
    body: {
      analysis,
      improvementPlans: improvementPlans || {},
      chatHistory: chatHistory || [],
      additionalContext: {
        sources: formData?.additionalSources || "",
        context: formData?.additionalContext || "",
      },
    },
    onChunk: useCallback((parsed: any) => {
      if (parsed.text) {
        fullSpecRef.current += parsed.text;
        setSpecification(fullSpecRef.current);
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
      setSpecification(fullSpecRef.current);
      sessionStorage.setItem("specification", fullSpecRef.current);
      setProgress(100);
      setStage("완료");
    }, []),
    onError: useCallback((err: string) => {
      console.error("Spec generation error:", err);
    }, []),
  });

  const generateSpec = useCallback(() => {
    fullSpecRef.current = "";
    setSpecification("");
    setProgress(0);
    setStage("시작 중...");
    startGeneration();
  }, [startGeneration]);

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
                <pre className="text-sm whitespace-pre-wrap font-mono">{specification}</pre>
              ) : (
                <MDXRenderer content={specification} />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
