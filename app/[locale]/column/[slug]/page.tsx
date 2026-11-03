import { notFound } from "next/navigation";
import Link from "@/lib/i18n/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { JsonLd } from "@/components/seo/json-ld";
import { ColumnBody } from "@/components/columns/column-body";
import { ColumnCover } from "@/components/columns/column-cover";
import { ColumnShare } from "@/components/columns/share-x";
import { MakeAppFab } from "@/components/columns/make-app-fab";
import { ColumnTracker } from "@/components/columns/column-tracker";
import { StudioCard } from "@/components/home/studio-card";
import { createPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName } from "@/lib/seo/site";
import { localizePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { getEmbeddedApps, getPublishedColumn, listPopularApps, listRelatedColumns } from "@/lib/columns/service";
import { excerpt, readingMinutes } from "@/lib/columns/markdown";

export const revalidate = 300;

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function load(params: PageProps["params"]) {
  const { locale, t } = await getI18n(params);
  const { slug } = await params;
  const column = await getPublishedColumn(slug).catch(() => null);
  // 日本語の記事は /column/…、英語の記事は /en/column/…（ベトナム語のページでは英語の記事を出す）
  if (!column || column.locale !== (locale === "ja" ? "ja" : "en")) return null;
  return { locale, t, column };
}

export async function generateMetadata({ params }: PageProps) {
  const r = await load(params);
  if (!r) return {};
  const { locale, column } = r;
  const description = column.description || excerpt(column.body);
  // 見出し画像は Supabase の完全な URL で保存している（そのまま使う）。ない記事はタイトルを描いた画像
  const base = createPageMetadata({ locale, title: column.title, description, path: `/column/${column.slug}`, ogImage: column.coverImage || `/og/columns/${column.slug}.png` });
  const og = base.openGraph!;
  return {
    ...base,
    openGraph: {
      ...og,
      type: "article",
      publishedTime: column.publishedAt ?? column.createdAt,
      modifiedTime: column.updatedAt,
      ...(column.tags.length ? { tags: column.tags } : {}),
      // 見出し画像は大きさも形式もまちまちなので、幅・高さ・形式は書かない（描いた画像は 1200×630 の PNG）
      ...(column.coverImage ? { images: [{ url: column.coverImage, alt: column.title }] } : {}),
    },
    // ほかの言語の記事はないので、言語の対応（hreflang）は出さない。ベトナム語のページの記事は英語の URL を正とする
    alternates: { canonical: absoluteUrl(localizePath(`/column/${column.slug}`, column.locale)) },
  };
}

function date(iso: string | null, en: boolean, short = false) {
  if (!iso) return "";
  const d = new Date(iso);
  if (en) return d.toLocaleDateString("en-US", { year: short ? undefined : "numeric", month: "short", day: "numeric" });
  return short ? `${d.getMonth() + 1}月${d.getDate()}日` : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default async function ColumnPage({ params }: PageProps) {
  const r = await load(params);
  if (!r) notFound();
  const { locale, t, column } = r;
  const en = column.locale === "en";
  const [apps, related, popular] = await Promise.all([
    getEmbeddedApps(column.body).catch(() => ({})),
    listRelatedColumns(column).catch(() => []),
    listPopularApps().catch(() => []),
  ]);
  const url = absoluteUrl(localizePath(`/column/${column.slug}`, column.locale));
  const appHref = (id: string) => localizePath(`/apps/${id}`, locale);
  return (
    <div className="font-column min-h-screen bg-white">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BlogPosting", headline: column.title,
        description: column.description || excerpt(column.body), url, inLanguage: column.locale,
        datePublished: column.publishedAt ?? column.createdAt, dateModified: column.updatedAt,
        ...(column.coverImage ? { image: column.coverImage } : {}),
        ...(column.tags.length ? { keywords: column.tags.join(",") } : {}),
        author: { "@type": "Organization", name: siteName(locale) }, publisher: { "@type": "Organization", name: siteName(locale) },
      }} />
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile fallbackHref="/column" />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-300">/</span>
          <Link href="/column" className="text-sm text-gray-500">{t("コラム", "Column")}</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-5 pb-28 pt-4">
        <ColumnCover src={column.coverImage} tags={column.tags} className="rounded-xl" big />
        {column.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-emerald-700">
            {column.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        )}
        <h1 className="mt-2 text-[1.6rem] font-bold leading-[1.55] tracking-[0.02em]">{column.title}</h1>
        <p className="mt-3 text-[12.5px] text-gray-500">{date(column.publishedAt, en)}・{en ? `${readingMinutes(column.body, true)} min read` : `${readingMinutes(column.body)}分で読めます`}</p>
        <div className="mt-3"><ColumnShare url={url} text={column.xText || column.title} en={en} /></div>

        <article id="column-article" className="mt-2"><ColumnBody body={column.body} apps={apps} appHref={appHref} toc en={en} /></article>

        <div className="mt-12"><ColumnShare url={url} text={column.xText || column.title} en={en} /></div>
        <div className="mt-8"><StudioCard tone="column" /></div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[15px] font-bold">{t("次に読む", "Read next")}</h2>
            <ul className="mt-1">
              {related.map((c) => (
                <li key={c.id} className="border-b border-gray-100">
                  <Link href={`/column/${c.slug}`} className="flex items-center gap-4 py-3">
                    <span className="flex-1">
                      <span className="line-clamp-2 text-[14.5px] font-bold leading-[1.6]">{c.title}</span>
                      <span className="mt-1 block text-[11.5px] text-gray-400">{c.tags[0] ? <span className="mr-2 text-emerald-700">#{c.tags[0]}</span> : null}{date(c.publishedAt, en, true)}</span>
                    </span>
                    <ColumnCover src={c.coverImage} tags={c.tags} className="!w-24 shrink-0 rounded-lg" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {popular.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[15px] font-bold">{t("人気のアプリ", "Popular apps")}</h2>
            <div className="mt-3 flex gap-4">
              {popular.map((a) => (
                <Link key={a.id} href={`/apps/${a.id}`} className="w-[72px] text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/apps/${a.id}/icon?size=180`} alt="" width={56} height={56} loading="lazy" className="mx-auto h-14 w-14 rounded-2xl shadow-sm" />
                  <span className="mt-1.5 line-clamp-2 block text-[11.5px] leading-tight text-gray-600">{a.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <MakeAppFab />
      <ColumnTracker slug={column.slug} />
    </div>
  );
}
