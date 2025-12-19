"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Analysis, ChatMessage } from "@/lib/types";

interface NextStepsProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: any;
  specification?: string;
}

export function NextSteps({ analysis, chatHistory, formData, specification }: NextStepsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { next_steps } = analysis;

  const handleNewAnalysis = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const sessionData = {
        pain_point: analysis.pain_point,
        input_type: analysis.input_type,
        process_steps: analysis.process_steps,
        output_type: analysis.output_types[0] || "",
        human_loop: analysis.human_loop,
        data_source: formData.dataSource || "",
        error_tolerance: formData.errorTolerance || "",
        additional_context: formData.additionalContext || "",
        pattern: analysis.pattern,
        pattern_reason: analysis.pattern_reason,
        feasibility_breakdown: analysis.feasibility_breakdown,
        feasibility_score: analysis.feasibility_score,
        recommendation: analysis.recommendation,
        risks: analysis.risks,
        next_steps: analysis.next_steps,
        chat_history: chatHistory,
        specification: specification || "",
      };

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving session:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🚀 다음 단계</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {next_steps.map((step, idx) => (
              <li key={idx} className="text-sm">
                {idx + 1}. {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>액션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                저장 중...
              </>
            ) : saveSuccess ? (
              "✅ 저장 완료!"
            ) : (
              "💾 이 분석 결과 저장"
            )}
          </Button>
          <Button onClick={handleNewAnalysis} variant="outline" className="w-full">
            🔄 새로운 분석 시작
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
