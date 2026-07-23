export const SITE_NAME = "ジサップ";

export const SITE_BRAND = "ジサップ（Jisapp）";

export const SITE_TAGLINE = "AIで作ったコードを貼るだけ！無料アプリ開発スタジオ";

export const SITE_TITLE = `${SITE_BRAND}｜${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  "ChatGPT・Claude・Geminiで作ったコードを貼るだけ。サーバー設定不要で、誰でも無料でアプリを作って公開・共有できます。";

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
