/**
 * 一覧のサムネイル（小さなプレビュー）で動かすと重すぎるアプリの扱い。
 * 3D（WebGL）のアプリは、いくつも同時に動かすとスマホ（特に iPhone）のメモリが足りなくなり、
 * ページごと落ちる（「問題が繰り返し起きました」）。そのため、サムネイルでは動かさずに画像を出す。
 */

/** 3D（WebGL）を使うアプリか */
export function uses3D(code: string): boolean {
  if (!code) return false;
  return /three(\.module)?(\.min)?\.js|getContext\(\s*["'`](webgl2?|experimental-webgl)["'`]|\bWebGLRenderer\b|babylon(\.max)?\.js|pixi(\.min)?\.js|\bWebGL2RenderingContext\b/i.test(code);
}

/**
 * 実際の画面を撮っておいたアプリ（public/app-thumbs/<id>.jpg）。
 * 画像は運営が撮ってここに足す。ないアプリは、アプリ名の入った画像になる
 */
export const APP_THUMB_IMAGES: Record<string, string> = {
  "bc550887-cd99-4b9f-b807-ddb74cfc8277": "/app-thumbs/bc550887-cd99-4b9f-b807-ddb74cfc8277.jpg", // 小便器戦線
  "1e661fee-6b46-4c51-acaa-29a9fd3fd9d1": "/app-thumbs/1e661fee-6b46-4c51-acaa-29a9fd3fd9d1.jpg", // 東京ナイトフライト
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** サムネイル用の静止画（HTML・スクリプトなし）。撮った画面があればそれを、なければアプリ名を出す */
export function buildStillPreviewHtml(appId: string, title: string): string {
  const img = APP_THUMB_IMAGES[appId];
  if (img) {
    return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>html,body{margin:0;height:100%;background:#0b0d12}img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}</style>
</head><body><img src="${img}" alt=""></body></html>`;
  }
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  html, body { margin: 0; height: 100%; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5vh;
    text-align: center; padding: 0 6vw; box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    color: #fff;
    background: radial-gradient(1200px 800px at 20% 0%, rgba(99, 102, 241, 0.55), transparent 60%), radial-gradient(1000px 700px at 100% 100%, rgba(236, 72, 153, 0.4), transparent 60%), #0b0d12;
  }
  p { margin: 0; font-size: min(18vh, 8vw); font-weight: 900; line-height: 1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  small { font-size: min(11vh, 4.4vw); color: #c7d2fe; font-weight: 700; }
</style></head>
<body>
  <p>${esc(title)}</p>
  <small>3D・開くと動きます</small>
</body></html>`;
}
