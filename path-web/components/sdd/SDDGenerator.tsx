"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MDXRenderer } from "@/components/analysis/MDXRenderer";
import {
  FileText,
  Download,
  Loader2,
  Play,
  Upload,
  FolderTree,
  Code,
  Package,
  ClipboardList,
  Layers,
} from "lucide-react";

interface SDDResult {
  specs: {
    "requirements.md": string;
    "design.md": string;
    "tasks.md": string;
  };
  steering: {
    "structure.md": string;
    "tech.md": string;
    "product.md": string;
  };
}

export function SDDGenerator() {
  const [specInput, setSpecInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<SDDResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("requirements");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // session_id로 /tmp에서 파일 내용 조회
  const fetchSDDFiles = async (sid: string) => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch(`/api/bedrock/sdd/files/${sid}`);
      if (response.ok) {
        const data = await response.json();
        console.log("[SDD Files] Loaded from /tmp:", Object.keys(data.specs || {}));
        setResult(data);
      } else {
        console.error("[SDD Files] Failed to fetch:", response.status);
      }
    } catch (error) {
      console.error("[SDD Files] Error:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSpecInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const generateSDD = async () => {
    if (!specInput.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setStage("시작 중...");
    setResult(null);
    setSessionId(null);

    let receivedSessionId: string | null = null;

    try {
      const response = await fetch("/api/bedrock/sdd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: specInput }),
      });

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
                setIsGenerating(false);
                setProgress(100);
                setStage("파일 로딩 중...");
                // session_id로 파일 내용 조회
                if (receivedSessionId) {
                  await fetchSDDFiles(receivedSessionId);
                }
                setStage("완료");
                return;
              }
              try {
                const parsed = JSON.parse(data);

                if (parsed.progress !== undefined) {
                  setProgress(parsed.progress);
                }

                if (parsed.stage) {
                  setStage(parsed.stage);
                }

                if (parsed.session_id) {
                  console.log("[SSE] Session ID received:", parsed.session_id);
                  receivedSessionId = parsed.session_id;
                  setSessionId(parsed.session_id);
                }

                if (parsed.error) {
                  console.error("Error:", parsed.error);
                  setIsGenerating(false);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsGenerating(false);
    }
  };

  const downloadZip = async () => {
    if (!sessionId) {
      console.log("[ZIP Download] No sessionId - cannot download");
      return;
    }

    console.log("[ZIP Download] Using sessionId:", sessionId);

    setIsDownloading(true);
    try {
      const response = await fetch("/api/bedrock/sdd/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sdd-documents-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadSingleFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar - 버튼과 진행률 위쪽 배치 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* 버튼 영역 */}
            <div className="flex items-center gap-3">
              <Button
                onClick={generateSDD}
                disabled={!specInput.trim() || isGenerating}
                size="lg"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    SDD 문서 생성
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={downloadZip}
                disabled={!sessionId || isDownloading || isGenerating}
                className="gap-2"
                title={!sessionId ? "먼저 SDD 문서를 생성하세요" : ""}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    다운로드 중...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    ZIP 다운로드
                  </>
                )}
              </Button>

              <div className="flex-1" />

              {/* 파일 업로드 */}
              <div className="flex items-center gap-2">
                <Label htmlFor="spec-file" className="text-sm text-muted-foreground whitespace-nowrap">
                  파일 업로드:
                </Label>
                <input
                  id="spec-file"
                  type="file"
                  accept=".md,.txt"
                  onChange={handleFileUpload}
                  className="block w-auto text-sm text-gray-500
                    file:mr-2 file:py-1.5 file:px-3
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-secondary file:text-secondary-foreground
                    hover:file:bg-secondary/80
                    cursor-pointer"
                />
              </div>
            </div>

            {/* 진행률 표시 */}
            {(isGenerating || progress > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{stage}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section - 프로그레스바 바로 아래 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              생성된 SDD 문서
            </CardTitle>
            <CardDescription>
              각 탭을 클릭하여 생성된 문서를 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="requirements" className="gap-1">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Requirements</span>
                </TabsTrigger>
                <TabsTrigger value="design" className="gap-1">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Design</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-1">
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">Tasks</span>
                </TabsTrigger>
                <TabsTrigger value="structure" className="gap-1">
                  <FolderTree className="h-4 w-4" />
                  <span className="hidden sm:inline">Structure</span>
                </TabsTrigger>
                <TabsTrigger value="tech" className="gap-1">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Tech</span>
                </TabsTrigger>
                <TabsTrigger value="product" className="gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Product</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requirements" className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSingleFile(
                        "requirements.md",
                        result.specs["requirements.md"]
                      )
                    }
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    다운로드
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 max-h-[600px] overflow-auto">
                  <MDXRenderer content={result.specs["requirements.md"]} />
                </div>
              </TabsContent>

              <TabsContent value="design" className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSingleFile("design.md", result.specs["design.md"])
                    }
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    다운로드
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 max-h-[600px] overflow-auto">
                  <MDXRenderer content={result.specs["design.md"]} />
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSingleFile("tasks.md", result.specs["tasks.md"])
                    }
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    다운로드
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 max-h-[600px] overflow-auto">
                  <MDXRenderer content={result.specs["tasks.md"]} />
                </div>
              </TabsContent>

              <TabsContent value="structure" className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSingleFile(
                        "structure.md",
                        result.steering["structure.md"]
                      )
                    }
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    다운로드
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 max-h-[600px] overflow-auto">
                  <MDXRenderer content={result.steering["structure.md"]} />
                </div>
              </TabsContent>

              <TabsContent value="tech" className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSingleFile("tech.md", result.steering["tech.md"])
                    }
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    다운로드
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 max-h-[600px] overflow-auto">
                  <MDXRenderer content={result.steering["tech.md"]} />
                </div>
              </TabsContent>

              <TabsContent value="product" className="mt-4">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadSingleFile(
                        "product.md",
                        result.steering["product.md"]
                      )
                    }
                    className="gap-1"
                  >
                    <Download className="h-3 w-3" />
                    다운로드
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 max-h-[600px] overflow-auto">
                  <MDXRenderer content={result.steering["product.md"]} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Input Section - 명세서 입력 (아래쪽 배치) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            PATH 명세서 입력
          </CardTitle>
          <CardDescription>
            PATH Agent Designer에서 생성한 명세서를 붙여넣거나 위에서 파일을 업로드하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="spec-input"
            placeholder="# AI Agent Design Specification&#10;&#10;# 1. Executive Summary&#10;- **Problem**: ...&#10;- **Solution**: ...&#10;&#10;# 2. Strands Agent 구현&#10;..."
            value={specInput}
            onChange={(e) => setSpecInput(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
