import { getSiteUrl } from "@/lib/seo/site";
import { localeFromPath, localizePath, type Locale } from "@/lib/i18n/config";

export type ShareChannel = {
  id: string;
  label: string;
  color?: string;
};

export function getAppSharePath(appId: string, locale?: Locale | null): string {
  return localizePath(`/apps/${appId}`, locale ?? "ja");
}

/** 共有URL。英語ページで共有したときは英語ページ（/en/apps/...）のURLになる */
export function getAppShareUrl(appId: string, origin?: string, locale?: Locale): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : getSiteUrl());
  const current =
    locale ?? (typeof window !== "undefined" ? localeFromPath(window.location.pathname) : null);
  return `${base}${getAppSharePath(appId, current)}`;
}

export function getLineShareUrl(url: string, text?: string): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}${
    text?.trim() ? `&text=${encodeURIComponent(text.trim())}` : ""
  }`;
}

/**
 * スマホで LINE アプリの「送信先を選択」画面を開く URL（LINE URL スキーム）。
 * 文の下にリンクを入れて送る。LINE が入っていない端末では、LINE のダウンロードページが開く
 */
export function getLineAppShareUrl(url: string, text?: string): string {
  const message = [text?.trim(), url].filter(Boolean).join("\n");
  return `https://line.me/R/share?text=${encodeURIComponent(message)}`;
}

/** スマホ・タブレットか（iPad は PC と同じ名前で名乗るので、タッチ操作できる Mac として見分ける） */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  return /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
}

/**
 * LINE で送る。
 * スマホは LINE アプリの「送信先を選択」を、その場で開く（新しい窓で開くとアプリに切り替わらないことがある）。
 * Web 版の共有ページ（social-plugins.line.me）は、LINE アプリの外では LINE へのログインを求めるため、スマホでは使わない。
 * PC は LINE URL スキームに対応していないので、Web 版の共有ページを新しい窓で開く
 */
export function openLineShare(url: string, text?: string): void {
  if (isMobileDevice()) {
    window.location.href = getLineAppShareUrl(url, text);
    return;
  }
  openShareWindow(getLineShareUrl(url, text));
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
  const subject = title?.trim() || "Jisapp";
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

/** 共有先（計測の utm_source にも使う） */
export type ShareSource = "x" | "line" | "facebook" | "messenger" | "zalo" | "mail" | "sms" | "copy" | "native";

/**
 * 共有リンクに計測用の UTM をつける（どこから来た人かを数えるため）。
 * 日本語版は今までどおりのリンクにするため、英語・ベトナム語ページから共有したときだけつける
 */
export function withUtm(url: string, source: ShareSource, locale: Locale | null | undefined): string {
  void locale;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "share");
    u.searchParams.set("utm_campaign", "app_share");
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Messenger で送る。スマホは Messenger アプリを開く（PC の送信画面は Facebook のアプリ ID が必要なため使わない）
 */
export function getMessengerShareUrl(url: string): string {
  return `fb-messenger://share/?link=${encodeURIComponent(url)}`;
}

/** スマホの「メッセージ」アプリ（SMS・iMessage）で送る。iPhone・Android の両方で開ける書き方 */
export function getSmsShareUrl(url: string, text?: string): string {
  return `sms:?&body=${encodeURIComponent([text?.trim(), url].filter(Boolean).join("\n"))}`;
}

/** Messenger の共有が使えるか（スマホだけ） */
export function canShareToMessenger(): boolean {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Zalo で送る。
 * Zalo の公式の共有ボタンは Zalo 公式アカウント（OA）の ID が必要で、ID なしで使える共有 URL は公開されていない。
 * そのため、OS の共有シート（Zalo が選べる）を開き、使えないときは URL をコピーする
 * @returns "shared"（共有シートで送った）/ "copied"（URL をコピーした）/ "failed"
 */
export async function shareToZalo(options: { url: string; title?: string; text?: string }): Promise<"shared" | "copied" | "failed"> {
  if (canNativeShare()) {
    const ok = await nativeShare(options);
    if (ok) return "shared";
  }
  return (await copyShareUrl(options.url)) ? "copied" : "failed";
}
