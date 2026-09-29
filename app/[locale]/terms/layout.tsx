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
    title: t("利用規約", "Terms of Service"),
    description: t(
      "ジサップ（Jisapp）の利用規約。アプリの出品・利用・安全な実行環境について定めています。",
      "Jisapp's Terms of Service, covering publishing apps, using apps, and the safe environment they run in."
    ),
    path: "/terms",
  });
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
