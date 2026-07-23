import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const header = path.join(publicDir, "logo-header.png");

async function faviconFromHeader(size) {
  const iconSize = Math.round(size * 0.78);
  const pad = Math.round((size - iconSize) / 2);
  const icon = await sharp(header)
    .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 243, g: 246, b: 244, alpha: 1 },
    },
  })
    .composite([{ input: icon, top: pad, left: pad }])
    .png();
}

async function main() {
  for (const [name, size] of [
    ["favicon-16.png", 16],
    ["favicon-32.png", 32],
    ["apple-touch-icon.png", 180],
    ["logo-icon.png", 48],
  ]) {
    const img = await faviconFromHeader(size);
    await img.toFile(path.join(publicDir, name));
    console.log("wrote", name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
