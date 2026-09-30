import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { APP_DATA_LIMITS } from "@/lib/app-data-limits";

/** 自分の保存容量（全アプリ分・圧縮後）: GET /api/app-data/usage */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  // 除くキーを指定しない（存在しないキー名を渡す）ことで、合計そのものを出す
  const { data, error } = await createServerSupabaseClient().rpc("app_user_data_bytes", {
    p_user_id: userId,
    p_app_id: "",
    p_data_key: "",
  });
  if (error) {
    // 集計用の SQL（scripts/add-app-data-limits.sql）がまだ無いとき
    return NextResponse.json({ available: false, limitBytes: APP_DATA_LIMITS.userBytes });
  }
  return NextResponse.json({
    available: true,
    usedBytes: Number(data ?? 0),
    limitBytes: APP_DATA_LIMITS.userBytes,
    warnRatio: APP_DATA_LIMITS.warnRatio,
  });
}
