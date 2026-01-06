"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Code,
  Download,
  Play,
  Rocket,
  Workflow,
  FileCode,
  Settings,
} from "lucide-react";
import { AgentCanvas } from "@/components/builder/AgentCanvas";
import { CodePreview } from "@/components/builder/CodePreview";
import { DeployPanel } from "@/components/builder/DeployPanel";
import type { AgentCanvasState } from "@/lib/types";

export default function BuilderPage() {
  const router = useRouter();
  const [canvasState, setCanvasState] = useState<AgentCanvasState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("canvas");

  useEffect(() => {
    // sessionStorage에서 캔버스 상태 로드
    const storedCanvas = sessionStorage.getItem("agentCanvasState");
    if (storedCanvas) {
      try {
        const parsed = JSON.parse(storedCanvas);
        setCanvasState(parsed);
      } catch (e) {
        console.error("Failed to parse canvas state:", e);
        // 샘플 데이터로 폴백
        setCanvasState(getSampleCanvasState());
      }
    } else {
      // 샘플 데이터 사용
      setCanvasState(getSampleCanvasState());
    }
    setLoading(false);
  }, []);

  const handleStateChange = (state: AgentCanvasState) => {
    setCanvasState(state);
    sessionStorage.setItem("agentCanvasState", JSON.stringify(state));
  };

  const handleDownloadCode = async () => {
    if (!canvasState) return;

    try {
      const response = await fetch("/api/builder/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canvasState),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `agent-code-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to download code:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/results")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                결과로 돌아가기
              </Button>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Agent Builder
              </h1>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Step 4
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCode}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                코드 다운로드
              </Button>
              <Button size="sm" className="gap-2">
                <Rocket className="h-4 w-4" />
                배포 가이드
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="border-b bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger
                  value="canvas"
                  className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <Workflow className="h-4 w-4" />
                  캔버스
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <FileCode className="h-4 w-4" />
                  코드 미리보기
                </TabsTrigger>
                <TabsTrigger
                  value="deploy"
                  className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <Rocket className="h-4 w-4" />
                  배포
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="canvas" className="flex-1 m-0">
            <div className="h-[calc(100vh-140px)]">
              {canvasState && (
                <AgentCanvas
                  initialState={canvasState}
                  onStateChange={handleStateChange}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 m-0">
            <div className="h-[calc(100vh-140px)] overflow-auto">
              {canvasState && <CodePreview canvasState={canvasState} />}
            </div>
          </TabsContent>

          <TabsContent value="deploy" className="flex-1 m-0">
            <div className="h-[calc(100vh-140px)] overflow-auto">
              {canvasState && <DeployPanel canvasState={canvasState} />}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function getSampleCanvasState(): AgentCanvasState {
  return {
    nodes: [
      // Agent 워크플로우 노드
      {
        id: "agent-1",
        type: "agent",
        position: { x: 250, y: 50 },
        data: {
          id: "agent-1",
          name: "Coordinator",
          role: "요청을 분석하고 적절한 Agent에게 작업을 위임",
          systemPrompt: "You are a coordinator agent...",
          input: "사용자 요청",
          output: "라우팅 결정",
          llm: { model: "claude-sonnet-4.5" },
          tools: ["route_to_agent"],
        },
      },
      {
        id: "router-1",
        type: "router",
        position: { x: 250, y: 200 },
        data: {
          id: "router-1",
          name: "Task Router",
          condition: "request.type",
          branches: [
            { label: "분석", targetNodeId: "agent-2" },
            { label: "생성", targetNodeId: "agent-3" },
          ],
        },
      },
      {
        id: "agent-2",
        type: "agent",
        position: { x: 100, y: 350 },
        data: {
          id: "agent-2",
          name: "Analyzer",
          role: "데이터 분석 및 인사이트 추출",
          systemPrompt: "You are an analyzer agent...",
          input: "분석 요청",
          output: "분석 결과",
          llm: { model: "claude-sonnet-4.5" },
          tools: ["data_query", "chart_generate"],
        },
      },
      {
        id: "agent-3",
        type: "agent",
        position: { x: 400, y: 350 },
        data: {
          id: "agent-3",
          name: "Generator",
          role: "콘텐츠 생성",
          systemPrompt: "You are a generator agent...",
          input: "생성 요청",
          output: "생성된 콘텐츠",
          llm: { model: "claude-haiku-4.5" },
          tools: ["text_generate"],
        },
      },
      // AgentCore 서비스 노드 (우측 영역)
      {
        id: "memory-1",
        type: "memory",
        position: { x: 650, y: 80 },
        data: {
          id: "memory-1",
          name: "Shared Memory",
          type: "long-term",
          strategies: ["semantic", "user-preference"],
          namespaces: ["/facts/{actorId}", "/preferences/{actorId}"],
        },
      },
      {
        id: "gateway-1",
        type: "gateway",
        position: { x: 650, y: 260 },
        data: {
          id: "gateway-1",
          name: "Tool Gateway",
          targets: [
            { type: "lambda", name: "data-query-lambda", config: {} },
            { type: "rest-api", name: "external-api", config: {} },
          ],
        },
      },
    ],
    edges: [
      // 워크플로우 edges (실선)
      { id: "e1", source: "agent-1", target: "router-1" },
      { id: "e2", source: "router-1", target: "agent-2", label: "분석" },
      { id: "e3", source: "router-1", target: "agent-3", label: "생성" },
      // 서비스 edges (점선)
      { id: "e-mem-1", source: "agent-1", target: "memory-1", label: "memory", type: "service" },
      { id: "e-mem-2", source: "agent-2", target: "memory-1", label: "memory", type: "service" },
      { id: "e-mem-3", source: "agent-3", target: "memory-1", label: "memory", type: "service" },
      { id: "e-gw-1", source: "agent-2", target: "gateway-1", label: "tools", type: "service" },
    ],
    entryPoint: "agent-1",
    agentCoreConfig: {
      runtime: { enabled: true, timeout: 900, concurrency: 1000 },
      memory: { enabled: true, strategies: ["semantic", "user-preference"] },
      gateway: { enabled: true, targets: ["data-query-lambda", "external-api"] },
      identity: { enabled: false, providers: [] },
    },
    metadata: {
      pattern: "Graph Pattern with AgentCore",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
