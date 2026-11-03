import Link from "@/lib/i18n/navigation";
import { FileText } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { listPublishedColumns } from "@/lib/columns/service";
import { excerpt } from "@/lib/columns/markdown";

export const revalidate = 300;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale, t } = await getI18n(params);
  return createPageMetadata({
    locale,
    title: t("コラム", "Column"),
    description: t("グループの用事を、AI とジサップで自分専用のアプリにするコラム。旅行の精算、当番、集金、出欠など。", "Columns on turning everyday group chores into your own app with AI and Jisapp."),
    path: "/column",
  });
}

function date(iso: string | null, en: boolean) {
  if (!iso) return "";
  const d = new Date(iso);
  return en ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default async function ColumnListPage({ params }: PageProps) {
  const { locale, t } = await getI18n(params);
  const en = locale !== "ja";
  const columns = await listPublishedColumns(en ? "en" : "ja").catch(() => []);
  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile fallbackHref="/" />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">{t("コラム", "Column")}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 pb-20">
        <h1 className="mb-6 text-2xl font-black text-gray-900">{t("コラム", "Column")}</h1>
        {columns.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-400 ring-1 ring-black/5"><FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />{t("まだ記事がありません", "No posts yet")}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {columns.map((c) => (
              <Link key={c.id} href={`/column/${c.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                {c.coverImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.coverImage} alt="" loading="lazy" className="aspect-[1.91/1] w-full object-cover" />
                  : <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center text-lg font-black text-emerald-800">{c.title}</div>}
                <div className="p-4">
                  <h2 className="line-clamp-2 font-black leading-snug text-gray-900 group-hover:text-emerald-700">{c.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{c.description || excerpt(c.body, 80)}</p>
                  <p className="mt-2 text-xs text-gray-400">{date(c.publishedAt, en)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
