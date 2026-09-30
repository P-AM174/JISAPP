import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  APP_DATA_LIMITS,
  APP_DATA_LIMIT_MESSAGES,
  checkAppDataValue,
  isReservedDataKey,
  utf8Bytes,
  type AppDataLimitCode,
  type AppDataWarning,
} from "@/lib/app-data-limits";
import { decodeAppDataValue } from "@/lib/app-data-codec-server";
import { notifyStorageAlmostFull, notifyStorageFull } from "@/lib/notifications/storage-notices";

const supabase = createServerSupabaseClient();

const LIMIT_STATUS: Record<AppDataLimitCode, number> = {
  too_large: 413,
  media_not_allowed: 415,
  quota_exceeded: 507,
  reserved_key: 400,
  bad_data: 400,
};
function limitError(code: AppDataLimitCode) {
  return NextResponse.json({ error: APP_DATA_LIMIT_MESSAGES[code], code, logged_in: true }, { status: LIMIT_STATUS[code] });
}
const LIBRARY_KEY = "__in_library__";

async function isAppInLibrary(userId: string, appId: string): Promise<boolean> {
  const { data } = await supabase
    .from("app_user_data")
    .select("app_id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("data_key", LIBRARY_KEY)
    .maybeSingle();
  return !!data;
}

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
  // ジサップ自身の管理用のキーは、アプリからは読ませない
  if (isReservedDataKey(key)) {
    return NextResponse.json({ value: null, logged_in: true });
  }

  const inLibrary = await isAppInLibrary(userId, appId);
  if (!inLibrary) {
    return NextResponse.json({ value: null, logged_in: true, in_library: false });
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

  // 圧縮して保存したデータは、ここで元に戻して返す（ブラウザの対応状況に関係なく読めるように）
  const stored = (data?.data_value as string | null | undefined) ?? null;
  const value = decodeAppDataValue(stored);
  if (stored !== null && value === null) {
    // 「データなし」と返すと、アプリが空のデータで上書きしてしまうおそれがあるので、読み込みの失敗にする
    console.error("[app-data GET] 圧縮データを元に戻せませんでした", { appId, key });
    return NextResponse.json({ error: "保存データを読み込めませんでした" }, { status: 500 });
  }
  return NextResponse.json({ value, logged_in: true, in_library: true });
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
  if (value != null && typeof value !== "string") {
    return NextResponse.json({ error: "不正なデータです" }, { status: 400 });
  }

  // ジサップ自身の管理用のキー（スタンプ・ライブラリ登録など）は、アプリからは書き換えさせない
  if (isReservedDataKey(key)) return limitError("reserved_key");

  // 1回の大きさ（圧縮したなら圧縮後）と、画像・動画でないか（圧縮を元に戻して）を確かめる
  const stored = value ?? "";
  const storedBytes = utf8Bytes(stored);
  const raw = decodeAppDataValue(stored);
  if (raw === null) return limitError(storedBytes > APP_DATA_LIMITS.valueBytes ? "too_large" : "bad_data");
  const problem = checkAppDataValue(raw, storedBytes);
  if (problem) return limitError(problem);

  const inLibrary = await isAppInLibrary(userId, appId);
  if (!inLibrary) {
    return NextResponse.json(
      {
        error: "マイライブラリに追加されたアプリのみ同期できます",
        logged_in: true,
        in_library: false,
      },
      { status: 403 }
    );
  }

  // 1人あたりの合計（今回上書きするキーを除いた分 ＋ 今回の値）
  const { data: usedBytes, error: usageError } = await supabase.rpc("app_user_data_bytes", {
    p_user_id: userId,
    p_app_id: appId,
    p_data_key: key,
  });
  const userTotal = usageError ? null : Number(usedBytes ?? 0) + storedBytes;
  if (usageError) {
    // 集計用の SQL（scripts/add-app-data-limits.sql）がまだ無いときは、保存は止めずに記録だけ残す
    console.error("[app-data POST] usage", usageError.message);
  } else if (userTotal !== null && userTotal > APP_DATA_LIMITS.userBytes) {
    await notifyStorageFull(userId);
    return limitError("quota_exceeded");
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

  // 上限の手前（8割）まで来ていたら、画面で知らせるための合図を返す
  const userAlmostFull = userTotal !== null && userTotal > APP_DATA_LIMITS.userBytes * APP_DATA_LIMITS.warnRatio;
  const warning: AppDataWarning | null =
    storedBytes > APP_DATA_LIMITS.valueBytes * APP_DATA_LIMITS.warnRatio ? "value" : userAlmostFull ? "user" : null;
  // 合計がもうすぐいっぱいなら、アプリを開いていなくても気づけるようベルマークにも届ける（30日に1回）
  if (userAlmostFull && userTotal !== null) await notifyStorageAlmostFull(userId, userTotal);

  return NextResponse.json({ ok: true, logged_in: true, in_library: true, warning });
}

/**
 * 自分がこのアプリに保存したデータを全部消す: DELETE /api/app-data?appId=xxx
 * スタンプ・ライブラリ登録など、ジサップ自身の記録（__ で始まるキー）は消さない
 */
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const appId = new URL(req.url).searchParams.get("appId");
  if (!appId) {
    return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  }

  const { data: rows, error: selectError } = await supabase
    .from("app_user_data")
    .select("data_key")
    .eq("user_id", userId)
    .eq("app_id", appId);
  if (selectError) {
    return NextResponse.json({ error: "保存データを消せませんでした" }, { status: 500 });
  }

  const keys = (rows ?? []).map((r) => r.data_key).filter((key) => !isReservedDataKey(key));
  if (keys.length > 0) {
    const { error } = await supabase
      .from("app_user_data")
      .delete()
      .eq("user_id", userId)
      .eq("app_id", appId)
      .in("data_key", keys);
    if (error) {
      return NextResponse.json({ error: "保存データを消せませんでした" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, deleted: keys.length });
}
