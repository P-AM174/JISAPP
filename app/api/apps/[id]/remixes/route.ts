import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/apps/[id]/remixes — このアプリをもとに作られたアプリ（マーケットに出品中のものだけ・新しい順）。
 * もとのアプリの詳しい表示（モーダル）の下に並べる。remix_of 列がまだないとき（SQL の実行前）は空で返す
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ apps: [] });
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("apps")
    .select("id, title, category, creator_name")
    .eq("remix_of", id)
    .eq("status", "active")
    .eq("is_listed", true)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ apps: [] });
  return NextResponse.json({ apps: data ?? [] });
}
