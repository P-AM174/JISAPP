import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function createUserNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("user_notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    href: params.href ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
