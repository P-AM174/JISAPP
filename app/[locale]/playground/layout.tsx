import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";

/** 開発スタジオは URL シェア用に OGP / X カードを出す（noindex にしない） */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale, t } = await getI18n(params);
  return createPageMetadata({
    locale,
    title: t("開発スタジオ", "Studio"),
    description: t(
      "AIが作ったHTMLコードを貼り付けるだけでアプリが動く無料の開発スタジオ。プレビュー・APIキー登録・URL発行までブラウザだけで完結。",
      "A free studio where HTML code made by AI runs as an app the moment you paste it. Preview, register API keys and get a URL — all in your browser."
    ),
    path: "/playground",
  });
}

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
