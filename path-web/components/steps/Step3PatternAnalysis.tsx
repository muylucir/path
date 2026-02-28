"use client";

import { useState, useEffect, useRef, memo, useLayoutEffect, useCallback } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Spinner from "@cloudscape-design/components/spinner";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Badge from "@cloudscape-design/components/badge";
import PromptInput from "@cloudscape-design/components/prompt-input";
import ChatBubble from "@cloudscape-design/chat-components/chat-bubble";
import Avatar from "@cloudscape-design/chat-components/avatar";
import LoadingBar from "@cloudscape-design/chat-components/loading-bar";
import { FEASIBILITY_ITEM_NAMES } from "@/lib/constants";
import { GlossaryTerm } from "@/components/cloudscape/GlossaryTerm";
import { useSSEStream } from "@/lib/hooks/useSSEStream";
import type { FormData, ChatMessage, Analysis, FeasibilityEvaluation, FeasibilityItemDetail, ImprovementPlans, TokenUsage } from "@/lib/types";

interface ChatMessageWithId extends ChatMessage {
  id: string;
}

interface Step3PatternAnalysisProps {
  formData: FormData;
  feasibility: FeasibilityEvaluation;
  improvementPlans?: ImprovementPlans;
  onComplete: (chatHistory: ChatMessage[], analysis: Analysis) => void;
  onUsage?: (usage: TokenUsage) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

type FeasibilityKey = keyof typeof FEASIBILITY_ITEM_NAMES;

const MessageComponent = memo(({ message }: { message: ChatMessageWithId }) => {
  if (message.role === "user") {
    return (
      <div className="chat-bubble-user">
        <ChatBubble
          type="outgoing"
          avatar={<Avatar color="default" iconName="user-profile" ariaLabel="User" />}
          ariaLabel="User message"
        >
          <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
        </ChatBubble>
      </div>
    );
  }

  return (
    <div className="chat-bubble-assistant">
      <ChatBubble
        type="incoming"
        avatar={<Avatar color="gen-ai" iconName="gen-ai" ariaLabel="Claude" />}
        ariaLabel="Claude response"
      >
        <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
      </ChatBubble>
    </div>
  );
}, (prev, next) => {
  return prev.message.content === next.message.content;
});

MessageComponent.displayName = "MessageComponent";

function stripIds(messages: ChatMessageWithId[]): ChatMessage[] {
  return messages.map(({ id: _id, ...rest }) => rest);
}

export function Step3PatternAnalysis({ formData, feasibility, improvementPlans = {}, onComplete, onUsage, onLoadingChange }: Step3PatternAnalysisProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessageWithId[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const hasStartedRef = useRef(false);
  const fullMessageRef = useRef("");
  const abortRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const { start: startAnalysisStream, isStreaming: isAnalysisStreaming } = useSSEStream({
    url: "/api/bedrock/pattern/analyze",
    body: { formData, feasibility, improvementPlans },
    onChunk: useCallback((parsed: any) => {
      if (parsed.text) {
        fullMessageRef.current += parsed.text;
        requestAnimationFrame(() => {
          setCurrentMessage(fullMessageRef.current);
        });
      }
      if (parsed.sessionId && !sessionIdRef.current) {
        sessionIdRef.current = parsed.sessionId;
      }
    }, []),
    onUsage: useCallback((usage: TokenUsage) => {
      onUsage?.(usage);
    }, [onUsage]),
    onDone: useCallback(() => {
      const msg: ChatMessageWithId = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullMessageRef.current,
      };
      setChatHistory((prev) => [...prev, msg]);
      setCurrentMessage("");
      fullMessageRef.current = "";
    }, []),
    onError: useCallback((err: string) => {
      console.error("Pattern analysis error:", err);
      fullMessageRef.current = "";
    }, []),
  });

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    fullMessageRef.current = "";
    startAnalysisStream();
  }, []);

  const handleUserMessage = async () => {
    if (!userInput.trim() || isStreaming || isAnalysisStreaming) return;

    const message = userInput.trim();
    setUserInput("");

    const userMsg: ChatMessageWithId = { id: crypto.randomUUID(), role: "user", content: message };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);

    setIsStreaming(true);
    fullMessageRef.current = "";

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const response = await fetch("/api/bedrock/pattern/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: stripIds(newHistory),
          userMessage: message,
          formData,
          feasibility,
          sessionId: sessionIdRef.current,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${response.statusText}`);
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n");
          buffer = parts.pop() ?? "";

          for (const line of parts) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                const assistantMsg: ChatMessageWithId = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: fullMessageRef.current,
                };
                setChatHistory((prev) => [...prev, assistantMsg]);
                setCurrentMessage("");
                setIsStreaming(false);
                fullMessageRef.current = "";
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.usage) onUsage?.(parsed.usage);
                if (parsed.text) {
                  fullMessageRef.current += parsed.text;
                  setCurrentMessage(fullMessageRef.current);
                }
                if (parsed.sessionId && !sessionIdRef.current) {
                  sessionIdRef.current = parsed.sessionId;
                }
                if (parsed.error) {
                  console.error("Chat error:", parsed.error);
                  setIsStreaming(false);
                  fullMessageRef.current = "";
                  return;
                }
              } catch (e) {
                if (!(e instanceof SyntaxError)) throw e;
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Error:", err);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const streamingAny = isStreaming || isAnalysisStreaming;

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(streamingAny || isAnalyzing);
  }, [streamingAny, isAnalyzing, onLoadingChange]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isUserScrollingRef.current = !isNearBottom;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

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
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatHistory, currentMessage]);

  const finalizeAnalysis = async (history: ChatMessageWithId[]) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/bedrock/pattern/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          feasibility,
          conversation: stripIds(history),
          improvementPlans,
          sessionId: sessionIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const analysis = await response.json();
      if (analysis._usage) {
        onUsage?.(analysis._usage);
        delete analysis._usage;
      }
      onComplete(stripIds(history), analysis);
    } catch (error) {
      console.error("Error:", error);
      setIsAnalyzing(false);
    }
  };

  const getScoreType = (score: number): "success" | "warning" | "error" => {
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    return "error";
  };

  return (
    <SpaceBetween size="m">
      {/* Feasibility Summary */}
      <Container header={<Header variant="h2"><GlossaryTerm glossaryKey="feasibility" /> 요약 ({feasibility.feasibility_score}/50점)</Header>}>
        <SpaceBetween direction="horizontal" size="s">
          {(Object.entries(feasibility.feasibility_breakdown) as [FeasibilityKey, FeasibilityItemDetail][]).map(([key, item]) => (
            <StatusIndicator key={key} type={getScoreType(item.score)}>
              {FEASIBILITY_ITEM_NAMES[key]}: {item.score}
            </StatusIndicator>
          ))}
          {feasibility.autonomy_requirement && (
            <Badge color={feasibility.autonomy_requirement.score >= 6 ? "blue" : "grey"}>
              <GlossaryTerm glossaryKey="autonomy" />: {feasibility.autonomy_requirement.score}/10
            </Badge>
          )}
        </SpaceBetween>
      </Container>

      {/* Chat Container */}
      <Container
        header={
          <Header
            variant="h2"
            description="Feasibility 결과를 바탕으로 적합한 Agent 패턴을 분석합니다. 질문에 답변하거나 &quot;패턴 확정&quot;을 클릭하세요."
          >
            패턴 분석 및 논의
          </Header>
        }
      >
        <SpaceBetween size="m">
          <div
            ref={chatContainerRef}
            style={{
              minHeight: 400,
              maxHeight: 600,
              overflowY: "auto",
              padding: 16,
              border: "1px solid var(--color-border-divider-default, #e9ebed)",
              borderRadius: 8,
              scrollBehavior: "smooth",
            }}
            aria-live="polite"
            aria-label="대화 내용"
          >
            <SpaceBetween size="s">
              {chatHistory.map((msg) => (
                <MessageComponent key={msg.id} message={msg} />
              ))}

              {streamingAny && currentMessage && (
                <div className="chat-bubble-assistant">
                  <ChatBubble
                    type="incoming"
                    avatar={<Avatar color="gen-ai" iconName="gen-ai" loading ariaLabel="Claude is typing" />}
                    ariaLabel="Claude is responding"
                  >
                    <span style={{ whiteSpace: "pre-wrap" }}>{currentMessage}</span>
                    <LoadingBar variant="gen-ai" />
                  </ChatBubble>
                </div>
              )}

              {streamingAny && !currentMessage && (
                <div className="chat-bubble-assistant">
                  <ChatBubble
                    type="incoming"
                    avatar={<Avatar color="gen-ai" iconName="gen-ai" loading ariaLabel="Claude is thinking" />}
                    ariaLabel="Waiting for response"
                  >
                    <Spinner /> 분석 중...
                  </ChatBubble>
                </div>
              )}

              <div ref={messagesEndRef} />
            </SpaceBetween>
          </div>

          {/* Input */}
          <div
            onKeyDownCapture={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                if (e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUserMessage();
                } else {
                  e.preventDefault();
                  e.stopPropagation();
                  setUserInput((prev) => prev + "\n");
                }
              }
            }}
          >
            <PromptInput
              value={userInput}
              onChange={({ detail }) => setUserInput(detail.value)}
              onAction={handleUserMessage}
              actionButtonIconName="send"
              placeholder="답변을 입력하세요... (Shift+Enter로 전송)"
              disabled={streamingAny || isAnalyzing}
              minRows={3}
            />
          </div>

          {/* Finalize Button */}
          <Button
            variant="primary"
            fullWidth
            onClick={() => finalizeAnalysis(chatHistory)}
            disabled={streamingAny || isAnalyzing || chatHistory.length < 3}
            loading={isAnalyzing}
          >
            {isAnalyzing ? "패턴 확정 중..." : "패턴 확정"}
          </Button>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}
