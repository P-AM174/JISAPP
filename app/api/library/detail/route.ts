import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getLibraryCounts } from "@/lib/library-counts";

const STAMP_KEY_PREFIX = "__stamp__";

/**
 * マイライブラリの詳細シート用: GET /api/library/detail?appId=xxx
 * 作者・ライブラリ登録数・スタンプ数を返す（カードをタップしたときだけ読み込む）
 */
export async function GET(req: Request) {
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

  const appId = new URL(req.url).searchParams.get("appId");
  if (!appId) {
    return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const [{ data: app }, libraryCounts, { count: stampCount }] = await Promise.all([
    supabase
      .from("apps")
      .select("title, description, category, creator_name, status, admin_deleted")
      .eq("id", appId)
      .maybeSingle(),
    getLibraryCounts([appId]),
    supabase
      .from("app_user_data")
      .select("data_key", { count: "exact", head: true })
      .eq("app_id", appId)
      .eq("data_value", "true")
      .like("data_key", `${STAMP_KEY_PREFIX}%`),
  ]);

  if (!app || app.admin_deleted) {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({
    title: app.title,
    description: app.description ?? null,
    category: app.category ?? null,
    creatorName: app.creator_name ?? null,
    // 作者がアプリを削除していても、ライブラリに入れた人は保存された版を使い続けられる
    removedByCreator: app.status === "deleted",
    libraryCount: libraryCounts[appId] ?? 0,
    stampCount: stampCount ?? 0,
  });
}
