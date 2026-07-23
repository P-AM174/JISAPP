import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

/** トップページ（ヒーロー・ロゴ）に合わせた明るいトーン */
export const OG_THEME = {
  pageBg: "linear-gradient(145deg, #ecfdf5 0%, #ffffff 38%, #f0fdfa 72%, #ecfeff 100%)",
  heroAccent: "linear-gradient(135deg, #34d399 0%, #2dd4bf 48%, #22d3ee 100%)",
  brandText: "#1D4242",
  titleText: "#0f3d3d",
  bodyText: "#475569",
  mutedText: "#64748b",
  badgeBg: "#d1fae5",
  badgeText: "#047857",
  pillBg: "rgba(255,255,255,0.92)",
  cardBorder: "rgba(16, 185, 129, 0.22)",
  emerald600: "#059669",
  white: "#ffffff",
};

export async function loadLogoDataUri(): Promise<string> {
  const buf = await readFile(join(process.cwd(), "public/logo-header.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export async function loadNotoSansJP(
  weights: Array<700 | 900> = [700, 900]
): Promise<
  Array<{
    name: string;
    data: ArrayBuffer;
    weight: 700 | 900;
    style: "normal";
  }>
> {
  const fonts: Array<{
    name: string;
    data: ArrayBuffer;
    weight: 700 | 900;
    style: "normal";
  }> = [];

  for (const weight of weights) {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&display=swap`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }
    ).then((r) => r.text());

    const match = css.match(/src: url\(([^)]+)\) format\('(?:woff2?|opentype|truetype)'\)/);
    if (!match?.[1]) continue;

    const data = await fetch(match[1]).then((r) => r.arrayBuffer());
    fonts.push({
      name: "Noto Sans JP",
      data,
      weight: weight as 700 | 900,
      style: "normal",
    });
  }

  if (fonts.length === 0) {
    throw new Error("Failed to load Noto Sans JP fonts for OG images");
  }

  return fonts;
}
