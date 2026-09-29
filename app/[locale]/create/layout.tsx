import type { Metadata } from "next";
import { createNoIndexPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createNoIndexPageMetadata({
  title: "アプリを作る",
  description: "ジサップでWebアプリを作成・公開する。HTMLコードをアップロードしてすぐに共有できます。",
  path: "/create",
});

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
