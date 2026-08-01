import type { Metadata } from "next";
import { createNoIndexPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createNoIndexPageMetadata({
  title: "マイプロジェクト",
  description: "開発スタジオで作成・保存したアプリの下書き一覧。編集・公開・URL発行を管理できます。",
  path: "/projects",
});

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
