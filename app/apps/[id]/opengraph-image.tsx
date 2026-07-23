import { ImageResponse } from "next/og";
import { getPublicAppSeo } from "@/lib/seo/public-apps";
import { CATEGORY_MAP } from "@/lib/categories";
import { SITE_BRAND } from "@/lib/seo/site";
import { loadLogoDataUri, loadNotoSansJP, OG_SIZE, OG_THEME } from "@/lib/seo/og-assets";

export const runtime = "nodejs";
export const alt = "ジサップのアプリ";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getPublicAppSeo(id);
  const title = app?.title ?? "無料Webアプリ";
  const description =
    app?.description?.slice(0, 80) ?? "AIで作ったコードを貼るだけで公開";
  const category = app?.category ? CATEGORY_MAP[app.category] : null;
  const emoji = category?.emoji ?? "✨";
  const categoryName = category?.name ?? "Webアプリ";
  const creatorName = app?.creatorName ?? "クリエイター";

  const [logo, fonts] = await Promise.all([
    loadLogoDataUri(),
    loadNotoSansJP([700, 900]),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: OG_THEME.pageBg,
          fontFamily: '"Noto Sans JP"',
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            width: 200,
            height: 200,
            borderRadius: 36,
            background: "rgba(52, 211, 153, 0.12)",
            transform: "rotate(12deg)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "52px 60px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} width={56} height={56} alt="" />
              <div style={{ fontSize: 26, fontWeight: 700, color: OG_THEME.brandText }}>
                Jisapp
              </div>
            </div>
            <div
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                background: OG_THEME.heroAccent,
                color: OG_THEME.white,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              FREE APP
            </div>
          </div>

          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 148,
                height: 148,
                borderRadius: 32,
                background: OG_THEME.pillBg,
                border: `2px solid ${OG_THEME.cardBorder}`,
                fontSize: 76,
                flexShrink: 0,
                boxShadow: "0 12px 32px rgba(5, 150, 105, 0.1)",
              }}
            >
              {emoji}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: OG_THEME.badgeBg,
                  color: OG_THEME.badgeText,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {categoryName}
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: -1.2,
                  color: OG_THEME.titleText,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 22,
                  lineHeight: 1.4,
                  color: OG_THEME.bodyText,
                  fontWeight: 500,
                }}
              >
                {description}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: OG_THEME.brandText }}>
              by {creatorName}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: OG_THEME.emerald600,
              }}
            >
              {SITE_BRAND} · タップして今すぐ試す
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
