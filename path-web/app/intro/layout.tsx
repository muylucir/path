import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소개 | P.A.T.H Agent Designer",
  description:
    "AI Agent, 좋은 건 알겠는데 우리 업무에 되는 건가요? P.A.T.H Agent Designer 소개",
};

export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
