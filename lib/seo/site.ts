export const SITE_NAME = "ジサップ";

export const SITE_BRAND = "ジサップ（Jisapp）";

export const SITE_TAGLINE = "無料個人アプリ開発ならジサップ";

/** タグラインにブランド名が入るため、SITE_BRAND とは重複させない */
export const SITE_TITLE = `${SITE_TAGLINE}（Jisapp）`;

export const SITE_DESCRIPTION =
  "ChatGPT・Claude・Geminiで作ったコードを貼るだけ。サーバー設定不要で、誰でも無料でアプリを作って公開・共有できます。";

/**
 * SNSシェア用 OGP 画像（静的 PNG・1200×630）。
 * X は拡張子なしの動的 /opengraph-image より .png の絶対URLの方がカード化しやすい。
 */
export const SITE_OG_IMAGE = "/og.png";

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
