import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JisappLogo } from "@/components/jisapp-logo";
import { BackButton } from "@/components/back-button";
import { JsonLd } from "@/components/seo/json-ld";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { createPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import { getAppsByCategory } from "@/lib/home/catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORY_MAP[slug];
  if (!category) {
    return createPageMetadata({ title: "カテゴリが見つかりません", noIndex: true });
  }

  return createPageMetadata({
    title: `${category.name}のアプリ`,
    description: `ジサップで公開されている${category.name}カテゴリのWebアプリ・ツール一覧。無料で使えるアプリを探せます。`,
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = CATEGORY_MAP[slug];
  if (!category) notFound();

  const apps = await getAppsByCategory(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name}のアプリ | ジサップ`,
    description: `${category.name}カテゴリのWebアプリ一覧`,
    url: absoluteUrl(`/category/${slug}`),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: apps.map((app, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/apps/${app.id}`),
        name: app.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <JsonLd data={jsonLd} />

      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" />
            <JisappLogo href="/" />
          </div>
          <Link
            href="/playground"
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            アプリを作る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-600">カテゴリ</p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">
            {category.emoji} {category.name}のアプリ
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            ジサップで公開されている{category.name}カテゴリのWebアプリ一覧です。
            気になるアプリを選んで、すぐにブラウザで試せます。
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-gray-500">このカテゴリのアプリはまだありません。</p>
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline">
              トップページへ戻る
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {apps.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/apps/${app.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] transition-all hover:shadow-md hover:ring-emerald-200"
                >
                  <h2 className="text-base font-bold text-gray-900">{app.title}</h2>
                  {app.description && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3">
                      {app.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-semibold text-emerald-600">
                    無料で試す →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <nav aria-label="他のカテゴリ" className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="mb-4 text-sm font-bold text-gray-700">他のカテゴリを見る</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((cat) => cat.id !== slug).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:text-emerald-600 hover:ring-emerald-200"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}
