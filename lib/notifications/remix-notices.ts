import { createServerSupabaseClient } from "@/lib/supabase-server";

/** 件数入りの通知から「何件目か」を読み取る（まとめた通知を数え直すため） */
function countFromTitle(title: string): number {
  const m = title.match(/アプリが(\d+)件作られました！$/);
  return m ? Number(m[1]) : 1;
}

/**
 * 「このアプリをもとに作る」から新しいアプリが出品されたことを、もとのアプリの作者に知らせる（ベルマーク）。
 * 作るモチベーションが上がるよう、誰かの「作りたい」のきっかけになったことを伝える。
 * まだ読んでいない同じアプリの通知があれば、新しく作らずに件数をまとめて1つにする（そのときは、もとのアプリへ飛ぶ）
 */
export async function notifyRemixed(params: {
  sourceAppId: string;
  sourceTitle: string;
  sourceCreatorId: string;
  newAppId: string;
  newTitle: string;
  makerName: string;
}): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    const source = params.sourceTitle || "アプリ";
    const who = params.makerName.trim() || "ジサップのユーザー";

    const { data: unread } = await supabase
      .from("user_notifications")
      .select("id, title")
      .eq("user_id", params.sourceCreatorId)
      .eq("type", "remix")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20);
    const existing = (unread ?? []).find((n) => (n.title as string).includes(`「${source}」`));
    if (existing) {
      const count = countFromTitle(existing.title as string) + 1;
      await supabase
        .from("user_notifications")
        .update({
          title: `あなたの「${source}」をもとに、アプリが${count}件作られました！`,
          body: `最新は ${who} さんの「${params.newTitle}」です。あなたのアプリが、みんなの「作りたい」のきっかけになっています。`,
          href: `/apps/${params.sourceAppId}`,
          created_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("user_notifications").insert({
      user_id: params.sourceCreatorId,
      type: "remix",
      title: `${who} さんが、あなたの「${source}」をもとにアプリを作りました！`,
      body: `新しいアプリ「${params.newTitle}」が生まれました。あなたのアプリが、誰かの「作りたい」のきっかけになっています。`,
      href: `/apps/${params.newAppId}`,
    });
  } catch {
    /* 通知の失敗で出品を止めない */
  }
}
