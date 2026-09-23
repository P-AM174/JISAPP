import { NextResponse } from "next/server";
import { assertCronAuth } from "@/lib/agent/cron-auth";
import { generateOfficialGameDraft } from "@/lib/agent/generate-game";
import { countPendingAgentTasksByType } from "@/lib/agent/tasks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PENDING = 2;

export async function GET(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  try {
    const pending = await countPendingAgentTasksByType("game_generation");
    if (pending >= MAX_PENDING) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `未処理の運営アプリが${pending}件あるため生成を見送りました`,
      });
    }
    const created = await generateOfficialGameDraft();
    return NextResponse.json({ ok: true, created });
  } catch (error) {
    console.error("[cron/agent-game]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成に失敗しました" },
      { status: 500 }
    );
  }
}
