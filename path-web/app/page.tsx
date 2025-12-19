"use client";

import { useRouter } from "next/navigation";
import { Step1FormClean } from "@/components/steps/Step1FormClean";
import type { FormValues } from "@/lib/schema";

export default function Home() {
  const router = useRouter();

  const handleSubmit = (data: FormValues) => {
    sessionStorage.setItem("formData", JSON.stringify(data));
    router.push("/analyze");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Agent 아이디어 분석</h1>
          <p className="text-muted-foreground">
            P.A.T.H 프레임워크로 실현 가능성을 빠르게 검증하세요
          </p>
        </div>

        <Step1FormClean onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
