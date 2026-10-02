-- 計測（多言語版・ベトナム語版の流入と利用の流れ）
-- Supabase SQL Editor で実行してください。実行するまでは記録されません（アプリの動作には影響しません）
--
-- 記録するイベント
--   page_view     … ページ表示（英語・ベトナム語ページ、またはベトナムからのアクセスだけ）
--   prompt_copy   … AI への指示文をコピー
--   studio_paste  … 開発スタジオにコードを貼り付け
--   preview       … プレビューでアプリが動いた
--   publish       … 公開（props.mode = url_only / listed）
--   share         … 共有（props.channel = facebook / messenger / zalo / x / line / mail / copy / native）
--   signup        … 新規登録の完了
-- locale（ja / en / vi）、国（Vercel が判定した2文字の国コード）、UTM（最初に来たときのもの）を一緒に残す

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  locale TEXT,
  country TEXT,
  path TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  props JSONB
);
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON public.analytics_events (name, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_country_idx ON public.analytics_events (country, created_at DESC);

-- サーバー（service role）だけが読み書きできるようにする
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_events FROM anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO service_role;

-- 直近 p_days 日の、イベント × 言語 × 流入元 の件数
CREATE OR REPLACE FUNCTION public.analytics_summary(p_days INTEGER)
RETURNS TABLE (name TEXT, locale TEXT, utm_source TEXT, events BIGINT, sessions BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT name, COALESCE(locale, '-'), COALESCE(utm_source, '-'), COUNT(*), COUNT(DISTINCT session_id)
  FROM public.analytics_events
  WHERE created_at >= NOW() - make_interval(days => p_days)
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;
$$;

-- ベトナムからの月ごとの訪問数（訪問 = ブラウザのセッションの数）。
-- 政令147号の対象の目安（月間10万訪問）に近づいていないかを見るため
CREATE OR REPLACE FUNCTION public.analytics_vn_monthly(p_months INTEGER)
RETURNS TABLE (month TEXT, visits BIGINT, page_views BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_char(date_trunc('month', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM'),
         COUNT(DISTINCT session_id), COUNT(*)
  FROM public.analytics_events
  WHERE name = 'page_view' AND country = 'VN'
    AND created_at >= date_trunc('month', NOW()) - make_interval(months => p_months - 1)
  GROUP BY 1
  ORDER BY 1 DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.analytics_summary(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_vn_monthly(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_summary(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.analytics_vn_monthly(INTEGER) TO service_role;

-- 通報を受けてから、非公開などの対応をするまでの時間を残す（ベトナムの規制への備え）
ALTER TABLE public.app_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
