"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Step3Results } from "@/components/steps/Step3Results";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, ArrowLeft } from "lucide-react";
import type { Analysis, ChatMessage } from "@/lib/types";

const STEPS = ["기본 정보", "Claude 분석", "결과 확인"];

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [formData, setFormData] = useState<any>(null);
  const [specification, setSpecification] = useState<string>("");

  useEffect(() => {
    const analysisData = sessionStorage.getItem("analysis");
    const chatData = sessionStorage.getItem("chatHistory");
    const formDataStr = sessionStorage.getItem("formData");
    const specData = sessionStorage.getItem("specification");

    if (!analysisData || !formDataStr) {
      router.push("/");
      return;
    }

    setAnalysis(JSON.parse(analysisData));
    setChatHistory(chatData ? JSON.parse(chatData) : []);
    setFormData(JSON.parse(formDataStr));
    setSpecification(specData || "");
  }, [router]);

  const handleSave = async (spec: string) => {
    if (!analysis || !formData) return;

    try {
      const existingSessionId = sessionStorage.getItem("currentSessionId");

      if (existingSessionId) {
        // Update existing session's specification only
        const response = await fetch(`/api/sessions/${existingSessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ specification: spec }),
        });

        if (response.ok) {
          toast.success("업데이트 완료", {
            description: "명세서가 업데이트되었습니다.",
          });
        }
      } else {
        // Create new session
        const sessionData = {
          pain_point: analysis.pain_point,
          input_type: analysis.input_type,
          process_steps: analysis.process_steps,
          output_type: analysis.output_types[0] || "",
          human_loop: analysis.human_loop,
          data_source: formData.dataSources?.map((ds: any) => `${ds.type}: ${ds.description}`).join(", ") || "",
          error_tolerance: formData.errorTolerance || "",
          additional_context: formData.additionalContext || "",
          use_agentcore: formData.useAgentCore || false,
          pattern: analysis.pattern,
          pattern_reason: analysis.pattern_reason,
          feasibility_breakdown: analysis.feasibility_breakdown,
          feasibility_score: analysis.feasibility_score,
          recommendation: analysis.recommendation,
          risks: analysis.risks,
          next_steps: analysis.next_steps,
          chat_history: chatHistory,
          specification: spec,
        };

        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData),
        });

        if (response.ok) {
          const data = await response.json();
          // Store the new session ID for future updates
          sessionStorage.setItem("currentSessionId", data.session_id);
          toast.success("저장 완료", {
            description: "분석 결과가 저장되었습니다.",
          });
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("저장 실패", {
        description: "오류가 발생했습니다.",
      });
    }
  };

  const handleNewAnalysis = () => {
    sessionStorage.clear();
    router.push("/");
  };

  if (!analysis || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* 세션 목록으로 돌아가기 버튼 */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.push("/sessions")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            세션 목록
          </Button>
        </div>
        
        <StepIndicator currentStep={3} steps={STEPS} />
        
        <div className="mt-8 space-y-6">
          <Step3Results
            analysis={analysis}
            chatHistory={chatHistory}
            formData={formData}
            initialSpecification={specification}
            onSave={handleSave}
          />
          
          <div className="flex justify-center">
            <Button onClick={handleNewAnalysis} variant="outline" size="lg" className="gap-2">
              <RefreshCw className="h-5 w-5" />
              새로운 분석 시작
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
