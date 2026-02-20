"use client";

import { useEffect, useRef, Component, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import mermaid from "mermaid";
import Alert from "@cloudscape-design/components/alert";
import TextContent from "@cloudscape-design/components/text-content";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

interface MDXRendererProps {
  content: string;
}

class ErrorBoundary extends Component<{
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function MDXRenderer({ content }: MDXRendererProps) {
  const mermaidInitialized = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mermaidInitialized.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "strict",
      });
      mermaidInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!content || !contentRef.current) return;

    const container = contentRef.current;

    const runMermaid = () => {
      const nodes = container.querySelectorAll(".mermaid:not([data-processed])");
      if (nodes.length > 0) {
        mermaid.run({ nodes: nodes as NodeListOf<HTMLElement> });
      }
    };

    runMermaid();

    const observer = new MutationObserver(() => {
      runMermaid();
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [content]);

  if (!content) {
    return <StatusIndicator type="loading">로딩 중...</StatusIndicator>;
  }

  const cleanedContent = content
    .replace(/<skill_tool>[\s\S]*?<\/skill_tool>/g, "")
    .replace(/<use_skill>[\s\S]*?<\/use_skill>/g, "")
    .replace(/<skill name='.*?'>[\s\S]*?<\/skill>/g, "");

  return (
    <div ref={contentRef} className="markdown-content">
      <ErrorBoundary
        fallback={
          <Alert type="warning" header="명세서 렌더링 중 오류가 발생했습니다. 원본 텍스트를 표시합니다.">
            <TextContent><pre>{content}</pre></TextContent>
          </Alert>
        }
        onError={(error) => {
          console.error("Markdown render error:", error);
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const lang = match?.[1];
              const codeString = String(children).replace(/\n$/, "");

              if (lang === "mermaid") {
                return <div className="mermaid mermaid-container">{codeString}</div>;
              }

              if (lang) {
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={lang}
                    PreTag="div"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                );
              }

              return (
                <code {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => {
              const childElement = children as React.ReactElement | null;
              const childProps = childElement?.props as Record<string, unknown> | undefined;
              if (
                (typeof childProps?.className === "string" && childProps.className.includes("language-")) ||
                childElement?.type === "div"
              ) {
                return <>{children}</>;
              }
              return (
                <pre style={{
                  backgroundColor: "var(--color-background-container-content, #f2f3f3)",
                  padding: 16,
                  borderRadius: 8,
                  overflowX: "auto",
                  margin: "16px 0",
                  fontSize: 14,
                }}>
                  {children}
                </pre>
              );
            },
          }}
        >
          {cleanedContent}
        </ReactMarkdown>
      </ErrorBoundary>
    </div>
  );
}
