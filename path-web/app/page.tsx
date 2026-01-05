"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Step1Form } from "@/components/steps/Step1Form";
import { HeroSection } from "@/components/layout/HeroSection";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Button } from "@/components/ui/button";
import { Settings2, History } from "lucide-react";
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
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-end gap-2 py-2">
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                세션 기록
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                통합 설정
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <StepIndicator currentStep={1} steps={STEPS} />
        <HeroSection />
        <Step1Form onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
