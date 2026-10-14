import { createHash } from "crypto";

/** 比べるためにコードをそろえる（改行コードと前後の空白の違いは同じとみなす） */
export function normalizeCode(html: string, css?: string | null, js?: string | null): string {
  return [html, css ?? "", js ?? ""].map((s) => s.replace(/\r\n?/g, "\n").trim()).join("\n\u0000\n");
}

/** コードの指紋（apps.code_hash）。まったく同じコードかどうかを、全アプリから速く調べるため */
export function codeHash(html: string, css?: string | null, js?: string | null): string {
  return createHash("sha256").update(normalizeCode(html, css, js), "utf8").digest("hex");
}

/** アプリ名を比べるためにそろえる（全角・半角、大文字・小文字、前後と途中の空白の違いは同じとみなす） */
export function normalizeTitle(title: string): string {
  return title.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}
