-- アプリでグループ共有を使うか（公開するときに選ぶ）
-- NULL = まだ選んでいない（コードが共有機能を使っているかで判断する）
-- Supabase SQL Editor で実行してください

ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS group_sharing BOOLEAN;
