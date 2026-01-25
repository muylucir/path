"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SDDGenerator } from "@/components/sdd/SDDGenerator";
import { ArrowLeft, FileCode } from "lucide-react";

export default function SDDPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileCode className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">SDD 문서 생성기</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            PATH Agent Designer에서 생성한 명세서를 기반으로
            Spec Driven Development(SDD) 문서를 자동 생성합니다.
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
              생성 문서: requirements.md, design.md, tasks.md, structure.md, tech.md, product.md
            </span>
          </div>
        </div>

        {/* Main Content */}
        <SDDGenerator />

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            SDD 문서는 Kiro CLI와 함께 사용하여 체계적인 Agent 개발을 지원합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
