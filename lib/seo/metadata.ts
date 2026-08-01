import type { Metadata } from "next";
import {
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_OG_IMAGE,
  SITE_OG_IMAGE_WIDTH,
  SITE_OG_IMAGE_HEIGHT,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  ogImage?: string;
  /** SNSプレビュー用（未指定時は title / description と同じ） */
  ogTitle?: string;
  ogDescription?: string;
};

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

/** 検索エンジンには載せないが、SNSシェア用 OGP は出したいページ向け */
export function createNoIndexPageMetadata(
  options: Omit<PageMetadataOptions, "noIndex"> = {}
): Metadata {
  return createPageMetadata({ ...options, noIndex: true });
}

export function createPageMetadata(options: PageMetadataOptions = {}): Metadata {
  const {
    title,
    description = SITE_DESCRIPTION,
    path,
    noIndex = false,
    ogImage = SITE_OG_IMAGE,
    ogTitle,
    ogDescription,
  } = options;

  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  const shareTitle = ogTitle ?? pageTitle;
  const shareDescription = ogDescription ?? description;
  const canonical = path ? absoluteUrl(path) : getSiteUrl();
  const imageUrl = ogImage.startsWith("http") ? ogImage : absoluteUrl(ogImage);
  const isSiteOg =
    ogImage === SITE_OG_IMAGE ||
    ogImage.endsWith("/og.png") ||
    ogImage.includes("opengraph") ||
    ogImage.includes("site-opengraph");
  const imageMeta = {
    url: imageUrl,
    secureUrl: imageUrl,
    width: isSiteOg ? SITE_OG_IMAGE_WIDTH : 512,
    height: isSiteOg ? SITE_OG_IMAGE_HEIGHT : 512,
    alt: shareTitle,
    type: "image/png" as const,
  };

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      siteName: SITE_NAME,
      title: shareTitle,
      description: shareDescription,
      url: canonical,
      images: [imageMeta],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      // 絶対URLの文字列を明示（X カード取得用）
      images: [imageUrl],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function createRootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    ...createPageMetadata(),
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    verification: {
      google: "MknTcu1dRo9xzP-DDlRK5K0p0GDBZEReO3ftFe1tFFM",
    },
  };
}

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: SITE_DESCRIPTION,
    inLanguage: "ja-JP",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function createSoftwareApplicationJsonLd(app: {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  creatorName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.title,
    description: app.description || `${app.title} - ${SITE_NAME}で公開中のアプリ`,
    url: absoluteUrl(`/apps/${app.id}`),
    applicationCategory: app.category ?? "UtilitiesApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    ...(app.creatorName
      ? { author: { "@type": "Person", name: app.creatorName } }
      : {}),
  };
}
