import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * 運営画面「あきらめたプロンプト」：開発スタジオでプロンプトを貼ったまま、アプリにならなかったもの。
 * 本人が頼んだもの（requested）と、そのあと自分でアプリにできていないものを出す。
 * 表がまだないとき（scripts/add-claim-and-stuck-prompts.sql の実行前）は ready: false
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("studio_stuck_prompts")
    .select("id, user_id, email, name, prompt, locale, requested, resolved, status, app_id, emailed_at, created_at")
    .neq("status", "skipped")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ ready: false, items: [] });
  // そのあと自分でアプリにできたもの（頼んでいないもの）は出さない。作成済み・送信済みは残す
  const items = (data ?? []).filter((r) => r.requested || !r.resolved || r.status !== "open");
  return NextResponse.json({ ready: true, items });
}
