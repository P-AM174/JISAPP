/**
 * 「ジサップ公式」の名前。作者のアイコンを公式のロゴにする判定と、
 * 普通の人がこの名前を使えないようにする判定に使う。
 */
export const OFFICIAL_NAME = "ジサップ公式";

/** 公式アカウントの名前か（作者名はデータ上いつも「ジサップ公式」） */
export function isOfficialCreatorName(name: string | null | undefined): boolean {
  return (name ?? "").trim() === OFFICIAL_NAME;
}

/** 公式とまぎらわしい名前か（空白・大文字小文字・「ジサップ公式」「Jisapp Official」などの言い換えを含めて見る） */
export function isReservedOfficialName(name: string | null | undefined): boolean {
  const n = (name ?? "").normalize("NFKC").toLowerCase().replace(/[\s　・._\-]/g, "");
  if (!n) return false;
  return /(ジサップ|じさっぷ|jisapp|zisup)(公式|運営|official|team|staff|chínhthức)/.test(n) ||
    /(公式|運営|official)(ジサップ|じさっぷ|jisapp)/.test(n);
}
