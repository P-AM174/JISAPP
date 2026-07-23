import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const LIBRARY_KEY = "__in_library__";

async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

async function isAppInLibrary(userId: string, appId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("app_user_data")
    .select("data_value")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("data_key", LIBRARY_KEY)
    .maybeSingle();
  return !!data?.data_value;
}

/** GET /api/apps/[id]/code — 公開設定かつライブラリ登録済みユーザーのみ */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: app, error } = await supabase
    .from("apps")
    .select("id, title, html_code, css_code, js_code, code_public, status, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !app) {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  if (app.status !== "active") {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  if (!app.code_public) {
    return NextResponse.json(
      { error: "このアプリのソースコードは公開されていません", code_public: false },
      { status: 403 }
    );
  }

  const inLibrary = await isAppInLibrary(userId, id);
  if (!inLibrary) {
    return NextResponse.json(
      {
        error: "マイライブラリに追加するとソースコードを閲覧できます",
        in_library: false,
        code_public: true,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    title: app.title,
    html_code: app.html_code ?? "",
    css_code: app.css_code ?? "",
    js_code: app.js_code ?? "",
    code_public: true,
    in_library: true,
  });
}
