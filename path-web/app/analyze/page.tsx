"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Step2Analysis } from "@/components/steps/Step2Analysis";
import { Sidebar } from "@/components/layout/Sidebar";
import type { ChatMessage, Analysis } from "@/lib/types";

export default function AnalyzePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // Load form data from sessionStorage
    const data = sessionStorage.getItem("formData");
    if (!data) {
      router.push("/");
      return;
    }
    setFormData(JSON.parse(data));
  }, [router]);

  const handleComplete = (chatHistory: ChatMessage[], analysis: Analysis) => {
    // Store analysis and chat history
    sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    sessionStorage.setItem("analysis", JSON.stringify(analysis));
    
    // Navigate to results page
    router.push("/results");
  };

  if (!formData) {
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
      <div className="flex-1 max-w-4xl">
        <Step2Analysis formData={formData} onComplete={handleComplete} />
      </div>
    </div>
  );
}
