import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/** 運営画面用：計測の集計（イベント × 言語 × 流入元、ベトナムからの月間訪問数） */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  const days = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("days") ?? "30") || 30, 1), 365);
  const supabase = createServerSupabaseClient();
  const [summary, vn] = await Promise.all([
    supabase.rpc("analytics_summary", { p_days: days }),
    supabase.rpc("analytics_vn_monthly", { p_months: 6 }),
  ]);
  if (summary.error || vn.error) {
    return NextResponse.json(
      {
        error:
          "計測の表がまだありません。Supabase の SQL Editor で scripts/add-analytics-events.sql を実行してください",
        detail: summary.error?.message ?? vn.error?.message,
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ days, summary: summary.data ?? [], vnMonthly: vn.data ?? [] });
}
