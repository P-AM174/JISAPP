import { NextResponse } from "next/server";
import { cleanupInactiveGuestUrlApps } from "@/lib/apps/access";
import { deleteInactiveGroups } from "@/lib/groups/server";
import { sendNextDayReminders } from "@/lib/notifications/comeback-notices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupInactiveGuestUrlApps();
  // 長く使われていないグループも、共有データごと削除する（Cron の本数制限のためここでまとめて行う）
  const groups = await deleteInactiveGroups();
  // はじめてアプリを作った人に、翌日1回だけ「使ってみましたか？」を送る（同じ理由でここで行う。失敗しても掃除の結果は返す）
  const reminders = await sendNextDayReminders().catch((e) => ({
    sent: 0,
    emailed: 0,
    error: e instanceof Error ? e.message : String(e),
  }));

  if (result.error || groups.error) {
    return NextResponse.json({ error: result.error ?? groups.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: result.deleted,
    deletedGroups: groups.deleted,
    reminders,
    ranAt: new Date().toISOString(),
  });
}
