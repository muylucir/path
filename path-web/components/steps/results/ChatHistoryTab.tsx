"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MDXRenderer } from "@/components/analysis/MDXRenderer";
import type { ChatMessage } from "@/lib/types";

interface ChatHistoryTabProps {
  chatHistory: ChatMessage[];
}

export function ChatHistoryTab({ chatHistory }: ChatHistoryTabProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4 max-h-[calc(100vh-300px)] min-h-[400px] overflow-y-auto">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-xs font-semibold mb-2">
                  {msg.role === "user" ? "You" : "Claude"}
                </div>
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <MDXRenderer content={msg.content} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
