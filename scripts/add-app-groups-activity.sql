-- グループの最終利用日時（長く使われていないグループを自動で削除するため）
-- Supabase SQL Editor で実行してください（add-app-groups.sql のあとに）

ALTER TABLE public.app_groups
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS app_groups_last_active_at_idx ON public.app_groups (last_active_at);

-- 書き込み回数の制限に使う（メンバーごとの直近の追加を数える）
CREATE INDEX IF NOT EXISTS app_group_items_author_created_idx ON public.app_group_items (author_id, created_at);
