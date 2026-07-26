-- ヒーロースライド CMS（v1）
-- Supabase Dashboard → SQL Editor → このファイルの中身をコピーして実行
-- ※ ファイルパス（C:\Users\...）は貼らないでください

create table if not exists public.hero_slides (
  id                uuid primary key default gen_random_uuid(),
  sort_order        int not null default 0,
  enabled           boolean not null default true,
  badge             text,
  title             text not null,
  subtitle          text not null,
  cta_enabled       boolean not null default false,
  cta_label         text,
  cta_href          text,
  layout            text not null default 'two_column'
                    check (layout in ('two_column', 'card', 'theme')),
  theme             text not null default 'studio'
                    check (theme in ('studio', 'violet', 'summer', 'amber', 'cyan')),
  visual_type       text check (visual_type in ('studio', 'summer', 'requests', 'phone', 'none')),
  bg_pattern        text check (bg_pattern in ('grid', 'dots', 'none')),
  featured_app_ids  uuid[] default '{}',
  updated_at        timestamptz not null default now()
);

create index if not exists hero_slides_sort_idx on public.hero_slides (sort_order);

-- 初期データ（空のときだけ投入）
insert into public.hero_slides (
  sort_order, enabled, badge, title, subtitle,
  cta_enabled, cta_label, cta_href,
  layout, theme, visual_type, bg_pattern, featured_app_ids
)
select
  v.sort_order, v.enabled, v.badge, v.title, v.subtitle,
  v.cta_enabled, v.cta_label, v.cta_href,
  v.layout, v.theme, v.visual_type, v.bg_pattern, v.featured_app_ids
from (
  values
    (0, true, 'ジサップ 開発スタジオ'::text,
     'AIにコードを作ってもらって、貼るだけでアプリが完成。'::text,
     'サーバー設定もデータベースも不要。使い慣れたAIのコードを貼るだけで即公開！'::text,
     true, 'アプリ開発スタジオへ'::text, '/playground'::text,
     'two_column'::text, 'studio'::text, 'studio'::text, 'grid'::text, '{}'::uuid[]),

    (1, true, '新企画：夏休みの自由研究・宿題に'::text,
     '夏休みの自由研究・工作は、自分だけのアプリを作って提出しよう！'::text,
     'AIと一緒に『生活を便利にするツール』や『オリジナルゲーム』を作るだけ。アイデアを形にする体験で、周りと差がつく自由研究に！'::text,
     true, '作り方ガイドを見る'::text, '/guide/summer-research'::text,
     'theme'::text, 'summer'::text, 'summer'::text, 'dots'::text, '{}'::uuid[]),

    (2, true, 'スマホ対応'::text,
     'スマホ1台で、アイデアをそのままアプリに。'::text,
     'パソコンがなくても大丈夫。通学中や移動時間のチャットから、数分で自分だけのツールを公開！'::text,
     false, null::text, null::text,
     'two_column'::text, 'cyan'::text, 'phone'::text, 'grid'::text, '{}'::uuid[]),

    (3, true, '開発依頼掲示板'::text,
     '欲しいアプリは『作って！』と頼んでみよう。'::text,
     '「こんなツールがあったらいいな」を掲示板に投げるだけ。みんなのアイデアで作る開発コミュニティ。'::text,
     false, null::text, null::text,
     'two_column'::text, 'amber'::text, 'requests'::text, 'none'::text, '{}'::uuid[])
) as v(sort_order, enabled, badge, title, subtitle, cta_enabled, cta_label, cta_href, layout, theme, visual_type, bg_pattern, featured_app_ids)
where not exists (select 1 from public.hero_slides limit 1);

grant all on public.hero_slides to postgres, anon, authenticated, service_role;
alter table public.hero_slides enable row level security;

drop policy if exists "hero_slides_read" on public.hero_slides;
drop policy if exists "hero_slides_write" on public.hero_slides;
create policy "hero_slides_read" on public.hero_slides for select using (true);
create policy "hero_slides_write" on public.hero_slides for all using (true) with check (true);
