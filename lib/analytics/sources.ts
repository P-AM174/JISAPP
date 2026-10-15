/**
 * 流入元の見分け（運営画面の「どこから来たか」用）。
 * 訪問の最初のページ表示に残した utm_source と、参照元のドメイン（props.ref）から決める。
 * ChatGPT はリンクに utm_source=chatgpt.com をつけるが、Gemini・Claude などはつけないので、参照元のドメインで見分ける
 */

export type SourceKind = "ai" | "search" | "sns" | "share" | "direct" | "other";

export type TrafficSource = { name: string; kind: SourceKind };

const AI: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "ChatGPT"],
  [/^gemini\.google\.com$|^bard\.google\.com$/, "Gemini"],
  [/(^|\.)claude\.ai$/, "Claude"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/^copilot\.microsoft\.com$|^copilot\.cloud\.microsoft$/, "Copilot"],
  [/(^|\.)deepseek\.com$/, "DeepSeek"],
  [/(^|\.)grok\.com$|(^|\.)x\.ai$/, "Grok"],
  [/(^|\.)you\.com$/, "You.com"],
];

const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "Google検索"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)yahoo\.co\.jp$|(^|\.)yahoo\.com$/, "Yahoo!"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)naver\.com$/, "Naver"],
  [/(^|\.)baidu\.com$/, "Baidu"],
  [/(^|\.)yandex\.[a-z.]+$/, "Yandex"],
];

const SNS: [RegExp, string][] = [
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, "X"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|^fb\.me$/, "Facebook"],
  [/(^|\.)line\.me$|(^|\.)naver\.jp$/, "LINE"],
  [/(^|\.)threads\.net$/, "Threads"],
  [/(^|\.)reddit\.com$/, "Reddit"],
];

/** 動画の説明欄などにつける utm_source の名前 */
const UTM_NAMES: Record<string, TrafficSource> = {
  "chatgpt.com": { name: "ChatGPT", kind: "ai" },
  tiktok: { name: "TikTok", kind: "sns" },
  youtube: { name: "YouTube", kind: "sns" },
  instagram: { name: "Instagram", kind: "sns" },
  x: { name: "X", kind: "sns" },
};

const SHARE_NAMES: Record<string, string> = {
  line: "LINE", x: "X", facebook: "Facebook", messenger: "Messenger", zalo: "Zalo", mail: "メール", copy: "URLのコピー", native: "スマホの共有",
};

function match(host: string, list: [RegExp, string][]): string | null {
  for (const [re, name] of list) if (re.test(host)) return name;
  return null;
}

export function classifySource(params: { utmSource?: string | null; utmMedium?: string | null; ref?: string | null }): TrafficSource {
  const utm = (params.utmSource ?? "").toLowerCase().trim();
  if (utm) {
    // ジサップの共有ボタンでつけた印（英語・ベトナム語のページから送られたリンク）
    if (params.utmMedium === "share") return { name: `共有ボタン（${SHARE_NAMES[utm] ?? utm}）`, kind: "share" };
    if (UTM_NAMES[utm]) return UTM_NAMES[utm];
    const host = utm.replace(/^www\./, "");
    const ai = match(host, AI);
    if (ai) return { name: ai, kind: "ai" };
    return { name: utm, kind: "other" };
  }
  const ref = (params.ref ?? "").toLowerCase().replace(/^www\./, "");
  if (!ref) return { name: "直接・不明", kind: "direct" };
  const ai = match(ref, AI);
  if (ai) return { name: ai, kind: "ai" };
  const sns = match(ref, SNS);
  if (sns) return { name: sns, kind: "sns" };
  const search = match(ref, SEARCH);
  if (search) return { name: search, kind: "search" };
  return { name: ref, kind: "other" };
}
