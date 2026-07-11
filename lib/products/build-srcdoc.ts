import { ZISUP_SHIM_SCRIPT } from "@/lib/zisup-shim";

/** Zisup シムを <head> の先頭（最初の <script> より前）に注入するヘルパー */
export function injectZisupShim(docHtml: string): string {
  const shimTag = `<script>${ZISUP_SHIM_SCRIPT}</script>`;
  // <head> タグがあればその直後に注入
  if (/<head[^>]*>/i.test(docHtml)) {
    return docHtml.replace(/<head[^>]*>/i, (m) => m + shimTag);
  }
  // <html> タグがあれば直後に <head> ごと注入
  if (/<html[^>]*>/i.test(docHtml)) {
    return docHtml.replace(/<html[^>]*>/i, (m) => m + `<head>${shimTag}</head>`);
  }
  // フォールバック：先頭に追加
  return shimTag + docHtml;
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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
