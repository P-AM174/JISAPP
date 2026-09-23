-- 承認キュー（Prisma AgentTask）と運営出品フラグ
-- 本番では `npx prisma db push` でも同じ内容が入ります

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isOfficial" BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
  CREATE TYPE "AgentTaskType" AS ENUM ('x_post', 'game_generation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AgentTaskStatus" AS ENUM ('pending', 'approved', 'rejected', 'executed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AgentTask" (
  "id" TEXT PRIMARY KEY,
  "type" "AgentTaskType" NOT NULL,
  "status" "AgentTaskStatus" NOT NULL DEFAULT 'pending',
  "title" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "previewData" JSONB,
  "safetyCheckResult" JSONB,
  "rejectionReason" TEXT,
  "executedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AgentTask_status_createdAt_idx" ON "AgentTask" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "AgentTask_type_status_idx" ON "AgentTask" ("type", "status");
