import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

const assetsDir = path.join(
  process.env.USERPROFILE ?? "",
  ".cursor",
  "projects",
  "c-Users-harut-OneDrive",
  "assets"
);

const headerSrc = path.join(
  assetsDir,
  "c__Users_harut_AppData_Roaming_Cursor_User_workspaceStorage_79738a6bb9fbf6d37143037d1c932d9a_images_IMG_6977-8885a615-ec2c-48ec-8af4-95a35193fe90.png"
);

const faviconSrc = path.join(
  assetsDir,
  "c__Users_harut_AppData_Roaming_Cursor_User_workspaceStorage_79738a6bb9fbf6d37143037d1c932d9a_images_F18057CF-3559-40B6-9768-A647D3B324C3-cf0452cc-50ce-412d-b622-76a1ac9b34f2.png"
);

async function trimHeader(input) {
  const trimmed = await sharp(input).trim({ threshold: 24 }).png().toBuffer();
  const { data, info } = await sharp(trimmed)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r > 235 && g > 235 && b > 235) {
      pixels[i + 3] = 0;
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function trimAndPad(input, paddingRatio = 0.06) {
  const trimmed = await sharp(input)
    .trim({ threshold: 20 })
    .png()
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  const pad = Math.max(2, Math.round(Math.max(meta.width, meta.height) * paddingRatio));

  return sharp(trimmed)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png();
}

function resizeIcon(image, size) {
  return image
    .clone()
    .resize(Math.round(size * 0.92), Math.round(size * 0.92), {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .extend({
      top: Math.round(size * 0.04),
      bottom: Math.round(size * 0.04),
      left: Math.round(size * 0.04),
      right: Math.round(size * 0.04),
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .resize(size, size, { fit: "fill" });
}

async function main() {
  const headerBase = await trimHeader(headerSrc);
  const meta = await headerBase.metadata();
  const canvas = 512;
  const contentMax = Math.round(canvas * 0.98);
  const scale = contentMax / Math.max(meta.width, meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);
  const padX = Math.round((canvas - w) / 2);
  const padY = Math.round((canvas - h) / 2);

  await headerBase
    .resize(w, h, { kernel: sharp.kernel.lanczos3 })
    .extend({
      top: padY,
      bottom: canvas - h - padY,
      left: padX,
      right: canvas - w - padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(path.join(publicDir, "logo-header.png"));

  const favicon = await trimAndPad(faviconSrc, 0.02);
  await resizeIcon(favicon, 32).toFile(path.join(publicDir, "favicon-32.png"));
  await resizeIcon(favicon, 16).toFile(path.join(publicDir, "favicon-16.png"));
  await resizeIcon(favicon, 180).toFile(path.join(publicDir, "apple-touch-icon.png"));
  await resizeIcon(favicon, 48).toFile(path.join(publicDir, "logo-icon.png"));

  console.log("Logo assets written to public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
