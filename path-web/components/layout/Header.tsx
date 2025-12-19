"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80">
              <Bot className="h-7 w-7" />
              <h1 className="text-xl font-bold">P.A.T.H Agent Designer</h1>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                새 분석
              </Link>
              <Link
                href="/sessions"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/sessions" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                세션 목록
              </Link>
            </nav>
          </div>
          
          <p className="text-sm text-muted-foreground">
            AI Agent 아이디어를 프로토타입으로
          </p>
        </div>
      </div>
    </header>
  );
}
