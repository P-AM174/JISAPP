/**
 * カメラ・マイクを使うアプリの判定と、一覧サムネイル用の静止画。
 * 一覧でアプリを動かすと、開いただけで許可のダイアログが出てしまうため、
 * 該当するアプリはサムネイルでは動かさずに静止画を出す。
 */

export type MediaUsage = "camera" | "microphone" | "camera_microphone";

const CAMERA_PATTERNS = [
  /getUserMedia\s*\(\s*\{[^}]*video/i,
  /\bvideo\s*:\s*(true|\{)/i,
  /getDisplayMedia/i,
  /<input[^>]*\bcapture\b/i,
  /ImageCapture/i,
];

const MICROPHONE_PATTERNS = [
  /getUserMedia\s*\(\s*\{[^}]*audio/i,
  /\baudio\s*:\s*(true|\{)/i,
  /SpeechRecognition/i,
];

/** コードがカメラ・マイクを使うか。使わなければ null */
export function detectMediaUsage(code: string): MediaUsage | null {
  if (!code) return null;
  const usesMediaApi = /getUserMedia|mediaDevices|getDisplayMedia|SpeechRecognition|ImageCapture|<input[^>]*\bcapture\b/i.test(code);
  if (!usesMediaApi) return null;

  const camera = CAMERA_PATTERNS.some((re) => re.test(code));
  const microphone = MICROPHONE_PATTERNS.some((re) => re.test(code));
  if (camera && microphone) return "camera_microphone";
  if (microphone) return "microphone";
  // getUserMedia などを使っていて種類が読み取れないときは、カメラとして扱う
  return "camera";
}

const LABELS: Record<MediaUsage, string> = {
  camera: "カメラを使うアプリ",
  microphone: "マイクを使うアプリ",
  camera_microphone: "カメラとマイクを使うアプリ",
};

const CAMERA_ICON =
  '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>';
const MIC_ICON =
  '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>';

/**
 * サムネイル用の静止画（HTML）。一覧では 0.2 倍に縮小して表示されるため、大きめに描く。
 * スクリプトは含めない。
 */
export function buildMediaPosterHtml(usage: MediaUsage): string {
  const icon = usage === "microphone" ? MIC_ICON : CAMERA_ICON;
  const second = usage === "camera_microphone" ? `<svg viewBox="0 0 24 24">${MIC_ICON}</svg>` : "";
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>${LABELS[usage]}</title>
<style>
  html, body { margin: 0; height: 100%; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5vh;
    text-align: center; white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    color: #134b3b;
    background:
      radial-gradient(1400px 900px at 10% 0%, rgba(167, 230, 205, 0.9), transparent 60%),
      radial-gradient(1200px 800px at 100% 20%, rgba(186, 225, 253, 0.9), transparent 60%),
      #f3faf7;
  }
  /* カードの大きさが違っても収まるよう、枠の幅・高さに合わせて大きさを決める */
  .icons { display: flex; gap: 4vw; }
  svg { width: min(30vh, 18vw); height: min(30vh, 18vw); fill: none; stroke: #1a7358; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  p { margin: 0; font-size: min(16vh, 6vw); font-weight: 800; letter-spacing: 0.02em; }
  small { font-size: min(11vh, 4.2vw); color: #2b8a6c; font-weight: 600; }
</style></head>
<body>
  <div class="icons"><svg viewBox="0 0 24 24">${icon}</svg>${second}</div>
  <p>${LABELS[usage]}</p>
  <small>開くと動きます</small>
</body></html>`;
}

/** サムネイルの iframe に付ける権限の制限（見分けに漏れても許可のダイアログを出さない） */
export const THUMBNAIL_IFRAME_ALLOW =
  "camera 'none'; microphone 'none'; geolocation 'none'; display-capture 'none'";
