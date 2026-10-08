import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * 運営画面「SNSで紹介したアプリ」
 * GET：今の並び（apps.sns_order の順）
 * PUT：{ ids: string[] } の順に並べ直す（ids にないアプリは外す）
 * 列がまだないとき（scripts/add-sns-featured.sql の実行前）は ready: false を返す
 */
type Row = { id: string; title: string; category: string | null; creator_name: string | null; app_number: number | null; sns_order: number | null };

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("apps")
    .select("id, title, category, creator_name, app_number, sns_order")
    .not("sns_order", "is", null)
    .neq("status", "deleted")
    .order("sns_order", { ascending: true });
  if (error) return NextResponse.json({ ready: false, apps: [] });
  return NextResponse.json({ ready: true, apps: (data ?? []) as Row[] });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((v): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)) : null;
  if (!ids) return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  if (new Set(ids).size !== ids.length) return NextResponse.json({ error: "同じアプリが2回入っています" }, { status: 400 });
  if (ids.length > 60) return NextResponse.json({ error: "60件までにしてください" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  // 今の一覧から外れたものを外す
  const { data: current, error } = await supabase.from("apps").select("id").not("sns_order", "is", null);
  if (error) return NextResponse.json({ error: "先に scripts/add-sns-featured.sql を実行してください" }, { status: 409 });
  const removed = (current ?? []).map((r) => r.id as string).filter((id) => !ids.includes(id));
  if (removed.length) {
    const { error: e } = await supabase.from("apps").update({ sns_order: null }).in("id", removed);
    if (e) return NextResponse.json({ error: "保存できませんでした: " + e.message }, { status: 500 });
  }
  for (let i = 0; i < ids.length; i++) {
    const { error: e } = await supabase.from("apps").update({ sns_order: i + 1 }).eq("id", ids[i]);
    if (e) return NextResponse.json({ error: "保存できませんでした: " + e.message }, { status: 500 });
  }
  console.info("[admin] sns featured updated", { count: ids.length, by: admin.userId ?? admin.via });
  return NextResponse.json({ ok: true });
}
