/**
 * ログインせずに公開した人（ゲスト）の作者名。
 * 本人が入れたニックネームの後ろに「（ゲスト）」を付けて保存し、ゲストだと分かるようにする。
 * 英語・ベトナム語の画面では、表示のときだけ「(Guest)」「(Khách)」に置き換える。
 */
export const GUEST_MARK = "（ゲスト）";
export const GUEST_NICKNAME_MAX = 20;

/** 入力されたニックネームを整える（前後の空白・本人が付けた「（ゲスト）」を取る） */
export function guestNickname(input: string | null | undefined): string {
  return (input ?? "")
    .normalize("NFKC")
    .replace(/\s*[（(]\s*(ゲスト|guest|khách)\s*[)）]\s*$/i, "")
    .trim();
}

export function withGuestMark(nickname: string): string {
  return `${nickname}${GUEST_MARK}`;
}

/** 作者名がゲストのものか（「たろう（ゲスト）」のほか、前からある「ゲスト」も含む） */
export function isGuestCreatorName(name: string | null | undefined): boolean {
  const n = (name ?? "").trim();
  return n === "ゲスト" || n.endsWith(GUEST_MARK);
}
