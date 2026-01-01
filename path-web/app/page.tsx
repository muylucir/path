"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Step1Form } from "@/components/steps/Step1Form";
import { HeroSection } from "@/components/layout/HeroSection";
import { StepIndicator } from "@/components/layout/StepIndicator";
import type { FormValues } from "@/lib/schema";

const STEPS = ["입력", "분석", "결과"];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Clear sessionStorage when visiting home page
    sessionStorage.clear();
  }, []);

  const handleSubmit = (data: FormValues) => {
    sessionStorage.setItem("formData", JSON.stringify(data));
    router.push("/analyze");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <StepIndicator currentStep={1} steps={STEPS} />
        <HeroSection />
        <Step1Form onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
