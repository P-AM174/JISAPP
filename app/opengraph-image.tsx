import { ImageResponse } from "next/og";
import { SITE_BRAND, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/seo/site";
import { loadLogoDataUri, loadNotoSansJP, OG_SIZE, OG_THEME } from "@/lib/seo/og-assets";

export const runtime = "nodejs";
export const alt = SITE_BRAND;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={72} height={72} alt="" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: OG_THEME.brandText,
                  letterSpacing: -1,
                }}
              >
                Jisapp
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: OG_THEME.emerald600 }}>
                {SITE_BRAND}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              padding: "36px 40px",
              borderRadius: 28,
              background: OG_THEME.pillBg,
              border: `2px solid ${OG_THEME.cardBorder}`,
              boxShadow: "0 20px 50px rgba(5, 150, 105, 0.08)",
            }}
          >
            <div
              style={{
                alignSelf: "flex-start",
                padding: "10px 18px",
                borderRadius: 999,
                background: OG_THEME.badgeBg,
                color: OG_THEME.badgeText,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              無料 · コードを貼るだけ · すぐ公開
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: -1.5,
                color: OG_THEME.titleText,
              }}
            >
              {SITE_TAGLINE}
            </div>
            <div
              style={{
                fontSize: 24,
                lineHeight: 1.5,
                color: OG_THEME.bodyText,
                fontWeight: 500,
              }}
            >
              {SITE_DESCRIPTION}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background: OG_THEME.heroAccent,
                color: OG_THEME.white,
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              jisapp.app
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: OG_THEME.mutedText }}>
              AIコードを貼るだけの開発スタジオ
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
