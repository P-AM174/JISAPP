// 記事の写真（台紙の真ん中にスマホ画面・webp）と、見出し画像（1200×628・jpg）を作る
// 使い方: node scripts/columns/images.mjs <見出しの設定.json> <写真のフォルダ（shoot.mjs の出力）> <出力フォルダ>
//
// 見出しの設定.json の例：
//   { "key": "fee", "bg": "#eef0fb", "dot": "#4f46e5", "hi": "#ffb4c8",
//     "phones": [["まだの人が<b>ひと目で</b>", "fee-members"], ["集まった額も<b>自動</b>", "fee-top"]],
//     "photos": ["fee-top", "fee-members", "fee-remind"] }
//   phones：見出し画像に並べるスマホ（1〜3台。ラベルの <b> の部分が hi の色になる）
//   photos：記事に入れる写真（省くと phones と同じ）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [confPath, shotsArg, outArg] = process.argv.slice(2);
if (!confPath || !shotsArg || !outArg) { console.error('使い方: images.mjs <見出しの設定.json> <写真のフォルダ> <出力フォルダ>'); process.exit(1); }
const c = JSON.parse(readFileSync(confPath, 'utf8'));
const shots = resolve(shotsArg), out = resolve(outArg);
mkdirSync(out, { recursive: true });

// 見出し画像：点々の地＋黒いピルのラベル＋黒ふちのスマホ
const dot = encodeURIComponent(c.dot ?? '#a8552f');
const n = c.phones.length;
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1200px;height:628px;overflow:hidden}
body{background:${c.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='2' cy='2' r='1.4' fill='${dot}' fill-opacity='.16'/%3E%3C/svg%3E");font-family:"Zen Maru Gothic","Hiragino Sans",sans-serif;display:flex;justify-content:center;gap:${n === 3 ? 56 : 90}px;padding-top:22px}
.col{display:flex;flex-direction:column;align-items:center;gap:18px}
.pill{background:#2b211b;color:#fff;font-weight:900;font-size:${n === 1 ? 32 : 25}px;padding:9px 22px;border-radius:999px;white-space:nowrap}
.pill b{color:${c.hi ?? '#f2c14e'}}
.phone{width:300px;height:560px;border:11px solid #2b211b;border-radius:44px;overflow:hidden;background:#fff;box-shadow:0 18px 40px rgba(40,30,20,.22)}
.phone img{width:100%;display:block}</style></head><body>
${c.phones.map(([label, shot]) => `<div class="col"><div class="pill">${label}</div><div class="phone"><img src="${pathToFileURL(join(shots, shot + '.png')).href}"></div></div>`).join('')}
</body></html>`;
const coverHtml = join(out, `cover-${c.key}.html`);
writeFileSync(coverHtml, html);
const coverPng = join(out, `cover-${c.key}.png`);
try {
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=1200,628', '--force-device-scale-factor=2', '--virtual-time-budget=5000', `--user-data-dir=${join(out, 'chrome', 'cover-' + c.key)}`, `--screenshot=${coverPng}`, pathToFileURL(coverHtml).href], { stdio: 'ignore', timeout: 60000 });
} catch { /* 写真があれば続ける */ }
await sharp(coverPng).resize(1200, 628).jpeg({ quality: 88, mozjpeg: true }).toFile(join(out, `cover-${c.key}.jpg`));
console.log('見出し画像', join(out, `cover-${c.key}.jpg`));

// 記事の写真：1200×1000 の台紙の真ん中に、角を丸めたスマホ画面と影
for (const shot of c.photos ?? c.phones.map((p) => p[1])) {
  const W = 1200, H = 1000, r = 36;
  const img = await sharp(join(shots, shot + '.png')).resize({ height: H - 90 }).png().toBuffer();
  const m = await sharp(img).metadata();
  const mask = Buffer.from(`<svg width="${m.width}" height="${m.height}"><rect width="100%" height="100%" rx="${r}" ry="${r}"/></svg>`);
  const rounded = await sharp(img).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const shadow = await sharp(Buffer.from(`<svg width="${m.width + 80}" height="${m.height + 80}"><rect x="40" y="52" width="${m.width}" height="${m.height}" rx="${r}" fill="rgba(40,30,20,.22)"/></svg>`)).blur(18).png().toBuffer();
  const left = Math.round((W - m.width) / 2), top = Math.round((H - m.height) / 2);
  await sharp({ create: { width: W, height: H, channels: 3, background: c.bg } })
    .composite([{ input: shadow, left: left - 40, top: top - 40 }, { input: rounded, left, top }])
    .webp({ quality: 84 }).toFile(join(out, `${shot}.webp`));
  console.log('写真', join(out, `${shot}.webp`));
}
