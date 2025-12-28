"use client";

import { useState, useEffect, useRef, memo, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface Step2AnalysisProps {
  formData: any;
  onComplete: (chatHistory: ChatMessage[], analysis: any) => void;
}

export function Step2Analysis({ formData, onComplete }: Step2AnalysisProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    startInitialAnalysis();
  }, []);

  // 사용자 스크롤 감지
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 하단에서 100px 이내면 자동 스크롤 허용
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrollingRef.current = !isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 첫 렌더링 최적화된 스크롤
  useLayoutEffect(() => {
    if (!chatContainerRef.current) return;

    // 첫 메시지는 즉시 스크롤 (떨림 방지)
    if (isFirstRenderRef.current && (chatHistory.length > 0 || currentMessage)) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      isFirstRenderRef.current = false;
      
      // 다음 프레임에서 한 번 더 보정
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    } else if (!isUserScrollingRef.current) {
      // 이후 메시지는 부드럽게
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [chatHistory, currentMessage]);

  // 스트리밍 중 스마트 스크롤 (기존 로직 제거)
  // useLayoutEffect가 처리하므로 불필요

  const startInitialAnalysis = async () => {
    setIsStreaming(true);
    let fullMessage = "";

    try {
      const response = await fetch("/api/bedrock/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
                  // 부드러운 업데이트를 위해 requestAnimationFrame 사용
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
      const response = await fetch("/api/bedrock/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: newHistory,
          userMessage: message,
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
      const response = await fetch("/api/bedrock/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: history }),
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>2️⃣ Claude 분석 및 보완</CardTitle>
          <p className="text-sm text-muted-foreground">
            Claude가 분석하고 추가 질문을 합니다. 답변하거나 "분석 완료"를 입력하세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              ref={chatContainerRef}
              className="border rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-scroll space-y-4 scroll-smooth"
              style={{ scrollBehavior: 'smooth', minHeight: '400px' }}
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
                placeholder="답변을 입력하세요 (Ctrl+Enter로 전송)..."
                disabled={isStreaming || isAnalyzing}
                className="min-h-[80px] resize-none"
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

            <Button
              onClick={() => finalizeAnalysis(chatHistory)}
              disabled={isStreaming || isAnalyzing || chatHistory.length === 0}
              variant="outline"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  최종 분석 중...
                </>
              ) : (
                "✅ 분석 완료"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
