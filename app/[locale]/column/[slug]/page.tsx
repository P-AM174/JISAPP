import { notFound } from "next/navigation";
import Link from "@/lib/i18n/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { JsonLd } from "@/components/seo/json-ld";
import { ColumnBody } from "@/components/columns/column-body";
import { ColumnShare } from "@/components/columns/share-x";
import { createPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, siteName } from "@/lib/seo/site";
import { localizePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { getEmbeddedApps, getPublishedColumn } from "@/lib/columns/service";
import { excerpt, readingMinutes } from "@/lib/columns/markdown";

export const revalidate = 300;

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function load(params: PageProps["params"]) {
  const { locale, t } = await getI18n(params);
  const { slug } = await params;
  const column = await getPublishedColumn(slug).catch(() => null);
  // 記事は書いた言語の URL でだけ出す（日本語の記事は /column/…、英語の記事は /en/column/…）
  if (!column || column.locale !== (locale === "ja" ? "ja" : "en") || (locale !== "ja" && locale !== "en")) return null;
  return { locale, t, column };
}

export async function generateMetadata({ params }: PageProps) {
  const r = await load(params);
  if (!r) return {};
  const { locale, column } = r;
  const description = column.description || excerpt(column.body);
  const og = column.coverImage ? absoluteUrl(column.coverImage) : `/og/columns/${column.slug}.png`;
  return {
    ...createPageMetadata({ locale, title: column.title, description, path: `/column/${column.slug}`, ogImage: og }),
    // ほかの言語の記事はないので、言語の対応（hreflang）は出さない
    alternates: { canonical: absoluteUrl(localizePath(`/column/${column.slug}`, locale)) },
  };
}

function date(iso: string | null, en: boolean) {
  if (!iso) return "";
  const d = new Date(iso);
  return en ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default async function ColumnPage({ params }: PageProps) {
  const r = await load(params);
  if (!r) notFound();
  const { locale, t, column } = r;
  const en = locale === "en";
  const apps = await getEmbeddedApps(column.body).catch(() => ({}));
  const url = absoluteUrl(localizePath(`/column/${column.slug}`, locale));
  const appHref = (id: string) => localizePath(`/apps/${id}`, locale);
  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BlogPosting", headline: column.title,
        description: column.description || excerpt(column.body), url, inLanguage: column.locale,
        datePublished: column.publishedAt ?? column.createdAt, dateModified: column.updatedAt,
        ...(column.coverImage ? { image: absoluteUrl(column.coverImage) } : {}),
        author: { "@type": "Organization", name: siteName(locale) }, publisher: { "@type": "Organization", name: siteName(locale) },
      }} />
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile fallbackHref="/column" />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <Link href="/column" className="text-sm font-semibold text-gray-700">{t("コラム", "Column")}</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[680px] px-5 pb-24 pt-6">
        {column.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={column.coverImage} alt="" className="mb-8 aspect-[1.91/1] w-full rounded-xl object-cover" />
        ) : null}
        <h1 className="text-[1.75rem] font-black leading-snug text-gray-900">{column.title}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-5">
          <p className="text-xs text-gray-400">{date(column.publishedAt, en)}・{t(`${readingMinutes(column.body)}分で読めます`, `${readingMinutes(column.body)} min read`)}</p>
          <ColumnShare url={url} text={column.xText || column.title} en={en} />
        </div>
        <article className="pt-4"><ColumnBody body={column.body} apps={apps} appHref={appHref} /></article>
        <div className="mt-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center">
          <p className="text-sm font-bold text-emerald-800">{t("AI に「こんなアプリ作りたい」と送って、貼るだけ。", "Ask your AI for an app, then paste the code.")}</p>
          <Link href="/playground" className="mt-3 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md">{t("ジサップで無料で作る", "Build it free on Jisapp")}</Link>
        </div>
        <div className="mt-8 flex justify-center"><ColumnShare url={url} text={column.xText || column.title} en={en} /></div>
      </main>
    </div>
  );
}
