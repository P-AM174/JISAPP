import { NextResponse } from "next/server";
import { assertCronAuth } from "@/lib/agent/cron-auth";
import { generateOfficialGameDraft } from "@/lib/agent/generate-game";
import {
  generatePlatformIntroDraft,
  generateXPostDraft,
} from "@/lib/agent/generate-x-post";
import { countPendingAgentTasksByType } from "@/lib/agent/tasks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PENDING = 2;

/**
 * Vercel Hobby は Cron 2本まで。掃除用とこの1本にまとめる。
 * 月金: アプリ個別紹介 / 水: ジサップ紹介 / 火木土: 運営アプリ
 */
export async function GET(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const day = new Date().getUTCDay();
  const job =
    day === 3 ? "x_intro" : day === 1 || day === 5 ? "x_post" : "game_generation";
  const pendingType = job === "game_generation" ? "game_generation" : "x_post";

  try {
    const pending = await countPendingAgentTasksByType(pendingType);
    if (pending >= MAX_PENDING) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        type: job,
        reason: `未処理が${pending}件あるため生成を見送りました`,
      });
    }

    const created =
      job === "x_intro"
        ? await generatePlatformIntroDraft()
        : job === "x_post"
          ? await generateXPostDraft()
          : await generateOfficialGameDraft();
    return NextResponse.json({ ok: true, type: job, created });
  } catch (error) {
    console.error("[cron/agent]", job, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成に失敗しました" },
      { status: 500 }
    );
  }
}
