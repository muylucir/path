"use client";

import { useRouter } from "next/navigation";
import { Step1Form } from "@/components/steps/Step1Form";
import { HeroSection } from "@/components/layout/HeroSection";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { STEPS } from "@/lib/constants";
import type { FormValues } from "@/lib/schema";

export default function Home() {
  const router = useRouter();

  const handleSubmit = (data: FormValues) => {
    // 새로운 분석 시작 - LLM 대화 데이터만 클리어 (formData는 새로 저장)
    sessionStorage.removeItem("chatHistory");
    sessionStorage.removeItem("analysis");
    sessionStorage.setItem("formData", JSON.stringify(data));
    router.push("/feasibility");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <StepIndicator currentStep={1} steps={[...STEPS]} />
        <HeroSection />
        <Step1Form onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
