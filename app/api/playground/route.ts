import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * セッションから安全にユーザーキーを取得する。
 * ログイン済みなら userId、未ログインなら "guest" を返す。
 * x-user-id ヘッダーは信頼しない。
 */
async function getUserKey(request: Request): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string })?.id;
    if (id) return id;
  } catch { /* noop */ }

  // フォールバック: User-Agent + Accept-Language でゲストキーを生成
  // （完全な一意性は保証しないが、ヘッダー偽装は防ぐ）
  const ua = request.headers.get("user-agent") ?? "unknown";
  const lang = request.headers.get("accept-language") ?? "";
  // 簡易ハッシュ（セキュリティよりも一意性確保が目的）
  let hash = 0;
  for (const ch of ua + lang) {
    hash = (hash * 31 + ch.charCodeAt(0)) & 0xfffffff;
  }
  return `guest_${hash.toString(16)}`;
}

export async function GET(request: Request) {
  const userId = await getUserKey(request);
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("playground_drafts")
    .select("html_code, css_code, js_code, updated_at")
    .eq("user_key", userId)
    .maybeSingle();

  if (error) {
    console.error("[playground GET]", error);
    return NextResponse.json({ html_code: "", css_code: "", js_code: "" });
  }

  return NextResponse.json({
    html_code: data?.html_code ?? "",
    css_code: data?.css_code ?? "",
    js_code: data?.js_code ?? "",
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const userId = await getUserKey(request);
  const supabase = createServerSupabaseClient();

  let body: { html_code?: string; css_code?: string; js_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { error } = await supabase
    .from("playground_drafts")
    .upsert(
      {
        user_key: userId,
        html_code: body.html_code ?? "",
        css_code: body.css_code ?? "",
        js_code: body.js_code ?? "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_key" }
    );

  if (error) {
    console.error("[playground PUT]", error);
    return NextResponse.json({ error: "保存に失敗しました: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
