import Link from "@/lib/i18n/navigation";
import { FileText } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { ColumnCover } from "@/components/columns/column-cover";
import { StudioCard } from "@/components/home/studio-card";
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

function date(iso: string | null, en: boolean, short = false) {
  if (!iso) return "";
  const d = new Date(iso);
  if (en) return d.toLocaleDateString("en-US", { year: short ? undefined : "numeric", month: "short", day: "numeric" });
  return short ? `${d.getMonth() + 1}月${d.getDate()}日` : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default async function ColumnListPage({ params }: PageProps) {
  const { locale, t } = await getI18n(params);
  const en = locale !== "ja";
  const columns = await listPublishedColumns(en ? "en" : "ja").catch(() => []);
  const [first, ...rest] = columns;
  return (
    <div className="font-column min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile fallbackHref="/" />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-300">/</span>
          <span className="text-sm text-gray-500">{t("コラム", "Column")}</span>
        </div>
      </header>
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-[680px] px-5 pb-5 pt-7">
          <p className="text-[11px] font-bold tracking-[0.2em] text-emerald-500">JISAPP COLUMN</p>
          <h1 className="mt-0.5 text-[1.6rem] font-bold">{t("コラム", "Column")}</h1>
          <p className="mt-1 text-[13.5px] text-gray-500">{t("グループの用事を、自分のアプリに。", "Turn your group's chores into your own app.")}</p>
        </div>
      </section>
      <main className="mx-auto max-w-[680px] px-5 pb-16">
        {!first ? (
          <div className="py-16 text-center text-sm text-gray-400"><FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />{t("まだ記事がありません", "No posts yet")}</div>
        ) : (
          <>
            <Link href={`/column/${first.slug}`} className="group block border-b border-gray-100 py-5">
              <div className="relative overflow-hidden rounded-xl">
                <ColumnCover src={first.coverImage} tags={first.tags} big />
                <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">NEW</span>
              </div>
              <h2 className="mt-3 text-[1.2rem] font-bold leading-[1.55] group-hover:text-emerald-700">{first.title}</h2>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.8] text-gray-500">{first.description || excerpt(first.body, 90)}</p>
              <p className="mt-2 text-[11.5px] text-gray-400">{first.tags[0] ? <span className="mr-2 text-emerald-700">#{first.tags[0]}</span> : null}{date(first.publishedAt, en)}</p>
            </Link>
            {rest.map((c) => (
              <Link key={c.id} href={`/column/${c.slug}`} className="group flex items-center gap-4 border-b border-gray-100 py-4">
                <span className="flex-1">
                  <span className="line-clamp-2 text-[15px] font-bold leading-[1.6] group-hover:text-emerald-700">{c.title}</span>
                  <span className="mt-1 block text-[11.5px] text-gray-400">{c.tags[0] ? <span className="mr-2 text-emerald-700">#{c.tags[0]}</span> : null}{date(c.publishedAt, en, true)}</span>
                </span>
                <ColumnCover src={c.coverImage} tags={c.tags} className="!w-[104px] shrink-0 rounded-lg" />
              </Link>
            ))}
          </>
        )}
        <div className="mt-10"><StudioCard /></div>
      </main>
    </div>
  );
}
