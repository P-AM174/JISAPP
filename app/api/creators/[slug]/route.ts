import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getStampCounts } from "@/lib/stamp-counts";

function decodeCreatorSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim();
  } catch {
    return slug.trim();
  }
}

function calcRating(totalStamps: number, appCount: number): number {
  if (appCount === 0) return 0;
  const base = 3.8 + Math.log10(totalStamps + 1) * 0.35;
  return Math.min(5, Math.round(base * 10) / 10);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const creatorName = decodeCreatorSlug(slug);

  if (!creatorName || creatorName === "匿名") {
    return NextResponse.json({ error: "クリエイターが見つかりません" }, { status: 404 });
  }

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("apps")
    .select("id, title, description, category, creator_name, created_at")
    .eq("status", "active")
    .eq("creator_name", creatorName)
    .order("created_at", { ascending: false });

  try {
    query = query.eq("is_listed", true);
  } catch {
    /* noop */
  }

  const { data: apps, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!apps || apps.length === 0) {
    return NextResponse.json({ error: "クリエイターが見つかりません" }, { status: 404 });
  }

  const stampCounts = await getStampCounts(apps.map((a) => a.id));
  const appsWithStamps = apps.map((app) => ({
    ...app,
    stamp_count: stampCounts[app.id] ?? 0,
  }));
  const totalStamps = appsWithStamps.reduce((sum, a) => sum + (a.stamp_count ?? 0), 0);

  return NextResponse.json({
    name: creatorName,
    apps: appsWithStamps,
    appCount: appsWithStamps.length,
    totalStamps,
    rating: calcRating(totalStamps, appsWithStamps.length),
  });
}
