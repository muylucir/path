"use client";

import { useEffect, useRef, useState } from "react";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

interface MDXRendererProps {
  content: string;
}

export function MDXRenderer({ content }: MDXRendererProps) {
  const [mdxSource, setMdxSource] = useState<any>(null);
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
        const mdx = await serialize(content, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        });
        setMdxSource(mdx);
      } catch (error) {
        console.error("MDX compile error:", error);
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
      <MDXRemote {...mdxSource} components={components} />
    </div>
  );
}
