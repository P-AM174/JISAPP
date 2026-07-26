import { supabase } from "@/lib/supabase";

const LIBRARY_KEY = "__in_library__";

/** アプリIDリストに対してマイライブラリ登録数を集計して返す */
export async function getLibraryCounts(appIds: string[]): Promise<Record<string, number>> {
  if (appIds.length === 0) return {};

  const { data } = await supabase
    .from("app_user_data")
    .select("app_id")
    .in("app_id", appIds)
    .eq("data_key", LIBRARY_KEY);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.app_id] = (counts[row.app_id] ?? 0) + 1;
  }
  return counts;
}
