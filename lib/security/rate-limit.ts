/**
 * 回数の制限（ログインの総当たり・確認コードの当てずっぽう・メールの送りすぎを止める）。
 *
 * 数はデータベース（security_rate_limits）に残すので、サーバーが何台に分かれていても同じ数で数えられる。
 * テーブルがまだない・読めないときは、そのサーバーの中だけで数える（止めすぎて誰も入れなくならないように）。
 */
import { createServerSupabaseClient } from "@/lib/supabase-server";

type Entry = { count: number; resetAt: number };
const memory = new Map<string, Entry>();

function memoryGet(key: string): Entry | null {
  const e = memory.get(key);
  if (!e) return null;
  if (e.resetAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return e;
}

async function dbGet(key: string): Promise<Entry | null | undefined> {
  try {
    const { data, error } = await createServerSupabaseClient()
      .from("security_rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();
    if (error) return undefined;
    if (!data) return null;
    const resetAt = new Date(data.reset_at as string).getTime();
    if (resetAt <= Date.now()) return null;
    return { count: Number(data.count) || 0, resetAt };
  } catch {
    return undefined;
  }
}

/** いまの数（期限切れなら 0） */
async function current(key: string): Promise<Entry | null> {
  const fromDb = await dbGet(key);
  if (fromDb !== undefined) return fromDb;
  return memoryGet(key);
}

/** 上限に届いているか（届いていれば、あと何秒で解けるか） */
export async function isLimited(key: string, max: number): Promise<{ limited: boolean; retryAfterSec: number }> {
  const e = await current(key);
  if (!e || e.count < max) return { limited: false, retryAfterSec: 0 };
  return { limited: true, retryAfterSec: Math.max(1, Math.ceil((e.resetAt - Date.now()) / 1000)) };
}

/** 1回数える（windowSec 秒たつと数は 0 に戻る） */
export async function countHit(key: string, windowSec: number): Promise<void> {
  const now = Date.now();
  const prev = await current(key);
  const next: Entry = prev ? { count: prev.count + 1, resetAt: prev.resetAt } : { count: 1, resetAt: now + windowSec * 1000 };
  memory.set(key, next);
  try {
    await createServerSupabaseClient()
      .from("security_rate_limits")
      .upsert({ key, count: next.count, reset_at: new Date(next.resetAt).toISOString() }, { onConflict: "key" });
  } catch {
    /* テーブルがないときは、このサーバーの中だけで数える */
  }
}

/** 数を消す（ログインに成功したときなど） */
export async function clearHits(key: string): Promise<void> {
  memory.delete(key);
  try {
    await createServerSupabaseClient().from("security_rate_limits").delete().eq("key", key);
  } catch {
    /* noop */
  }
}

/** 送り元の IP（Vercel では x-forwarded-for の先頭が本当の送り元） */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) return "unknown";
  const get = (name: string): string | undefined => {
    if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name) ?? undefined;
    const v = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(v) ? v[0] : v;
  };
  const xff = get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return get("x-real-ip")?.trim() || "unknown";
}

/** 「多すぎます」のときに返す文（英語・ベトナム語は lib/i18n/api-messages.ts と vi.json） */
export const TOO_MANY_ATTEMPTS = "試した回数が多すぎます。しばらく待ってから、もう一度試してください";
