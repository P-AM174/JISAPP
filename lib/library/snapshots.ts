import { createServerSupabaseClient } from "@/lib/supabase-server";

const LIBRARY_KEY = "__in_library__";

export type AppCodeSnapshot = {
  title: string;
  description: string | null;
  html_code: string | null;
  css_code: string | null;
  js_code: string | null;
  category: string | null;
  code_version: number;
};

type Supabase = ReturnType<typeof createServerSupabaseClient>;

export async function userHasInLibrary(
  supabase: Supabase,
  userId: string,
  appId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("app_user_data")
    .select("user_id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("data_key", LIBRARY_KEY)
    .maybeSingle();
  return !!data;
}

export async function getLibraryUserIds(
  supabase: Supabase,
  appId: string,
  excludeUserId?: string
): Promise<string[]> {
  const { data } = await supabase
    .from("app_user_data")
    .select("user_id")
    .eq("app_id", appId)
    .eq("data_key", LIBRARY_KEY);

  return (data ?? [])
    .map((r) => r.user_id as string)
    .filter((id) => id !== excludeUserId);
}

export async function upsertLibrarySnapshot(
  supabase: Supabase,
  userId: string,
  appId: string,
  snapshot: AppCodeSnapshot
): Promise<void> {
  await supabase.from("library_snapshots").upsert(
    {
      user_id: userId,
      app_id: appId,
      title: snapshot.title,
      description: snapshot.description,
      html_code: snapshot.html_code,
      css_code: snapshot.css_code,
      js_code: snapshot.js_code,
      category: snapshot.category,
      code_version: snapshot.code_version,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,app_id" }
  );
}

export async function getLibrarySnapshot(
  supabase: Supabase,
  userId: string,
  appId: string
): Promise<AppCodeSnapshot | null> {
  const { data } = await supabase
    .from("library_snapshots")
    .select("title, description, html_code, css_code, js_code, category, code_version")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();

  if (!data) return null;
  return data as AppCodeSnapshot;
}

export async function deleteLibrarySnapshot(
  supabase: Supabase,
  userId: string,
  appId: string
): Promise<void> {
  await supabase
    .from("library_snapshots")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId);
}

export function snapshotFromAppRow(app: {
  title: string;
  description?: string | null;
  html_code?: string | null;
  css_code?: string | null;
  js_code?: string | null;
  category?: string | null;
  code_version?: number | null;
}): AppCodeSnapshot {
  return {
    title: app.title,
    description: app.description ?? null,
    html_code: app.html_code ?? null,
    css_code: app.css_code ?? null,
    js_code: app.js_code ?? null,
    category: app.category ?? null,
    code_version: app.code_version ?? 1,
  };
}

export async function clearUserAppDataExceptLibrary(
  supabase: Supabase,
  userId: string,
  appId: string
): Promise<void> {
  await supabase
    .from("app_user_data")
    .delete()
    .eq("user_id", userId)
    .eq("app_id", appId)
    .neq("data_key", LIBRARY_KEY);
}
