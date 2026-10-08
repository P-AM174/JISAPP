import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SnsFeatureClient } from "@/components/features/sns-feature-client";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getSnsFeaturedApps } from "@/lib/home/catalog";
import { getI18n } from "@/lib/i18n/server";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await getI18n(params);
  return createPageMetadata({
    locale,
    title: "ショート動画で紹介したアプリ",
    description: "TikTok・YouTube・Instagram で紹介したジサップのアプリをまとめました。動画で見たアプリを、そのまま遊べます。自分仕様に作り変える方法も紹介しています。",
    path: "/features/sns",
  });
}

export const dynamic = "force-dynamic";

/** 特集：SNSで紹介したアプリ（まずは日本語版だけ） */
export default async function SnsFeaturePage({ params }: PageProps) {
  const { locale } = await getI18n(params);
  if (locale !== "ja") notFound();
  const apps = await getSnsFeaturedApps(100);
  return <SnsFeatureClient apps={apps} />;
}
