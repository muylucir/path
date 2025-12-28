"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

interface SpecificationProps {
  analysis: any;
  onGenerated?: (spec: string) => void;
  initialSpec?: string;
  useAgentCore?: boolean;
}

export function Specification({ analysis, onGenerated, initialSpec, useAgentCore }: SpecificationProps) {
  const [spec, setSpec] = useState<string>(initialSpec || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const mermaidInitialized = useRef(false);

  useEffect(() => {
    if (!mermaidInitialized.current) {
      mermaid.initialize({ 
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
      });
      mermaidInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (initialSpec) {
      setSpec(initialSpec);
    }
  }, [initialSpec]);

  useEffect(() => {
    if (spec && !isGenerating) {
      // Render mermaid diagrams after spec is loaded
      setTimeout(() => {
        mermaid.run({
          querySelector: '.mermaid',
        });
      }, 100);
    }
  }, [spec, isGenerating]);

  const generateSpec = async () => {
    setIsGenerating(true);
    setError("");
    setProgress(0);
    setStage("시작 중...");
    let fullSpec = "";

    try {
      const response = await fetch("/api/bedrock/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, useAgentCore }),
      });

      if (!response.ok) {
        throw new Error("명세서 생성 실패");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setSpec(fullSpec);
                onGenerated?.(fullSpec);
                setIsGenerating(false);
                setProgress(100);
                setStage("완료");
                return;
              }
              try {
                const parsed = JSON.parse(data);
                console.log("[SSE] Parsed:", JSON.stringify(parsed));

                // Progress 업데이트
                if (parsed.progress !== undefined) {
                  console.log("[Progress]", parsed.progress);
                  setProgress(parsed.progress);
                }

                // Stage 업데이트
                if (parsed.stage) {
                  console.log("[Stage]", parsed.stage);
                  setStage(parsed.stage);
                }

                // 명세서 텍스트 추가
                if (parsed.text) {
                  console.log("[Text] Adding:", parsed.text.substring(0, 50));
                  fullSpec += parsed.text;
                  setSpec(fullSpec);
                }
              } catch (e) {
                console.error("[SSE] Parse error:", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error generating spec:", err);
      setError(err instanceof Error ? err.message : "명세서 생성 중 오류가 발생했습니다");
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
        
        {!spec && !isGenerating && (
          <Button
            onClick={generateSpec}
            disabled={isGenerating}
            className="w-full"
          >
            🤖 Claude로 상세 명세서 생성
          </Button>
        )}

        {isGenerating && (
          <div className="space-y-3">
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              생성 중...
            </Button>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{stage}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        {spec && !isGenerating && (
          <>
            <div className="flex gap-2">
              <Button onClick={generateSpec} variant="outline" className="flex-1">
                <Loader2 className="h-4 w-4 mr-2" />
                재생성
              </Button>
              <Button onClick={downloadSpec} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </div>
            
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">미리보기</TabsTrigger>
                <TabsTrigger value="raw">Markdown</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg p-6 max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props) {
                        const { node, className, children, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        
                        if (lang === 'mermaid') {
                          return (
                            <div className="mermaid">
                              {String(children).replace(/\n$/, '')}
                            </div>
                          );
                        }
                        
                        return (
                          <code className={className} {...rest}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {spec}
                  </ReactMarkdown>
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="raw" className="mt-4">
                <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto bg-muted/30">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{spec}</pre>
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
