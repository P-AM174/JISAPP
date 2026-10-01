import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromPath, stripLocale } from "@/lib/i18n/config";
import { FEATURES } from "@/lib/features";

/**
 * 言語ごとの URL の振り分け。
 * - /en/...  … 英語ページ（そのまま表示）
 * - /vi/...  … ベトナム語ページ（そのまま表示）
 * - /ja/...  … 日本語は言語なしの URL が正なので、そちらへ転送
 * - それ以外 … 日本語ページ（内部で /ja/... を表示）。
 *   ただし、英語・ベトナム語を選んだことがある人、ブラウザの第一言語が日本語でない人は、
 *   その言語のページへ案内する（ベトナム語は /vi、それ以外は /en）
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const pathLocale = localeFromPath(pathname);

  if (pathLocale === "en" || pathLocale === "vi") {
    // 旧来の有料出品フロー（/create）と、仮の取引チャット（/chat）は日本語のみ。
    // 英語版・ベトナム語版では、今の公開の流れ（マイプロジェクト）と依頼掲示板へ案内する
    const legacy = stripLocale(pathname);
    if (/^\/create(\/|$)/.test(legacy) || /^\/chat(\/|$)/.test(legacy)) {
      const url = req.nextUrl.clone();
      url.pathname = `/${pathLocale}${legacy.startsWith("/create") ? "/projects" : "/requests"}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathLocale === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const preferred = preferredLocale(req);
  if (preferred !== DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${preferred}` : `/${preferred}${pathname}`;
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

function preferredLocale(req: NextRequest): string {
  const saved = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  // 検索エンジンのクローラーは言語の自動案内をしない（日本語ページをそのまま見せる）
  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawler|spider|preview|facebookexternalhit|slurp|zalo/i.test(ua)) return DEFAULT_LOCALE;
  const accept = req.headers.get("accept-language");
  if (!accept) return DEFAULT_LOCALE;
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first || first === "*") return DEFAULT_LOCALE;
  if (first.startsWith("ja")) return DEFAULT_LOCALE;
  // ベトナム語は、公開の準備ができるまで自動では案内しない（/vi を直接開けば見られる）
  if (first.startsWith("vi") && FEATURES.viAutoRedirect) return "vi";
  return "en";
}

export const config = {
  // API・OGP画像・静的ファイル・robots/sitemap/llms.txt は対象外
  matcher: ["/((?!api|og|_next|_vercel|llms\\.txt|robots\\.txt|sitemap\\.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
