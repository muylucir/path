"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, AlertCircle } from "lucide-react";

interface SpecificationProps {
  analysis: any;
}

export function Specification({ analysis }: SpecificationProps) {
  const [spec, setSpec] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const generateSpec = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/bedrock/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "명세서 생성 실패");
      }

      const data = await response.json();
      setSpec(data.specification);
    } catch (err) {
      console.error("Error generating spec:", err);
      setError(err instanceof Error ? err.message : "명세서 생성 중 오류가 발생했습니다");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSpec = () => {
    const blob = new Blob([spec], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-spec-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📄 구현 명세서</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {!spec ? (
          <Button
            onClick={generateSpec}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                명세서 생성 중...
              </>
            ) : (
              "🤖 Claude로 상세 명세서 생성"
            )}
          </Button>
        ) : (
          <>
            <Button onClick={downloadSpec} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              명세서 다운로드 (Markdown)
            </Button>
            <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{spec}</pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
