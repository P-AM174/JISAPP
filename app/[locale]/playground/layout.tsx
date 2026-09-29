import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

/** 開発スタジオは URL シェア用に OGP / X カードを出す（noindex にしない） */
export const metadata: Metadata = createPageMetadata({
  title: "開発スタジオ",
  description:
    "AIが作ったHTMLコードを貼り付けるだけでアプリが動く無料の開発スタジオ。プレビュー・APIキー登録・URL発行までブラウザだけで完結。",
  path: "/playground",
});

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
