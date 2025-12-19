"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Step1Form } from "@/components/steps/Step1Form";
import { Step2Analysis } from "@/components/steps/Step2Analysis";
import { Step3ResultsSimplified } from "@/components/steps/Step3ResultsSimplified";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import type { FormValues } from "@/lib/schema";
import type { Analysis, ChatMessage } from "@/lib/types";

const STEPS = ["기본 정보", "Claude 분석", "결과 확인"];

export default function Home() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [specification, setSpecification] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Load from sessionStorage on mount
  useEffect(() => {
    const savedStep = sessionStorage.getItem("currentStep");
    const savedFormData = sessionStorage.getItem("formData");
    const savedChatHistory = sessionStorage.getItem("chatHistory");
    const savedAnalysis = sessionStorage.getItem("analysis");
    const savedSpec = sessionStorage.getItem("specification");

    if (savedFormData) setFormData(JSON.parse(savedFormData));
    if (savedChatHistory) setChatHistory(JSON.parse(savedChatHistory));
    if (savedAnalysis) setAnalysis(JSON.parse(savedAnalysis));
    if (savedSpec) setSpecification(savedSpec);
    
    setIsLoading(false);
    
    // Set step after data is loaded
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  // Don't render until loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  // Save to sessionStorage on state change
  useEffect(() => {
    sessionStorage.setItem("currentStep", currentStep.toString());
  }, [currentStep]);

  const handleStep1Submit = (data: FormValues) => {
    setFormData(data);
    sessionStorage.setItem("formData", JSON.stringify(data));
    setCurrentStep(2);
  };

  const handleStep2Complete = (history: ChatMessage[], analysisData: Analysis) => {
    setChatHistory(history);
    setAnalysis(analysisData);
    sessionStorage.setItem("chatHistory", JSON.stringify(history));
    sessionStorage.setItem("analysis", JSON.stringify(analysisData));
    setCurrentStep(3);
  };

  const handleSave = async (spec: string) => {
    if (!analysis || !formData) return;

    try {
      const sessionData = {
        pain_point: analysis.pain_point,
        input_type: analysis.input_type,
        process_steps: analysis.process_steps,
        output_type: analysis.output_types[0] || "",
        human_loop: analysis.human_loop,
        data_source: formData.dataSources?.map((ds: any) => `${ds.type}: ${ds.description}`).join(", ") || "",
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
        specification: spec,
      };

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        toast.success("저장 완료", {
          description: "분석 결과가 저장되었습니다.",
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("저장 실패", {
        description: "오류가 발생했습니다.",
      });
    }
  };

  const handleNewAnalysis = () => {
    setCurrentStep(1);
    setFormData(null);
    setChatHistory([]);
    setAnalysis(null);
    setSpecification("");
    sessionStorage.clear();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Help Button */}
        <div className="flex justify-end mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                P.A.T.H 프레임워크
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>📚 P.A.T.H 프레임워크</DialogTitle>
                <DialogDescription>
                  AI Agent 아이디어를 프로토타입으로 검증하는 구조화된 방법론
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">🔍 P: Problem Decomposition</h3>
                  <p className="text-muted-foreground">
                    Pain Point를 INPUT, PROCESS, OUTPUT, Human-in-Loop 4가지 요소로 분해
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🎯 A: Agent Pattern Mapping</h3>
                  <p className="text-muted-foreground">
                    Reflection, Tool Use, Planning, Multi-Agent 중 적합한 패턴 선택
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">📊 T: Technical Feasibility</h3>
                  <p className="text-muted-foreground">
                    5개 항목 50점 만점 평가 (데이터 접근성, 판단 명확성, 오류 허용도, 지연 요구사항, 통합 복잡도)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">📋 H: Handoff Specification</h3>
                  <p className="text-muted-foreground">
                    구현 명세서 자동 생성 (Architecture 다이어그램, Agent 컴포넌트 정의 포함)
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <Step1Form onSubmit={handleStep1Submit} />
          )}

          {currentStep === 2 && formData && (
            <Step2Analysis 
              formData={formData} 
              onComplete={handleStep2Complete}
            />
          )}

          {currentStep === 3 && analysis && formData && (
            <div className="space-y-4">
              <Step3ResultsSimplified
                analysis={analysis}
                chatHistory={chatHistory}
                formData={formData}
                initialSpecification={specification}
                onSave={handleSave}
              />
              <div className="flex justify-center">
                <Button onClick={handleNewAnalysis} variant="outline" size="lg">
                  🔄 새로운 분석 시작
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
