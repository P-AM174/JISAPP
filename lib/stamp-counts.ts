import { supabase } from "@/lib/supabase";

/** アプリIDリストに対してスタンプ数を集計して返す */
export async function getStampCounts(appIds: string[]): Promise<Record<string, number>> {
  if (appIds.length === 0) return {};

  const { data } = await supabase
    .from("app_user_data")
    .select("app_id")
    .in("app_id", appIds)
    .like("data_key", "__stamp__%");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.app_id] = (counts[row.app_id] ?? 0) + 1;
  }
  return counts;
}
