-- ジサップで表示する名前を本人が決めたか（prisma/schema.prisma の User.usernameSet と対応）
-- Supabase SQL Editor で実行してください。**コードを公開する前に**実行してください
-- （先にコードを公開すると、ログインの処理がこの列を読もうとして失敗します）。
--
-- ・メール・パスワードで登録した人は、登録のときにニックネームを決めているので「決めた」扱いにする
-- ・ジサップ公式も「決めた」扱いにする
-- ・Google でログインした人は「まだ」のまま。次に開いたときに、名前を決める画面が出る

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usernameSet" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "User"
SET "usernameSet" = TRUE
WHERE "passwordHash" IS NOT NULL
   OR "isOfficial" = TRUE;
