-- ユーザーのマイプロジェクト一覧
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  html_code TEXT,
  css_code TEXT,
  js_code TEXT,
  app_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  is_listed BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_projects_user_id_idx ON public.user_projects (user_id);
CREATE INDEX IF NOT EXISTS user_projects_app_id_idx ON public.user_projects (app_id);

-- apps テーブルに作成者IDを追加
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS creator_id TEXT;

GRANT ALL ON public.user_projects TO postgres, anon, authenticated, service_role;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_projects_all" ON public.user_projects FOR ALL USING (true) WITH CHECK (true);
