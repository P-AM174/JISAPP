-- Supabase API ロールにテーブル権限を付与
GRANT ALL ON public.apps TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.playground_drafts TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.app_user_data TO postgres, anon, authenticated, service_role;

-- RLS を有効化しつつ service_role はバイパス可能
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_data ENABLE ROW LEVEL SECURITY;

-- 全操作を許可するポリシー（service_role は RLS バイパス、anon は読み取りのみ等）
CREATE POLICY "apps_read" ON public.apps FOR SELECT USING (true);
CREATE POLICY "apps_insert" ON public.apps FOR INSERT WITH CHECK (true);
CREATE POLICY "apps_update" ON public.apps FOR UPDATE USING (true);
CREATE POLICY "apps_delete" ON public.apps FOR DELETE USING (true);

CREATE POLICY "playground_drafts_all" ON public.playground_drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "app_user_data_all" ON public.app_user_data FOR ALL USING (true) WITH CHECK (true);
