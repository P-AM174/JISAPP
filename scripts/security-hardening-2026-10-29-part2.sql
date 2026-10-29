-- ジサップ セキュリティ強化 その2（2026-10-29）
-- Supabase の SQL Editor で、1回だけ実行してください（その1を流したあとに流すもの）。
--
-- 何をするか
-- 1. トップの「お知らせ枠」（hero_slides）に、公開用の鍵（サイトの画面に入っている鍵）で書き込めたのを止める
--    （誰でもトップページに偽のお知らせ・偽のリンクを出せる状態だった）
-- 2. 秘密の鍵の保管場所などから、公開用の鍵の「読む権限」を外す（今は行ごとの守りで0件しか見えないが、守りを2重にする）
-- 3. 回数制限のテーブルを、サーバー専用の鍵（service_role）が読み書きできるようにする
-- どのテーブルも、サイトはサーバー専用の鍵で読み書きしているので、サイトの動きは変わりません。

begin;

-- 1・2. 公開用の鍵（anon）とログイン用の役割（authenticated）の権限を外す
revoke all on table public.hero_slides from anon, authenticated;
revoke all on table public.user_secrets from anon, authenticated;
revoke all on table public.app_secrets from anon, authenticated;
revoke all on table public.library_snapshots from anon, authenticated;
revoke all on table public.library_pending_updates from anon, authenticated;
revoke all on table public.app_requests from anon, authenticated;
revoke all on table public.app_request_responses from anon, authenticated;

-- 行ごとの守り（RLS）も、まだ付いていなければ付ける（サーバー専用の鍵は RLS を通らないので影響なし）
alter table public.hero_slides enable row level security;
alter table public.user_secrets enable row level security;
alter table public.app_secrets enable row level security;
alter table public.library_snapshots enable row level security;
alter table public.library_pending_updates enable row level security;
alter table public.app_requests enable row level security;
alter table public.app_request_responses enable row level security;

-- 3. 回数制限のテーブル
grant select, insert, update, delete on table public.security_rate_limits to service_role;

commit;
