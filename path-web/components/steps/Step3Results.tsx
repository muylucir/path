"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailedAnalysis } from "@/components/analysis/DetailedAnalysis";
import { ChatHistory } from "@/components/analysis/ChatHistory";
import { Specification } from "@/components/analysis/Specification";
import { Risks } from "@/components/analysis/Risks";
import { NextSteps } from "@/components/analysis/NextSteps";
import type { Analysis, ChatMessage } from "@/lib/types";

interface Step3ResultsProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: any;
}

export function Step3Results({ analysis, chatHistory, formData }: Step3ResultsProps) {
  const { feasibility_score, pattern } = analysis;
  const [specification, setSpecification] = useState<string>("");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">추천 패턴</p>
              <p className="text-xl font-bold">{pattern}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Feasibility</p>
              <p className="text-xl font-bold">{feasibility_score}/50</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">판정</p>
              <p className="text-xl font-bold">
                {feasibility_score >= 40
                  ? "✅ Go"
                  : feasibility_score >= 30
                  ? "⚠️ 조건부"
                  : "🔄 개선 필요"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {feasibility_score >= 40
                  ? "높은 성공률"
                  : feasibility_score >= 30
                  ? "리스크 관리 필요"
                  : "선행 작업 필요"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">📊 상세 분석</TabsTrigger>
          <TabsTrigger value="chat">💬 대화 내역</TabsTrigger>
          <TabsTrigger value="spec">📋 명세서</TabsTrigger>
          <TabsTrigger value="risks">⚠️ 리스크</TabsTrigger>
          <TabsTrigger value="next">🚀 다음 단계</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-6">
          <DetailedAnalysis analysis={analysis} />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ChatHistory messages={chatHistory} />
        </TabsContent>

        <TabsContent value="spec" className="mt-6">
          <Specification analysis={analysis} onGenerated={setSpecification} />
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <Risks analysis={analysis} />
        </TabsContent>

        <TabsContent value="next" className="mt-6">
          <NextSteps 
            analysis={analysis} 
            chatHistory={chatHistory} 
            formData={formData}
            specification={specification}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
