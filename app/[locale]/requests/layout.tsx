import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, t } = await getI18n(params);
  return createPageMetadata({
    locale,
    title: t("アプリリクエスト", "App requests"),
    description: t(
      "欲しいアプリのアイデアを投稿・閲覧できる掲示板。クリエイターがアプリを作って応えます。",
      "A board where you can post and browse ideas for apps you want. Creators answer by building them."
    ),
    path: "/requests",
  });
}

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
