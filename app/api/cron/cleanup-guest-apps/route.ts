import { NextResponse } from "next/server";
import { cleanupInactiveGuestUrlApps } from "@/lib/apps/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupInactiveGuestUrlApps();

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: result.deleted,
    ranAt: new Date().toISOString(),
  });
}
