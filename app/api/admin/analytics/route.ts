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
  // 開発スタジオの貼り付けの内訳（動いた・さっきのプロンプト・文章・途中で切れた）と、国別の訪問
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const [pastes, views] = await Promise.all([
    supabase.from("analytics_events").select("props").eq("name", "studio_paste").gte("created_at", since).limit(20000),
    supabase.from("analytics_events").select("country, session_id").eq("name", "page_view").gte("created_at", since).limit(50000),
  ]);
  const pasteBreakdown: Record<string, number> = {};
  for (const r of (pastes.data ?? []) as { props: { ok?: boolean; issue?: string } | null }[]) {
    // 内訳を数え始める前の記録は「動いた／動かなかった」だけ
    const k = r.props?.issue ?? (r.props?.ok ? "none" : "unknown");
    pasteBreakdown[k] = (pasteBreakdown[k] ?? 0) + 1;
  }
  const byCountry = new Map<string, { views: number; sessions: Set<string> }>();
  for (const r of (views.data ?? []) as { country: string | null; session_id: string | null }[]) {
    const c = r.country ?? "??";
    const v = byCountry.get(c) ?? { views: 0, sessions: new Set<string>() };
    v.views++;
    if (r.session_id) v.sessions.add(r.session_id);
    byCountry.set(c, v);
  }
  const countries = [...byCountry.entries()]
    .map(([country, v]) => ({ country, views: v.views, visits: v.sessions.size }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 30);
  return NextResponse.json({ days, summary: summary.data ?? [], vnMonthly: vn.data ?? [], pasteBreakdown, countries });
}
