import type { Metadata } from "next";
import { createNoIndexPageMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, t } = await getI18n(params);
  return createNoIndexPageMetadata({
    locale,
    title: t("マイプロジェクト", "My projects"),
    description: t(
      "開発スタジオで作成・保存したアプリの下書き一覧。編集・公開・URL発行を管理できます。",
      "Drafts you made and saved in the Studio. Edit them, publish them and manage their URLs."
    ),
    path: "/projects",
  });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
