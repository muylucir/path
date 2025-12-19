"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    startInitialAnalysis();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, currentMessage]);

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

  const handleUserMessage = async () => {
    if (!userInput.trim() || isStreaming) return;

    const message = userInput.trim();
    setUserInput("");

    if (message.includes("분석 완료") || message.includes("완료")) {
      const userMsg: ChatMessage = { role: "user", content: message };
      await finalizeAnalysis([...chatHistory, userMsg]);
      return;
    }

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
            <div className="border rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto space-y-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1">
                      {msg.role === "user" ? "You" : "Claude"}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {currentMessage && (
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
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleUserMessage();
                  }
                }}
                placeholder="답변을 입력하거나 '분석 완료'를 입력하세요..."
                disabled={isStreaming || isAnalyzing}
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
