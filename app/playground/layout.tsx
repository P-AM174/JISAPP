import type { Metadata } from "next";
import { createNoIndexPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createNoIndexPageMetadata({
  title: "開発スタジオ",
  description:
    "AIが作ったHTMLコードを貼り付けるだけでアプリが動く無料の開発スタジオ。プレビュー・APIキー登録・URL発行までブラウザだけで完結。",
  path: "/playground",
});

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
