import type { Locale } from "@/lib/i18n/config";

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

export type CodeIssue = "prompt" | "not_html" | "truncated";

/**
 * ジサップが作ったプロンプト（AIへの指示文）に必ず入っている目印。
 * AIの返事を待たずにコピーすると、クリップボードに指示文が残ったまま貼られてしまう
 */
const PROMPT_MARKERS = [
  "あなたはジサップ（Jisapp）向けの優秀なフロントエンドエンジニアです",
  "【コードを書くときのルール】",
  "【ジサップ必須ルール",
  "You are an excellent front-end engineer building apps for Jisapp",
  "[Rules for writing the code]",
  "[Jisapp rules",
];

/** 貼り付けたコードで、初心者がつまずきやすい状態を見つける */
export function detectCodeIssue(code: string): CodeIssue | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  if (PROMPT_MARKERS.some((m) => trimmed.includes(m)) && !/<!doctype html|<html[\s>]/i.test(trimmed)) {
    return "prompt";
  }
  if (!/<[a-zA-Z!]/.test(trimmed)) return "not_html";
  const startsDocument = /<!doctype html|<html[\s>]/i.test(trimmed);
  if (startsDocument && !/<\/html>\s*$/i.test(trimmed)) return "truncated";
  return null;
}

/** AI に送る「続きを出して」の依頼文 */
export const TRUNCATED_RETRY_MESSAGE =
  "コードが途中で切れていました。index.html を最初から最後まで、省略せずにもう一度すべて出力してください。";
export const TRUNCATED_RETRY_MESSAGE_EN =
  "The code was cut off partway. Please output the whole index.html again, from start to finish, without leaving anything out.";

export function truncatedRetryMessage(locale: Locale = "ja"): string {
  return locale === "ja" ? TRUNCATED_RETRY_MESSAGE : TRUNCATED_RETRY_MESSAGE_EN;
}

/** コードが外部APIのキー（ジサップのシークレット）を使うか */
export function usesStudioSecrets(code: string): boolean {
  return /(?:Jisapp|Zisup)\.fetch\s*\([^)]*secret\s*:/.test(code) || /secret\s*:\s*['"][A-Z0-9_]+['"]/.test(code);
}

/** localStorage だけで保存していて、ジサップの保存機能を使っていないか */
export function usesLocalStorageOnly(code: string): boolean {
  return /localStorage\s*\.\s*(setItem|getItem)/.test(code) && !/(?:Jisapp|Zisup)\s*\.\s*(saveData|loadData)/.test(code);
}

/** ジサップの保存機能に書き換えてもらうための依頼文 */
export const STORAGE_FIX_MESSAGE =
  "このアプリのデータ保存を、localStorage ではなくジサップの保存機能に書き換えてください。保存は await window.Jisapp.saveData('識別名', データ)、読み込みは await window.Jisapp.loadData('識別名') を使い、画面を出す前に読み込みを await で完了させてください。index.html を最初から最後まで省略せずに出力してください。";
export const STORAGE_FIX_MESSAGE_EN =
  "Please change how this app saves data from localStorage to Jisapp's save feature. Save with await window.Jisapp.saveData('keyName', data) and load with await window.Jisapp.loadData('keyName'), and finish loading with await before showing the screen. Output the whole index.html from start to finish without leaving anything out.";

export function storageFixMessage(locale: Locale = "ja"): string {
  return locale === "ja" ? STORAGE_FIX_MESSAGE : STORAGE_FIX_MESSAGE_EN;
}
