import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createUserNotification } from "@/lib/notifications/create-notification";
import { APP_DATA_LIMITS, formatBytes } from "@/lib/app-data-limits";

/** 同じ通知を送り直さない期間 */
const REPEAT_DAYS = 30;

/** 同じ種類・同じリンクの通知を、REPEAT_DAYS 日に1回だけ送る */
async function notifyOnce(params: { userId: string; type: string; title: string; body: string; href: string }) {
  const supabase = createServerSupabaseClient();
  const since = new Date(Date.now() - REPEAT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("user_notifications")
    .select("id")
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .eq("href", params.href)
    .gt("created_at", since)
    .limit(1);
  if (error || (data && data.length > 0)) return;
  await createUserNotification(params);
}

const MYPAGE_STORAGE = "/mypage#storage";

/** 保存データの合計が、もうすぐ上限に届く（8割を超えた） */
export function notifyStorageAlmostFull(userId: string, usedBytes: number) {
  return notifyOnce({
    userId,
    type: "storage_warning",
    title: "保存容量がもうすぐいっぱいです",
    body: `アプリに保存しているデータが ${formatBytes(usedBytes)} / ${formatBytes(APP_DATA_LIMITS.userBytes)} になりました。いっぱいになると、新しく保存できなくなります。使っていないアプリのデータを消しておくと安心です。`,
    href: MYPAGE_STORAGE,
  }).catch(() => {});
}

/** 保存データの合計が上限に達し、保存を断った */
export function notifyStorageFull(userId: string) {
  return notifyOnce({
    userId,
    type: "storage_full",
    title: "保存容量がいっぱいです",
    body: `アプリに保存できるデータ（全アプリで ${formatBytes(APP_DATA_LIMITS.userBytes)}）がいっぱいになったため、保存できませんでした。使っていないアプリのデータを消すと、また保存できます。`,
    href: MYPAGE_STORAGE,
  }).catch(() => {});
}

/** グループの共有データが、もうすぐ上限に届く（グループを作った人に知らせる） */
export function notifyGroupStorageAlmostFull(ownerId: string, appId: string, groupId: string, groupName: string, usedBytes: number) {
  return notifyOnce({
    userId: ownerId,
    type: "group_storage_warning",
    title: `「${groupName}」の共有データがもうすぐいっぱいです`,
    body: `グループの共有データが ${formatBytes(usedBytes)} / ${formatBytes(APP_DATA_LIMITS.groupBytes)} になりました。いっぱいになると、メンバーが新しく書き込めなくなります。不要な項目を消しておくと安心です。`,
    href: `/apps/${appId}#group-${groupId}`,
  }).catch(() => {});
}

/** グループの共有データが上限に達し、書き込みを断った（グループを作った人に知らせる） */
export function notifyGroupStorageFull(ownerId: string, appId: string, groupId: string, groupName: string) {
  return notifyOnce({
    userId: ownerId,
    type: "group_storage_full",
    title: `「${groupName}」の共有データがいっぱいです`,
    body: `グループの共有データ（${formatBytes(APP_DATA_LIMITS.groupBytes)}）がいっぱいになったため、メンバーの書き込みを断りました。不要な項目を消すと、また書き込めます。`,
    href: `/apps/${appId}#group-${groupId}`,
  }).catch(() => {});
}
