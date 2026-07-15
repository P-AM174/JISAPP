import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const supabase = createServerSupabaseClient();

const REQUEST_KEY_PREFIX = "__request__";

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

/** リクエスト一覧取得: GET /api/apps/[id]/requests */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;

  const { data, error } = await supabase
    .from("app_user_data")
    .select("user_id, data_value, updated_at")
    .eq("app_id", appId)
    .like("data_key", `${REQUEST_KEY_PREFIX}%`)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests = (data ?? []).map(r => {
    try {
      const parsed = JSON.parse(r.data_value ?? "{}");
      return { message: parsed.message ?? "", createdAt: r.updated_at };
    } catch {
      return { message: r.data_value ?? "", createdAt: r.updated_at };
    }
  });

  return NextResponse.json({ requests });
}

/** リクエスト送信: POST /api/apps/[id]/requests */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "メッセージが空です" }, { status: 400 });
  }

  const userId = await getUserId();
  // 未ログインでも送信可（匿名IDとしてタイムスタンプを使用）
  const uid = userId ?? `anon_${Date.now()}`;
  const dataKey = `${REQUEST_KEY_PREFIX}${Date.now()}`;

  const { error } = await supabase.from("app_user_data").insert({
    user_id: uid,
    app_id: appId,
    data_key: dataKey,
    data_value: JSON.stringify({ message }),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    // テーブルがなくてもフロントにはエラーを返さない（graceful）
    console.error("request insert error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
