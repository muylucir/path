"use client";

import { useState, useEffect, useRef, memo, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, MessageSquare, Keyboard, Info } from "lucide-react";
import { FEASIBILITY_ITEM_NAMES } from "@/lib/constants";
import type { ChatMessage, Analysis, FeasibilityEvaluation, FeasibilityItemDetail, ImprovementPlans } from "@/lib/types";

interface Step3PatternAnalysisProps {
  formData: any;
  feasibility: FeasibilityEvaluation;
  improvementPlans?: ImprovementPlans;
  onComplete: (chatHistory: ChatMessage[], analysis: Analysis) => void;
}

type FeasibilityKey = keyof typeof FEASIBILITY_ITEM_NAMES;

export function Step3PatternAnalysis({ formData, feasibility, improvementPlans = {}, onComplete }: Step3PatternAnalysisProps) {
  const router = useRouter();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // 중복 실행 방지
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    startPatternAnalysis();
  }, []);

  // 사용자 스크롤 감지
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrollingRef.current = !isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 스크롤 관리
  useLayoutEffect(() => {
    if (!chatContainerRef.current) return;

    if (isFirstRenderRef.current && (chatHistory.length > 0 || currentMessage)) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      isFirstRenderRef.current = false;

      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    } else if (!isUserScrollingRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [chatHistory, currentMessage]);

  const startPatternAnalysis = async () => {
    setIsStreaming(true);
    let fullMessage = "";

    try {
      const response = await fetch("/api/bedrock/pattern/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, feasibility, improvementPlans }),
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
                const msg: ChatMessage = {
                  role: "assistant",
                  content: fullMessage,
                };
                setChatHistory((prev) => [...prev, msg]);
                setCurrentMessage("");
                setIsStreaming(false);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullMessage += parsed.text;
                  requestAnimationFrame(() => {
                    setCurrentMessage(fullMessage);
                  });
                }
              } catch (e) {
                // Ignore
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsStreaming(false);
    }
  };

  const handleUserMessage = async () => {
    if (!userInput.trim() || isStreaming) return;

    const message = userInput.trim();
    setUserInput("");

    const userMsg: ChatMessage = { role: "user", content: message };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);

    setIsStreaming(true);
    let fullMessage = "";

    try {
      const response = await fetch("/api/bedrock/pattern/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: newHistory,
          userMessage: message,
          formData,
          feasibility,
        }),
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
                const assistantMsg: ChatMessage = {
                  role: "assistant",
                  content: fullMessage,
                };
                setChatHistory((prev) => [...prev, assistantMsg]);
                setCurrentMessage("");
                setIsStreaming(false);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                fullMessage += parsed.text;
                setCurrentMessage(fullMessage);
              } catch (e) {
                // Ignore
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setIsStreaming(false);
    }
  };

  const finalizeAnalysis = async (history: ChatMessage[]) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/bedrock/pattern/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          feasibility,
          conversation: history,
          improvementPlans,
        }),
      });

      const analysis = await response.json();
      onComplete(history, analysis);
    } catch (error) {
      console.error("Error:", error);
      setIsAnalyzing(false);
    }
  };

  // 메시지 컴포넌트 메모이제이션
  const MessageComponent = memo(({ message, index }: { message: ChatMessage; index: number }) => (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <div className="text-xs font-semibold mb-1">
          {message.role === "user" ? "You" : "Claude"}
        </div>
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  ), (prev, next) => {
    return prev.message.content === next.message.content;
  });

  MessageComponent.displayName = 'MessageComponent';

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-4">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push("/feasibility")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        이전 단계로
      </Button>

      {/* Feasibility Summary */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Feasibility 요약 ({feasibility.feasibility_score}/50점)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(feasibility.feasibility_breakdown) as [FeasibilityKey, FeasibilityItemDetail][]).map(([key, item]) => (
              <span
                key={key}
                className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(item.score)}`}
              >
                {FEASIBILITY_ITEM_NAMES[key]}: {item.score}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            패턴 분석 및 논의
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Feasibility 결과를 바탕으로 적합한 Agent 패턴을 분석합니다. 질문에 답변하거나 "패턴 확정"을 클릭하세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              ref={chatContainerRef}
              className="border rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-scroll space-y-4 scroll-smooth"
              style={{ scrollBehavior: 'smooth', minHeight: '400px' }}
              aria-live="polite"
              aria-label="대화 내용"
            >
              {chatHistory.map((msg, idx) => (
                <MessageComponent key={idx} message={msg} index={idx} />
              ))}

              {isStreaming && currentMessage && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="text-xs font-semibold mb-1">Claude</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {currentMessage}
                      <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault();
                      handleUserMessage();
                    }
                  }}
                  placeholder="답변을 입력하세요..."
                  disabled={isStreaming || isAnalyzing}
                  className="min-h-[80px] resize-none"
                  aria-label="답변 입력"
                />
                <Button
                  onClick={handleUserMessage}
                  disabled={isStreaming || isAnalyzing || !userInput.trim()}
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "전송"
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                <span>Ctrl + Enter로 전송</span>
              </div>
            </div>

            <Button
              onClick={() => finalizeAnalysis(chatHistory)}
              disabled={isStreaming || isAnalyzing || chatHistory.length === 0}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  패턴 확정 중...
                </>
              ) : (
                "✅ 패턴 확정"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
