// コラムで紹介するアプリの HTML と説明文を、データベースから手元に保存する（機能を確かめる・写真を撮るため）
// 使い方: node --env-file=.env.local scripts/columns/fetch-app.mjs <アプリのID> <保存先フォルダ>
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';

const [id, dir] = process.argv.slice(2);
if (!id || !dir) { console.error('使い方: fetch-app.mjs <アプリのID> <保存先フォルダ>'); process.exit(1); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: a, error } = await s.from('apps').select('id,title,description,creator_name,status,group_sharing,open_count,html_code').eq('id', id).single();
if (error) throw error;
// 使われ方（グループの数）。0件なら記事で「使われている」と書かない
const { count } = await s.from('app_groups').select('*', { count: 'exact', head: true }).eq('app_id', id);
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/${id}.html`, a.html_code ?? '');
console.log(JSON.stringify({ id: a.id, title: a.title, creator: a.creator_name, status: a.status, groupSharing: a.group_sharing, openCount: a.open_count, groups: count }, null, 2));
console.log(`\n説明文:\n${a.description ?? ''}\n\n保存しました: ${dir}/${id}.html`);
