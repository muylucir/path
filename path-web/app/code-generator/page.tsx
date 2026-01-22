"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeGenerator } from "@/components/code-generator/CodeGenerator";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const STEPS = ["기본 정보", "Claude 분석", "결과 확인", "코드 생성"];

export default function CodeGeneratorPage() {
  const router = useRouter();
  const [pathSpec, setPathSpec] = useState<string>("");
  const [integrationDetails, setIntegrationDetails] = useState<any[]>([]);

  useEffect(() => {
    // sessionStorage에서 명세서와 통합 정보 가져오기
    const specData = sessionStorage.getItem("specification");
    const formDataStr = sessionStorage.getItem("formData");

    if (!specData) {
      // 명세서가 없으면 결과 페이지로 리다이렉트
      router.push("/results");
      return;
    }

    setPathSpec(specData);

    if (formDataStr) {
      const formData = JSON.parse(formDataStr);
      setIntegrationDetails(formData.integrationDetails || []);
    }
  }, [router]);

  if (!pathSpec) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 뒤로 가기 버튼 */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.push("/results")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            결과 페이지로 돌아가기
          </Button>
        </div>

        <StepIndicator currentStep={4} steps={STEPS} />

        <div className="mt-8">
          <CodeGenerator
            pathSpec={pathSpec}
            integrationDetails={integrationDetails}
          />
        </div>
      </div>
    </div>
  );
}
