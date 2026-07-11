import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function getSessionUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    title?: string;
    description?: string;
    category?: string;
    is_listed?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const t = body.title.trim();
    if (!t || t.length > 100) return NextResponse.json({ error: "タイトルは1〜100文字で入力してください" }, { status: 400 });
    updates.title = t;
  }
  if (body.description !== undefined) updates.description = body.description.trim() || null;
  if (body.category !== undefined)    updates.category    = body.category || null;
  if (body.is_listed !== undefined)   updates.is_listed   = body.is_listed;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "更新内容がありません" }, { status: 400 });
  }

  // アプリの存在確認（将来的に user_id カラム追加時はここで所有者チェックを追加）
  const { error } = await supabase
    .from("apps")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
