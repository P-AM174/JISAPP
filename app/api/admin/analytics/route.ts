import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { classifySource, type TrafficSource } from "@/lib/analytics/sources";
import { summarizeEngagement } from '@/lib/analytics/engagement-summary';
import { summarizeGoal, type CreatedApp } from '@/lib/analytics/retention';
import { OFFICIAL_CREATOR_NAME } from '@/lib/agent/official-creator';
import { prisma } from '@/lib/db';
import { EXCLUDED_ACCOUNT_NAMES, filterExcludedEvents } from '@/lib/analytics/excluded';

/** 運営画面用：計測の集計（継続利用・アプリ作成数・2つ目のアプリ、イベント × 言語 × 流入元） */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  const days = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("days") ?? "30") || 30, 1), 365);
  const supabase = createServerSupabaseClient();
  const summary = await supabase.rpc("analytics_summary", { p_days: days });
  if (summary.error) {
    return NextResponse.json(
      {
        error:
          "計測の表がまだありません。Supabase の SQL Editor で scripts/add-analytics-events.sql を実行してください",
        detail: summary.error?.message,
      },
      { status: 503 }
    );
  }
  // 作成数の「1週間前との比較」には15日分の記録が要るので、期間が短いときも15日分は読む（継続利用は期間の中だけで数える）
  const periodSince = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const since = new Date(Date.now() - Math.max(days, 15) * 24 * 60 * 60 * 1000).toISOString();
  type Ev = {
    name: string;
    locale: string | null;
    created_at: string;
    session_id: string | null;
    country: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    props: ({ ref?: string; ok?: boolean; issue?: string } & Record<string, unknown>) | null;
  };
  // Supabase は1回に1000件までしか返さないので、1000件ずつ読む（最大10万件）。
  // 以前は1回で読んでいたため、1000件を超えると国別の訪問・貼り付けの内訳が途中で切れていた
  const evs: Ev[] = [];
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("name, locale, created_at, session_id, country, utm_source, utm_medium, props")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error || !data?.length) break;
    evs.push(...(data as Ev[]));
    if (data.length < 1000) break;
  }

  // 運営・本人（lib/analytics/excluded.ts）のアカウント。この人が作ったアプリと、その人のブラウザの記録は、どの数にも入れない
  const excludedUsers = await prisma.user.findMany({
    where: { OR: [{ role: "ADMIN" }, ...EXCLUDED_ACCOUNT_NAMES.map((name) => ({ name: { equals: name, mode: "insensitive" as const } }))] },
    select: { id: true },
  }).catch(() => [] as { id: string }[]);
  const excludedUserIds = new Set(excludedUsers.map((u) => u.id));
  const excludedAppIds = new Set<string>();
  // アプリの作成数・2つ目のアプリ（apps 表。公式のアプリは除く。消されたアプリは数えられない）
  const apps: CreatedApp[] = [];
  for (let from = 0; from < 200000; from += 1000) {
    const { data, error } = await supabase
      .from("apps")
      .select("id, created_at, creator_id, creator_name")
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error || !data?.length) break;
    for (const a of data as { id: string; created_at: string; creator_id: string | null; creator_name: string | null }[]) {
      // 運営・本人のアカウントで作ったアプリは数えない（そのアプリの記録も下で除く）
      if (a.creator_id && excludedUserIds.has(a.creator_id)) { excludedAppIds.add(a.id); continue; }
      if (a.creator_name !== OFFICIAL_CREATOR_NAME) apps.push({ id: a.id, created_at: a.created_at, creator_id: a.creator_id });
    }
    if (data.length < 1000) break;
  }
  const allEvs = filterExcludedEvents(evs, excludedAppIds);
  const periodEvs = allEvs.filter((e) => new Date(e.created_at).getTime() >= new Date(periodSince).getTime());
  // 開発スタジオの貼り付けの内訳（動いた・さっきのプロンプト・文章・途中で切れた）
  const pasteBreakdown: Record<string, number> = {};
  for (const r of periodEvs) {
    if (r.name !== "studio_paste") continue;
    // 内訳を数え始める前の記録は「動いた／動かなかった」だけ
    const k = r.props?.issue ?? (r.props?.ok ? "none" : "unknown");
    pasteBreakdown[k] = (pasteBreakdown[k] ?? 0) + 1;
  }
  // 国別の訪問
  const byCountry = new Map<string, { views: number; sessions: Set<string> }>();
  for (const r of periodEvs) {
    if (r.name !== "page_view") continue;
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

  // どこから来たか：訪問（セッション）ごとに、最初のイベントの utm と参照元で決め、その訪問で貼り付け・公開・登録まで進んだかを数える
  const visits = new Map<string, { source: TrafficSource; day: string; paste: boolean; publish: boolean; signup: boolean }>();
  for (const e of periodEvs) {
    if (!e.session_id) continue;
    let v = visits.get(e.session_id);
    if (!v) {
      v = {
        source: classifySource({ utmSource: e.utm_source, utmMedium: e.utm_medium, ref: e.props?.ref }),
        // 日本時間の日付
        day: new Date(new Date(e.created_at).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10),
        paste: false,
        publish: false,
        signup: false,
      };
      visits.set(e.session_id, v);
    } else if (v.source.kind === "direct" && e.props?.ref) {
      // 最初のイベントが計測の前に送られた場合に備え、あとのページ表示の参照元でも決め直す
      v.source = classifySource({ utmSource: e.utm_source, utmMedium: e.utm_medium, ref: e.props.ref });
    }
    if (e.name === "studio_paste") v.paste = true;
    if (e.name === "publish") v.publish = true;
    if (e.name === "signup") v.signup = true;
  }
  const bySource = new Map<string, { name: string; kind: string; visits: number; paste: number; publish: number; signup: number }>();
  const aiDaily = new Map<string, Record<string, number>>();
  for (const v of visits.values()) {
    const s = bySource.get(v.source.name) ?? { name: v.source.name, kind: v.source.kind, visits: 0, paste: 0, publish: 0, signup: 0 };
    s.visits++;
    if (v.paste) s.paste++;
    if (v.publish) s.publish++;
    if (v.signup) s.signup++;
    bySource.set(v.source.name, s);
    if (v.source.kind === "ai") {
      const d = aiDaily.get(v.day) ?? {};
      d[v.source.name] = (d[v.source.name] ?? 0) + 1;
      aiDaily.set(v.day, d);
    }
  }
  const sources = [...bySource.values()].sort((a, b) => b.visits - a.visits);
  const aiByDay = [...aiDaily.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([day, counts]) => ({ day, counts }));

  const engagement = summarizeEngagement(periodEvs.filter(e=>e.name==='engagement'));

  // 今月の目標（継続利用など）：全体・日本語版・英語版
  const goal = summarizeGoal({ events: allEvs, apps, periodDays: days });

  // 利用の流れ（イベント × 言語 × 流入元）：運営・本人を除いたあとの記録から数える
  const funnel = new Map<string, { name: string; locale: string; utm_source: string; events: number; sessions: Set<string> }>();
  for (const e of periodEvs) {
    const key = `${e.name}|${e.locale ?? "-"}|${e.utm_source ?? "-"}`;
    const row = funnel.get(key) ?? { name: e.name, locale: e.locale ?? "-", utm_source: e.utm_source ?? "-", events: 0, sessions: new Set<string>() };
    row.events++;
    if (e.session_id) row.sessions.add(e.session_id);
    funnel.set(key, row);
  }
  const summaryRows = [...funnel.values()].map((r) => ({ name: r.name, locale: r.locale, utm_source: r.utm_source, events: r.events, sessions: r.sessions.size }));

  return NextResponse.json({ days, excludedAccounts: excludedUserIds.size, summary: summaryRows, pasteBreakdown, countries, sources, aiByDay, engagement, goal });
}
