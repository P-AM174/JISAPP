import type { createServerSupabaseClient } from "@/lib/supabase-server";
import { decodeAppDataValue } from "@/lib/app-data-codec-server";

type Supabase = ReturnType<typeof createServerSupabaseClient>;

/**
 * アプリの保存データの履歴（scripts/add-app-data-history.sql）。
 * 上書き・削除の前の内容を取っておき、万一の事故（空の状態での上書きなど）のときに運営が戻せるようにする。
 * 表がまだないときやエラーのときも、保存そのものは止めない。
 */
const TABLE = "app_user_data_history";
const KEEP_DAYS = 30;
const KEEP_PER_KEY = 100;
/** 大きく減る上書き以外は、1つのデータにつき、この間隔に1回だけ残す */
const MIN_INTERVAL_MS = 60 * 60 * 1000;
/** これより小さいデータは「大きく減った」の判定に使わない（中身がほとんどないため） */
const SHRINK_MIN_CHARS = 1024;

const rawLength = (value: string | null | undefined) => (decodeAppDataValue(value ?? null) ?? value ?? "").length;

/** 上書きの前に呼ぶ。前の内容を必要に応じて履歴に残す */
export async function keepHistoryBeforeOverwrite(supabase: Supabase, userId: string, appId: string, key: string, nextValue: string | null): Promise<void> {
  try {
    const { data: cur } = await supabase
      .from("app_user_data")
      .select("data_value, updated_at")
      .eq("user_id", userId)
      .eq("app_id", appId)
      .eq("data_key", key)
      .maybeSingle();
    const prev = (cur?.data_value as string | null | undefined) ?? null;
    if (!prev || prev === nextValue) return;

    const before = rawLength(prev);
    const after = rawLength(nextValue);
    const shrink = before >= SHRINK_MIN_CHARS && after < before * 0.5;
    if (!shrink) {
      const { data: last } = await supabase
        .from(TABLE)
        .select("replaced_at")
        .eq("user_id", userId)
        .eq("app_id", appId)
        .eq("data_key", key)
        .order("replaced_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last && Date.now() - new Date(last.replaced_at as string).getTime() < MIN_INTERVAL_MS) return;
    }
    const { error } = await supabase.from(TABLE).insert({
      user_id: userId,
      app_id: appId,
      data_key: key,
      data_value: prev,
      saved_at: cur?.updated_at ?? null,
      reason: shrink ? "shrink" : "overwrite",
    });
    if (error) return;
    if (shrink) console.warn("[app-data] 保存データが大きく減る上書き（前の内容を履歴に残しました）", { userId, appId, key, before, after });
    await prune(supabase, userId, appId, key);
  } catch {
    /* 履歴が残せなくても、保存は止めない */
  }
}

/** ユーザーが自分で消すときに呼ぶ。消す前の内容を履歴に残す */
export async function keepHistoryBeforeDelete(supabase: Supabase, userId: string, appId: string, rows: { data_key: string; data_value: string | null; updated_at?: string | null }[]): Promise<void> {
  try {
    const items = rows.filter((r) => r.data_value).map((r) => ({
      user_id: userId,
      app_id: appId,
      data_key: r.data_key,
      data_value: r.data_value,
      saved_at: r.updated_at ?? null,
      reason: "delete",
    }));
    if (items.length) await supabase.from(TABLE).insert(items);
  } catch {
    /* noop */
  }
}

async function prune(supabase: Supabase, userId: string, appId: string, key: string) {
  const cutoff = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from(TABLE).delete().eq("user_id", userId).eq("app_id", appId).eq("data_key", key).lt("replaced_at", cutoff);
  const { data: extra } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("data_key", key)
    .order("replaced_at", { ascending: false })
    .range(KEEP_PER_KEY, KEEP_PER_KEY + 200);
  const ids = (extra ?? []).map((r) => r.id as number);
  if (ids.length) await supabase.from(TABLE).delete().in("id", ids);
}
