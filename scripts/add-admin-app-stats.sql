-- 運営画面：アプリごとの保存データの状況（lib/admin/app-stats.ts と対応）
-- Supabase SQL Editor で実行してください。関数を足すだけで、今のデータは変えません。
--
-- 返す値（アプリごと）
--   library_users : マイライブラリに入れている人数
--   data_users    : そのアプリでデータを保存している人数（ジサップの内部用の記録は除く）
--   data_bytes    : その人たちの保存データの合計（バイト）
--   group_count   : グループの数
--   group_members : グループのメンバーの合計
--   group_bytes   : グループで共有しているデータの合計（バイト）

CREATE OR REPLACE FUNCTION public.admin_app_stats()
RETURNS TABLE (
  app_id TEXT,
  library_users BIGINT,
  data_users BIGINT,
  data_bytes BIGINT,
  group_count BIGINT,
  group_members BIGINT,
  group_bytes BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH u AS (
    SELECT
      d.app_id::TEXT AS app_id,
      count(DISTINCT d.user_id) FILTER (WHERE d.data_key = '__in_library__') AS library_users,
      count(DISTINCT d.user_id) FILTER (WHERE d.data_key NOT LIKE '\_\_%' ESCAPE '\') AS data_users,
      coalesce(sum(octet_length(coalesce(d.data_value, ''))) FILTER (WHERE d.data_key NOT LIKE '\_\_%' ESCAPE '\'), 0) AS data_bytes
    FROM public.app_user_data d
    GROUP BY d.app_id
  ),
  gm AS (
    SELECT m.group_id, count(*) AS members
    FROM public.app_group_members m
    GROUP BY m.group_id
  ),
  gv AS (
    SELECT v.group_id, sum(octet_length(v.data_value)) AS bytes
    FROM public.app_group_values v
    GROUP BY v.group_id
  ),
  gi AS (
    SELECT i.group_id, sum(octet_length(i.data_value)) AS bytes
    FROM public.app_group_items i
    GROUP BY i.group_id
  ),
  g AS (
    SELECT
      gr.app_id::TEXT AS app_id,
      count(*) AS group_count,
      coalesce(sum(gm.members), 0) AS group_members,
      coalesce(sum(coalesce(gv.bytes, 0) + coalesce(gi.bytes, 0)), 0) AS group_bytes
    FROM public.app_groups gr
    LEFT JOIN gm ON gm.group_id = gr.id
    LEFT JOIN gv ON gv.group_id = gr.id
    LEFT JOIN gi ON gi.group_id = gr.id
    GROUP BY gr.app_id
  )
  SELECT
    coalesce(u.app_id, g.app_id),
    coalesce(u.library_users, 0),
    coalesce(u.data_users, 0),
    coalesce(u.data_bytes, 0)::BIGINT,
    coalesce(g.group_count, 0),
    coalesce(g.group_members, 0)::BIGINT,
    coalesce(g.group_bytes, 0)::BIGINT
  FROM u
  FULL OUTER JOIN g ON g.app_id = u.app_id;
$$;

-- サーバー（service role）からだけ呼べるようにする
REVOKE EXECUTE ON FUNCTION public.admin_app_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_app_stats() TO service_role;
