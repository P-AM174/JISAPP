import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const sessionEmail = session?.user?.email ?? null;
  const sessionName = session?.user?.name ?? null;

  const email = (body.email ?? sessionEmail ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const text = (body.body ?? "").trim();
  const name = (body.name ?? sessionName ?? "").trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
  }
  if (!subject || subject.length > 100) {
    return NextResponse.json({ error: "件名は1〜100文字で入力してください" }, { status: 400 });
  }
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "内容は1〜2000文字で入力してください" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("support_inquiries")
    .insert({
      user_id: userId,
      email,
      name,
      subject,
      body: text,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[support/inquiries POST]", error);
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
