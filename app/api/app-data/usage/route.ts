import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { APP_DATA_LIMITS, isReservedDataKey } from "@/lib/app-data-limits";

/**
 * 自分の保存容量（全アプリ分・圧縮後）: GET /api/app-data/usage
 * ?byApp=1 のときは、アプリごとの内訳（apps: { アプリID: バイト数 }）も返す。
 * 内訳はアプリが保存したデータだけを数える（スタンプ・ライブラリ登録などジサップ自身の記録は除く）
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  // 除くキーを指定しない（存在しないキー名を渡す）ことで、合計そのものを出す
  const { data, error } = await supabase.rpc("app_user_data_bytes", {
    p_user_id: userId,
    p_app_id: "",
    p_data_key: "",
  });
  if (error) {
    // 集計用の SQL（scripts/add-app-data-limits.sql）がまだ無いとき
    return NextResponse.json({ available: false, limitBytes: APP_DATA_LIMITS.userBytes });
  }

  let apps: Record<string, number> | undefined;
  if (new URL(req.url).searchParams.get("byApp") === "1") {
    const { data: rows, error: rowsError } = await supabase
      .from("app_user_data")
      .select("app_id, data_key, data_bytes")
      .eq("user_id", userId);
    if (!rowsError) {
      apps = {};
      for (const row of rows ?? []) {
        if (isReservedDataKey(row.data_key)) continue;
        apps[row.app_id] = (apps[row.app_id] ?? 0) + (row.data_bytes ?? 0);
      }
    }
  }

  return NextResponse.json({
    available: true,
    usedBytes: Number(data ?? 0),
    limitBytes: APP_DATA_LIMITS.userBytes,
    warnRatio: APP_DATA_LIMITS.warnRatio,
    apps,
  });
}
