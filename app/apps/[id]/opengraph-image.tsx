import { ImageResponse } from "next/og";
import { getPublicAppSeo } from "@/lib/seo/public-apps";
import { CATEGORY_MAP } from "@/lib/categories";

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
  const title = app?.title ?? "ジサップ";
  const description =
    app?.description?.slice(0, 90) ?? "無料で使えるWebアプリ";
  const category = app?.category ? CATEGORY_MAP[app.category] : null;
  const emoji = category?.emoji ?? "✨";
  const categoryName = category?.name ?? "Webアプリ";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #047857 0%, #0f766e 45%, #0e7490 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            opacity: 0.9,
          }}
        >
          <span>Jisapp</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>{categoryName}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72 }}>{emoji}</div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, opacity: 0.85, maxWidth: 900 }}>
            {description}
          </div>
        </div>

        <div style={{ fontSize: 26, fontWeight: 700, opacity: 0.75 }}>
          無料 · ブラウザですぐ使える
        </div>
      </div>
    ),
    { ...size }
  );
}
