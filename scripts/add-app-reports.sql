-- アプリ報告（Supabase プレイグラウンドアプリ用）
CREATE TABLE IF NOT EXISTS public.app_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL,
  reporter_id TEXT,
  reason TEXT NOT NULL,
  detail TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_reports_app_id_idx ON public.app_reports (app_id);
CREATE INDEX IF NOT EXISTS app_reports_status_idx ON public.app_reports (status);
CREATE INDEX IF NOT EXISTS app_reports_created_at_idx ON public.app_reports (created_at DESC);
