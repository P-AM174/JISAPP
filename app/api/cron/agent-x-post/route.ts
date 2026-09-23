import { NextResponse } from "next/server";
import { assertCronAuth } from "@/lib/agent/cron-auth";
import { generateXPostDraft } from "@/lib/agent/generate-x-post";
import { countPendingAgentTasksByType } from "@/lib/agent/tasks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PENDING = 2;

export async function GET(request: Request) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  try {
    const pending = await countPendingAgentTasksByType("x_post");
    if (pending >= MAX_PENDING) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `未処理のX下書きが${pending}件あるため生成を見送りました`,
      });
    }
    const created = await generateXPostDraft();
    return NextResponse.json({ ok: true, created });
  } catch (error) {
    console.error("[cron/agent-x-post]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成に失敗しました" },
      { status: 500 }
    );
  }
}
