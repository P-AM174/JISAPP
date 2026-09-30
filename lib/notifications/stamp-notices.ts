import { createServerSupabaseClient } from "@/lib/supabase-server";

const STAMP_LABELS: Record<string, string> = {
  like: "いいね！",
  genius: "天才！",
  useful: "便利！",
  design: "デザインが好き！",
};

/** タイトルから「何件目か」を読み取る（まとめた通知を数え直すため） */
function countFromTitle(title: string): number {
  const m = title.match(/にスタンプが(\d+)件届きました$/);
  return m ? Number(m[1]) : 1;
}

/**
 * スタンプが押されたことを作者に知らせる（ベルマーク）。
 * 作者がまだ読んでいない同じアプリのスタンプ通知があれば、新しく作らずに件数をまとめて1つにする
 */
export async function notifyStampReceived(params: {
  appId: string;
  stamperId: string;
  stamperName: string | null;
  stampId: string;
}): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: app } = await supabase
      .from("apps")
      .select("title, creator_id, status")
      .eq("id", params.appId)
      .maybeSingle();
    // 作者がいない（ゲスト公開）・自分で押した・公開していないときは知らせない
    if (!app?.creator_id || app.creator_id === params.stamperId || app.status !== "active") return;

    const title = app.title || "アプリ";
    const who = params.stamperName?.trim() || "ジサップのユーザー";
    const stamp = STAMP_LABELS[params.stampId] ?? "スタンプ";
    const href = `/apps/${params.appId}`;

    const { data: unread } = await supabase
      .from("user_notifications")
      .select("id, title")
      .eq("user_id", app.creator_id)
      .eq("type", "stamp")
      .eq("href", href)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const existing = unread?.[0];
    if (existing) {
      const count = countFromTitle(existing.title) + 1;
      await supabase
        .from("user_notifications")
        .update({
          title: `「${title}」にスタンプが${count}件届きました`,
          body: `最新は ${who} さんの「${stamp}」です。`,
          // いちばん上に出るよう、日時を新しくする
          created_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("user_notifications").insert({
      user_id: app.creator_id,
      type: "stamp",
      title: `「${title}」にスタンプが届きました`,
      body: `${who} さんが「${stamp}」を押しました。`,
      href,
    });
  } catch {
    /* 通知の失敗でスタンプを止めない */
  }
}
