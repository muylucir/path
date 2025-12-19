import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatMessage } from "@/lib/types";

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>대화 내역</CardTitle>
        <p className="text-sm text-muted-foreground">
          총 {messages.length}개의 메시지
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {messages.map((msg, idx) => (
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
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
