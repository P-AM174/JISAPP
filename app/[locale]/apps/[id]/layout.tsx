import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  createPageMetadata,
  createSoftwareApplicationJsonLd,
} from "@/lib/seo/metadata";
import { getShareableAppSeo } from "@/lib/seo/public-apps";
import { siteName } from "@/lib/seo/site";
import { getI18n } from "@/lib/i18n/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * アイコンを保存した日時。アイコンの URL に ?v= として付け、iPhone などが古い画像を使い続けないようにする
 */
async function iconVersion(id: string): Promise<string> {
  try {
    const { data } = await createServerSupabaseClient().from("app_appearance").select("updated_at").eq("app_id", id).maybeSingle();
    return data?.updated_at ? `&v=${new Date(data.updated_at).getTime()}` : "";
  } catch {
    return "";
  }
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { locale, t } = await getI18n(params);
  const app = await getShareableAppSeo(id);

  if (!app) {
    return createPageMetadata({
      locale,
      title: t("アプリが見つかりません", "App not found"),
      path: `/apps/${id}`,
      noIndex: true,
    });
  }

  const v = await iconVersion(app.id);
  return { ...createPageMetadata({
    locale,
    title: app.title,
    description: app.description,
    path: `/apps/${app.id}`,
    // アプリ名を描き込んだ専用OGP画像（取得に失敗したときは共通画像へリダイレクト）
    ogImage: `/og/apps/${encodeURIComponent(app.id)}${locale === "ja" ? "" : `.${locale}`}.png`,
    ogTitle: t(`${app.title}｜${siteName(locale)}`, `${app.title} | ${siteName(locale)}`),
    ogDescription: app.description,
    noIndex: app.isListed === false,
  }), manifest: `/api/apps/${id}/manifest?locale=${locale}`, icons: { apple: { url: `/api/apps/${id}/icon?size=180${v}`, sizes: "180x180", type: "image/png" }, icon: { url: `/api/apps/${id}/icon?size=192${v}`, sizes: "192x192", type: "image/png" } }, appleWebApp: { capable: true, title: app.title } };
}

export default async function AppDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const { locale } = await getI18n(params);
  const app = await getShareableAppSeo(id);

  return (
    <>
      {app ? (
        <JsonLd data={createSoftwareApplicationJsonLd(app, locale)} />
      ) : null}
      {children}
    </>
  );
}
