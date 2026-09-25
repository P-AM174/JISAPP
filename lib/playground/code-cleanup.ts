/**
 * AI の回答から貼り付けられたコードを、そのまま動かせる形に整える。
 * - 回答全体をコピーしたときに付いてくる ```html ～ ``` の囲みや前後の説明文を取り除く
 */
export function normalizePastedCode(raw: string): string {
  const text = raw.replace(/\r\n/g, "\n");

  // ```html ... ``` のブロックがあれば、HTML らしい最長のものを採用する
  const fence = /```[a-zA-Z0-9_-]*[^\S\n]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    blocks.push(m[1]);
  }
  const htmlBlocks = blocks.filter((b) => /<(!doctype|html|body|div|script)/i.test(b));
  if (htmlBlocks.length > 0) {
    return htmlBlocks.sort((a, b) => b.length - a.length)[0].trim();
  }

  // 閉じの ``` がない（途中で切れた）囲み
  const open = text.match(/```[a-zA-Z0-9_-]*[^\S\n]*\n([\s\S]*)$/);
  if (open && /<(!doctype|html)/i.test(open[1])) {
    return open[1].trim();
  }

  // 囲みがなくても、<!DOCTYPE / <html の前に説明文があれば落とす
  const start = text.search(/<!doctype html|<html[\s>]/i);
  if (start > 0) {
    const endTag = text.search(/<\/html>/i);
    const end = endTag >= 0 ? endTag + "</html>".length : text.length;
    return text.slice(start, end).trim();
  }

  return text.trim();
}

export type CodeIssue = "not_html" | "truncated";

/** 貼り付けたコードで、初心者がつまずきやすい状態を見つける */
export function detectCodeIssue(code: string): CodeIssue | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  if (!/<[a-zA-Z!]/.test(trimmed)) return "not_html";
  const startsDocument = /<!doctype html|<html[\s>]/i.test(trimmed);
  if (startsDocument && !/<\/html>\s*$/i.test(trimmed)) return "truncated";
  return null;
}

/** AI に送る「続きを出して」の依頼文 */
export const TRUNCATED_RETRY_MESSAGE =
  "コードが途中で切れていました。index.html を最初から最後まで、省略せずにもう一度すべて出力してください。";

/** コードが外部APIのキー（ジサップのシークレット）を使うか */
export function usesStudioSecrets(code: string): boolean {
  return /Zisup\.fetch\s*\([^)]*secret\s*:/.test(code) || /secret\s*:\s*['"][A-Z0-9_]+['"]/.test(code);
}

/** localStorage だけで保存していて、ジサップの保存機能を使っていないか */
export function usesLocalStorageOnly(code: string): boolean {
  return /localStorage\s*\.\s*(setItem|getItem)/.test(code) && !/Zisup\s*\.\s*(saveData|loadData)/.test(code);
}

/** ジサップの保存機能に書き換えてもらうための依頼文 */
export const STORAGE_FIX_MESSAGE =
  "このアプリのデータ保存を、localStorage ではなくジサップの保存機能に書き換えてください。保存は await window.Zisup.saveData('識別名', データ)、読み込みは await window.Zisup.loadData('識別名') を使い、画面を出す前に読み込みを await で完了させてください。index.html を最初から最後まで省略せずに出力してください。";
