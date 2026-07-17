import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const LIBRARY_KEY = "__in_library__";

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

/** GET /api/library/check?appId=xxx — ライブラリ登録済みか確認 */
export async function GET(req: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("appId")?.trim();

  if (!userId || !appId) {
    return NextResponse.json({ inLibrary: false });
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("app_user_data")
    .select("app_id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("data_key", LIBRARY_KEY)
    .maybeSingle();

  return NextResponse.json({ inLibrary: !!data });
}
