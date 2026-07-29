import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_notifications")
    .select("id, type, title, body, href, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[notifications GET]", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const notifications = (data ?? []).map((n) => ({
    id: n.id as string,
    type: n.type as string,
    title: n.title as string,
    body: n.body as string,
    href: (n.href as string | null) ?? null,
    isRead: n.is_read as boolean,
    createdAt: n.created_at as string,
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: { ids?: string[]; markAllRead?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  if (body.markAllRead) {
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) {
      return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const ids = body.ids ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "通知IDが指定されていません" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
