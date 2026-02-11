"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Step1Form } from "@/components/steps/Step1Form";
import { HeroSection } from "@/components/layout/HeroSection";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { STEPS } from "@/lib/constants";
import type { FormValues } from "@/lib/schema";

export default function Home() {
  const router = useRouter();
  const [initialData, setInitialData] = useState<FormValues | undefined>(undefined);

  useEffect(() => {
    const saved = sessionStorage.getItem("formData");
    if (saved) {
      try {
        setInitialData(JSON.parse(saved));
      } catch {
        sessionStorage.removeItem("formData");
      }
    }
  }, []);

  const handleSubmit = (data: FormValues) => {
    // 새로운 분석 시작 - 이전 분석 결과 클리어 후 새로 시작
    sessionStorage.removeItem("feasibility");
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
        <Step1Form onSubmit={handleSubmit} initialData={initialData} />
      </div>
    </div>
  );
}
