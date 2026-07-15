-- Supabase 互換テーブル（prisma db push で消えた分を復元）
-- apps: プレイグラウンド出品アプリ
CREATE TABLE IF NOT EXISTS public.apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  html_code TEXT,
  css_code TEXT,
  js_code TEXT,
  is_playground_app BOOLEAN NOT NULL DEFAULT FALSE,
  creator_name TEXT,
  category TEXT,
  is_listed BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apps_status_idx ON public.apps (status);
CREATE INDEX IF NOT EXISTS apps_created_at_idx ON public.apps (created_at DESC);

-- playground_drafts: プレイグラウンドの下書き保存
CREATE TABLE IF NOT EXISTS public.playground_drafts (
  user_key TEXT PRIMARY KEY,
  html_code TEXT NOT NULL DEFAULT '',
  css_code TEXT NOT NULL DEFAULT '',
  js_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- app_user_data: スタンプ・ライブラリ・リクエスト等
CREATE TABLE IF NOT EXISTS public.app_user_data (
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data_value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, app_id, data_key)
);

CREATE INDEX IF NOT EXISTS app_user_data_app_id_idx ON public.app_user_data (app_id);
