import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * 作者のフォロー（scripts/add-creator-follows.sql）。
 * 表がまだないときは null を返し、呼び出し側は端末ごとの保存（localStorage）のまま動く。
 */

/** 自分がフォローしている作者の名前（フォローした順） */
export async function listFollowing(userId: string): Promise<string[] | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("creator_follows")
    .select("creator_name")
    .eq("follower_id", userId)
    .order("created_at", { ascending: true });
  if (error) return null;
  return (data ?? []).map((row) => row.creator_name as string);
}

/** 作者のフォロワー数 */
export async function countFollowers(creatorName: string): Promise<number | null> {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("creator_follows")
    // head: true だと、表がないときにエラーにならず 0 件と返ることがあるので、1件だけ読む形で数える
    .select("follower_id", { count: "exact" })
    .eq("creator_name", creatorName)
    .limit(1);
  if (error) return null;
  return count ?? 0;
}

/** フォローする・外す。新しくフォローしたときは added: true */
export async function setFollow(
  userId: string,
  creatorName: string,
  follow: boolean
): Promise<{ ok: boolean; added: boolean }> {
  const supabase = createServerSupabaseClient();
  if (!follow) {
    const { error } = await supabase
      .from("creator_follows")
      .delete()
      .eq("follower_id", userId)
      .eq("creator_name", creatorName);
    return { ok: !error, added: false };
  }
  const { data, error } = await supabase
    .from("creator_follows")
    .upsert({ follower_id: userId, creator_name: creatorName }, { onConflict: "follower_id,creator_name", ignoreDuplicates: true })
    .select("creator_name");
  // ignoreDuplicates のとき、すでにフォローしていた行は返ってこない
  return { ok: !error, added: !error && (data?.length ?? 0) > 0 };
}

/** 端末に残っていたフォローをまとめて移す（お知らせは送らない） */
export async function importFollows(userId: string, creatorNames: string[]): Promise<boolean> {
  const names = [...new Set(creatorNames.map((n) => n.trim()).filter(Boolean))].slice(0, 500);
  if (names.length === 0) return true;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("creator_follows")
    .upsert(
      names.map((creator_name) => ({ follower_id: userId, creator_name })),
      { onConflict: "follower_id,creator_name", ignoreDuplicates: true }
    );
  return !error;
}

/** 作者の名前から、その作者のユーザーID（お知らせを送る先）を探す */
export async function findCreatorUserId(creatorName: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("apps")
    .select("creator_id")
    .eq("creator_name", creatorName)
    .not("creator_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0]?.creator_id as string | undefined) ?? null;
}
