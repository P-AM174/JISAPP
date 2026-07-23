import type { Metadata } from "next";
import {
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  ogImage?: string;
};

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export function createPageMetadata(options: PageMetadataOptions = {}): Metadata {
  const {
    title,
    description = SITE_DESCRIPTION,
    path,
    noIndex = false,
    ogImage,
  } = options;

  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  const canonical = path ? absoluteUrl(path) : getSiteUrl();
  const imageMeta = ogImage
    ? {
        url: ogImage.startsWith("http") ? ogImage : absoluteUrl(ogImage),
        width: ogImage.includes("opengraph") ? 1200 : 512,
        height: ogImage.includes("opengraph") ? 630 : 512,
        alt: SITE_NAME,
      }
    : null;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      url: canonical,
      ...(imageMeta ? { images: [imageMeta] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      ...(imageMeta ? { images: [imageMeta.url] } : {}),
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
