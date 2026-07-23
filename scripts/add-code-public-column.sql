-- ソースコード公開設定（マイライブラリ登録者のみ閲覧可）
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS code_public BOOLEAN NOT NULL DEFAULT FALSE;
