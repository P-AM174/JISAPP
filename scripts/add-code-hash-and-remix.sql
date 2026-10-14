-- 出品ルールの追加（2026-10-15）
-- 1) code_hash：コードの指紋。まったく同じコードのアプリが、ほかの人の作品としてマーケットに出品されていないかを速く調べるため
-- 2) remix_of：「このアプリをもとに作る」から作ったアプリの、もとのアプリ。もとのアプリの下に並べ、新着には出さない
-- Supabase の SQL Editor で、このファイルの中身をそのまま実行してください（何度実行しても大丈夫です）

alter table public.apps add column if not exists code_hash text;
alter table public.apps add column if not exists remix_of uuid references public.apps(id) on delete set null;

create index if not exists apps_code_hash_idx on public.apps (code_hash) where code_hash is not null;
create index if not exists apps_remix_of_idx on public.apps (remix_of) where remix_of is not null;
