/**
 * アプリが window.Zisup で保存するデータの上限と、画像・動画の判定。
 * サーバー（API）とジサップの画面（ブリッジ）の両方から使う。
 *
 * 無料版では、画像・動画は保存できない（容量のほとんどを占め、DB の容量と通信量を圧迫するため）。
 * 文字データは長く残せるよう、保存の前に圧縮し（lib/app-data-codec.ts）、上限は圧縮後の大きさで数える。
 * 有料プランを作るときは、ここの数字をプランごとに切り替える。
 */

export const APP_DATA_LIMITS = {
  /** 1回の保存（1つのキーの値）の最大バイト数。圧縮して保存するときは圧縮後の大きさ */
  valueBytes: 2 * 1024 * 1024,
  /** 圧縮を元に戻したときの最大バイト数（元に戻すと巨大になるデータへの備え） */
  rawBytes: 16 * 1024 * 1024,
  /** 1人あたりの保存データの合計（全アプリ分・圧縮後） */
  userBytes: 10 * 1024 * 1024,
  /** グループ1つあたりの共有データの合計 */
  groupBytes: 10 * 1024 * 1024,
  /** この割合を超えたら「もうすぐいっぱい」と知らせる */
  warnRatio: 0.8,
} as const;

export type AppDataLimitCode = "too_large" | "media_not_allowed" | "quota_exceeded" | "reserved_key" | "bad_data";

export const APP_DATA_LIMIT_MESSAGES: Record<AppDataLimitCode, string> = {
  too_large: "このアプリのデータが、1回に保存できる量（2MB）を超えました。アプリの作者に、データを年ごとなどに分けて保存する形に直してもらってください",
  media_not_allowed: "画像・動画は保存できません（文字のデータだけ保存できます）",
  quota_exceeded: "保存できる容量（全アプリで10MB）がいっぱいです。不要なデータを消してください",
  reserved_key: "この名前（__ で始まる名前）では保存できません",
  bad_data: "保存するデータの形が正しくありません",
};

export const APP_DATA_WARNINGS = {
  value: "このアプリのデータが、もうすぐ1回に保存できる量（2MB）に届きます。アプリの作者に、データを年ごとなどに分けて保存する形に直してもらうと安心です",
  user: "保存しているデータの合計が、もうすぐ上限（全アプリで10MB）に届きます",
  group: "このグループの共有データが、もうすぐ上限（10MB）に届きます。不要な項目を消しておくと安心です",
} as const;

/** バイト数を「3.2MB」「512KB」のように表す */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}
export type AppDataWarning = keyof typeof APP_DATA_WARNINGS;

export const GROUP_QUOTA_MESSAGE = "このグループの共有データの容量（10MB）がいっぱいです。不要な項目を消してください";

/** ジサップ自身が使う管理用のキー（スタンプ・ライブラリ登録など）。アプリからは保存させない */
export function isReservedDataKey(key: string): boolean {
  return key.startsWith("__");
}

/** UTF-8 でのバイト数（サーバー・ブラウザ両方で動く） */
export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

// data:image/png;base64,... のようなデータURL
const DATA_URL = /data:(?:image|video)\/[a-z0-9.+-]+;base64,/i;
// 文字に変換（base64）した画像・動画の先頭の目印に、長い base64 が続くもの
//   JPEG: /9j/  PNG: iVBORw0KGgo  GIF: R0lGOD  WebP・AVI: UklGR  MP4・MOV・HEIC: ....ftyp  WebM: GkXf
const BASE64_MEDIA = /(?:\/9j\/|iVBORw0KGgo|R0lGOD|UklGR|AAAA[A-Za-z0-9+/]{1,2}ZnR5c|GkXf)[A-Za-z0-9+/]{2000,}/;

/** 保存しようとしているデータ（元の文字のデータ）に、画像・動画が含まれているか */
export function containsMedia(text: string): boolean {
  if (text.length < 100) return false;
  return DATA_URL.test(text) || BASE64_MEDIA.test(text);
}

/**
 * 保存できるかを調べる。問題なければ null。
 * raw：元の文字のデータ（圧縮前）。storedBytes：実際に保存する大きさ（圧縮したなら圧縮後）
 */
export function checkAppDataValue(raw: string, storedBytes = utf8Bytes(raw)): AppDataLimitCode | null {
  if (containsMedia(raw)) return "media_not_allowed";
  if (storedBytes > APP_DATA_LIMITS.valueBytes) return "too_large";
  return null;
}
