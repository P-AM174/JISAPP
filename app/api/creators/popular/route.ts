import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStampCounts } from "@/lib/stamp-counts";

export type PopularCreator = {
  name: string;
  appCount: number;
  totalStamps: number;
  topApp: { id: string; title: string; category: string | null } | null;
};

/**
 * GET /api/creators/popular
 * アプリ公開数 × スタンプ数をもとにトップクリエイターを最大8件返す。
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("apps")
      .select("id, title, category, creator_name, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data) {
      return NextResponse.json({ creators: [] });
    }

    // スタンプ数を集計
    const stampCounts = await getStampCounts(data.map(a => a.id));

    // creator_name でグループ化
    const creatorMap = new Map<string, { appCount: number; totalStamps: number; topApp: typeof data[number] | null }>();

    for (const app of data) {
      const name = app.creator_name ?? "匿名";
      const stamps = stampCounts[app.id] ?? 0;
      const existing = creatorMap.get(name);
      if (!existing) {
        creatorMap.set(name, { appCount: 1, totalStamps: stamps, topApp: app });
      } else {
        creatorMap.set(name, {
          appCount: existing.appCount + 1,
          totalStamps: existing.totalStamps + stamps,
          // スタンプ数が多いアプリをトップアプリとして保持
          topApp: stamps > (stampCounts[existing.topApp?.id ?? ""] ?? 0) ? app : existing.topApp,
        });
      }
    }

    // スタンプ数 × アプリ数でスコアリング（スタンプ優先）
    const creators: PopularCreator[] = Array.from(creatorMap.entries())
      .map(([name, val]) => ({
        name,
        appCount: val.appCount,
        totalStamps: val.totalStamps,
        topApp: val.topApp ? { id: val.topApp.id, title: val.topApp.title, category: val.topApp.category } : null,
      }))
      .sort((a, b) => {
        // スタンプ数優先、同数ならアプリ数
        const scoreA = a.totalStamps * 3 + a.appCount;
        const scoreB = b.totalStamps * 3 + b.appCount;
        return scoreB - scoreA;
      })
      .slice(0, 8);

    return NextResponse.json({ creators });
  } catch {
    return NextResponse.json({ creators: [] });
  }
}
