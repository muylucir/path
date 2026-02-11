"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Menu, X } from "lucide-react";

const STEP_PAGES = ["/feasibility", "/analyze", "/results"];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigateHome = () => {
    if (STEP_PAGES.some((p) => pathname.startsWith(p))) {
      if (!window.confirm("진행 중인 분석이 초기화됩니다. 계속하시겠습니까?")) {
        return;
      }
    }
    sessionStorage.clear();
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
                새 분석
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

          <p className="text-sm text-muted-foreground hidden md:block">
            AI Agent 아이디어를 프로토타입으로
          </p>

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
