"use client";

import { memo } from "react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export const ChatMessage = memo(
  function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
    return (
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
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />
            )}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.message.content === next.message.content &&
      prev.isStreaming === next.isStreaming
    );
  }
);
