import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "에이전트 디자인 | P.A.T.H Agent Designer",
  description:
    "AI Agent 아이디어를 구조화하고, 준비도를 점검하고, 패턴을 분석하여 구현 명세서를 생성합니다.",
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
