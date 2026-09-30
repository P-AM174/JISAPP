-- サーバー（service role）が読み書きできていなかった表に、権限を付ける。
-- 経緯：この3つの表は作られていたが service_role への GRANT がなく、
--       ベルマークのお知らせ・アプリの通報・お問い合わせの保存が「permission denied」で失敗していた。
-- ブラウザ（anon / authenticated）からは引き続き読み書きできないようにする。
-- Supabase SQL Editor で実行してください

GRANT ALL ON public.user_notifications TO service_role;
GRANT ALL ON public.support_inquiries TO service_role;
GRANT ALL ON public.app_reports TO service_role;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_notifications FROM anon, authenticated;
REVOKE ALL ON public.support_inquiries FROM anon, authenticated;
REVOKE ALL ON public.app_reports FROM anon, authenticated;
