import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromPath, stripLocale } from "@/lib/i18n/config";

/**
 * 言語ごとの URL の振り分け。
 * - /en/...  … 英語ページ（そのまま表示）
 * - /ja/...  … 日本語は言語なしの URL が正なので、そちらへ転送
 * - それ以外 … 日本語ページ（内部で /ja/... を表示）。
 *   ただし、英語を選んだことがある人・ブラウザの第一言語が日本語でない人は /en へ案内する
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const pathLocale = localeFromPath(pathname);

  if (pathLocale === "en") return NextResponse.next();

  if (pathLocale === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const preferred = preferredLocale(req);
  if (preferred === "en") {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
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
  if (/bot|crawler|spider|preview|facebookexternalhit|slurp/i.test(ua)) return DEFAULT_LOCALE;
  const accept = req.headers.get("accept-language");
  if (!accept) return DEFAULT_LOCALE;
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first || first === "*") return DEFAULT_LOCALE;
  return first.startsWith("ja") ? DEFAULT_LOCALE : "en";
}

export const config = {
  // API・OGP画像・静的ファイル・robots/sitemap/llms.txt は対象外
  matcher: ["/((?!api|og|_next|_vercel|llms\\.txt|robots\\.txt|sitemap\\.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
