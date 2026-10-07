import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { combineAppCode } from "@/lib/admin/code-file";

/**
 * GET /api/apps/[id]/remix — 「このアプリをもとに作る」用に、コードを渡す
 * - コードを公開している、公開中のスタジオアプリだけ（有料のアプリは対象外）
 * - 開発スタジオと同じく、ログインしていなくても使える
 * - ?check=1 のときは、使えるかどうかとアプリ名だけを返す（モーダルでボタンを出すかの判定用）
 * 元のアプリには何も書き込まない（スタジオでは新しいアプリとして扱う）
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checkOnly = new URL(request.url).searchParams.get("check") === "1";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ available: false });

  const supabase = createServerSupabaseClient();
  const { data: app } = await supabase
    .from("apps")
    .select(checkOnly ? "id, title, status, code_public, is_playground_app" : "id, title, status, code_public, is_playground_app, html_code, css_code, js_code")
    .eq("id", id)
    .maybeSingle();
  const row = app as { title: string; status: string; code_public: boolean | null; is_playground_app: boolean | null; html_code?: string | null; css_code?: string | null; js_code?: string | null } | null;

  const available = !!row && row.status === "active" && !!row.code_public && !!row.is_playground_app;
  if (!available) return NextResponse.json({ available: false });
  if (checkOnly) return NextResponse.json({ available: true, title: row.title });

  const html = combineAppCode(row.html_code ?? "", row.css_code ?? "", row.js_code ?? "");
  if (!html.trim()) return NextResponse.json({ available: false });
  return NextResponse.json({ available: true, title: row.title, html_code: html });
}
