"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Step3PatternAnalysis } from "@/components/steps/Step3PatternAnalysis";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { STEPS } from "@/lib/constants";
import type { ChatMessage, Analysis, FeasibilityEvaluation, ImprovementPlans } from "@/lib/types";

export default function AnalyzePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);
  const [feasibility, setFeasibility] = useState<FeasibilityEvaluation | null>(null);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlans>({});

  useEffect(() => {
    const formDataStr = sessionStorage.getItem("formData");
    const feasibilityStr = sessionStorage.getItem("feasibility");
    const improvementPlansStr = sessionStorage.getItem("improvementPlans");

    if (!formDataStr) {
      router.push("/");
      return;
    }

    if (!feasibilityStr) {
      router.push("/feasibility");
      return;
    }

    setFormData(JSON.parse(formDataStr));
    setFeasibility(JSON.parse(feasibilityStr));
    setImprovementPlans(improvementPlansStr ? JSON.parse(improvementPlansStr) : {});
  }, [router]);

  const handleComplete = (chatHistory: ChatMessage[], analysis: Analysis) => {
    sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    sessionStorage.setItem("analysis", JSON.stringify(analysis));
    router.push("/results");
  };

  if (!formData || !feasibility) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <StepIndicator currentStep={3} steps={[...STEPS]} />
        <div className="mt-8">
          <Step3PatternAnalysis
            formData={formData}
            feasibility={feasibility}
            improvementPlans={improvementPlans}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}
