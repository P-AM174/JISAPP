import type { SupabaseClient } from "@supabase/supabase-js";
import { usesSharedData } from "@/lib/groups/client";

/**
 * 一覧に出すアプリがグループ共有アプリかどうか（サーバー側）。
 * 公開時に作者が選んだ apps.group_sharing を使い、まだ選んでいない（NULL）アプリだけ
 * コードが Jisapp.shared を使っているかで判断する（全アプリのコードは読まない）。
 */
export async function resolveGroupSharing(
  client: SupabaseClient,
  rows: { id: string; group_sharing?: boolean | null }[]
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  const unknownIds: string[] = [];
  for (const row of rows) {
    if (typeof row.group_sharing === "boolean") result[row.id] = row.group_sharing;
    else unknownIds.push(row.id);
  }
  if (unknownIds.length === 0) return result;

  try {
    const { data } = await client.from("apps").select("id, html_code, js_code").in("id", unknownIds);
    for (const app of (data ?? []) as { id: string; html_code: string | null; js_code: string | null }[]) {
      result[app.id] = usesSharedData(`${app.html_code ?? ""}\n${app.js_code ?? ""}`);
    }
  } catch {
    /* 判断できないアプリはグループ共有アプリとして扱わない */
  }
  return result;
}
