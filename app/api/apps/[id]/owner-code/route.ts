import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * 所有者向け: 公開済みアプリの現行コードを返す（上書き公開前の保存先比較用）。
 * GET /api/apps/[id]/owner-code
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id?: string })?.id ?? null;
  } catch {
    /* noop */
  }

  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: app, error } = await supabase
    .from("apps")
    .select("id, creator_id, html_code, css_code, js_code, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !app || app.status !== "active") {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  if (app.creator_id && app.creator_id !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  return NextResponse.json({
    id: app.id,
    html_code: app.html_code ?? "",
    css_code: app.css_code ?? "",
    js_code: app.js_code ?? "",
  });
}
