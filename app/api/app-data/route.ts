import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// ユーザーIDを取得するヘルパー
async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

/** データ読み込み: GET /api/app-data?key=xxx&appId=xxx */
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ value: null, logged_in: false });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key")?.trim();
  const appId = searchParams.get("appId")?.trim();

  if (!key || !appId) {
    return NextResponse.json({ error: "key と appId が必要です" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("app_user_data")
    .select("data_value")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("data_key", key)
    .maybeSingle();

  if (error) {
    console.error("[app-data GET]", error);
    return NextResponse.json({ value: null, logged_in: true });
  }

  return NextResponse.json({ value: data?.data_value ?? null, logged_in: true });
}

/** データ保存: POST /api/app-data */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です", logged_in: false }, { status: 401 });
  }

  let body: { key?: string; value?: string; appId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { key, value, appId } = body;
  if (!key || !appId) {
    return NextResponse.json({ error: "key と appId が必要です" }, { status: 400 });
  }

  const { error } = await supabase
    .from("app_user_data")
    .upsert(
      {
        user_id: userId,
        app_id: appId,
        data_key: key,
        data_value: value ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,app_id,data_key" }
    );

  if (error) {
    console.error("[app-data POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, logged_in: true });
}
