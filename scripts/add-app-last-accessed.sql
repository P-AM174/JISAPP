-- アプリ最終アクセス日時（ゲストURL自動削除用）
-- Supabase SQL Editor で実行（create-hero-slides.sql とは別でOK）

alter table public.apps add column if not exists last_accessed_at timestamptz;

update public.apps
set last_accessed_at = coalesce(last_accessed_at, created_at, now())
where last_accessed_at is null;

create index if not exists apps_guest_cleanup_idx
  on public.apps (last_accessed_at)
  where creator_id is null and is_listed = false and status = 'active';
