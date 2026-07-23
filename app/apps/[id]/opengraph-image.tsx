import { ImageResponse } from "next/og";
import { getPublicAppSeo } from "@/lib/seo/public-apps";
import { CATEGORY_MAP } from "@/lib/categories";
import { SITE_BRAND } from "@/lib/seo/site";

export const runtime = "nodejs";
export const alt = "ジサップのアプリ";
export const size = { width: 1200, height: 630 };
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
    app?.description?.slice(0, 72) ?? "AIで作ったコードを貼るだけで公開";
  const category = app?.category ? CATEGORY_MAP[app.category] : null;
  const emoji = category?.emoji ?? "✨";
  const categoryName = category?.name ?? "Webアプリ";
  const creatorName = app?.creatorName ?? "クリエイター";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(145deg, #022c22 0%, #065f46 42%, #0f766e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 220,
            height: 220,
            borderRadius: 40,
            background: "rgba(255,255,255,0.06)",
            transform: "rotate(12deg)",
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, opacity: 0.9 }}>{SITE_BRAND}</div>
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "#10b981",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              FREE APP
            </div>
          </div>

          <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 140,
                height: 140,
                borderRadius: 36,
                background: "rgba(255,255,255,0.12)",
                fontSize: 72,
                flexShrink: 0,
              }}
            >
              {emoji}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {categoryName}
              </div>
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: -1.5,
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 26, lineHeight: 1.35, opacity: 0.86, fontWeight: 500 }}>
                {description}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 600, opacity: 0.82 }}>
              by {creatorName}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, opacity: 0.72 }}>
              タップして今すぐ試す →
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
