import { ImageResponse } from "next/og";
import { OG_SIZE, OG_THEME, loadLogoDataUri, loadNotoSansJP } from "@/lib/seo/og-assets";
import { getPublishedColumn } from "@/lib/columns/service";
import { SITE_BRAND, SITE_OG_IMAGE, absoluteUrl } from "@/lib/seo/site";

export const runtime = "nodejs";

/** 見出し画像のないコラムの OGP 画像（タイトルを描く）。/og/columns/<slug>.png */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!file.endsWith(".png")) return new Response("Not found", { status: 404 });
  const column = await getPublishedColumn(decodeURIComponent(file.slice(0, -4))).catch(() => null);
  if (!column) return Response.redirect(absoluteUrl(SITE_OG_IMAGE), 302);
  const title = column.title.length > 60 ? `${column.title.slice(0, 60)}…` : column.title;
  const size = title.length <= 16 ? 76 : title.length <= 28 ? 62 : 50;
  try {
    const [logo, fonts] = await Promise.all([loadLogoDataUri().catch(() => null), loadNotoSansJP([700, 900])]);
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 70px", background: OG_THEME.pageBg, fontFamily: '"Noto Sans JP"' }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} width={56} height={56} alt="" /> : null}
            <div style={{ fontSize: 28, fontWeight: 700, color: OG_THEME.brandText }}>{column.locale === "en" ? "Jisapp Column" : `${SITE_BRAND} コラム`}</div>
          </div>
          <div style={{ display: "flex", fontSize: size, fontWeight: 900, lineHeight: 1.3, color: OG_THEME.titleText, letterSpacing: -1 }}>{title}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 22, fontWeight: 700, color: OG_THEME.mutedText }}>jisapp.app</div>
        </div>
      ),
      { ...OG_SIZE, fonts, headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return Response.redirect(absoluteUrl(SITE_OG_IMAGE), 302);
  }
}
