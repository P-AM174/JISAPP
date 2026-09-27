-- アプリが開かれた回数（マイプロジェクトの出品情報に表示）
-- Supabase SQL Editor で実行してください

ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS open_count INTEGER NOT NULL DEFAULT 0;

-- 開かれた回数を1増やし、最終アクセス日時も更新する（同時に開かれても数え漏れしない）
CREATE OR REPLACE FUNCTION public.increment_app_open_count(p_app_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.apps
  SET open_count = open_count + 1,
      last_accessed_at = NOW()
  WHERE id = p_app_id
    AND status = 'active';
$$;

-- サーバー（service role）からだけ呼べるようにする
REVOKE EXECUTE ON FUNCTION public.increment_app_open_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_app_open_count(UUID) TO service_role;
