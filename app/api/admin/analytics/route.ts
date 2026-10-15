import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { classifySource, type TrafficSource } from "@/lib/analytics/sources";

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
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  type Ev = {
    name: string;
    created_at: string;
    session_id: string | null;
    country: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    props: { ref?: string; ok?: boolean; issue?: string } | null;
  };
  // Supabase は1回に1000件までしか返さないので、1000件ずつ読む（最大10万件）。
  // 以前は1回で読んでいたため、1000件を超えると国別の訪問・貼り付けの内訳が途中で切れていた
  const evs: Ev[] = [];
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("name, created_at, session_id, country, utm_source, utm_medium, props")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error || !data?.length) break;
    evs.push(...(data as Ev[]));
    if (data.length < 1000) break;
  }

  // 開発スタジオの貼り付けの内訳（動いた・さっきのプロンプト・文章・途中で切れた）
  const pasteBreakdown: Record<string, number> = {};
  for (const r of evs) {
    if (r.name !== "studio_paste") continue;
    // 内訳を数え始める前の記録は「動いた／動かなかった」だけ
    const k = r.props?.issue ?? (r.props?.ok ? "none" : "unknown");
    pasteBreakdown[k] = (pasteBreakdown[k] ?? 0) + 1;
  }
  // 国別の訪問
  const byCountry = new Map<string, { views: number; sessions: Set<string> }>();
  for (const r of evs) {
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
  for (const e of evs) {
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

  return NextResponse.json({ days, summary: summary.data ?? [], vnMonthly: vn.data ?? [], pasteBreakdown, countries, sources, aiByDay });
}
