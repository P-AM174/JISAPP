import { ZISUP_SHIM_SCRIPT } from "@/lib/zisup-shim";

const MOBILE_VIEWPORT_META =
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';

const MOBILE_NO_ZOOM_STYLE =
  "<style>html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}input,textarea,select{font-size:16px}</style>";

/** iframe 内アプリでもタップ時のズームを抑止 */
function normalizeMobileViewport(docHtml: string): string {
  if (/<meta\s+name=["']viewport["'][^>]*>/i.test(docHtml)) {
    return docHtml.replace(/<meta\s+name=["']viewport["'][^>]*>/i, MOBILE_VIEWPORT_META);
  }
  if (/<head[^>]*>/i.test(docHtml)) {
    return docHtml.replace(/<head[^>]*>/i, (m) => m + MOBILE_VIEWPORT_META);
  }
  return docHtml;
}

/** Zisup シムを <head> の先頭（最初の <script> より前）に注入するヘルパー */
export function injectZisupShim(docHtml: string): string {
  const doc = normalizeMobileViewport(docHtml);
  const headInjection = MOBILE_NO_ZOOM_STYLE + `<script>${ZISUP_SHIM_SCRIPT}</script>`;

  if (/<head[^>]*>/i.test(doc)) {
    return doc.replace(/<head[^>]*>/i, (m) => m + headInjection);
  }
  if (/<html[^>]*>/i.test(doc)) {
    return doc.replace(/<html[^>]*>/i, (m) => m + `<head>${MOBILE_VIEWPORT_META}${headInjection}</head>`);
  }
  return MOBILE_VIEWPORT_META + headInjection + doc;
}

/** HTML / CSS / JS 断片を iframe 用の完全な HTML ドキュメントに結合 */
export function buildSrcDoc(
  html: string,
  css?: string | null,
  js?: string | null
): string {
  const h = html?.trim() ?? "";
  const c = css?.trim() ?? "";
  const j = js?.trim() ?? "";

  if (!h && !c && !j) return "";

  let doc: string;

  if (/^<!DOCTYPE|^<html[\s>]/i.test(h)) {
    doc = h;
    if (c) {
      const styleTag = `<style>${c}</style>`;
      if (/<\/head>/i.test(doc)) {
        doc = doc.replace(/<\/head>/i, `${styleTag}</head>`);
      } else {
        doc = doc.replace(/<body/i, `${styleTag}<body`);
      }
    }
    if (j) {
      const scriptTag = `<script>${j}</script>`;
      if (/<\/body>/i.test(doc)) {
        doc = doc.replace(/<\/body>/i, `${scriptTag}</body>`);
      } else {
        doc += scriptTag;
      }
    }
  } else {
    doc = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
${MOBILE_VIEWPORT_META}
<style>${c}</style>
</head>
<body>
${h}
<script>${j}</script>
</body>
</html>`;
  }

  return injectZisupShim(doc);
}

/** ファイル配列から html / css / js を抽出 */
export function extractCodeFromFiles(
  files: Array<{ name: string; content: string }>
): { html_code: string; css_code: string; js_code: string } {
  let html_code = "";
  let css_code = "";
  let js_code = "";

  for (const file of files) {
    const name = file.name.toLowerCase();
    const content = file.content ?? "";
    if (name.endsWith(".css")) {
      css_code += (css_code ? "\n" : "") + content;
    } else if (name.endsWith(".js") || name.endsWith(".mjs")) {
      js_code += (js_code ? "\n" : "") + content;
    } else {
      html_code += (html_code ? "\n" : "") + content;
    }
  }

  return { html_code, css_code, js_code };
}
