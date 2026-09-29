import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  createPageMetadata,
  createSoftwareApplicationJsonLd,
} from "@/lib/seo/metadata";
import { getShareableAppSeo } from "@/lib/seo/public-apps";
import { SITE_NAME } from "@/lib/seo/site";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const app = await getShareableAppSeo(id);

  if (!app) {
    return createPageMetadata({
      title: "アプリが見つかりません",
      path: `/apps/${id}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: app.title,
    description: app.description,
    path: `/apps/${app.id}`,
    // アプリ名を描き込んだ専用OGP画像（取得に失敗したときは共通画像へリダイレクト）
    ogImage: `/og/apps/${encodeURIComponent(app.id)}.png`,
    ogTitle: `${app.title}｜${SITE_NAME}`,
    ogDescription: app.description,
    noIndex: app.isListed === false,
  });
}

export default async function AppDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const app = await getShareableAppSeo(id);

  return (
    <>
      {app ? (
        <JsonLd data={createSoftwareApplicationJsonLd(app)} />
      ) : null}
      {children}
    </>
  );
}
