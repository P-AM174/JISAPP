import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const supabase = createServerSupabaseClient();

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

const LIBRARY_KEY = "__in_library__";

/** ライブラリ一覧取得: GET /api/library */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("app_user_data")
    .select("app_id, data_value, updated_at")
    .eq("user_id", userId)
    .eq("data_key", LIBRARY_KEY)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    library: (data ?? []).map((r) => {
      let extra: Record<string, unknown> = {};
      if (r.data_value) {
        try { extra = JSON.parse(r.data_value); } catch { /* noop */ }
      }
      return { appId: r.app_id, addedAt: r.updated_at, ...extra };
    }),
  });
}

/** ライブラリに追加: POST /api/library */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: { appId?: string; name?: string; category?: string; gradient?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { appId, name, category, gradient } = body;
  if (!appId) {
    return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  }

  const { error } = await supabase.from("app_user_data").upsert(
    {
      user_id: userId,
      app_id: appId,
      data_key: LIBRARY_KEY,
      data_value: JSON.stringify({ name, category, gradient, addedAt: new Date().toISOString() }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,app_id,data_key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** ライブラリから削除: DELETE /api/library?appId=xxx */
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("appId");
  if (!appId) {
    return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  }

  const { error } = await supabase
    .from("app_user_data")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("data_key", LIBRARY_KEY);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
