import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const MAX_CODE_BYTES = 512 * 1024; // 512KB

export async function POST(request: Request) {
  // コンテンツサイズ事前チェック
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "コードサイズが大きすぎます（最大512KB）" }, { status: 413 });
  }

  let body: {
    title?: string;
    description?: string;
    html_code?: string;
    css_code?: string;
    js_code?: string;
    creator_name?: string;
    category?: string;
    is_listed?: boolean;
    code_public?: boolean;
    project_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title || title.length > 100) {
    return NextResponse.json({ error: "タイトルは1〜100文字で入力してください" }, { status: 400 });
  }

  const html_code = (body.html_code ?? "").trim();
  if (!html_code) {
    return NextResponse.json({ error: "HTMLコードは必須です" }, { status: 400 });
  }
  if (Buffer.byteLength(html_code, "utf8") > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "コードサイズが大きすぎます（最大512KB）" }, { status: 413 });
  }

  // セッションからクリエイター名・IDを補完
  let sessionCreatorName: string | null = null;
  let sessionUserId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    sessionCreatorName = (session?.user as { name?: string })?.name ?? null;
    sessionUserId = (session?.user as { id?: string })?.id ?? null;
  } catch { /* noop */ }

  const creatorName = (body.creator_name ?? "").trim() || sessionCreatorName || "ゲスト";

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("apps")
    .insert({
      title,
      description: (body.description ?? "").trim() || null,
      html_code,
      css_code: body.css_code ?? null,
      js_code: body.js_code ?? null,
      creator_name: creatorName,
      creator_id: sessionUserId,
      category: body.category ?? null,
      is_listed: body.is_listed ?? true,
      code_public: body.code_public ?? false,
      is_playground_app: true,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[publish]", error);
    return NextResponse.json(
      { error: "保存に失敗しました: " + error.message },
      { status: 500 }
    );
  }

  // ログイン済みならマイプロジェクトにも登録
  if (sessionUserId) {
    const status = body.is_listed ? "listed" : "url_only";
    const projectRow = {
      user_id: sessionUserId,
      title,
      description: (body.description ?? "").trim() || null,
      html_code,
      css_code: body.css_code ?? null,
      js_code: body.js_code ?? null,
      app_id: data.id,
      status,
      is_listed: body.is_listed ?? true,
      category: body.category ?? null,
      updated_at: new Date().toISOString(),
    };

    if (body.project_id) {
      await supabase
        .from("user_projects")
        .update(projectRow)
        .eq("id", body.project_id)
        .eq("user_id", sessionUserId);
    } else {
      await supabase.from("user_projects").insert(projectRow);
    }
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
