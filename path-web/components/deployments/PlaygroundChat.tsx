"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Send,
  Bot,
  User,
  Activity,
  Clock,
  Zap,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import type { Deployment, PlaygroundMessage, DeploymentMetrics } from "@/lib/types";

interface PlaygroundChatProps {
  deployment: Deployment;
}

export function PlaygroundChat({ deployment }: PlaygroundChatProps) {
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DeploymentMetrics | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadMetrics();
  }, [deployment.deployment_id]);

  useEffect(() => {
    // 메시지가 추가될 때 스크롤
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/bedrock/deployments/${deployment.deployment_id}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage: PlaygroundMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch(
        `/api/bedrock/deployments/${deployment.deployment_id}/invoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage.content,
            session_id: sessionId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Agent 호출 실패");
      }

      const data = await response.json();

      // 세션 ID 저장
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const assistantMessage: PlaygroundMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 메트릭 새로고침
      loadMetrics();
    } catch (error: any) {
      console.error("Error invoking agent:", error);
      toast.error(error.message || "Agent 호출 실패");

      // 에러 메시지 추가
      const errorMessage: PlaygroundMessage = {
        role: "assistant",
        content: `오류가 발생했습니다: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // 실패 시에도 메트릭 새로고침
      loadMetrics();
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Deployment Info & Metrics */}
      <div className="space-y-3 px-4 pb-4 border-b">
        {/* Deployment Info */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">버전: </span>
            <span className="font-medium">v{deployment.version}</span>
          </div>
          <div>
            <span className="text-muted-foreground">리전: </span>
            <span className="font-medium">{deployment.region}</span>
          </div>
          {deployment.pattern && (
            <div>
              <span className="text-muted-foreground">패턴: </span>
              <span className="font-medium">{deployment.pattern}</span>
            </div>
          )}
          <Badge
            variant={deployment.status === "active" ? "success" : "secondary"}
            className="text-xs"
          >
            {deployment.status === "active" ? "활성" : deployment.status}
          </Badge>
        </div>

        {/* Metrics Panel */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">메트릭</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">호출:</span>
              <span className="font-medium">{metrics?.total_invocations ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">지연:</span>
              <span className="font-medium">{metrics?.avg_latency_ms?.toFixed(0) ?? 0}ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">토큰:</span>
              <span className="font-medium">{metrics?.total_tokens_used?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">마지막:</span>
              <span className="font-medium">
                {metrics?.last_invocation_at
                  ? new Date(metrics.last_invocation_at * 1000).toLocaleTimeString("ko-KR")
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-12 w-12 mb-4" />
            <p className="text-sm text-center">메시지를 입력하여<br />Agent와 대화를 시작하세요</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              <div
                className={`flex items-center gap-2 text-xs mt-1 ${
                  message.role === "user"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                <span>{new Date(message.timestamp).toLocaleTimeString("ko-KR")}</span>
                {message.role === "assistant" && message.metadata && (
                  <>
                    {message.metadata.latency_ms !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {message.metadata.latency_ms}ms
                      </span>
                    )}
                    {message.metadata.tokens_used !== undefined && message.metadata.tokens_used > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Zap className="h-3 w-3" />
                        {message.metadata.tokens_used}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            {message.role === "user" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력... (Enter 전송)"
            className="min-h-[50px] max-h-[120px] resize-none text-sm"
            disabled={isSending || deployment.status !== "active"}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isSending || deployment.status !== "active"}
            className="h-[50px] px-4"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {deployment.status !== "active" && (
          <p className="text-xs text-destructive mt-2">
            배포가 활성 상태가 아니므로 메시지를 보낼 수 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
