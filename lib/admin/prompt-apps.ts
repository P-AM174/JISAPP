import type { SupabaseClient } from "@supabase/supabase-js";
import { PROMPT_MARKERS } from "@/lib/playground/code-cleanup";

/**
 * コードではなくプロンプト（AIに送る文章）が入っているアプリの id を探す（運営画面の札と絞り込み用）。
 * コード全体を読み込むと重いので、データベース側の絞り込みだけで判定する：
 *  - HTML のタグ（「<」）がひとつもない
 *  - ジサップのプロンプトの目印が入っていて、<!DOCTYPE html> も <html も入っていない
 * 画面側の判定（looksLikePrompt）とほぼ同じ結果になる
 */
export async function findPromptAppIds(client: SupabaseClient): Promise<Set<string>> {
  const ids = new Set<string>();
  const base = () => client.from("apps").select("id").eq("is_playground_app", true).neq("status", "deleted");
  try {
    const queries = [
      base().not("html_code", "ilike", "%<%"),
      ...PROMPT_MARKERS.map((m) =>
        base().ilike("html_code", `%${m}%`).not("html_code", "ilike", "%<!doctype html%").not("html_code", "ilike", "%<html%")
      ),
    ];
    const results = await Promise.all(queries);
    for (const { data } of results) for (const row of (data ?? []) as { id: string }[]) ids.add(row.id);
  } catch {
    /* 判定できなくても一覧は出す */
  }
  return ids;
}
