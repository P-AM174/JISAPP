/**
 * 表示言語の設定。
 * 日本語は今までどおりの URL（/apps/1）、英語は /en を先頭につけた URL（/en/apps/1）。
 */
export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

/** 利用者が選んだ言語を覚えておく cookie */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** "/en/apps/1" → "/apps/1"。先頭に言語がなければそのまま */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(ja|en)(?=\/|$|\?|#)/);
  if (!m) return pathname;
  const rest = pathname.slice(m[0].length);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** URL の先頭の言語を読み取る（なければ null） */
export function localeFromPath(pathname: string): Locale | null {
  const m = pathname.match(/^\/(ja|en)(?=\/|$|\?|#)/);
  return m ? (m[1] as Locale) : null;
}

/** サイト内のパスを、その言語の URL にする。外部URL・API・すでに言語つきのパスはそのまま */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (/^\/(api|og|_next)(\/|$)/.test(path)) return path;
  if (localeFromPath(path)) return path;
  if (locale === DEFAULT_LOCALE) return path;
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/?") || path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** 言語を切り替えたときの URL（今のページのまま言語だけ変える） */
export function switchLocalePath(pathname: string, to: Locale): string {
  return localizePath(stripLocale(pathname), to);
}

/** Intl 用のロケール名 */
export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "ja-JP";
}

/** 日本語と英語を並べて書き、表示中の言語のほうを返す */
export function pick<T>(locale: Locale, ja: T, en: T): T {
  return locale === "en" ? en : ja;
}

export type Translate = <T>(ja: T, en: T) => T;

export function makeT(locale: Locale): Translate {
  return (ja, en) => pick(locale, ja, en);
}
