// 今あるアプリにコードの指紋（apps.code_hash）を入れる（scripts/add-code-hash-and-remix.sql を実行したあとに一度だけ）。
// 入っていないアプリだけを埋める。コードの中身は変えない。
// 使い方: node --env-file=.env.local scripts/backfill-code-hash.mjs
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
// lib/apps/code-hash.ts と同じそろえ方
const normalize = (html, css, js) => [html ?? "", css ?? "", js ?? ""].map((x) => x.replace(/\r\n?/g, "\n").trim()).join("\n\u0000\n");
const hashOf = (a) => createHash("sha256").update(normalize(a.html_code, a.css_code, a.js_code), "utf8").digest("hex");

let done = 0;
for (;;) {
  const { data, error } = await s.from("apps").select("id, html_code, css_code, js_code").is("code_hash", null).limit(100);
  if (error) throw new Error(error.message);
  if (!data?.length) break;
  for (const a of data) {
    const { error: e } = await s.from("apps").update({ code_hash: hashOf(a) }).eq("id", a.id);
    if (e) throw new Error(`${a.id}: ${e.message}`);
    done++;
  }
  console.log(`${done} 件`);
}
console.log(`おわり：${done} 件に指紋を入れました`);
