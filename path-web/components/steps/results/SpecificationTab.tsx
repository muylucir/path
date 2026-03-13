"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ProgressBar from "@cloudscape-design/components/progress-bar";
import TextContent from "@cloudscape-design/components/text-content";
import { MDXRenderer } from "@/components/analysis/MDXRenderer";
import { useSSEStream } from "@/lib/hooks/useSSEStream";
import type { Analysis, ChatMessage, FormData, ImprovementPlans, TokenUsage } from "@/lib/types";

function extractHeadings(markdown: string): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`]/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, "").replace(/\s+/g, "-");
      headings.push({ level, text, id });
    }
  }
  return headings;
}

interface SpecificationTabProps {
  analysis: Analysis;
  chatHistory: ChatMessage[];
  formData: FormData;
  improvementPlans?: ImprovementPlans;
  initialSpecification?: string;
  onSave: (specification: string) => Promise<void>;
  onUsage?: (usage: TokenUsage) => void;
}

export function SpecificationTab({
  analysis,
  chatHistory,
  formData,
  improvementPlans,
  initialSpecification,
  onSave,
  onUsage,
}: SpecificationTabProps) {
  const [specification, setSpecification] = useState<string>(initialSpecification || "");
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const fullSpecRef = useRef("");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(specification);
    } finally {
      setIsSaving(false);
    }
  };

  const { start: startGeneration, isStreaming: isGenerating } = useSSEStream({
    url: "/api/bedrock/spec",
    body: {
      analysis,
      improvementPlans: improvementPlans || {},
      chatHistory: chatHistory || [],
      additionalContext: {
        sources: formData?.additionalSources || "",
        context: formData?.additionalContext || "",
      },
    },
    onChunk: useCallback((parsed: any) => {
      if (parsed.text) {
        fullSpecRef.current += parsed.text;
        setSpecification(fullSpecRef.current);
      }
    }, []),
    onProgress: useCallback((p: number, s: string) => {
      setProgress(p);
      if (s) setStage(s);
    }, []),
    onUsage: useCallback((usage: TokenUsage) => {
      onUsage?.(usage);
    }, [onUsage]),
    onDone: useCallback(() => {
      setSpecification(fullSpecRef.current);
      sessionStorage.setItem("specification", fullSpecRef.current);
      setProgress(100);
      setStage("완료");
    }, []),
    onError: useCallback((err: string) => {
      console.error("Spec generation error:", err);
    }, []),
  });

  const generateSpec = useCallback(() => {
    fullSpecRef.current = "";
    setSpecification("");
    setProgress(0);
    setStage("시작 중...");
    startGeneration();
  }, [startGeneration]);

  const downloadSpec = () => {
    const blob = new Blob([specification], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-spec-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasSpecification = specification || isGenerating;

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            hasSpecification ? (
              !isGenerating ? (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={generateSpec} iconName="refresh">재생성</Button>
                  <Button onClick={downloadSpec} iconName="download">다운로드</Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    loading={isSaving}
                  >
                    {isSaving ? "저장 중..." : "세션 저장"}
                  </Button>
                </SpaceBetween>
              ) : (
                <Button disabled loading>생성 중...</Button>
              )
            ) : undefined
          }
        >
          명세서
        </Header>
      }
    >
      {!hasSpecification ? (
        <SpaceBetween size="m">
          <Box textAlign="center" color="text-body-secondary" padding={{ vertical: "xl" }}>
            Claude가 분석 결과를 기반으로 상세 명세서를 생성합니다.
          </Box>
          <Button variant="primary" fullWidth onClick={generateSpec} iconName="gen-ai">
            Claude로 상세 명세서 생성
          </Button>
        </SpaceBetween>
      ) : (
        <SpaceBetween size="m">
          {isGenerating && (
            <ProgressBar
              value={progress}
              label="명세서 생성 진행률"
              additionalInfo={stage}
              description={`${progress}%`}
            />
          )}

          {!isGenerating && specification ? (
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
              <div style={{ position: "sticky", top: 56, alignSelf: "start", maxHeight: "calc(100vh - 400px)", overflowY: "auto", fontSize: 13, lineHeight: 1.6 }}>
                <Box variant="h4" margin={{ bottom: "xs" }}>목차</Box>
                {extractHeadings(specification).map((h, i) => (
                  <div key={i} style={{ paddingLeft: (h.level - 1) * 12, marginBottom: 4 }}>
                    <a
                      href={`#${h.id}`}
                      style={{ color: "var(--color-text-body-secondary)", textDecoration: "none" }}
                      onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" }); }}
                    >
                      {h.text}
                    </a>
                  </div>
                ))}
              </div>
              <div className="spec-viewer-scroll">
                <MDXRenderer content={specification} />
              </div>
            </div>
          ) : (
            <div className="spec-viewer-scroll">
              {isGenerating ? (
                <TextContent><pre>{specification}</pre></TextContent>
              ) : null}
            </div>
          )}
        </SpaceBetween>
      )}
    </Container>
  );
}
