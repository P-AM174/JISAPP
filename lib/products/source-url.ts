import type { ProductType } from "./types";

/** URL から product_type を判別 */
export function detectProductType(url: string): ProductType {
  const lower = url.toLowerCase();
  if (lower.includes("docs.google.com")) return "google";
  if (lower.includes("notion.so") || lower.includes("notion.site")) return "notion";
  if (lower.includes("replit.com")) return "replit";
  return "generic";
}

/**
 * Google ドキュメント系 URL の末尾を /copy に変換
 * 例: .../edit?usp=sharing → .../copy
 */
export function transformGoogleCopyUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes("docs.google.com")) return trimmed;

    let path = parsed.pathname;
    if (/\/(edit|view|preview|pub)(\/|$)/.test(path)) {
      path = path.replace(/\/(edit|view|preview|pub)(\/.*)?$/, "/copy");
    } else if (/\/d\/[^/]+$/.test(path)) {
      path = `${path}/copy`;
    }
    parsed.pathname = path;
    return parsed.toString();
  } catch {
    return trimmed.replace(/\/(edit|view|preview|pub)([#?].*)?$/i, "/copy");
  }
}

/** 出品保存時: ドメイン判別 + URL 変換 */
export function processSourceUrl(rawUrl: string): {
  source_url: string;
  product_type: ProductType;
} {
  const trimmed = rawUrl.trim();
  const product_type = detectProductType(trimmed);
  const source_url =
    product_type === "google" ? transformGoogleCopyUrl(trimmed) : trimmed;
  return { source_url, product_type };
}
