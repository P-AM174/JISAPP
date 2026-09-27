import { createServerSupabaseClient } from "@/lib/supabase-server";

/** アプリへのアクセスを記録（開かれた回数と、ゲストURL削除判定用の最終アクセス日時） */
export async function touchAppLastAccessed(appId: string): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    // 開かれた回数を数える（最終アクセス日時も一緒に更新される）
    const { error } = await supabase.rpc("increment_app_open_count", { p_app_id: appId });
    if (!error) return;
    // 回数の仕組みがまだないときは、最終アクセス日時だけ更新する
    await supabase
      .from("apps")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", appId)
      .eq("status", "active");
  } catch {
    /* 記録失敗は本処理を止めない */
  }
}

/** 未ログイン・URLのみ公開アプリのうち、2か月以上アクセスがないものを削除 */
export async function cleanupInactiveGuestUrlApps(): Promise<{ deleted: number; error?: string }> {
  const supabase = createServerSupabaseClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 2);

  const { data: targets, error: selectError } = await supabase
    .from("apps")
    .select("id, last_accessed_at, created_at")
    .is("creator_id", null)
    .eq("is_listed", false)
    .eq("status", "active");

  if (selectError) {
    return { deleted: 0, error: selectError.message };
  }

  const ids = (targets ?? [])
    .filter((app) => {
      const last = app.last_accessed_at ?? app.created_at;
      if (!last) return false;
      return new Date(last).getTime() < cutoff.getTime();
    })
    .map((app) => app.id);

  if (ids.length === 0) return { deleted: 0 };

  const { error: deleteError } = await supabase.from("apps").delete().in("id", ids);

  if (deleteError) {
    return { deleted: 0, error: deleteError.message };
  }

  return { deleted: ids.length };
}
