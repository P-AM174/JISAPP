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
    title: t("マイライブラリ", "My library"),
    description: t(
      "購入・追加したアプリを一覧で管理。いつでも再実行できます。",
      "All the apps you've added, in one place. Open them again anytime."
    ),
    path: "/library",
  });
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
