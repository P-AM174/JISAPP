export const SITE_NAME = "ジサップ";

export const SITE_TAGLINE = "アイデアを、すぐアプリに。";

export const SITE_DESCRIPTION =
  "コードがわからなくても大丈夫。ジサップなら誰でも無料でアプリが作れ、使え、共有できます。";

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
