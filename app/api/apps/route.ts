import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStampCounts } from "@/lib/stamp-counts";

/**
 * GET /api/apps
 * ?sort=popular  スタンプ数降順（デフォルト：新着順）
 * ?month=1       今月公開のみ
 * ?limit=N       取得件数（デフォルト50）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort  = searchParams.get("sort") ?? "new";
  const month = searchParams.get("month") === "1";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  try {
    let query = supabase
      .from("apps")
      .select("id, title, description, category, creator_name, created_at")
      .eq("status", "active")
      .limit(sort === "popular" ? 200 : limit); // 人気順の場合はより多く取得してから並び替え

    // is_listed フィルター
    try {
      query = query.eq("is_listed", true);
    } catch { /* カラム未存在の場合スキップ */ }

    // 今月フィルター
    if (month) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte("created_at", firstDay);
    }

    // 新着順の場合はここでソート
    if (sort !== "popular") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      // is_listed カラム未作成フォールバック
      const { data: fallback } = await supabase
        .from("apps")
        .select("id, title, description, category, creator_name, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      return NextResponse.json({ apps: fallback ?? [] });
    }

    const apps = data ?? [];

    // 人気順：スタンプ数を取得して並び替え
    if (sort === "popular" && apps.length > 0) {
      const stampCounts = await getStampCounts(apps.map(a => a.id));
      const ranked = apps
        .map(a => ({ ...a, stamp_count: stampCounts[a.id] ?? 0 }))
        .sort((a, b) => b.stamp_count - a.stamp_count)
        .slice(0, limit);
      return NextResponse.json({ apps: ranked });
    }

    // 新着順：スタンプ数も一緒に返す
    const stampCounts = await getStampCounts(apps.map(a => a.id));
    const withStamps = apps.map(a => ({ ...a, stamp_count: stampCounts[a.id] ?? 0 }));
    return NextResponse.json({ apps: withStamps });

  } catch {
    return NextResponse.json({ apps: [] });
  }
}
