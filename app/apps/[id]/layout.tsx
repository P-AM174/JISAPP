import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  createPageMetadata,
  createSoftwareApplicationJsonLd,
} from "@/lib/seo/metadata";
import { getPublicAppSeo } from "@/lib/seo/public-apps";

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
  const app = await getPublicAppSeo(id);

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
  });
}

export default async function AppDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const app = await getPublicAppSeo(id);

  return (
    <>
      {app ? (
        <JsonLd data={createSoftwareApplicationJsonLd(app)} />
      ) : null}
      {children}
    </>
  );
}
