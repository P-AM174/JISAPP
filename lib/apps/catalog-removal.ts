import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidateCatalogPages } from "@/lib/revalidate-catalog";

type RemovalOptions = {
  /** 管理者による強制削除（マイライブラリ利用不可） */
  admin?: boolean;
};

/** トップ・検索カタログから非表示（status=deleted, is_listed=false） */
export async function removeAppFromCatalog(
  appId: string,
  options?: RemovalOptions
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("apps")
    .update({
      status: "deleted",
      is_listed: false,
      admin_deleted: options?.admin ?? false,
    })
    .eq("id", appId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: true };
  }

  revalidateCatalogPages();
  return { ok: true };
}

/** 出品者本人のみカタログから削除 */
export async function removeAppFromCatalogByOwner(
  appId: string,
  userId: string
): Promise<{ ok: boolean; error?: string; status?: number }> {
  const supabase = createServerSupabaseClient();

  const { data: app } = await supabase
    .from("apps")
    .select("creator_id")
    .eq("id", appId)
    .maybeSingle();

  if (!app) {
    return { ok: true };
  }

  if (app.creator_id && app.creator_id !== userId) {
    return { ok: false, error: "このアプリを削除する権限がありません", status: 403 };
  }

  const ownedViaProject = await supabase
    .from("user_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();

  if (app.creator_id !== userId && !ownedViaProject.data) {
    return { ok: false, error: "このアプリを削除する権限がありません", status: 403 };
  }

  return removeAppFromCatalog(appId);
}
