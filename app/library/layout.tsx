import type { Metadata } from "next";
import { createNoIndexPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createNoIndexPageMetadata({
  title: "マイライブラリ",
  description: "購入・追加したアプリを一覧で管理。いつでも再実行できます。",
  path: "/library",
});

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
