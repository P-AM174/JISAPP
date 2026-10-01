import { registerDictionary, type Dictionary, type Locale } from "../config";
import viSource from "./vi.json";

/**
 * ベトナム語の辞書。キーはコードに書いた日本語の文。
 *   vi       … ベトナム語の訳（{n} などはそのまま残す）
 *   reviewed … ネイティブが確認したら true（未確認の一覧は scripts/i18n-extract.mjs --unreviewed）
 *   en       … 翻訳するときの参考（実行時には使わない）
 *
 * サーバーでだけ読み込み、ベトナム語ページのときだけ画面に渡す（日本語・英語ページの読み込みを重くしない）。
 */
export type DictionaryEntry = { vi: string; reviewed?: boolean; en?: string };

const vi: Dictionary = Object.fromEntries(
  Object.entries(viSource as Record<string, DictionaryEntry>)
    .filter(([, entry]) => !!entry?.vi)
    .map(([ja, entry]) => [ja, entry.vi])
);

registerDictionary(vi);

export function getDictionary(locale: Locale): Dictionary | null {
  return locale === "vi" ? vi : null;
}
