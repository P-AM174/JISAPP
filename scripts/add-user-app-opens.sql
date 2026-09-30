-- ひとりひとりがアプリを開いた記録と、ライブラリのピン留め
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS public.user_app_opens (
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  open_count INTEGER NOT NULL DEFAULT 0,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pinned_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, app_id)
);
CREATE INDEX IF NOT EXISTS user_app_opens_recent_idx
  ON public.user_app_opens (user_id, last_opened_at DESC);

-- サーバーだけが読み書きできるようにする（前回の権限の修正と同じ考え方）
ALTER TABLE public.user_app_opens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_app_opens FROM anon, authenticated;
GRANT ALL ON public.user_app_opens TO service_role;

-- 開いた記録を1回分ふやす（同時に開かれても数え漏れしない）
-- p_count が false のときは、回数は変えずに最後に開いた日時だけ更新する
CREATE OR REPLACE FUNCTION public.record_user_app_open(p_user_id TEXT, p_app_id TEXT, p_count BOOLEAN)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.user_app_opens (user_id, app_id, open_count, last_opened_at)
  VALUES (p_user_id, p_app_id, CASE WHEN p_count THEN 1 ELSE 0 END, NOW())
  ON CONFLICT (user_id, app_id) DO UPDATE
  SET open_count = user_app_opens.open_count + CASE WHEN p_count THEN 1 ELSE 0 END,
      last_opened_at = NOW();
$$;
REVOKE EXECUTE ON FUNCTION public.record_user_app_open(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_user_app_open(TEXT, TEXT, BOOLEAN) TO service_role;
