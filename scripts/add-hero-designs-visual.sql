-- ヒーローのスライドに「デザイン見本」（visual_type = 'designs'）を使えるようにする（2026-11-18）
-- 6種のデザインの見本を並べ、スライドのどこを押してもボタンの先へ移る見た目（components/home/hero/hero-visual.tsx）
alter table public.hero_slides drop constraint if exists hero_slides_visual_type_check;
alter table public.hero_slides add constraint hero_slides_visual_type_check
  check (visual_type in ('studio', 'summer', 'requests', 'column', 'phone', 'designs', 'none'));
