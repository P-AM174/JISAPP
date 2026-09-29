import type { Metadata } from "next";
import SearchPageClientRoot from "@/components/search/search-page-client";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getCatalogApps } from "@/lib/home/catalog";

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim();

  if (query) {
    return createPageMetadata({
      title: `「${query}」の検索結果`,
      description: `「${query}」に関連するWebアプリ・ツールをジサップで検索。無料アプリをすぐ試せます。`,
      path: `/search?q=${encodeURIComponent(query)}`,
    });
  }

  return createPageMetadata({
    title: "アプリを探す",
    description:
      "ジサップで公開されているWebアプリ・ツールをカテゴリやキーワードから検索できます。",
    path: "/search",
  });
}

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const initialApps = await getCatalogApps(100);

  return <SearchPageClientRoot initialApps={initialApps} />;
}
