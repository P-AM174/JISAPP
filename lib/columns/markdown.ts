/**
 * コラムの本文の書き方（AI が出す Markdown をそのまま貼れるようにしている）
 *   ## 大見出し / ### 小見出し（# も大見出しとして扱う）
 *   **太字**、[文字](https://…)、`コード`
 *   - 箇条書き / 1. 番号つき / > 引用 / --- 区切り線 / ``` コード ```
 *   ![説明](画像のURL)        … 1行だけで書くと画像
 *   ::app[アプリのID]          … ジサップのアプリのカード
 *   ::youtube[動画のURL]       … YouTube の動画
 *   ::button[文字](/playground) … ボタン
 * HTML は使えない（すべて文字として表示する）
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; v: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; v: Inline[]; href: string }
  | { t: "br" };

export type Block =
  | { t: "h2" | "h3"; v: Inline[]; id: string }
  | { t: "p"; v: Inline[] }
  | { t: "quote"; v: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "hr" }
  | { t: "code"; v: string }
  | { t: "image"; src: string; alt: string }
  | { t: "app"; id: string }
  | { t: "youtube"; id: string }
  | { t: "button"; label: string; href: string };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/** 外に出してよいリンク先か（javascript: などを通さない） */
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(h)) return h;
  if (/^\/(?!\/)[^\s"'<>]*$/.test(h)) return h;
  return null;
}
function safeImage(src: string): string | null {
  const s = src.trim();
  if (new RegExp(`^/api/columns/image/${UUID}$`).test(s)) return s;
  if (/^https:\/\/[^\s"'<>]+$/i.test(s)) return s;
  return null;
}
export function youtubeId(v: string): string | null {
  const s = v.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => { if (buf) { out.push({ t: "text", v: buf }); buf = ""; } };
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    let m: RegExpMatchArray | null;
    if (rest.startsWith("\n")) { flush(); out.push({ t: "br" }); i++; continue; }
    if ((m = rest.match(/^\*\*([^*][\s\S]*?)\*\*/))) { flush(); out.push({ t: "bold", v: parseInline(m[1]) }); i += m[0].length; continue; }
    if ((m = rest.match(/^`([^`\n]+)`/))) { flush(); out.push({ t: "code", v: m[1] }); i += m[0].length; continue; }
    if ((m = rest.match(/^\[([^\]\n]+)\]\(([^)\s]+)\)/))) {
      const href = safeHref(m[2]);
      flush();
      if (href) out.push({ t: "link", v: parseInline(m[1]), href });
      else out.push({ t: "text", v: m[1] });
      i += m[0].length; continue;
    }
    buf += src[i]; i++;
  }
  flush();
  return out;
}

function plain(v: Inline[]): string {
  return v.map((x) => (x.t === "text" || x.t === "code" ? x.v : x.t === "bold" || x.t === "link" ? plain(x.v) : " ")).join("");
}

export function parseBody(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let n = 0;
  const flushPara = () => { if (para.length) { blocks.push({ t: "p", v: parseInline(para.join("\n")) }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const s = line.trim();
    let m: RegExpMatchArray | null;
    if (!s) { flushPara(); continue; }
    if (s.startsWith("```")) {
      flushPara();
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith("```"); i++) code.push(lines[i]);
      blocks.push({ t: "code", v: code.join("\n") });
      continue;
    }
    if ((m = s.match(/^(#{1,3})\s+(.+)$/))) {
      flushPara();
      const v = parseInline(m[2].replace(/\s+#+$/, ""));
      blocks.push({ t: m[1].length === 3 ? "h3" : "h2", v, id: `h-${++n}` });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(s)) { flushPara(); blocks.push({ t: "hr" }); continue; }
    if ((m = s.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      flushPara();
      const src = safeImage(m[2]);
      if (src) blocks.push({ t: "image", src, alt: m[1] });
      continue;
    }
    if ((m = s.match(new RegExp(`^::app\\[(${UUID})\\]$`, "i")))) { flushPara(); blocks.push({ t: "app", id: m[1].toLowerCase() }); continue; }
    if ((m = s.match(/^::youtube\[([^\]]+)\]$/))) { flushPara(); const id = youtubeId(m[1]); if (id) blocks.push({ t: "youtube", id }); continue; }
    if ((m = s.match(/^::button\[([^\]]+)\]\(([^)\s]+)\)$/))) { flushPara(); const href = safeHref(m[2]); if (href) blocks.push({ t: "button", label: m[1], href }); continue; }
    if (/^>\s?/.test(s)) {
      flushPara();
      const q: string[] = [];
      for (; i < lines.length && /^>\s?/.test(lines[i].trim()); i++) q.push(lines[i].trim().replace(/^>\s?/, ""));
      i--;
      blocks.push({ t: "quote", v: parseInline(q.join("\n")) });
      continue;
    }
    if (/^[-*・]\s+/.test(s) || /^\d+[.)．]\s+/.test(s)) {
      flushPara();
      const ordered = /^\d/.test(s);
      const re = ordered ? /^\d+[.)．]\s+/ : /^[-*・]\s+/;
      const items: Inline[][] = [];
      for (; i < lines.length && re.test(lines[i].trim()); i++) items.push(parseInline(lines[i].trim().replace(re, "")));
      i--;
      blocks.push({ t: ordered ? "ol" : "ul", items });
      continue;
    }
    para.push(s);
  }
  flushPara();
  return blocks;
}

export function appIdsInBody(body: string): string[] {
  const re = new RegExp(`^\\s*::app\\[(${UUID})\\]\\s*$`, "gim");
  return [...new Set([...body.matchAll(re)].map((m) => m[1].toLowerCase()))].slice(0, 20);
}

/** 目次・説明文の自動作成用 */
export function headings(blocks: Block[]): { id: string; text: string; level: 2 | 3 }[] {
  return blocks.flatMap((b) => (b.t === "h2" || b.t === "h3" ? [{ id: b.id, text: plain(b.v), level: b.t === "h2" ? (2 as const) : (3 as const) }] : []));
}
export function excerpt(body: string, max = 120): string {
  const text = parseBody(body).flatMap((b) => (b.t === "p" ? [plain(b.v)] : [])).join(" ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
/** 読むのにかかる分（日本語 500字/分） */
export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.replace(/\s/g, "").length / 500));
}
