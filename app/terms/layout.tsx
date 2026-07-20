import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "利用規約",
  description: "ジサップ（Jisapp）の利用規約。アプリの出品・利用・安全な実行環境について定めています。",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
