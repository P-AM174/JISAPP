import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * ひとりひとりがアプリを開いた記録と、ライブラリのピン留め（scripts/add-user-app-opens.sql）。
 * 表がまだないときも画面は壊さず、記録・ピン留めがされないだけにする。
 */

export type UserAppOpen = {
  openCount: number;
  lastOpenedAt: string | null;
  pinnedAt: string | null;
};

/** 開いた記録を残す。count が false なら回数は変えず、最後に開いた日時だけ更新する */
export async function recordUserAppOpen(userId: string, appId: string, count: boolean): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.rpc("record_user_app_open", { p_user_id: userId, p_app_id: appId, p_count: count });
  } catch {
    /* 記録失敗は本処理を止めない */
  }
}

/** 自分の記録を、アプリIDごとにまとめて返す */
export async function getUserAppOpens(userId: string, appIds: string[]): Promise<Map<string, UserAppOpen>> {
  const map = new Map<string, UserAppOpen>();
  if (appIds.length === 0) return map;
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("user_app_opens")
      .select("app_id, open_count, last_opened_at, pinned_at")
      .eq("user_id", userId)
      .in("app_id", appIds);
    if (error) return map;
    for (const row of data ?? []) {
      map.set(row.app_id, {
        openCount: row.open_count ?? 0,
        // ピン留めのためだけに作った行（まだ開いていない）は、開いた日時なしとして扱う
        lastOpenedAt: row.open_count > 0 ? (row.last_opened_at ?? null) : null,
        pinnedAt: row.pinned_at ?? null,
      });
    }
  } catch {
    /* 表がないときは空のまま */
  }
  return map;
}

/** ピン留めする・外す。成功したら true */
export async function setUserAppPinned(userId: string, appId: string, pinned: boolean): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const pinnedAt = pinned ? new Date().toISOString() : null;
  if (!pinned) {
    const { error } = await supabase
      .from("user_app_opens")
      .update({ pinned_at: null })
      .eq("user_id", userId)
      .eq("app_id", appId);
    return !error;
  }
  // まだ一度も開いていないアプリでもピン留めできるよう、行がなければ作る（回数・日時はそのまま）
  const { data: existing, error: selectError } = await supabase
    .from("user_app_opens")
    .select("app_id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();
  if (selectError) return false;
  if (existing) {
    const { error } = await supabase
      .from("user_app_opens")
      .update({ pinned_at: pinnedAt })
      .eq("user_id", userId)
      .eq("app_id", appId);
    return !error;
  }
  const { error } = await supabase
    .from("user_app_opens")
    .insert({ user_id: userId, app_id: appId, open_count: 0, pinned_at: pinnedAt });
  return !error;
}
