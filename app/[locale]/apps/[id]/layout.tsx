import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  createPageMetadata,
  createSoftwareApplicationJsonLd,
} from "@/lib/seo/metadata";
import { getShareableAppSeo } from "@/lib/seo/public-apps";
import { siteName } from "@/lib/seo/site";
import { getI18n } from "@/lib/i18n/server";

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

  return createPageMetadata({
    locale,
    title: app.title,
    description: app.description,
    path: `/apps/${app.id}`,
    // アプリ名を描き込んだ専用OGP画像（取得に失敗したときは共通画像へリダイレクト）
    ogImage: `/og/apps/${encodeURIComponent(app.id)}${locale === "en" ? ".en" : ""}.png`,
    ogTitle: t(`${app.title}｜${siteName(locale)}`, `${app.title} | ${siteName(locale)}`),
    ogDescription: app.description,
    noIndex: app.isListed === false,
  });
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
