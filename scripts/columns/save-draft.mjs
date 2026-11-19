// コラムを下書きで保存する。写真と見出し画像を column-images/<記事ID>/ に上げて、本文の {{img:名前}} と {{prompt}} を差しかえる。
// 公開はしない（公開は管理画面で人がする）。すでに公開中の記事は書きかえない。保存のあと、記事と同じ読み方で形を確かめ、画像が開けるかも見る。
// 使い方: node --experimental-strip-types --env-file=.env.local scripts/columns/save-draft.mjs <記事の設定.json>
//
// 記事の設定.json の例（パスは設定ファイルのフォルダから）：
//   { "slug": "club-fee-app", "locale": "ja", "tags": ["サークル", "お金"],
//     "description": "検索結果に出る説明", "xText": "Xの投稿文",
//     "body": "fee.md", "prompt": "prompt-fee.txt", "images": "out", "cover": "out/cover-fee.jpg" }
//   本文は1行目が「# タイトル」。写真は ![説明]({{img:fee-top}}) と書くと images の fee-top.webp が入る
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseBody } from '../../lib/columns/markdown.ts';

const confPath = process.argv[2];
if (!confPath) { console.error('使い方: save-draft.mjs <記事の設定.json>'); process.exit(1); }
const base = dirname(resolve(confPath));
const p = JSON.parse(readFileSync(confPath, 'utf8'));
const at = (f) => resolve(base, f);
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/column-images/`;

if ((p.xText ?? '').length > 280) throw new Error(`X の投稿文が長すぎます（${p.xText.length}字。280字まで）`);
if ((p.description ?? '').length > 300) throw new Error('説明が長すぎます（300字まで）');

let { data: row } = await s.from('columns').select('id,status').eq('slug', p.slug).maybeSingle();
if (row && row.status !== 'draft') { console.log('公開中の記事なので書きかえません:', p.slug); process.exit(0); }
if (!row) {
  const { data, error } = await s.from('columns').insert({ slug: p.slug, locale: p.locale ?? 'ja', title: '', description: '', body: '', x_text: '', tags: [], status: 'draft' }).select('id,status').single();
  if (error) throw error;
  row = data;
}
const upload = async (file, type) => {
  const path = `${row.id}/${randomUUID()}.${file.endsWith('.jpg') ? 'jpg' : 'webp'}`;
  const up = await s.storage.from('column-images').upload(path, readFileSync(file), { contentType: type, cacheControl: '31536000', upsert: false });
  if (up.error) throw up.error;
  return prefix + path;
};

let body = readFileSync(at(p.body), 'utf8').replace(/\r\n?/g, '\n');
const title = body.match(/^# (.+)$/m)?.[1];
if (!title) throw new Error('本文の1行目に「# タイトル」がありません');
for (const name of [...new Set([...body.matchAll(/\{\{img:([\w-]+)\}\}/g)].map((m) => m[1]))]) {
  body = body.split(`{{img:${name}}}`).join(await upload(join(at(p.images), `${name}.webp`), 'image/webp'));
}
if (p.prompt) body = body.replace('{{prompt}}', readFileSync(at(p.prompt), 'utf8').replace(/\r\n?/g, '\n').trim());
if (body.includes('{{')) throw new Error('本文に {{…}} が残っています');
const cover = p.cover ? await upload(at(p.cover), 'image/jpeg') : undefined;
const { error } = await s.from('columns').update({
  title, body, description: p.description ?? '', x_text: p.xText ?? '', tags: p.tags ?? [], locale: p.locale ?? 'ja',
  ...(cover ? { cover_image: cover } : {}),
}).eq('id', row.id);
if (error) throw error;

// 確かめる：記事ページと同じ読み方で分け、写真と見出し画像が開けるか
const blocks = parseBody(body, (p.locale ?? 'ja') === 'en');
const count = {};
for (const b of blocks) count[b.t] = (count[b.t] ?? 0) + 1;
const urls = [cover, ...blocks.filter((b) => b.t === 'image').map((b) => b.src)].filter(Boolean);
const status = await Promise.all(urls.map((u) => fetch(u, { method: 'HEAD' }).then((r) => r.status)));
console.log(`下書きに保存しました: ${p.slug}（${row.id}）`);
console.log('記事の形:', JSON.stringify(count));
console.log('画像:', status.every((x) => x === 200) ? `${status.length}枚とも開けます` : `開けないものがあります ${status.join(',')}`);
