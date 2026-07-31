-- アプリ・ユーザー用シークレット（APIキー等）
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS public.user_secrets (
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'general',
  header_name TEXT NOT NULL DEFAULT 'Authorization',
  prefix TEXT NOT NULL DEFAULT 'Bearer ',
  attach_type TEXT NOT NULL DEFAULT 'header',
  param_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, name)
);

CREATE INDEX IF NOT EXISTS user_secrets_user_id_idx ON public.user_secrets (user_id);

CREATE TABLE IF NOT EXISTS public.app_secrets (
  app_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  header_name TEXT NOT NULL DEFAULT 'Authorization',
  prefix TEXT NOT NULL DEFAULT 'Bearer ',
  attach_type TEXT NOT NULL DEFAULT 'header',
  param_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app_id, name)
);

CREATE INDEX IF NOT EXISTS app_secrets_app_id_idx ON public.app_secrets (app_id);

GRANT ALL ON public.user_secrets TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.app_secrets TO postgres, anon, authenticated, service_role;
