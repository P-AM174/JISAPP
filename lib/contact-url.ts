/**
 * 運営への問い合わせフォームの URL（トップページで問い合わせフォームが開く）。
 * 運営からのメールは送信専用のため、返信の代わりにこの URL を案内する。
 */
export function contactUrl(lang: "ja" | "en" | "vi" = "ja"): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jisapp.app").replace(/\/$/, "");
  return lang === "ja" ? `${site}/?contact=1` : `${site}/${lang}?contact=1`;
}

/** 運営からのメールの最後に付ける一文（日本語） */
export function contactFooterJa(): string {
  return `※このメールは送信専用のため、返信いただいても届きません。お問い合わせは次のフォームからお願いします。\n${contactUrl("ja")}`;
}
