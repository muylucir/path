"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Step2Readiness } from "@/components/steps/Step2Readiness";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { TokenUsageBadge } from "@/components/layout/TokenUsageBadge";
import { useTokenUsage } from "@/lib/hooks/useTokenUsage";
import { STEPS } from "@/lib/constants";
import type { FeasibilityEvaluation, ImprovementPlans } from "@/lib/types";

export default function FeasibilityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);
  const [feasibility, setFeasibility] = useState<FeasibilityEvaluation | null>(null);
  const [improvementPlans, setImprovementPlans] = useState<ImprovementPlans>({});
  const { usage, addUsage } = useTokenUsage();

  useEffect(() => {
    const data = sessionStorage.getItem("formData");
    if (!data) {
      router.push("/");
      return;
    }

    try {
      setFormData(JSON.parse(data));
    } catch {
      sessionStorage.removeItem("formData");
      router.push("/");
      return;
    }

    // 기존 feasibility 결과가 있으면 로드
    const existingFeasibility = sessionStorage.getItem("feasibility");
    if (existingFeasibility) {
      try {
        setFeasibility(JSON.parse(existingFeasibility));
      } catch {
        sessionStorage.removeItem("feasibility");
      }
    }

    // 기존 improvementPlans가 있으면 로드
    const existingImprovementPlans = sessionStorage.getItem("improvementPlans");
    if (existingImprovementPlans) {
      try {
        setImprovementPlans(JSON.parse(existingImprovementPlans));
      } catch {
        sessionStorage.removeItem("improvementPlans");
      }
    }
  }, [router]);

  const handleComplete = (feasibilityResult: FeasibilityEvaluation, userImprovementPlans: ImprovementPlans) => {
    sessionStorage.setItem("feasibility", JSON.stringify(feasibilityResult));
    sessionStorage.setItem("improvementPlans", JSON.stringify(userImprovementPlans));
    // 패턴 분석 단계로 진행 시 새로운 LLM 대화 시작
    sessionStorage.removeItem("chatHistory");
    sessionStorage.removeItem("analysis");
    router.push("/analyze");
  };

  const handleFormDataUpdate = (updatedFormData: any) => {
    setFormData(updatedFormData);
    sessionStorage.setItem("formData", JSON.stringify(updatedFormData));
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <StepIndicator currentStep={2} steps={[...STEPS]} />
        <div className="mt-8">
          <Step2Readiness
            formData={formData}
            initialFeasibility={feasibility}
            initialImprovementPlans={improvementPlans}
            onComplete={handleComplete}
            onFormDataUpdate={handleFormDataUpdate}
            onUsage={addUsage}
          />
        </div>
        <TokenUsageBadge usage={usage} />
      </div>
    </div>
  );
}
