import type { Locale } from "@/lib/i18n/config";

/**
 * 切り替えスイッチ。Vercel の環境変数で変えられる（"1" でオン）。
 * 画面（ブラウザ）からも読むので NEXT_PUBLIC_ をつける。変えたら再デプロイが必要。
 */
export const FEATURES = {
  /**
   * ベトナム語ページを正式に公開するか。
   * オフ（初期値）のあいだは、/vi を直接開けば見られるが、
   * ブラウザがベトナム語の人の自動案内・サイトマップ・検索エンジンへの登録はしない
   */
  viPublic: process.env.NEXT_PUBLIC_VI_PUBLIC === "1",
  get viAutoRedirect() {
    return this.viPublic;
  },
  /**
   * ベトナム語ページでゲームを見せるか（初期値はオフ）。
   * ベトナムでは海外事業者のオンラインゲーム提供が規制されている（政令147号）。
   * 弁護士の確認が取れるまで、ゲームを前面に出さず、ゲームのカテゴリも隠す
   */
  viShowGames: process.env.NEXT_PUBLIC_VI_SHOW_GAMES === "1",
} as const;

/** この言語のページでゲーム（ホームのゲーム欄・ゲームのカテゴリ・ゲームの例文）を出すか */
export function showGames(locale: Locale): boolean {
  return locale !== "vi" || FEATURES.viShowGames;
}

/** この言語のページで有料出品・購入を出すか（ベトナム語では出さない） */
export function showPaidListings(locale: Locale): boolean {
  return locale !== "vi";
}

/** ベトナム語ページに「Beta」の表示を出すか（ネイティブの確認が済むまで） */
export function showViBeta(locale: Locale): boolean {
  return locale === "vi" && process.env.NEXT_PUBLIC_VI_BETA !== "0";
}

/** 検索エンジン・サイトマップ・hreflang に載せる言語（ベトナム語は正式公開まで載せない） */
export function indexedLocales(): Locale[] {
  return FEATURES.viPublic ? ["ja", "en", "vi"] : ["ja", "en"];
}
