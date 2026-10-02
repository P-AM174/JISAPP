import type { Locale } from "@/lib/i18n/config";

export const SITE_NAME = "ジサップ";

export const SITE_BRAND = "ジサップ（Jisapp）";

export const SITE_TAGLINE = "無料個人アプリ開発ならジサップ";

/** タグラインにブランド名が入るため、SITE_BRAND とは重複させない */
export const SITE_TITLE = `${SITE_TAGLINE}（Jisapp）`;

export const SITE_DESCRIPTION =
  "ChatGPT・Claude・Geminiで作ったコードを貼るだけ。サーバー設定不要で、誰でも無料でアプリを作って公開・共有できます。";

/** 英語版の表記。英語ではカタカナを使わず Jisapp に統一する */
export const SITE_NAME_EN = "Jisapp";
export const SITE_TAGLINE_EN = "Turn AI-made code into your own app — free";
export const SITE_TITLE_EN = `Jisapp — ${SITE_TAGLINE_EN}`;
export const SITE_DESCRIPTION_EN =
  "Paste code from ChatGPT, Claude or Gemini and it becomes a real app. No servers, no setup — anyone can make, publish and share apps for free.";

/**
 * ベトナム語版の表記（機械翻訳・ネイティブ未確認）。ブランド名はラテン文字の Jisapp。
 * 確認したら lib/i18n/dictionaries/glossary.md も直す
 */
export const SITE_TAGLINE_VI = "Biến code do AI viết thành app của riêng bạn — miễn phí";
export const SITE_TITLE_VI = `Jisapp — ${SITE_TAGLINE_VI}`;
export const SITE_DESCRIPTION_VI =
  "Dán code từ ChatGPT, Claude hoặc Gemini là có ngay một app thật. Không cần server, không cần cài đặt — ai cũng có thể tạo, đăng và chia sẻ app miễn phí.";

export function siteName(locale: Locale): string {
  return locale === "ja" ? SITE_NAME : SITE_NAME_EN;
}
export function siteTitle(locale: Locale): string {
  if (locale === "vi") return SITE_TITLE_VI;
  return locale === "en" ? SITE_TITLE_EN : SITE_TITLE;
}
export function siteTagline(locale: Locale): string {
  if (locale === "vi") return SITE_TAGLINE_VI;
  return locale === "en" ? SITE_TAGLINE_EN : SITE_TAGLINE;
}
export function siteDescription(locale: Locale): string {
  if (locale === "vi") return SITE_DESCRIPTION_VI;
  return locale === "en" ? SITE_DESCRIPTION_EN : SITE_DESCRIPTION;
}

/**
 * SNSシェア用 OGP 画像（静的 PNG・1200×630）。
 * X は拡張子なしの動的 /opengraph-image より .png の絶対URLの方がカード化しやすい。
 */
export const SITE_OG_IMAGE = "/og.png";
export const SITE_OG_IMAGE_EN = "/og-en.png";
/** ベトナム語は描いて出す（app/og/site/[file]/route.tsx） */
export const SITE_OG_IMAGE_VI = "/og/site/vi.png";

export function siteOgImage(locale: Locale): string {
  if (locale === "vi") return SITE_OG_IMAGE_VI;
  return locale === "en" ? SITE_OG_IMAGE_EN : SITE_OG_IMAGE;
}

export const SITE_OG_IMAGE_WIDTH = 1200;
export const SITE_OG_IMAGE_HEIGHT = 630;

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://jisapp.app";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

/** 公式SNS。Organization.sameAs とフッターで共用する */
export const SITE_SOCIAL_PROFILES = [
  { name: "X", handle: "@jisapp_app", url: "https://x.com/jisapp_app" },
  {
    name: "YouTube",
    handle: "@jisapp.official",
    url: "https://www.youtube.com/@jisapp.official",
  },
  {
    name: "TikTok",
    handle: "@jisapp.official",
    url: "https://www.tiktok.com/@jisapp.official",
  },
  {
    name: "Instagram",
    handle: "@jisapp_app",
    url: "https://www.instagram.com/jisapp_app/",
  },
] as const;

export const SITE_SAME_AS: string[] = SITE_SOCIAL_PROFILES.map((p) => p.url);
