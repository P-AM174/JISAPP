import type { createServerSupabaseClient } from "@/lib/supabase-server";

type Supabase = ReturnType<typeof createServerSupabaseClient>;

/** 運営画面に出す、アプリごとの使われ方 */
export type AdminAppStats = {
  /** 開かれた回数 */
  openCount: number;
  /** 一番最近開かれた日時 */
  lastOpenedAt: string | null;
  /** マイライブラリに入れている人数 */
  libraryUsers: number;
  /** データを保存している人数・合計バイト */
  dataUsers: number;
  dataBytes: number;
  /** グループの数・メンバーの合計・共有データの合計バイト */
  groupCount: number;
  groupMembers: number;
  groupBytes: number;
};

/**
 * アプリごとの使われ方をまとめて返す。
 * 開かれた回数は apps.open_count、保存データは admin_app_stats()（scripts/add-admin-app-stats.sql）。
 * どちらかがまだないときも、運営画面は壊さず 0 として出す（statsReady で分かる）。
 */
export async function getAdminAppStats(
  supabase: Supabase,
  appIds: string[]
): Promise<{ stats: Record<string, AdminAppStats>; statsReady: boolean }> {
  const stats: Record<string, AdminAppStats> = {};
  for (const id of appIds) {
    stats[id] = { openCount: 0, lastOpenedAt: null, libraryUsers: 0, dataUsers: 0, dataBytes: 0, groupCount: 0, groupMembers: 0, groupBytes: 0 };
  }
  if (appIds.length === 0) return { stats, statsReady: true };

  // 開かれた回数・最近開かれた日時（回数の列がないときは日時だけ）
  // （アプリが多いと ID の一覧が URL に入りきらないので、スタジオのアプリをまとめて読む）
  const appsQuery = (cols: string) => supabase.from("apps").select(cols).eq("is_playground_app", true).neq("status", "deleted");
  const withCount = await appsQuery("id, open_count, last_accessed_at");
  const rows = withCount.error ? (await appsQuery("id, last_accessed_at")).data ?? [] : withCount.data ?? [];
  for (const row of rows as unknown as { id: string; open_count?: number | null; last_accessed_at: string | null }[]) {
    const s = stats[row.id];
    if (!s) continue;
    s.openCount = row.open_count ?? 0;
    s.lastOpenedAt = row.last_accessed_at ?? null;
  }

  // 保存データ・グループ
  let statsReady = true;
  try {
    const { data, error } = await supabase.rpc("admin_app_stats");
    if (error) statsReady = false;
    for (const r of (data ?? []) as {
      app_id: string;
      library_users: number;
      data_users: number;
      data_bytes: number;
      group_count: number;
      group_members: number;
      group_bytes: number;
    }[]) {
      const s = stats[r.app_id];
      if (!s) continue;
      s.libraryUsers = Number(r.library_users) || 0;
      s.dataUsers = Number(r.data_users) || 0;
      s.dataBytes = Number(r.data_bytes) || 0;
      s.groupCount = Number(r.group_count) || 0;
      s.groupMembers = Number(r.group_members) || 0;
      s.groupBytes = Number(r.group_bytes) || 0;
    }
  } catch {
    statsReady = false;
  }
  return { stats, statsReady };
}
