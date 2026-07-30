import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createUserNotification } from "@/lib/notifications/create-notification";
import {
  clearUserAppDataExceptLibrary,
  getLibraryUserIds,
  snapshotFromAppRow,
  upsertLibrarySnapshot,
  type AppCodeSnapshot,
} from "@/lib/library/snapshots";

type Supabase = ReturnType<typeof createServerSupabaseClient>;

export type PendingUpdate = {
  code_version: number;
  reset_user_data: boolean;
  app_title: string;
  update_notes: string | null;
  created_at: string;
};

function notificationBody(updateNotes: string | null, resetUserData: boolean): string {
  if (updateNotes) {
    const summary = updateNotes.length > 120 ? updateNotes.slice(0, 120) + "…" : updateNotes;
    return summary;
  }
  return resetUserData
    ? "出品者がコードを更新しました。アップデートすると保存データが消える可能性があります。"
    : "出品者がコードを更新しました。アップデートするか選択できます。";
}

export async function getPendingUpdate(
  supabase: Supabase,
  userId: string,
  appId: string
): Promise<PendingUpdate | null> {
  const { data } = await supabase
    .from("library_pending_updates")
    .select("code_version, reset_user_data, app_title, update_notes, created_at")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();

  if (!data) return null;
  return data as PendingUpdate;
}

export async function queueLibraryUpdatesOnRepublish(params: {
  supabase: Supabase;
  appId: string;
  publisherUserId: string;
  appTitle: string;
  codeVersion: number;
  resetUserData: boolean;
  updateNotes?: string | null;
}): Promise<void> {
  const { supabase, appId, publisherUserId, appTitle, codeVersion, resetUserData, updateNotes } = params;
  const libraryUserIds = await getLibraryUserIds(supabase, appId, publisherUserId);

  if (libraryUserIds.length === 0) return;

  const notes = (updateNotes ?? "").trim() || null;

  const rows = libraryUserIds.map((userId) => ({
    user_id: userId,
    app_id: appId,
    code_version: codeVersion,
    reset_user_data: resetUserData,
    app_title: appTitle,
    update_notes: notes,
    created_at: new Date().toISOString(),
  }));

  await supabase.from("library_pending_updates").upsert(rows, {
    onConflict: "user_id,app_id",
  });

  const body = notificationBody(notes, resetUserData);

  await Promise.all(
    libraryUserIds.map((userId) =>
      createUserNotification({
        userId,
        type: "app_update",
        title: `「${appTitle}」のコードが更新されました`,
        body,
        href: `/apps/${appId}`,
      })
    )
  );
}

export async function acceptPendingUpdate(
  supabase: Supabase,
  userId: string,
  appId: string,
  liveSnapshot: AppCodeSnapshot
): Promise<{ ok: boolean; error?: string }> {
  const pending = await getPendingUpdate(supabase, userId, appId);
  if (!pending) {
    return { ok: false, error: "保留中のアップデートがありません" };
  }

  await upsertLibrarySnapshot(supabase, userId, appId, liveSnapshot);

  if (pending.reset_user_data) {
    await clearUserAppDataExceptLibrary(supabase, userId, appId);
  }

  await supabase
    .from("library_pending_updates")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId);

  return { ok: true };
}

export async function declinePendingUpdate(
  supabase: Supabase,
  userId: string,
  appId: string
): Promise<{ ok: boolean; error?: string }> {
  const pending = await getPendingUpdate(supabase, userId, appId);
  if (!pending) {
    return { ok: false, error: "保留中のアップデートがありません" };
  }

  await supabase
    .from("library_pending_updates")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId);

  return { ok: true };
}

export async function snapshotFromLiveApp(
  supabase: Supabase,
  appId: string
): Promise<AppCodeSnapshot | null> {
  const { data } = await supabase
    .from("apps")
    .select("title, description, html_code, css_code, js_code, category, code_version")
    .eq("id", appId)
    .maybeSingle();

  if (!data) return null;
  return snapshotFromAppRow(data);
}
