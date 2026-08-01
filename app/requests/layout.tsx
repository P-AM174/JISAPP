import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "アプリリクエスト",
  description:
    "欲しいアプリのアイデアを投稿・閲覧できる掲示板。クリエイターがアプリを作って応えます。",
  path: "/requests",
});

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
