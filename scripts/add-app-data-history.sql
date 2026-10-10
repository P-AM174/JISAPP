-- アプリの保存データの履歴（上書き・削除の前の内容を取っておく）
-- Supabase SQL Editor で実行してください。表を足すだけで、今のデータは変えません。
--
-- 2026-10-09 の事故（読み込みに失敗したアプリが空の状態で保存し、元のデータを上書きした）を受けて、
-- 万一上書きされても運営が戻せるようにする。サーバー（app/api/app-data）が書き込む。
--   ・データが大きく減る上書き（半分未満になる）のときは、必ず前の内容を残す
--   ・それ以外の上書きは、1つのデータにつき1時間に1回まで残す
--   ・ユーザーが自分で消したときも、消す前の内容を残す
--   ・30日より前のものと、1つのデータにつき新しい順に100件を超えた分は片付ける
-- 履歴は保存容量（1人10MB）には数えない。

CREATE TABLE IF NOT EXISTS public.app_user_data_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data_value TEXT,
  -- その内容が保存された時刻（上書きされる前の updated_at）
  saved_at TIMESTAMPTZ,
  -- 上書き・削除された時刻
  replaced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- overwrite（上書き）・shrink（大きく減る上書き）・delete（ユーザーが消した）
  reason TEXT NOT NULL DEFAULT 'overwrite'
);

CREATE INDEX IF NOT EXISTS app_user_data_history_key_idx
  ON public.app_user_data_history (user_id, app_id, data_key, replaced_at DESC);

-- サーバーだけが読み書きできるようにする
ALTER TABLE public.app_user_data_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_user_data_history FROM anon, authenticated;
GRANT ALL ON public.app_user_data_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.app_user_data_history_id_seq TO service_role;
