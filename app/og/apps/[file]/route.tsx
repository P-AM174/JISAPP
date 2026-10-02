import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_THEME,
  loadLogoDataUri,
  loadNotoSansJP,
} from "@/lib/seo/og-assets";
import { getShareableAppSeo } from "@/lib/seo/public-apps";
import {
  SITE_BRAND,
  SITE_OG_IMAGE,
  SITE_OG_IMAGE_EN,
  SITE_TAGLINE,
  SITE_TAGLINE_EN,
  SITE_TAGLINE_VI,
  absoluteUrl,
  siteOgImage,
} from "@/lib/seo/site";

export const runtime = "nodejs";

/**
 * アプリ名を描き込んだ OGP 画像。
 * X は拡張子なしのURLをカード化しないことがあるため、必ず `.png` で終わるパスで配信する。
 * 例: /og/apps/<id>.png（英語版は /og/apps/<id>.en.png、ベトナム語版は /og/apps/<id>.vi.png）
 * 共有されたアプリ自体が広告になるよう、英語・ベトナム語版には「Made with Jisapp」を入れる
 */
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

const MAX_TITLE_LENGTH = 56;

function titleFontSize(length: number): number {
  if (length <= 10) return 92;
  if (length <= 16) return 78;
  if (length <= 24) return 64;
  if (length <= 34) return 54;
  return 46;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!file.toLowerCase().endsWith(".png")) {
    return new Response("Not found", { status: 404 });
  }

  let name = decodeURIComponent(file.slice(0, -4));
  const vi = name.endsWith(".vi");
  // ベトナム語版も、文言以外は英語版と同じ作り
  const en = name.endsWith(".en") || vi;
  if (en) name = name.slice(0, -3);
  const id = name;
  const fallbackImage = absoluteUrl(vi ? siteOgImage("vi") : en ? SITE_OG_IMAGE_EN : SITE_OG_IMAGE);
  const app = await getShareableAppSeo(id);

  if (!app) {
    // アプリが見つからない場合は共通のOGP画像を返す
    return Response.redirect(fallbackImage, 302);
  }

  const rawTitle = app.title.trim().normalize("NFC") || (vi ? "Một app trên Jisapp" : en ? "A Jisapp app" : "ジサップのアプリ");
  const tagline = vi ? SITE_TAGLINE_VI : en ? SITE_TAGLINE_EN : SITE_TAGLINE;
  const badge = vi
    ? "Dùng miễn phí ngay trên trình duyệt"
    : en
      ? "Free to use, right in your browser"
      : "ブラウザでそのまま無料で使えます";
  const footer = en ? "Made with Jisapp · jisapp.app" : "jisapp.app";
  const title =
    rawTitle.length > MAX_TITLE_LENGTH
      ? `${rawTitle.slice(0, MAX_TITLE_LENGTH)}…`
      : rawTitle;

  try {
    const [logo, fonts] = await Promise.all([
      loadLogoDataUri().catch(() => null),
      // ベトナム語は、画像に描く文字だけを含むフォントを読み込む（声調記号の字形を確実に入れるため）
      vi ? loadNotoSansJP([700, 900], `Jisapp${tagline}${title}${badge}${footer}…`) : loadNotoSansJP([700, 900]),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            padding: "56px 64px",
            background: OG_THEME.pageBg,
            fontFamily: '"Noto Sans JP"',
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -60,
              width: 360,
              height: 360,
              borderRadius: "50%",
              background: "rgba(52, 211, 153, 0.18)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -100,
              left: -40,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "rgba(45, 212, 191, 0.14)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} width={64} height={64} alt="" />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: OG_THEME.brandText,
                  letterSpacing: -1,
                }}
              >
                {en ? "Jisapp" : SITE_BRAND}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: OG_THEME.mutedText }}>
                {tagline}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                width: 96,
                height: 10,
                borderRadius: 999,
                background: OG_THEME.heroAccent,
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: titleFontSize(title.length),
                fontWeight: 900,
                lineHeight: 1.24,
                letterSpacing: -2,
                color: OG_THEME.titleText,
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                background: OG_THEME.badgeBg,
                color: OG_THEME.badgeText,
                fontSize: 24,
                fontWeight: 700,
                padding: "10px 24px",
              }}
            >
              {badge}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: OG_THEME.mutedText }}>
              {footer}
            </div>
          </div>
        </div>
      ),
      {
        ...OG_SIZE,
        fonts,
        headers: { "Cache-Control": CACHE_CONTROL },
      }
    );
  } catch {
    // フォント取得や描画に失敗しても、カードが空になるより共通画像を出す
    return Response.redirect(fallbackImage, 302);
  }
}
