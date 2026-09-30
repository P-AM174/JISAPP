-- アプリの保存データに容量の上限を設けるための準備（lib/app-data-limits.ts と対応）。
-- ・各行のバイト数を自動で持つ列を足し、1人あたり・グループあたりの合計をすぐ出せるようにする
-- ・合計を出す関数は service role（サーバー）だけが呼べるようにする
-- 追加するだけで既存のデータは変えない。コードのデプロイより前に実行してよい。

-- ─── 各行のバイト数（自動計算・保存される列） ───────────────────────────
ALTER TABLE public.app_user_data
  ADD COLUMN IF NOT EXISTS data_bytes INTEGER GENERATED ALWAYS AS (octet_length(coalesce(data_value, ''))) STORED;
ALTER TABLE public.app_group_values
  ADD COLUMN IF NOT EXISTS data_bytes INTEGER GENERATED ALWAYS AS (octet_length(data_value)) STORED;
ALTER TABLE public.app_group_items
  ADD COLUMN IF NOT EXISTS data_bytes INTEGER GENERATED ALWAYS AS (octet_length(data_value)) STORED;

CREATE INDEX IF NOT EXISTS app_user_data_user_id_idx ON public.app_user_data (user_id);
CREATE INDEX IF NOT EXISTS app_group_values_group_id_idx ON public.app_group_values (group_id);

-- ─── 1人あたりの合計（これから上書きするキーは除く） ─────────────────────
CREATE OR REPLACE FUNCTION public.app_user_data_bytes(p_user_id TEXT, p_app_id TEXT, p_data_key TEXT)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(sum(data_bytes), 0)
  FROM public.app_user_data
  WHERE user_id = p_user_id
    AND NOT (app_id = p_app_id AND data_key = p_data_key);
$$;

-- ─── グループあたりの合計（上書きする値のキーは除く。p_data_key が NULL なら全部） ─────────
CREATE OR REPLACE FUNCTION public.app_group_data_bytes(p_group_id UUID, p_data_key TEXT)
RETURNS BIGINT
LANGUAGE sql STABLE
AS $$
  SELECT
    coalesce((SELECT sum(data_bytes) FROM public.app_group_values
              WHERE group_id = p_group_id AND (p_data_key IS NULL OR data_key <> p_data_key)), 0)
  + coalesce((SELECT sum(data_bytes) FROM public.app_group_items WHERE group_id = p_group_id), 0);
$$;

-- 関数はふつう誰でも実行できるので、サーバー（service role）だけにする
REVOKE ALL ON FUNCTION public.app_user_data_bytes(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.app_group_data_bytes(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.app_user_data_bytes(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.app_group_data_bytes(UUID, TEXT) TO service_role;
