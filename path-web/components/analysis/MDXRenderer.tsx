"use client";

import { useEffect, useRef, Component, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import mermaid from "mermaid";

interface MDXRendererProps {
  content: string;
}

// Error Boundary 컴포넌트
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
        securityLevel: "loose",
      });
      mermaidInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (content && contentRef.current) {
      // Mermaid 다이어그램 렌더링
      setTimeout(() => {
        mermaid.run({ querySelector: ".mermaid" });
      }, 100);
    }
  }, [content]);

  if (!content) {
    return <div className="text-sm text-muted-foreground">로딩 중...</div>;
  }

  // SKILL tool 태그 제거 (Agent가 생성한 태그)
  const cleanedContent = content
    .replace(/<skill_tool>[\s\S]*?<\/skill_tool>/g, "")
    .replace(/<use_skill>[\s\S]*?<\/use_skill>/g, "")
    .replace(/<skill name='.*?'>[\s\S]*?<\/skill>/g, "");

  return (
    <div ref={contentRef} className="prose prose-sm dark:prose-invert max-w-none">
      <ErrorBoundary
        fallback={
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ 명세서 렌더링 중 오류가 발생했습니다. 원본 텍스트를 표시합니다.
            </p>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded mt-4">
              {content}
            </pre>
          </div>
        }
        onError={(error) => {
          console.error("Markdown render error:", error);
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children, ...props }) => (
              <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-2xl font-semibold mt-6 mb-3" {...props}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-xl font-semibold mt-4 mb-2" {...props}>
                {children}
              </h3>
            ),
            p: ({ children, ...props }) => (
              <p className="mb-4 leading-7" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li className="ml-4" {...props}>
                {children}
              </li>
            ),
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-6">
                <table className="w-full border-collapse border border-border" {...props}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ children, ...props }) => (
              <thead className="bg-muted" {...props}>
                {children}
              </thead>
            ),
            th: ({ children, ...props }) => (
              <th className="border border-border px-4 py-2 text-left font-semibold" {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-border px-4 py-2" {...props}>
                {children}
              </td>
            ),
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const lang = match?.[1];
              const codeString = String(children).replace(/\n$/, "");

              // Mermaid 다이어그램 처리
              if (lang === "mermaid") {
                return <div className="mermaid my-6">{codeString}</div>;
              }

              // 코드 블록 (언어 지정됨)
              if (lang) {
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={lang}
                    PreTag="div"
                    className="rounded-lg my-4 text-sm"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                );
              }

              // 인라인 코드 또는 언어 미지정 코드
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => {
              // SyntaxHighlighter가 이미 처리한 경우 children을 그대로 반환
              // react-markdown은 code를 pre 안에 넣으므로, code가 이미 처리됐으면 그대로 반환
              const childElement = children as React.ReactElement | null;
              const childProps = childElement?.props as Record<string, unknown> | undefined;
              if (
                (typeof childProps?.className === "string" && childProps.className.includes("language-")) ||
                childElement?.type === "div"
              ) {
                return <>{children}</>;
              }
              return (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm">
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
