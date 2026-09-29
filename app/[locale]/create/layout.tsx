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
    title: t("アプリを作る", "Make an app"),
    description: t(
      "ジサップでWebアプリを作成・公開する。HTMLコードをアップロードしてすぐに共有できます。",
      "Make and publish a web app on Jisapp. Upload HTML code and share it right away."
    ),
    path: "/create",
  });
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
