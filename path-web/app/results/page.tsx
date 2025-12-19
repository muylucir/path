"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Step3Results } from "@/components/steps/Step3Results";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Analysis, ChatMessage } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [formData, setFormData] = useState<any>(null);
  const [specification, setSpecification] = useState<string>("");

  useEffect(() => {
    const analysisData = sessionStorage.getItem("analysis");
    const chatData = sessionStorage.getItem("chatHistory");
    const formDataStr = sessionStorage.getItem("formData");
    const specData = sessionStorage.getItem("specification");

    if (!analysisData || !chatData || !formDataStr) {
      router.push("/");
      return;
    }

    setAnalysis(JSON.parse(analysisData));
    setChatHistory(JSON.parse(chatData));
    setFormData(JSON.parse(formDataStr));
    setSpecification(specData || "");
  }, [router]);

  if (!analysis || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <Sidebar />
      <div className="flex-1 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">3️⃣ 분석 결과</h1>
        <Step3Results 
          analysis={analysis} 
          chatHistory={chatHistory} 
          formData={formData}
          initialSpecification={specification}
        />
      </div>
    </div>
  );
}
