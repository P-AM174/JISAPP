import { ImageResponse } from "next/og";
import { SITE_BRAND, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/seo/site";

export const runtime = "edge";
export const alt = SITE_BRAND;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(145deg, #022c22 0%, #065f46 38%, #0d9488 72%, #0891b2 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(167,243,208,0.12)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 18,
                background: "rgba(255,255,255,0.16)",
                fontSize: 28,
              }}
            >
              ⚡
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              {SITE_BRAND}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 980 }}>
            <div
              style={{
                alignSelf: "flex-start",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.14)",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              無料 · コードを貼るだけ · すぐ公開
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 900,
                lineHeight: 1.12,
                letterSpacing: -2,
              }}
            >
              {SITE_TAGLINE}
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.45,
                opacity: 0.88,
                fontWeight: 500,
              }}
            >
              {SITE_DESCRIPTION}
            </div>
          </div>

          <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.72 }}>
            jisapp.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
