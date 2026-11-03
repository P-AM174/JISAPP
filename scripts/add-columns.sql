-- コラム（運営が書く記事）と、記事に入れる写真の置き場
-- Supabase Dashboard → SQL Editor → このファイルの中身をコピーして実行
-- 読み書きはサーバー（サービスロール）からだけ。ブラウザから直接は読めない

create table if not exists public.columns (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  locale        text not null default 'ja' check (locale in ('ja', 'en')),
  title         text not null default '',
  description   text not null default '',
  body          text not null default '',          -- 本文（見出しは ##、アプリは ::app[ID] などの書き方）
  cover_image   text,                              -- 見出し画像（Storage の公開 URL）
  x_text        text not null default '',          -- X に投稿するときの文
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists columns_published_idx on public.columns (status, locale, published_at desc);

-- 記事の写真は Supabase Storage（ファイル置き場）に置く。データベースの容量は使わない
-- 公開の置き場（だれでも見られる）。書き込み・削除はサーバー（サービスロール）だけ。1枚 1MB まで
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('column-images', 'column-images', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/webp', 'image/jpeg'];

alter table public.columns enable row level security;
revoke all on table public.columns from anon, authenticated;
grant all on table public.columns to service_role;

-- タグ（一覧の表紙の色や、次に読む記事を選ぶのに使う）。あとから足した列
alter table public.columns add column if not exists tags text[] not null default '{}';

-- トップページのヒーロー：「開発依頼掲示板」のスライドを「コラム」のスライドに差し替える
-- （絵の種類に column を足してから、スライドを書きかえる。運営画面 /admin/hero で直してもよい）
alter table public.hero_slides drop constraint if exists hero_slides_visual_type_check;
alter table public.hero_slides add constraint hero_slides_visual_type_check
  check (visual_type in ('studio', 'summer', 'requests', 'column', 'phone', 'none'));
update public.hero_slides set
  badge = 'ジサップ コラム',
  title = '旅行の精算も、遠征の車出しも。アプリにしたら、こんなにラク。',
  subtitle = 'グループの面倒な用事を、AI とジサップで自分のアプリにした話。読むと、きっと作りたくなります。',
  cta_enabled = true, cta_label = 'コラムを読んでみる', cta_href = '/column',
  theme = 'studio', visual_type = 'column', bg_pattern = 'none', updated_at = now()
where badge = '開発依頼掲示板';
