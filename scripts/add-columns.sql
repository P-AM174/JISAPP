-- コラム（運営が書く記事）と、記事に入れる画像
-- Supabase Dashboard → SQL Editor → このファイルの中身をコピーして実行
-- 読み書きはサーバー（サービスロール）からだけ。ブラウザから直接は読めない

create table if not exists public.columns (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  locale        text not null default 'ja' check (locale in ('ja', 'en')),
  title         text not null default '',
  description   text not null default '',
  body          text not null default '',          -- 本文（見出しは ##、アプリは ::app[ID] などの書き方）
  cover_image   text,                              -- 見出し画像（/api/columns/image/<id> など）
  x_text        text not null default '',          -- X に投稿するときの文
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists columns_published_idx on public.columns (status, locale, published_at desc);

create table if not exists public.column_images (
  id          uuid primary key default gen_random_uuid(),
  mime        text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  data        text not null,                       -- base64（ブラウザで縮めてから送る。1枚 1.5MB まで）
  created_at  timestamptz not null default now()
);

alter table public.columns enable row level security;
alter table public.column_images enable row level security;
revoke all on table public.columns from anon, authenticated;
revoke all on table public.column_images from anon, authenticated;
grant all on table public.columns to service_role;
grant all on table public.column_images to service_role;
