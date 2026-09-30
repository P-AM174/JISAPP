-- 運営画面から選んだアプリ・ユーザーは、保存容量の上限（1回 2MB・1人 10MB・グループ 10MB）をかけない。
-- 画像・動画を保存できない決まりはそのまま。
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS public.storage_limit_exemptions (
  kind TEXT NOT NULL CHECK (kind IN ('user', 'app')),
  target_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (kind, target_id)
);

-- サーバー（service role）だけが読み書きできるようにする
ALTER TABLE public.storage_limit_exemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.storage_limit_exemptions FROM anon, authenticated;
GRANT ALL ON public.storage_limit_exemptions TO service_role;
