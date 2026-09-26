import { NextResponse } from "next/server";
import { cleanupInactiveGuestUrlApps } from "@/lib/apps/access";
import { deleteInactiveGroups } from "@/lib/groups/server";

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

  if (result.error || groups.error) {
    return NextResponse.json({ error: result.error ?? groups.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: result.deleted,
    deletedGroups: groups.deleted,
    ranAt: new Date().toISOString(),
  });
}
