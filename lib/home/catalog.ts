import { supabase } from "@/lib/supabase";
import { getStampCounts } from "@/lib/stamp-counts";

export type PopularCreator = {
  name: string;
  appCount: number;
  totalStamps: number;
  topApp: { id: string; title: string; category: string | null } | null;
};

export type CatalogApp = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  creator_name: string | null;
  created_at: string;
  stamp_count?: number;
};

async function fetchActiveApps(limit = 200): Promise<CatalogApp[]> {
  try {
    let query = supabase
      .from("apps")
      .select("id, title, description, category, creator_name, creator_id, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    try {
      query = query.eq("is_listed", true);
    } catch {
      /* is_listed 未作成時はスキップ */
    }

    const { data, error } = await query;
    if (error) {
      const { data: fallback } = await supabase
        .from("apps")
        .select("id, title, description, category, creator_name, creator_id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(Math.min(limit, 50));
      return fallback ?? [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCatalogApps(limit = 100): Promise<CatalogApp[]> {
  const apps = await fetchActiveApps(Math.max(limit, 200));
  const stampCounts = await getStampCounts(apps.map((a) => a.id));
  return apps
    .map((app) => ({ ...app, stamp_count: stampCounts[app.id] ?? 0 }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function getPopularApps(limit = 50): Promise<CatalogApp[]> {
  const apps = await fetchActiveApps(Math.max(limit, 200));
  if (apps.length === 0) return [];

  const stampCounts = await getStampCounts(apps.map((a) => a.id));
  return apps
    .map((app) => ({ ...app, stamp_count: stampCounts[app.id] ?? 0 }))
    .sort((a, b) => (b.stamp_count ?? 0) - (a.stamp_count ?? 0))
    .slice(0, limit);
}

export async function getPopularMonthApps(limit = 5): Promise<CatalogApp[]> {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from("apps")
      .select("id, title, description, category, creator_name, creator_id, created_at")
      .eq("status", "active")
      .gte("created_at", firstDay)
      .order("created_at", { ascending: false })
      .limit(50);

    const source =
      error || !data || data.length === 0
        ? await fetchActiveApps(20)
        : data;

    const stampCounts = await getStampCounts(source.map((a) => a.id));
    return source
      .map((app) => ({ ...app, stamp_count: stampCounts[app.id] ?? 0 }))
      .sort((a, b) => (b.stamp_count ?? 0) - (a.stamp_count ?? 0))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getPopularCreators(): Promise<PopularCreator[]> {
  try {
    const data = await fetchActiveApps(200);
    if (data.length === 0) return [];

    const stampCounts = await getStampCounts(data.map((a) => a.id));
    const creatorMap = new Map<
      string,
      { appCount: number; totalStamps: number; topApp: CatalogApp | null }
    >();

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
          topApp:
            stamps > (stampCounts[existing.topApp?.id ?? ""] ?? 0)
              ? app
              : existing.topApp,
        });
      }
    }

    return Array.from(creatorMap.entries())
      .map(([name, val]) => ({
        name,
        appCount: val.appCount,
        totalStamps: val.totalStamps,
        topApp: val.topApp
          ? {
              id: val.topApp.id,
              title: val.topApp.title,
              category: val.topApp.category,
            }
          : null,
      }))
      .sort((a, b) => {
        const scoreA = a.totalStamps * 3 + a.appCount;
        const scoreB = b.totalStamps * 3 + b.appCount;
        return scoreB - scoreA;
      })
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function getAppsByCategory(categoryId: string, limit = 100): Promise<CatalogApp[]> {
  const apps = await fetchActiveApps(Math.max(limit, 200));
  const filtered = apps.filter((app) => app.category === categoryId);
  const stampCounts = await getStampCounts(filtered.map((a) => a.id));
  return filtered
    .map((app) => ({ ...app, stamp_count: stampCounts[app.id] ?? 0 }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export type HomeCatalogData = {
  playgroundApps: CatalogApp[];
  popularMonth: CatalogApp[];
  popularCreators: PopularCreator[];
};

export async function getHomeCatalogData(): Promise<HomeCatalogData> {
  const [playgroundApps, popularMonth, popularCreators] = await Promise.all([
    getPopularApps(50),
    getPopularMonthApps(5),
    getPopularCreators(),
  ]);

  return { playgroundApps, popularMonth, popularCreators };
}
