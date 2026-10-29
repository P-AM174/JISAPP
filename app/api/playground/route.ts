import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * ログインしている人の id。ログインしていなければ null。x-user-id ヘッダーは信頼しない。
 *
 * 以前は、ログインしていない人を「ブラウザの種類＋言語」から作った印で見分けていた。
 * 同じ機種・同じ言語の人は同じ印になり、ほかの人の作りかけのコードが見えたり上書きされたりするので、
 * ログインしていない人の下書きはサーバーに置かない（ブラウザの中にだけ保存される）
 */
async function getUserKey(_request: Request): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string })?.id;
    if (id) return id;
  } catch { /* noop */ }
  return null;
}

export async function GET(request: Request) {
  const userId = await getUserKey(request);
  if (!userId) return NextResponse.json({ html_code: "", css_code: "", js_code: "", updatedAt: null });
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
  // ログインしていない人は、ブラウザの中にだけ保存する（サーバーには置かない）
  if (!userId) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
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
