import { ImageResponse } from "next/og";
import { OG_SIZE, OG_THEME, loadLogoDataUri, loadNotoSansJP } from "@/lib/seo/og-assets";
import { SITE_DESCRIPTION_VI, SITE_OG_IMAGE_EN, SITE_TAGLINE_VI, absoluteUrl } from "@/lib/seo/site";

export const runtime = "nodejs";

/**
 * サイト全体の OGP 画像（ベトナム語版）。/og/site/vi.png
 * 日本語・英語は public/og.png・og-en.png の静的画像を使う。ベトナム語は文言の確認中で変わりうるため、描いて出す
 */
const CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (file !== "vi.png") return new Response("Not found", { status: 404 });

  const headline = "Dán code AI viết là có app";
  const points = ["Không cần biết lập trình", "Không cần server", "Miễn phí"];
  const madeIn = "Made in Japan · jisapp.app/vi";

  try {
    const [logo, fonts] = await Promise.all([
      loadLogoDataUri().catch(() => null),
      loadNotoSansJP([700, 900], `Jisapp${SITE_TAGLINE_VI}${SITE_DESCRIPTION_VI}${headline}${points.join("")}${madeIn}·`),
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
            padding: "56px 64px",
            background: OG_THEME.pageBg,
            fontFamily: '"Noto Sans JP"',
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} width={64} height={64} alt="" /> : null}
            <div style={{ fontSize: 36, fontWeight: 900, color: OG_THEME.brandText }}>Jisapp</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ width: 96, height: 10, borderRadius: 999, background: OG_THEME.heroAccent }} />
            <div style={{ display: "flex", fontSize: 76, fontWeight: 900, lineHeight: 1.3, color: OG_THEME.titleText }}>
              {headline}
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, lineHeight: 1.5, color: OG_THEME.bodyText }}>
              {SITE_TAGLINE_VI}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 12 }}>
              {points.map((p) => (
                <div
                  key={p}
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    background: OG_THEME.badgeBg,
                    color: OG_THEME.badgeText,
                    fontSize: 22,
                    fontWeight: 700,
                    padding: "10px 20px",
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: OG_THEME.mutedText }}>{madeIn}</div>
          </div>
        </div>
      ),
      { ...OG_SIZE, fonts, headers: { "Cache-Control": CACHE_CONTROL } }
    );
  } catch {
    return Response.redirect(absoluteUrl(SITE_OG_IMAGE_EN), 302);
  }
}
