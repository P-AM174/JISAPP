import { getSiteUrl } from "@/lib/seo/site";

export type ShareChannel = {
  id: string;
  label: string;
  color?: string;
};

export function getAppSharePath(appId: string): string {
  return `/apps/${appId}`;
}

export function getAppShareUrl(appId: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : getSiteUrl());
  return `${base}${getAppSharePath(appId)}`;
}

export function getLineShareUrl(url: string, text?: string): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}${
    text?.trim() ? `&text=${encodeURIComponent(text.trim())}` : ""
  }`;
}

export function getTwitterShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  if (text?.trim()) params.set("text", text.trim());
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getMailShareUrl(url: string, title?: string, text?: string): string {
  const subject = title?.trim() || "ジサップのアプリ";
  const body = [text?.trim(), url].filter(Boolean).join("\n\n");
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** スマホでは OS 標準の共有シートを優先 */
export function prefersNativeShare(): boolean {
  if (typeof window === "undefined" || !canNativeShare()) return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export async function copyShareUrl(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShare(options: {
  url: string;
  title?: string;
  text?: string;
}): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share({
      url: options.url,
      title: options.title,
      text: options.text,
    });
    return true;
  } catch {
    return false;
  }
}

export function openShareWindow(shareUrl: string): void {
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=520");
}
