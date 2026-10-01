/**
 * 文字列の正規化（ベトナム語対応）。
 *
 * ベトナム語は声調記号つきのラテン文字（quản lý）。
 * - 保存する前に NFC（合成済みの形）にそろえる。macOS や一部の入力方法は NFD（分解した形）で入れてくるため、
 *   そのままだと見た目が同じでも検索や重複チェックがずれる
 * - 検索では声調記号を外して比べる（「quan ly」で「quản lý」が見つかる）。保存する文字列からは記号を落とさない
 */

/** 保存用。見た目は変えずに NFC にそろえる */
export function normalizeText(value: string): string {
  return value.normalize("NFC");
}

/** オブジェクトの文字列の値をすべて NFC にそろえる（1段だけ） */
export function normalizeFields<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = { ...obj };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === "string") out[key] = value.normalize("NFC");
  }
  return out as T;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * 検索用のキー。小文字にし、声調記号などの結合文字を外し、đ を d にする。
 * 日本語の濁点・半濁点は結合文字の範囲が違うので消えない（「か」で「が」は見つからない）
 */
export function searchKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFC")
    .toLowerCase();
}

/** 検索語が対象に含まれるか（大文字小文字・声調記号の有無を問わない） */
export function matchesSearch(target: string | null | undefined, query: string): boolean {
  if (!target) return false;
  return searchKey(target).includes(searchKey(query));
}

/** 見た目の文字数（絵文字や結合文字を1文字として数える） */
export function visibleLength(value: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let count = 0;
    for (const _ of segmenter.segment(value)) count++;
    return count;
  }
  return Array.from(value.normalize("NFC")).length;
}
