-- anon キー（ブラウザに配られる公開キー）で、ユーザーの保存データや下書きを読み書きできないようにする。
--
-- 経緯：grant-supabase-tables.sql で apps / playground_drafts / app_user_data に
--   「anon にも全操作を許可」＋「全行を誰でも読み書きできる」ポリシーを付けていた。
--   anon キーは NEXT_PUBLIC_SUPABASE_ANON_KEY としてブラウザに配られているため、
--   その状態だと誰でも Supabase の API を直接呼んで、全ユーザーの保存データ（アプリが保存した
--   ID・パスワードのメモなども含む）を読んだり、アプリを書き換え・削除したりできてしまう。
--
-- ジサップ本体の書き込みはすべてサーバー（service role キー。RLS を通らない）から行っていて、
-- ブラウザからの anon の利用は apps の読み取りだけなので、それ以外の権限を外す。
-- （app_user_data を anon で読んでいた lib/stamp-counts.ts と lib/library-counts.ts は、
--   同じ変更でサーバー用のクライアントに切り替えている。先にそのコードをデプロイしてから実行すること）

-- ─── 実行前の確認（読み取りだけ）────────────────────────────────
-- 今のポリシー
-- SELECT tablename, policyname, cmd, roles, qual FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('apps', 'playground_drafts', 'app_user_data');
-- anon / authenticated に付いている権限
-- SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
--   GROUP BY table_name, grantee ORDER BY table_name, grantee;

-- ─── ユーザーの保存データ：anon / authenticated からは一切触れないようにする ─────────
-- （2026-09-30 の応急処置で、スタンプ数・ライブラリ登録数の集計用に anon の読み取りを一部残す
--   app_user_data_counts_temp を作った。このファイルの実行でそれも消す）
DROP POLICY IF EXISTS "app_user_data_all" ON public.app_user_data;
DROP POLICY IF EXISTS "app_user_data_counts_temp" ON public.app_user_data;
REVOKE ALL ON public.app_user_data FROM anon, authenticated;

-- ─── 開発スタジオの下書き：同上 ───────────────────────────────────
DROP POLICY IF EXISTS "playground_drafts_all" ON public.playground_drafts;
REVOKE ALL ON public.playground_drafts FROM anon, authenticated;

-- ─── アプリ：読み取りだけ残し、追加・更新・削除は外す ───────────────────
DROP POLICY IF EXISTS "apps_insert" ON public.apps;
DROP POLICY IF EXISTS "apps_update" ON public.apps;
DROP POLICY IF EXISTS "apps_delete" ON public.apps;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.apps FROM anon, authenticated;
REVOKE USAGE ON SEQUENCE public.apps_app_number_seq FROM anon, authenticated;
-- apps_read（SELECT は誰でも可）はそのまま残す
