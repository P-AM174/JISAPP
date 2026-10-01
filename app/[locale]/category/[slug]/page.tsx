import type { Metadata } from "next";
import Link from "@/lib/i18n/navigation";
import { notFound } from "next/navigation";
import { JisappLogo } from "@/components/jisapp-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BackButton } from "@/components/back-button";
import { JsonLd } from "@/components/seo/json-ld";
import { CATEGORIES, CATEGORY_MAP, categoryName } from "@/lib/categories";
import { getI18n } from "@/lib/i18n/server";
import { localizePath, format } from "@/lib/i18n/config";
import { CategoryIcon } from "@/lib/category-icon";
import { createPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import { getAppsByCategory } from "@/lib/home/catalog";

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale, t } = await getI18n(params);
  const category = CATEGORY_MAP[slug];
  if (!category) {
    return createPageMetadata({ locale, title: t("カテゴリが見つかりません", "Category not found"), noIndex: true });
  }
  const name = categoryName(category, locale);

  return createPageMetadata({
    locale,
    title: format(t("{name}のアプリ", "{name} apps"), { name }),
    description: format(t("ジサップで公開されている{name}カテゴリのWebアプリ・ツール一覧。無料で使えるアプリを探せます。", "Web apps and tools in the {name} category on Jisapp. Find free apps to try."), { name }),
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const { locale, t } = await getI18n(params);
  const category = CATEGORY_MAP[slug];
  if (!category) notFound();
  const name = categoryName(category, locale);

  const apps = await getAppsByCategory(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: format(t("{name}のアプリ | ジサップ", "{name} apps | Jisapp"), { name }),
    description: format(t("{name}カテゴリのWebアプリ一覧", "Web apps in the {name} category"), { name }),
    url: absoluteUrl(localizePath(`/category/${slug}`, locale)),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: apps.map((app, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(localizePath(`/apps/${app.id}`, locale)),
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
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Link
              href="/playground"
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              {t("アプリ開発スタジオへ", "Open the Studio")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-600">{t("カテゴリ", "Category")}</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-black text-gray-900">
            <CategoryIcon categoryId={category.id} className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
            {format(t("{name}のアプリ", "{name} apps"), { name })}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {format(t("ジサップで公開されている{name}カテゴリのWebアプリ一覧です。気になるアプリを選んで、すぐにブラウザで試せます。", "Web apps in the {name} category on Jisapp. Pick one and try it right away in your browser."), { name })}
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-gray-500">{t("このカテゴリのアプリはまだありません。", "No apps in this category yet.")}</p>
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline">
              {t("トップページへ戻る", "Back to home")}
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
                    {t("無料で試す →", "Try it free →")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <nav aria-label={t("他のカテゴリ", "Other categories")} className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="mb-4 text-sm font-bold text-gray-700">{t("他のカテゴリを見る", "More categories")}</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((cat) => cat.id !== slug).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:text-emerald-600 hover:ring-emerald-200"
              >
                <CategoryIcon categoryId={cat.id} className="h-3.5 w-3.5" />
                {categoryName(cat, locale)}
              </Link>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}
