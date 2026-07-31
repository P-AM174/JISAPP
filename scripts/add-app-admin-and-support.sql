-- アプリ管理番号・注目フラグ・運営問い合わせ・ユーザー通知
-- Supabase SQL Editor で実行してください

-- ─── apps 拡張 ───
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS app_number INTEGER UNIQUE;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS admin_flags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS creator_id TEXT;

CREATE INDEX IF NOT EXISTS apps_app_number_idx ON public.apps (app_number);
CREATE INDEX IF NOT EXISTS apps_is_featured_idx ON public.apps (is_featured) WHERE is_featured = TRUE;

CREATE SEQUENCE IF NOT EXISTS apps_app_number_seq;

-- 既存行に管理番号を付与（作成日時順）
DO $$
DECLARE
  base_num INTEGER;
  rec RECORD;
  n INTEGER := 0;
BEGIN
  SELECT COALESCE(MAX(app_number), 0) INTO base_num FROM public.apps;
  FOR rec IN
    SELECT id FROM public.apps WHERE app_number IS NULL ORDER BY created_at ASC
  LOOP
    n := n + 1;
    UPDATE public.apps SET app_number = base_num + n WHERE id = rec.id;
  END LOOP;
END $$;

-- Prisma Product テーブルがある場合はシーケンスを両方の最大値に合わせる
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT GREATEST(
    COALESCE((SELECT MAX(app_number) FROM public.apps), 0),
    COALESCE((SELECT MAX("appNumber") FROM public."Product"), 0),
    1
  ) INTO max_num;
  PERFORM setval('apps_app_number_seq', max_num);
END $$;

CREATE OR REPLACE FUNCTION public.assign_app_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.app_number IS NULL THEN
    NEW.app_number := nextval('apps_app_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apps_assign_app_number ON public.apps;
CREATE TRIGGER apps_assign_app_number
  BEFORE INSERT ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_app_number();

GRANT USAGE, SELECT ON SEQUENCE public.apps_app_number_seq TO postgres, anon, authenticated, service_role;

-- ─── 運営問い合わせ ───
CREATE TABLE IF NOT EXISTS public.support_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  email TEXT NOT NULL,
  name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_inquiries_status_idx ON public.support_inquiries (status);
CREATE INDEX IF NOT EXISTS support_inquiries_created_at_idx ON public.support_inquiries (created_at DESC);

-- ─── ユーザー通知（ベルマーク） ───
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'support_reply',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications (user_id, created_at DESC);
