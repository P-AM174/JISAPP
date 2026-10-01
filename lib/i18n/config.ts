/**
 * 表示言語の設定。
 * 日本語は今までどおりの URL（/apps/1）、英語・ベトナム語は /en・/vi を先頭につけた URL（/en/apps/1）。
 *
 * 文言はコードに t("日本語", "English") と並べて書く。
 * ベトナム語は、日本語の文をキーにした辞書（lib/i18n/dictionaries/vi.json）から引き、
 * 辞書にない文は英語で表示する。
 */
export const LOCALES = ["ja", "en", "vi"] as const;
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

const LOCALE_PREFIX = /^\/(ja|en|vi)(?=\/|$|\?|#)/;

/** "/en/apps/1" → "/apps/1"。先頭に言語がなければそのまま */
export function stripLocale(pathname: string): string {
  const m = pathname.match(LOCALE_PREFIX);
  if (!m) return pathname;
  const rest = pathname.slice(m[0].length);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** URL の先頭の言語を読み取る（なければ null） */
export function localeFromPath(pathname: string): Locale | null {
  const m = pathname.match(LOCALE_PREFIX);
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
  if (locale === "vi") return "vi-VN";
  return locale === "en" ? "en-US" : "ja-JP";
}

/** OGP の og:locale */
export function ogLocale(locale: Locale): string {
  if (locale === "vi") return "vi_VN";
  return locale === "en" ? "en_US" : "ja_JP";
}

/** 言語切替に出す、その言語自身での名前 */
export const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  vi: "Tiếng Việt",
};

/**
 * 日本語以外の言語か。日本語版と英語版の2通りしか用意していない文言・指示文などは、
 * ベトナム語でも英語のほうを使う
 */
export function isForeign(locale: Locale): boolean {
  return locale !== "ja";
}

/** ベトナム語の辞書（日本語の文 → ベトナム語） */
export type Dictionary = Record<string, string>;

/**
 * 読み込み済みのベトナム語の辞書。サーバーでは lib/i18n/dictionaries、
 * ブラウザではベトナム語ページの LocaleProvider が登録する。
 * これがあるので、pick(locale, "日本語", "English") はどこからでも使える
 */
let registered: Dictionary | null = null;

export function registerDictionary(dict: Dictionary | null) {
  if (dict) registered = dict;
}

/** 日本語と英語を並べて書き、表示中の言語のほうを返す（ベトナム語は辞書から引く） */
export function pick<T>(locale: Locale, ja: T, en: T, dict?: Dictionary | null): T {
  if (locale === "ja") return ja;
  if (locale === "vi") return lookup(ja, en, dict);
  return en;
}

/**
 * 日本語版と英語版を同じ形のオブジェクト・配列で持っているもの（QUESTIONS と QUESTIONS_EN など）を、
 * 表示中の言語にする。ベトナム語は英語版の形を使い、文字列を同じ位置の日本語から辞書で引いて差し替える。
 * 辞書の洗い出し（scripts/i18n-extract.mjs）は、X と X_EN という名前の組を読み取る
 */
export function pickDeep<T>(locale: Locale, ja: T, en: T, dict?: Dictionary | null): T {
  if (locale === "ja") return ja;
  if (locale === "en") return en;
  return deepLookup(ja, en, dict) as T;
}

function deepLookup(ja: unknown, en: unknown, dict?: Dictionary | null): unknown {
  if (typeof en === "string") return typeof ja === "string" ? lookup(ja, en, dict) : en;
  if (Array.isArray(en)) return en.map((v, i) => deepLookup(Array.isArray(ja) ? ja[i] : undefined, v, dict));
  if (en && typeof en === "object") {
    if (Object.getPrototypeOf(en) !== Object.prototype) return en;
    const src = (ja && typeof ja === "object" ? ja : {}) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(en)) out[key] = deepLookup(src[key], value, dict);
    return out;
  }
  return en;
}

export type Translate = <T>(ja: T, en: T) => T;

export function makeT(locale: Locale, dict?: Dictionary | null): Translate {
  return (ja, en) => pick(locale, ja, en, dict);
}

/**
 * 変数を差し込む文。語順は言語ごとに違うので、文字列をつなげず {name} の形で書く。
 *   format(t("{n}件のアプリ", "{n} apps"), { n: 3 })
 */
export function format(template: string, values: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) =>
    key in values ? String(values[key] ?? "") : all
  );
}

/**
 * 数による言い分け（英語の 1 reply / 2 replies など）。言語の規則は Intl.PluralRules に任せる。
 *   format(t("{n}件の返信", plural(locale, n, "{n} reply", "{n} replies")), { n })
 * 日本語・ベトナム語は数で形が変わらないので、どちらを渡しても日本語の文から訳が引かれる
 */
export function plural(locale: Locale, n: number, one: string, other: string): string {
  return new Intl.PluralRules(intlLocale(locale)).select(n) === "one" ? one : other;
}

const warned = new Set<string>();
const JAPANESE = /[぀-ヿ㐀-鿿]/;

function lookup<T>(ja: T, en: T, dict?: Dictionary | null): T {
  if (typeof ja !== "string" || ja === (en as unknown)) return en;
  const hit = (dict ?? registered)?.[ja];
  if (hit) return hit as T;
  if (process.env.NODE_ENV !== "production" && !warned.has(ja) && JAPANESE.test(ja)) {
    warned.add(ja);
    console.warn(`[i18n] ベトナム語の訳がありません（英語で表示）: ${ja}`);
  }
  return en;
}
