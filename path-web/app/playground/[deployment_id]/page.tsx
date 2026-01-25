"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Send,
  ArrowLeft,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
  Activity,
  Clock,
  Zap,
  Hash,
  StopCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Deployment, PlaygroundMessage, DeploymentMetrics } from "@/lib/types";

export default function PlaygroundPage({
  params,
}: {
  params: Promise<{ deployment_id: string }>;
}) {
  const { deployment_id } = use(params);
  const router = useRouter();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DeploymentMetrics | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadDeployment();
    loadMetrics();
  }, [deployment_id]);

  useEffect(() => {
    // 메시지가 추가될 때 스크롤
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/bedrock/deployments/${deployment_id}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  };

  const loadDeployment = async () => {
    try {
      const response = await fetch(`/api/bedrock/deployments/${deployment_id}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("배포를 찾을 수 없습니다");
          router.push("/deployments");
          return;
        }
        throw new Error("Failed to load deployment");
      }

      const data = await response.json();
      setDeployment(data);

      if (data.status !== "active") {
        toast.error("배포가 활성 상태가 아닙니다");
      }
    } catch (error) {
      console.error("Error loading deployment:", error);
      toast.error("배포 정보 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsSending(false);
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending || !deployment) return;

    const userMessage: PlaygroundMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
    setIsStreaming(true);

    // 빈 어시스턴트 메시지 추가 (스트리밍으로 채워질 예정)
    const assistantMessageIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      },
    ]);

    // AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/bedrock/deployments/${deployment_id}/invoke/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userMessage.content,
            session_id: sessionId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Agent 호출 실패");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("스트림을 읽을 수 없습니다");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let finalMetadata: any = null;
      let finalSessionId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 이벤트 파싱
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 마지막 불완전한 라인은 버퍼에 유지

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr.trim() === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.type === "chunk") {
                fullContent += data.content || "";
                // 실시간 업데이트
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIdx = newMessages.length - 1;
                  if (lastIdx >= 0 && newMessages[lastIdx].role === "assistant") {
                    newMessages[lastIdx] = {
                      ...newMessages[lastIdx],
                      content: fullContent,
                    };
                  }
                  return newMessages;
                });
              } else if (data.type === "done") {
                finalSessionId = data.session_id;
                finalMetadata = data.metadata;
              } else if (data.type === "error") {
                throw new Error(data.content || "스트리밍 오류");
              }
            } catch (parseError) {
              // JSON 파싱 실패 무시
              console.warn("Failed to parse SSE data:", parseError);
            }
          }
        }
      }

      // 세션 ID 저장
      if (finalSessionId) {
        setSessionId(finalSessionId);
      }

      // 최종 메타데이터 업데이트
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        if (lastIdx >= 0 && newMessages[lastIdx].role === "assistant") {
          newMessages[lastIdx] = {
            ...newMessages[lastIdx],
            content: fullContent,
            metadata: finalMetadata,
          };
        }
        return newMessages;
      });

      // 메트릭 새로고침
      loadMetrics();
    } catch (error: any) {
      if (error.name === "AbortError") {
        // 사용자가 중단한 경우
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          if (lastIdx >= 0 && newMessages[lastIdx].role === "assistant") {
            newMessages[lastIdx] = {
              ...newMessages[lastIdx],
              content: newMessages[lastIdx].content + " [중단됨]",
            };
          }
          return newMessages;
        });
      } else {
        console.error("Error invoking agent:", error);
        toast.error(error.message || "Agent 호출 실패");

        // 에러 메시지로 업데이트
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          if (lastIdx >= 0 && newMessages[lastIdx].role === "assistant") {
            newMessages[lastIdx] = {
              ...newMessages[lastIdx],
              content: `오류가 발생했습니다: ${error.message}`,
            };
          }
          return newMessages;
        });
      }

      // 실패 시에도 메트릭 새로고침
      loadMetrics();
    } finally {
      setIsSending(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">배포를 찾을 수 없습니다</p>
        <Button onClick={() => router.push("/deployments")}>
          배포 목록으로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/deployments")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          뒤로
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{deployment.agent_name}</h1>
          <p className="text-sm text-muted-foreground">
            {deployment.pain_point || "Agent Playground"}
          </p>
        </div>
        <Badge
          variant={deployment.status === "active" ? "success" : "secondary"}
          className="flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          {deployment.status === "active" ? "활성" : deployment.status}
        </Badge>
      </div>

      {/* Deployment Info & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Deployment Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
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
              {deployment.endpoint_url && (
                <div className="w-full">
                  <span className="text-muted-foreground">엔드포인트: </span>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {deployment.endpoint_url}
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics Panel */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">메트릭</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">호출 횟수:</span>
                <span className="font-medium">{metrics?.total_invocations ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">평균 지연:</span>
                <span className="font-medium">{metrics?.avg_latency_ms?.toFixed(0) ?? 0}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">총 토큰:</span>
                <span className="font-medium">{metrics?.total_tokens_used?.toLocaleString() ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">마지막 호출:</span>
                <span className="font-medium text-xs">
                  {metrics?.last_invocation_at
                    ? new Date(metrics.last_invocation_at * 1000).toLocaleTimeString("ko-KR")
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex flex-col h-[60vh]">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agent 테스트
            {isStreaming && (
              <Badge variant="outline" className="ml-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                스트리밍 중
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="h-12 w-12 mb-4" />
              <p>메시지를 입력하여 Agent와 대화를 시작하세요</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">
                  {message.content}
                  {/* 스트리밍 중 커서 표시 */}
                  {message.role === "assistant" &&
                    isStreaming &&
                    index === messages.length - 1 && (
                      <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
                    )}
                </p>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
              className="min-h-[60px] max-h-[150px] resize-none"
              disabled={isSending || deployment.status !== "active"}
            />
            {isStreaming ? (
              <Button
                onClick={stopStreaming}
                variant="destructive"
                className="h-[60px] px-6"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isSending || deployment.status !== "active"}
                className="h-[60px] px-6"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
          {deployment.status !== "active" && (
            <p className="text-xs text-destructive mt-2">
              배포가 활성 상태가 아니므로 메시지를 보낼 수 없습니다.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
