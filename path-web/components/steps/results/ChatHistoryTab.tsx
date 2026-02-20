"use client";

import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import ChatBubble from "@cloudscape-design/chat-components/chat-bubble";
import Avatar from "@cloudscape-design/chat-components/avatar";
import { MDXRenderer } from "@/components/analysis/MDXRenderer";
import type { ChatMessage } from "@/lib/types";

interface ChatHistoryTabProps {
  chatHistory: ChatMessage[];
}

export function ChatHistoryTab({ chatHistory }: ChatHistoryTabProps) {
  return (
    <Container
      header={
        <Header variant="h2" counter={`(${chatHistory.length})`}>
          대화 내역
        </Header>
      }
    >
      {chatHistory.length === 0 ? (
        <Box textAlign="center" color="text-body-secondary" padding={{ vertical: "xl" }}>
          대화 내역이 없습니다.
        </Box>
      ) : (
        <div className="chat-history-scroll">
          <SpaceBetween size="s">
            {chatHistory.map((msg, idx) => {
              if (msg.role === "user") {
                return (
                  <div key={idx} className="chat-bubble-user">
                    <ChatBubble
                      type="outgoing"
                      avatar={<Avatar color="default" iconName="user-profile" ariaLabel="User" />}
                      ariaLabel="User message"
                    >
                      <span className="chat-message-content">{msg.content}</span>
                    </ChatBubble>
                  </div>
                );
              }
              return (
                <div key={idx} className="chat-bubble-assistant">
                  <ChatBubble
                    type="incoming"
                    avatar={<Avatar color="gen-ai" iconName="gen-ai" ariaLabel="Claude" />}
                    ariaLabel="Claude response"
                  >
                    <MDXRenderer content={msg.content} />
                  </ChatBubble>
                </div>
              );
            })}
          </SpaceBetween>
        </div>
      )}
    </Container>
  );
}
