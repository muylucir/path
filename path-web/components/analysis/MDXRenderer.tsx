"use client";

import { useEffect, useRef, useState, Component, ReactNode } from "react";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
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
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const mermaidInitialized = useRef(false);

  useEffect(() => {
    if (!mermaidInitialized.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
      });
      mermaidInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    const compileMDX = async () => {
      try {
        // SKILL tool 태그 제거 (Agent가 생성한 태그)
        let cleanedContent = content
          .replace(/<skill_tool>[\s\S]*?<\/skill_tool>/g, '')
          .replace(/<use_skill>[\s\S]*?<\/use_skill>/g, '')
          .replace(/<skill name='.*?'>[\s\S]*?<\/skill>/g, '');
        
        // 중괄호 이스케이프 (MDX가 JSX로 해석하지 않도록)
        // 1. 먼저 mermaid 블록과 코드 블록을 보존
        const codeBlocks: string[] = [];
        cleanedContent = cleanedContent.replace(
          /(```[\s\S]*?```)/g,
          (match) => {
            codeBlocks.push(match);
            return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
          }
        );

        // 2. 남은 텍스트에서 중괄호 이스케이프 (변수 템플릿 등)
        cleanedContent = cleanedContent
          .replace(/\{/g, '&#123;')
          .replace(/\}/g, '&#125;');

        // 3. 코드 블록 복원 (mermaid는 그대로, 나머지는 이스케이프)
        cleanedContent = cleanedContent.replace(
          /__CODE_BLOCK_(\d+)__/g,
          (_, idx) => {
            const block = codeBlocks[parseInt(idx)];
            // mermaid 블록은 그대로 유지
            if (block.startsWith('```mermaid')) {
              return block;
            }
            // 나머지 코드 블록은 중괄호 이스케이프
            return block.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
          }
        );
        
        const mdx = await serialize(cleanedContent, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            development: false,
          },
          parseFrontmatter: false,
        });
        setMdxSource(mdx);
      } catch (error) {
        console.error("MDX compile error:", error);
        // MDX 컴파일 실패 시 일반 텍스트로 표시
        setMdxSource({ 
          compiledSource: '', 
          frontmatter: {},
          scope: {},
          error: true,
          rawContent: content 
        });
      }
    };

    if (content) {
      compileMDX();
    }
  }, [content]);

  useEffect(() => {
    if (mdxSource) {
      setTimeout(() => {
        mermaid.run({ querySelector: ".mermaid" });
      }, 100);
    }
  }, [mdxSource]);

  if (!mdxSource) {
    return <div className="text-sm text-muted-foreground">로딩 중...</div>;
  }

  // MDX 컴파일 실패 시 일반 텍스트로 표시
  if (mdxSource.error || renderError) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ 명세서 렌더링 중 오류가 발생했습니다. 원본 텍스트를 표시합니다.
          </p>
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">{mdxSource.rawContent || content}</pre>
      </div>
    );
  }

  const components = {
    h1: (props: any) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
    h2: (props: any) => <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
    h3: (props: any) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
    p: (props: any) => <p className="mb-4 leading-7" {...props} />,
    ul: (props: any) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
    ol: (props: any) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
    li: (props: any) => <li className="ml-4" {...props} />,
    table: (props: any) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border" {...props} />
      </div>
    ),
    thead: (props: any) => <thead className="bg-muted" {...props} />,
    th: (props: any) => <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />,
    td: (props: any) => <td className="border border-border px-4 py-2" {...props} />,
    code: (props: any) => {
      const { className, children } = props;
      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : "";

      if (lang === "mermaid") {
        return (
          <div className="mermaid my-6">
            {String(children).replace(/\n$/, "")}
          </div>
        );
      }

      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
      );
    },
    pre: (props: any) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm" {...props} />
    ),
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ErrorBoundary
        fallback={
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ 명세서 렌더링 중 오류가 발생했습니다. 원본 텍스트를 표시합니다.
            </p>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded mt-4">{content}</pre>
          </div>
        }
        onError={(error) => {
          console.error("MDX render error:", error);
          setRenderError(error.message);
        }}
      >
        <MDXRemote {...mdxSource} components={components} />
      </ErrorBoundary>
    </div>
  );
}
