"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Step2Analysis } from "@/components/steps/Step2Analysis";
import { StepIndicator } from "@/components/layout/StepIndicator";
import type { ChatMessage, Analysis } from "@/lib/types";

const STEPS = ["기본 정보", "Claude 분석", "결과 확인"];

export default function AnalyzePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("formData");
    if (!data) {
      router.push("/");
      return;
    }
    setFormData(JSON.parse(data));
  }, [router]);

  const handleComplete = (chatHistory: ChatMessage[], analysis: Analysis) => {
    sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    sessionStorage.setItem("analysis", JSON.stringify(analysis));
    router.push("/results");
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <StepIndicator currentStep={2} steps={STEPS} />
        <div className="mt-8">
          <Step2Analysis formData={formData} onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
