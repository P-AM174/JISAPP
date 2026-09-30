-- 作者のフォローをサーバーに保存する（これまでは端末ごとの localStorage だけだった）
-- 作者はプロフィールのURLと同じく、表示名（apps.creator_name）で指す
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS public.creator_follows (
  follower_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, creator_name)
);
CREATE INDEX IF NOT EXISTS creator_follows_creator_name_idx ON public.creator_follows (creator_name);

-- サーバー（service role）だけが読み書きできるようにする
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.creator_follows FROM anon, authenticated;
GRANT ALL ON public.creator_follows TO service_role;
