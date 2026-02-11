import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const d2Coding = localFont({
  src: "../D2Coding.woff2",
  variable: "--font-d2coding",
  display: "swap",
});

export const metadata: Metadata = {
  title: "P.A.T.H Agent Designer",
  description: "AI Agent 아이디어 검증 및 구현 명세서 생성 도구",
  openGraph: {
    title: "P.A.T.H Agent Designer",
    description: "AI Agent 아이디어 검증 및 구현 명세서 생성 도구",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${d2Coding.variable} antialiased`}>
        <TooltipProvider delayDuration={200}>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
