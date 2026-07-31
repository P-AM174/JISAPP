import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function userOwnsApp(
  userId: string,
  appId: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { data: byCreator } = await supabase
    .from("apps")
    .select("id")
    .eq("id", appId)
    .eq("creator_id", userId)
    .maybeSingle();
  if (byCreator) return true;

  const { data: byProject } = await supabase
    .from("user_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();

  return !!byProject;
}
