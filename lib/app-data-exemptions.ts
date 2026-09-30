import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * 保存容量の上限をかけないアプリ・ユーザー（運営画面で設定。scripts/add-storage-limit-exemptions.sql）。
 * 表がまだないとき・読めないときは「上限あり」として扱う。
 */

export type ExemptionKind = "user" | "app";

/** このユーザー、またはこのアプリが、上限なしに設定されているか */
export async function isStorageLimitExempt(params: { userId?: string | null; appId?: string | null }): Promise<boolean> {
  const targets: { kind: ExemptionKind; id: string }[] = [];
  if (params.userId) targets.push({ kind: "user", id: params.userId });
  if (params.appId) targets.push({ kind: "app", id: params.appId });
  if (targets.length === 0) return false;
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("storage_limit_exemptions")
      .select("kind, target_id")
      .in("target_id", targets.map((t) => t.id));
    if (error) return false;
    return (data ?? []).some((row) => targets.some((t) => t.kind === row.kind && t.id === row.target_id));
  } catch {
    return false;
  }
}

/** 運営画面用：上限なしの一覧 */
export async function listStorageLimitExemptions(): Promise<{ kind: ExemptionKind; targetId: string }[] | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("storage_limit_exemptions").select("kind, target_id");
  if (error) return null;
  return (data ?? []).map((row) => ({ kind: row.kind as ExemptionKind, targetId: row.target_id as string }));
}

/** 運営画面用：上限なしにする・戻す */
export async function setStorageLimitExempt(kind: ExemptionKind, targetId: string, exempt: boolean): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  if (exempt) {
    const { error } = await supabase
      .from("storage_limit_exemptions")
      .upsert({ kind, target_id: targetId }, { onConflict: "kind,target_id" });
    return !error;
  }
  const { error } = await supabase.from("storage_limit_exemptions").delete().eq("kind", kind).eq("target_id", targetId);
  return !error;
}
