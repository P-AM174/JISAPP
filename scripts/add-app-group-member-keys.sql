-- グループのメンバーが、端末ごとに鍵を持てるようにする（スマホとPCの両方で同じメンバーとして使う）
-- Supabase SQL Editor で実行してください（add-app-groups.sql のあとに）
--
-- ・1台目の鍵は今までどおり app_group_members.member_key_hash。2台目からの鍵をこの表に足す
-- ・別の端末で入り直しても、前の端末の鍵は消さない（前の端末が「グループから外れました」にならない）
-- ・メンバーを外す・グループを消すと、その人の鍵もいっしょに消える
-- ・この表がまだ無いあいだは、サーバーは今までどおり鍵を作り直す（入り直すと前の端末は外れる）

CREATE TABLE IF NOT EXISTS public.app_group_member_keys (
  key_hash TEXT PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.app_group_members (id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.app_groups (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_group_member_keys_member_idx ON public.app_group_member_keys (member_id, created_at);

-- 読み書きはサーバーの API（サービスロール）だけ。ブラウザからは読めないようにする
ALTER TABLE public.app_group_member_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_group_member_keys FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.app_group_member_keys TO postgres, service_role;
