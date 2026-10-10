-- ① ゲストで公開したアプリを、ログインしたあと自分の作品として引き継ぐ（apps.claim_token_hash）
-- ② 開発スタジオでプロンプトを貼ったまま、アプリにならずに離れた人のプロンプト（運営がアプリにして届ける）
-- Supabase SQL Editor で実行してください。列と表を足すだけで、今のデータは変えません。

-- ① 引き継ぎの印（ゲストで公開したときだけ入る。本人の端末にだけ元の文字列が残る。引き継いだら消す）
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS claim_token_hash TEXT;

-- ② あきらめたプロンプト
--   ログインしている人：コードではない文章（プロンプト）を貼ったときに自動で残す（スタジオと利用規約で知らせる）
--   ログインしていない人：「運営にアプリを作ってもらう」を押して、メールアドレスを書いたときだけ残す
--   その日のうちに動くコードが貼られたら resolved = true にして、一覧には出さない
CREATE TABLE IF NOT EXISTS public.studio_stuck_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  email TEXT,
  name TEXT,
  prompt TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  locale TEXT,
  -- 本人が「運営に作ってもらう」を押した
  requested BOOLEAN NOT NULL DEFAULT FALSE,
  -- そのあと自分でアプリにできた
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  -- open（未対応）・made（作成済み）・emailed（メール送信済み）・skipped（対応しない）
  status TEXT NOT NULL DEFAULT 'open',
  app_id TEXT,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS studio_stuck_prompts_created_idx ON public.studio_stuck_prompts (created_at DESC);
CREATE INDEX IF NOT EXISTS studio_stuck_prompts_owner_idx ON public.studio_stuck_prompts (user_id, prompt_hash);

-- サーバーだけが読み書きできるようにする
ALTER TABLE public.studio_stuck_prompts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.studio_stuck_prompts FROM anon, authenticated;
GRANT ALL ON public.studio_stuck_prompts TO service_role;
