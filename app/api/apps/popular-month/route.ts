import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStampCounts } from "@/lib/stamp-counts";

/**
 * GET /api/apps/popular-month
 * 今月公開されたアプリを応援バッジ数（スタンプ数）順で最大5件返す。
 * スタンプが少ない場合は新着順で補完する。
 */
export async function GET() {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from("apps")
      .select("id, title, description, category, creator_name, created_at")
      .eq("status", "active")
      .gte("created_at", firstDay)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      // 今月公開がなければ全期間から新着5件
      const { data: all } = await supabase
        .from("apps")
        .select("id, title, description, category, creator_name, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      const apps = all ?? [];
      const stampCounts = await getStampCounts(apps.map(a => a.id));
      const ranked = apps
        .map(a => ({ ...a, stamp_count: stampCounts[a.id] ?? 0 }))
        .sort((a, b) => b.stamp_count - a.stamp_count)
        .slice(0, 5);

      return NextResponse.json({ apps: ranked, isAllTime: true });
    }

    const stampCounts = await getStampCounts(data.map(a => a.id));
    const ranked = data
      .map(a => ({ ...a, stamp_count: stampCounts[a.id] ?? 0 }))
      .sort((a, b) => b.stamp_count - a.stamp_count)
      .slice(0, 5);

    return NextResponse.json({ apps: ranked, isAllTime: false });
  } catch {
    return NextResponse.json({ apps: [], isAllTime: false });
  }
}
