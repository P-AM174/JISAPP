-- 「SNSで紹介したアプリ」（トップページの列・特集ページ /features/sns・ヒーロー）
-- Supabase SQL Editor で実行してください。列を足すだけで、今のデータは変えません。
--
-- sns_order：SNSで紹介したアプリの並び順（小さいほど前）。NULL のアプリは出さない。
-- 運営画面の「SNSで紹介したアプリ」で、追加・並べ替え・外すができる。

ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS sns_order INTEGER;

CREATE INDEX IF NOT EXISTS apps_sns_order_idx
  ON public.apps (sns_order)
  WHERE sns_order IS NOT NULL;
