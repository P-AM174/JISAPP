-- アプリのグループ共有（サークルなどでデータを共有する）
-- Supabase SQL Editor で実行してください
--
-- ・グループはログインした人が作る（owner_id）。メンバーは招待リンクから表示名だけで参加できる
-- ・メンバーの本人確認は、参加時に渡す秘密の鍵（member_key）のハッシュで行う
-- ・読み書きはすべてサーバーの API（サービスロール）経由。ブラウザから直接は読めないよう RLS を有効にし、ポリシーは作らない

CREATE TABLE IF NOT EXISTS public.app_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_groups_app_id_idx ON public.app_groups (app_id);
CREATE INDEX IF NOT EXISTS app_groups_owner_id_idx ON public.app_groups (owner_id);

CREATE TABLE IF NOT EXISTS public.app_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.app_groups (id) ON DELETE CASCADE,
  member_key_hash TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  user_id TEXT,
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_group_members_group_id_idx ON public.app_group_members (group_id);
CREATE INDEX IF NOT EXISTS app_group_members_user_id_idx ON public.app_group_members (group_id, user_id);

-- グループで1つの値を共有する（Zisup.shared.save / load）
CREATE TABLE IF NOT EXISTS public.app_group_values (
  group_id UUID NOT NULL REFERENCES public.app_groups (id) ON DELETE CASCADE,
  data_key TEXT NOT NULL,
  data_value TEXT NOT NULL,
  updated_by UUID REFERENCES public.app_group_members (id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, data_key)
);

-- メンバーが項目を追加していく（Zisup.shared.add / list / remove）
CREATE TABLE IF NOT EXISTS public.app_group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.app_groups (id) ON DELETE CASCADE,
  data_key TEXT NOT NULL,
  data_value TEXT NOT NULL,
  author_id UUID REFERENCES public.app_group_members (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_group_items_group_key_idx ON public.app_group_items (group_id, data_key, created_at);

ALTER TABLE public.app_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_group_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_group_items ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.app_groups TO postgres, service_role;
GRANT ALL ON public.app_group_members TO postgres, service_role;
GRANT ALL ON public.app_group_values TO postgres, service_role;
GRANT ALL ON public.app_group_items TO postgres, service_role;
