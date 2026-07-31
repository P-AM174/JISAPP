-- apps 挿入時の app_number 採番エラー修正
-- エラー: permission denied for sequence apps_app_number_seq
-- Supabase SQL Editor で実行してください

-- シーケンスへの権限付与
GRANT USAGE, SELECT ON SEQUENCE public.apps_app_number_seq TO postgres, anon, authenticated, service_role;

-- トリガー関数を SECURITY DEFINER に（実行ユーザーに依存せず採番できる）
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
