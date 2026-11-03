import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { OFFICIAL_CREATOR_NAME } from "@/lib/agent/official-creator";
import { prisma } from "@/lib/db";
import { EXCLUDED_ACCOUNT_NAMES, filterExcludedEvents } from "@/lib/analytics/excluded";

/**
 * 運営画面のダッシュボード用：今日（日本時間の0時から）作られたアプリの数と、アクセス数。
 * 計測（/api/admin/analytics）と同じく、運営・本人のアカウントと公式のアプリは数えない
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  const JST = 9 * 3600 * 1000;
  const since = new Date(Math.floor((Date.now() + JST) / 86400000) * 86400000 - JST).toISOString();
  const supabase = createServerSupabaseClient();

  const excludedUsers = await prisma.user.findMany({
    where: { OR: [{ role: "ADMIN" }, ...EXCLUDED_ACCOUNT_NAMES.map((name) => ({ name: { equals: name, mode: "insensitive" as const } }))] },
    select: { id: true },
  }).catch(() => [] as { id: string }[]);
  const excludedUserIds = new Set(excludedUsers.map((u) => u.id));

  // 今日作られたアプリ
  const excludedAppIds = new Set<string>();
  let appsCreated = 0;
  const { data: apps } = await supabase
    .from("apps")
    .select("id, creator_id, creator_name")
    .gte("created_at", since)
    .limit(5000);
  for (const a of (apps ?? []) as { id: string; creator_id: string | null; creator_name: string | null }[]) {
    if (a.creator_id && excludedUserIds.has(a.creator_id)) { excludedAppIds.add(a.id); continue; }
    if (a.creator_name !== OFFICIAL_CREATOR_NAME) appsCreated++;
  }
  // 運営・本人が前に作ったアプリを開いた記録も除くため、その人のアプリをすべて集める
  if (excludedUserIds.size) {
    const { data: own } = await supabase.from("apps").select("id").in("creator_id", [...excludedUserIds]).limit(10000);
    for (const a of (own ?? []) as { id: string }[]) excludedAppIds.add(a.id);
  }

  // 今日のアクセス（Supabase は1回に1000件までなので1000件ずつ読む）
  type Ev = { name: string; session_id: string | null; props: Record<string, unknown> | null };
  const evs: Ev[] = [];
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("name, session_id, props")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error || !data?.length) break;
    evs.push(...(data as Ev[]));
    if (data.length < 1000) break;
  }
  const views = filterExcludedEvents(evs, excludedAppIds).filter((e) => e.name === "page_view");
  const visits = new Set(views.map((e) => e.session_id).filter(Boolean)).size;

  return NextResponse.json({ since, appsCreated, pageViews: views.length, visits });
}
