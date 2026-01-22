"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Code2,
  Download,
  Loader2,
  CheckCircle,
  FileCode,
  Package,
  Settings,
  FileText,
  Container,
  BookOpen,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface CodeGeneratorProps {
  pathSpec: string;
  integrationDetails: any[];
}

interface GeneratedFiles {
  "agent.py": string;
  "tools.py": string;
  "agentcore_config.py": string;
  "requirements.txt": string;
  "Dockerfile": string;
  "deploy_guide.md": string;
}

export function CodeGenerator({ pathSpec, integrationDetails }: CodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");

  // 자동 코드 생성 시작
  useEffect(() => {
    generateCode();
  }, []);

  const generateCode = async () => {
    setIsGenerating(true);
    setIsComplete(false);
    setProgress(0);
    setCurrentMessage("코드 생성 시작...");

    try {
      const response = await fetch("/api/bedrock/code-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathSpec,
          integrationDetails
        }),
      });

      if (!response.ok) {
        throw new Error("코드 생성 실패");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("스트림 읽기 실패");
      }

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
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.status === "progress") {
                setCurrentMessage(parsed.message);
                // 백엔드에서 전송한 정확한 진행률 사용
                if (parsed.progress !== undefined) {
                  setProgress(parsed.progress);
                }
              } else if (parsed.status === "complete") {
                setGeneratedFiles(parsed.files as GeneratedFiles);
                setIsComplete(true);
                setProgress(100);
                setCurrentMessage(parsed.message);
                toast.success("코드 생성 완료", {
                  description: `${parsed.file_count}개 파일이 생성되었습니다.`
                });
              } else if (parsed.status === "error") {
                throw new Error(parsed.message);
              }
            } catch (e) {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error generating code:", error);
      const errorMessage = error.name === 'AbortError'
        ? "요청 시간이 초과되었습니다. 명세서가 너무 복잡하거나 서버 응답이 느립니다."
        : error.message || "알 수 없는 오류가 발생했습니다.";

      toast.error("코드 생성 실패", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllAsZip = async () => {
    try {
      const response = await fetch("/api/bedrock/code-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathSpec,
          integrationDetails
        }),
      });

      if (!response.ok) {
        throw new Error("다운로드 실패");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `strands-agent-code-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("다운로드 완료");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("다운로드 실패");
    }
  };

  const copyToClipboard = async (filename: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(filename);
      toast.success(`${filename} 복사 완료`);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (error) {
      toast.error("복사 실패");
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".py")) return <FileCode className="h-4 w-4" />;
    if (filename === "requirements.txt") return <Package className="h-4 w-4" />;
    if (filename === "Dockerfile") return <Container className="h-4 w-4" />;
    if (filename.endsWith(".md")) return <BookOpen className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getFileDescription = (filename: string) => {
    const descriptions: Record<string, string> = {
      "agent.py": "GraphBuilder 기반 Multi-Agent 정의 + FastAPI 엔드포인트",
      "tools.py": "boto3 직접 호출 또는 MCP 서버 연결 도구",
      "agentcore_config.py": "Runtime/Memory/Gateway/Identity 설정",
      "requirements.txt": "Python 의존성 목록",
      "Dockerfile": "AgentCore Runtime용 컨테이너 이미지",
      "deploy_guide.md": "ECR 푸시 및 Runtime 배포 가이드"
    };
    return descriptions[filename] || "";
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-6 w-6" />
            Strands Agent SDK 코드 생성
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            PATH 명세서를 기반으로 배포 가능한 Strands Agent 코드를 생성합니다.
          </p>
        </CardHeader>
        <CardContent>
          {/* 생성 상태 */}
          {isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">코드 생성 중...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between items-center text-sm">
                <p className="text-muted-foreground">{currentMessage}</p>
                <span className="font-medium">{progress}%</span>
              </div>
            </div>
          )}

          {/* 생성 완료 */}
          {isComplete && generatedFiles && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">코드 생성 완료!</span>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadAllAsZip} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  전체 파일 ZIP 다운로드
                </Button>
                <Button onClick={generateCode} variant="outline" className="gap-2">
                  <Loader2 className="h-4 w-4" />
                  재생성
                </Button>
              </div>

              <Separator />

              {/* 파일 개요 */}
              <div>
                <h3 className="font-semibold mb-3">생성된 파일 ({Object.keys(generatedFiles).length}개)</h3>
                <div className="grid gap-2">
                  {Object.entries(generatedFiles).map(([filename]) => (
                    <div
                      key={filename}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="text-muted-foreground">{getFileIcon(filename)}</div>
                      <div className="flex-1">
                        <p className="font-mono text-sm font-medium">{filename}</p>
                        <p className="text-xs text-muted-foreground">{getFileDescription(filename)}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {generatedFiles[filename as keyof GeneratedFiles].split("\n").length} lines
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 파일 미리보기 */}
      {isComplete && generatedFiles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              파일 미리보기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="agent.py" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {Object.keys(generatedFiles).map((filename) => (
                  <TabsTrigger key={filename} value={filename} className="text-xs">
                    {filename.split(".")[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(generatedFiles).map(([filename, content]) => (
                <TabsContent key={filename} value={filename} className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(filename)}
                        <h4 className="font-mono font-semibold">{filename}</h4>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(filename, content)}
                        className="gap-2"
                      >
                        {copiedFile === filename ? (
                          <>
                            <Check className="h-4 w-4" />
                            복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            복사
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{getFileDescription(filename)}</p>
                    <div className="border rounded-lg p-4 bg-muted/50 max-h-[600px] overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap">{content}</pre>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
