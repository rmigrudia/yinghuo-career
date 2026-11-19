import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "团队工作区 · 萤火职航",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
