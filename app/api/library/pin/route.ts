import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { setUserAppPinned } from "@/lib/apps/user-opens";

const LIBRARY_KEY = "__in_library__";

/** ライブラリのアプリをピン留めする・外す: POST /api/library/pin  body: { appId, pinned } */
export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id?: string })?.id ?? null;
  } catch {
    /* 未ログインとして扱う */
  }
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { appId?: string; pinned?: boolean } | null;
  if (!body?.appId || typeof body.pinned !== "boolean") {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  // ピン留めできるのは、ライブラリに入っているアプリだけ
  if (body.pinned) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("app_user_data")
      .select("app_id")
      .eq("user_id", userId)
      .eq("app_id", body.appId)
      .eq("data_key", LIBRARY_KEY)
      .maybeSingle();
    if (!data) {
      return NextResponse.json({ error: "ライブラリに入っているアプリだけピン留めできます" }, { status: 400 });
    }
  }

  const ok = await setUserAppPinned(userId, body.appId, body.pinned);
  if (!ok) {
    return NextResponse.json({ error: "ピン留めを保存できませんでした" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pinned: body.pinned });
}
