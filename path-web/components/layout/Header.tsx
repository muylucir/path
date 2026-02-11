"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Menu, X, Coins } from "lucide-react";
import { useTokenUsage } from "@/lib/hooks/useTokenUsage";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STEP_PAGES = ["/feasibility", "/analyze", "/results"];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { usage, resetUsage } = useTokenUsage();

  const handleNavigateHome = () => {
    if (STEP_PAGES.some((p) => pathname.startsWith(p))) {
      if (!window.confirm("진행 중인 분석이 초기화됩니다. 계속하시겠습니까?")) {
        return;
      }
    }
    sessionStorage.clear();
    resetUsage();
    router.push("/");
    setMobileMenuOpen(false);
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={handleNavigateHome}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Bot className="h-7 w-7" />
              <h1 className="text-xl font-bold">P.A.T.H Agent Designer</h1>
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/intro"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/intro" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                소개
              </Link>
              <Link
                href="/guide"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/guide" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                가이드
              </Link>
              <button
                onClick={handleNavigateHome}
                className={`text-sm font-medium cursor-pointer transition-colors hover:text-primary ${
                  pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                에이전트 디자인
              </button>
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

          <div className="hidden md:flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              AI Agent 아이디어를 프로토타입으로
            </p>
            {usage.totalTokens > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs cursor-default hover:bg-muted/50 transition-colors">
                    <Coins className="h-3 w-3 text-amber-500" />
                    <span className="font-medium tabular-nums">
                      {formatTokens(usage.totalTokens)}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-medium tabular-nums text-green-600">
                      ${usage.estimatedCostUSD.toFixed(2)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="text-xs space-y-1 w-56">
                  <p className="font-semibold pb-1 border-b mb-1">Token Usage (this session)</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">Claude Opus 4.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Input</span>
                    <span className="tabular-nums">{usage.inputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Output</span>
                    <span className="tabular-nums">{usage.outputTokens.toLocaleString()}</span>
                  </div>
                  {(usage.cacheReadInputTokens ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cache Read</span>
                      <span className="tabular-nums">{(usage.cacheReadInputTokens ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  {(usage.cacheWriteInputTokens ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cache Write</span>
                      <span className="tabular-nums">{(usage.cacheWriteInputTokens ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t font-medium">
                    <span>Total</span>
                    <span className="tabular-nums">{usage.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Est. Cost</span>
                    <span className="tabular-nums">${usage.estimatedCostUSD.toFixed(4)}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile navigation dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-2 border-t pt-4 flex flex-col gap-3">
            <button
              onClick={() => handleNavClick("/intro")}
              className={`text-sm font-medium text-left transition-colors hover:text-primary ${
                pathname === "/intro" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              소개
            </button>
            <button
              onClick={() => handleNavClick("/guide")}
              className={`text-sm font-medium text-left transition-colors hover:text-primary ${
                pathname === "/guide" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              가이드
            </button>
            <button
              onClick={handleNavigateHome}
              className={`text-sm font-medium text-left transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              새 분석
            </button>
            <button
              onClick={() => handleNavClick("/sessions")}
              className={`text-sm font-medium text-left transition-colors hover:text-primary ${
                pathname === "/sessions" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              세션 목록
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
