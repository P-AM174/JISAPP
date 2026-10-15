import { createHash } from "crypto";

/** 比べるためにコードをそろえる（改行コードと前後の空白の違いは同じとみなす） */
export function normalizeCode(html: string, css?: string | null, js?: string | null): string {
  return [html, css ?? "", js ?? ""].map((s) => s.replace(/\r\n?/g, "\n").trim()).join("\n\u0000\n");
}

/** コードの指紋（apps.code_hash）。まったく同じコードかどうかを、全アプリから速く調べるため */
export function codeHash(html: string, css?: string | null, js?: string | null): string {
  return createHash("sha256").update(normalizeCode(html, css, js), "utf8").digest("hex");
}

/** 名前の似ている度合い（0〜1）。「アプリ」「app」などの付け足しと記号は無視し、2文字ずつの重なりで比べる */
export function titleSimilarity(a: string, b: string): number {
  const clean = (s: string) =>
    normalizeTitle(s)
      .replace(/アプリ|app|の|用/g, "")
      .replace(/[\s・、。,.!?！？「」『』()（）［］\[\]_\-–—~〜:：/]/g, "");
  const grams = (s: string) => {
    const g = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) g.set(s.slice(i, i + 2), (g.get(s.slice(i, i + 2)) ?? 0) + 1);
    return g;
  };
  const x = clean(a), y = clean(b);
  if (x.length < 2 || y.length < 2) return 0;
  const gx = grams(x), gy = grams(y);
  let common = 0;
  for (const [k, n] of gx) common += Math.min(n, gy.get(k) ?? 0);
  return (2 * common) / (x.length - 1 + y.length - 1);
}

/** コードの似ている度合い（0〜1）。意味のある行（4文字以上）がどれだけ重なっているか */
export function codeSimilarity(a: string, b: string): number {
  const lines = (s: string) => new Set(s.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter((l) => l.length > 3));
  const x = lines(a), y = lines(b);
  if (!x.size || !y.size) return 0;
  let common = 0;
  for (const l of x) if (y.has(l)) common++;
  return common / (x.size + y.size - common);
}

/** アプリ名を比べるためにそろえる（全角・半角、大文字・小文字、前後と途中の空白の違いは同じとみなす） */
export function normalizeTitle(title: string): string {
  return title.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}
