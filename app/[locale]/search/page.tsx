import type { Metadata } from "next";
import SearchPageClientRoot from "@/components/search/search-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getCatalogApps } from "@/lib/home/catalog";
import { getI18n } from "@/lib/i18n/server";

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  searchParams,
  params: routeParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const { locale, t } = await getI18n(routeParams);
  const query = params.q?.trim();

  if (query) {
    return createPageMetadata({
      locale,
      title: t(`「${query}」の検索結果`, `Results for “${query}”`),
      description: t(
        `「${query}」に関連するWebアプリ・ツールをジサップで検索。無料アプリをすぐ試せます。`,
        `Search Jisapp for web apps and tools related to “${query}”. Try free apps right away.`
      ),
      path: `/search?q=${encodeURIComponent(query)}`,
    });
  }

  return createPageMetadata({
    locale,
    title: t("アプリを探す", "Browse apps"),
    description: t(
      "ジサップで公開されているWebアプリ・ツールをカテゴリやキーワードから検索できます。",
      "Search the web apps and tools published on Jisapp by category or keyword."
    ),
    path: "/search",
  });
}

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const initialApps = await getCatalogApps(100);

  return <SearchPageClientRoot initialApps={initialApps} />;
}
