import type { Metadata } from "next";
import { DEFAULT_LOCALE, localizePath, ogLocale, type Locale } from "@/lib/i18n/config";
import { indexedLocales } from "@/lib/features";
import {
  siteName,
  siteTitle,
  siteDescription,
  siteOgImage,
  SITE_OG_IMAGE_WIDTH,
  SITE_OG_IMAGE_HEIGHT,
  SITE_SAME_AS,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo/site";

type PageMetadataOptions = {
  /** 表示言語。canonical と hreflang（言語ごとの URL）に使う */
  locale?: Locale;
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
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
    locale = DEFAULT_LOCALE,
    title,
    description = siteDescription(locale),
    path,
    noIndex = false,
    ogImage = siteOgImage(locale),
    ogImageWidth = SITE_OG_IMAGE_WIDTH,
    ogImageHeight = SITE_OG_IMAGE_HEIGHT,
    ogTitle,
    ogDescription,
  } = options;

  const name = siteName(locale);
  const pageTitle = title ? `${title} | ${name}` : siteTitle(locale);
  const shareTitle = ogTitle ?? pageTitle;
  const shareDescription = ogDescription ?? description;
  const basePath = path ?? "/";
  const canonical = absoluteUrl(localizePath(basePath, locale));
  const languages: Record<string, string> = {};
  const listed = indexedLocales();
  for (const l of listed) languages[l] = absoluteUrl(localizePath(basePath, l));
  languages["x-default"] = absoluteUrl(localizePath(basePath, DEFAULT_LOCALE));
  const imageUrl = ogImage.startsWith("http") ? ogImage : absoluteUrl(ogImage);
  const imageMeta = {
    url: imageUrl,
    secureUrl: imageUrl,
    width: ogImageWidth,
    height: ogImageHeight,
    alt: shareTitle,
    type: "image/png" as const,
  };

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      locale: ogLocale(locale),
      alternateLocale: listed.filter((l) => l !== locale).map(ogLocale),
      siteName: name,
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
    // 正式公開前の言語（ベトナム語）は検索エンジンに載せない
    ...(noIndex || !listed.includes(locale) ? { robots: { index: false, follow: false } } : {}),
  };
}

export function createRootMetadata(locale: Locale = DEFAULT_LOCALE): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    ...createPageMetadata({ locale }),
    title: {
      default: siteTitle(locale),
      template: `%s | ${siteName(locale)}`,
    },
    verification: {
      google: "MknTcu1dRo9xzP-DDlRK5K0p0GDBZEReO3ftFe1tFFM",
    },
  };
}

export function createWebsiteJsonLd(locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName(locale),
    alternateName: locale === "ja" ? ["Jisapp", "ジサップ（Jisapp）"] : ["ジサップ", "ジサップ（Jisapp）"],
    url: absoluteUrl(localizePath("/", locale)),
    description: siteDescription(locale),
    inLanguage: locale === "ja" ? "ja-JP" : locale,
    publisher: {
      "@type": "Organization",
      name: siteName(locale),
      url: getSiteUrl(),
      logo: absoluteUrl("/logo-header.png"),
      sameAs: SITE_SAME_AS,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl(`${localizePath("/search", locale)}?q={search_term_string}`),
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
}, locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.title,
    description:
      app.description ||
      (locale === "ja"
        ? `${app.title} - ${siteName(locale)}で公開中のアプリ`
        : locale === "vi"
          ? `${app.title} — app đăng trên ${siteName(locale)}`
          : `${app.title} — an app published on ${siteName(locale)}`),
    url: absoluteUrl(localizePath(`/apps/${app.id}`, locale)),
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
