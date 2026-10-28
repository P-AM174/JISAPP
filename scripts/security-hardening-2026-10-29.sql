-- ジサップ セキュリティ強化（2026-10-29）
-- Supabase の SQL Editor で、上から順に1回だけ実行してください。
-- 先に新しいコード（サーバー専用の鍵でアプリのコードを読む）を本番に反映してから流します。
--
-- 何をするか
-- 1. マイプロジェクト（作りかけ・公開していないアプリのコード）を、公開用の鍵（サイトの画面に入っている鍵）では読めなくする
-- 2. アプリは、公開用の鍵では一覧に必要な列（名前・説明など）だけ読めるようにし、コードや管理用の列は読めなくする
-- 3. ログインなどの「試した回数」を数えるテーブルを作る（総当たり対策）
-- サーバーはサーバー専用の鍵（service_role）で読むので、サイトの動きは変わりません。

begin;

-- 1. マイプロジェクト
alter table public.user_projects enable row level security;
revoke all on table public.user_projects from anon, authenticated;

-- 2. アプリ：公開用の鍵で読める列をしぼる
revoke all on table public.apps from anon, authenticated;
grant select (
  id, title, description, category, creator_name, creator_id, created_at,
  is_listed, status, code_public, group_sharing, remix_of, is_playground_app,
  app_number, is_featured, code_version, open_count, sns_order, last_accessed_at
) on table public.apps to anon, authenticated;

-- 3. 試した回数のテーブル（サーバー専用の鍵だけで読み書きする）
create table if not exists public.security_rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);
alter table public.security_rate_limits enable row level security;
revoke all on table public.security_rate_limits from anon, authenticated;
create index if not exists security_rate_limits_reset_at_idx on public.security_rate_limits (reset_at);

commit;

-- 確認（どちらも「permission denied」になれば成功）
-- set role anon; select html_code from public.apps limit 1; reset role;
-- set role anon; select id from public.user_projects limit 1; reset role;
