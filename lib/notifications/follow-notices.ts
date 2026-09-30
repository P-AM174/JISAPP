import { createServerSupabaseClient } from "@/lib/supabase-server";

/** タイトルから「何人目か」を読み取る（まとめた通知を数え直すため） */
function countFromTitle(title: string): number {
  const m = title.match(/(\d+)人にフォローされました$/);
  return m ? Number(m[1]) : 1;
}

/**
 * フォローされたことを作者に知らせる（ベルマーク）。
 * 作者がまだ読んでいないフォローの通知があれば、新しく作らずに人数をまとめて1つにする
 */
export async function notifyFollowed(params: {
  creatorUserId: string;
  creatorName: string;
  followerName: string | null;
}): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    const who = params.followerName?.trim() || "ジサップのユーザー";
    const href = `/creators/${encodeURIComponent(params.creatorName)}`;

    const { data: unread } = await supabase
      .from("user_notifications")
      .select("id, title")
      .eq("user_id", params.creatorUserId)
      .eq("type", "follow")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const existing = unread?.[0];
    if (existing) {
      const count = countFromTitle(existing.title) + 1;
      await supabase
        .from("user_notifications")
        .update({
          title: `新しく${count}人にフォローされました`,
          body: `最新は ${who} さんです。`,
          href,
          // いちばん上に出るよう、日時を新しくする
          created_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("user_notifications").insert({
      user_id: params.creatorUserId,
      type: "follow",
      title: "新しくフォローされました",
      body: `${who} さんがあなたをフォローしました。`,
      href,
    });
  } catch {
    /* 通知の失敗でフォローを止めない */
  }
}
