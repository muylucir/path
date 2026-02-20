import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CloudscapeProvider } from "@/components/cloudscape/CloudscapeProvider";
import { FlashbarProvider } from "@/components/cloudscape/FlashbarProvider";

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
      <body className={d2Coding.variable}>
        <CloudscapeProvider>
          <FlashbarProvider>
            {children}
          </FlashbarProvider>
        </CloudscapeProvider>
      </body>
    </html>
  );
}
