-- 依頼掲示板・マイライブラリスナップショット・アップデート通知
-- Supabase SQL Editor で実行してください

-- ─── apps 拡張 ───
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS code_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS admin_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS apps_admin_deleted_idx ON public.apps (admin_deleted) WHERE admin_deleted = TRUE;

-- ─── マイライブラリ用コードスナップショット ───
CREATE TABLE IF NOT EXISTS public.library_snapshots (
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  html_code TEXT,
  css_code TEXT,
  js_code TEXT,
  category TEXT,
  code_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, app_id)
);

CREATE INDEX IF NOT EXISTS library_snapshots_app_id_idx ON public.library_snapshots (app_id);

-- ─── ライブラリユーザーの保留アップデート ───
CREATE TABLE IF NOT EXISTS public.library_pending_updates (
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  code_version INTEGER NOT NULL,
  reset_user_data BOOLEAN NOT NULL DEFAULT FALSE,
  app_title TEXT NOT NULL,
  update_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, app_id)
);

ALTER TABLE public.library_pending_updates ADD COLUMN IF NOT EXISTS update_notes TEXT;

-- ─── 依頼掲示板 ───
CREATE TABLE IF NOT EXISTS public.app_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_requests_created_at_idx ON public.app_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS app_requests_user_id_idx ON public.app_requests (user_id);

CREATE TABLE IF NOT EXISTS public.app_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.app_requests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  message TEXT NOT NULL,
  app_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_request_responses_request_id_idx ON public.app_request_responses (request_id, created_at ASC);

-- ─── API ロール権限（service_role 経由で利用） ───
GRANT ALL ON public.library_snapshots TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.library_pending_updates TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.app_requests TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.app_request_responses TO postgres, anon, authenticated, service_role;
