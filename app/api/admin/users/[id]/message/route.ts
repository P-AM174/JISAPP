import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type MessageChannel = "bell" | "email" | "both";

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { title?: string; message?: string; channel?: MessageChannel };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const message = (body.message ?? "").trim();
  const channel = body.channel ?? "both";

  if (!title || title.length > 100) {
    return NextResponse.json({ error: "件名は1〜100文字で入力してください" }, { status: 400 });
  }
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "メッセージは1〜2000文字で入力してください" }, { status: 400 });
  }
  if (!["bell", "email", "both"].includes(channel)) {
    return NextResponse.json({ error: "送信方法が不正です" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const sent: { bell?: boolean; email?: boolean } = {};

  if (channel === "bell" || channel === "both") {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("user_notifications").insert({
      user_id: user.id,
      type: "admin_message",
      title,
      body: message.length > 200 ? message.slice(0, 200) + "…" : message,
      href: "/mypage",
    });
    if (error) {
      return NextResponse.json({ error: "通知の送信に失敗しました" }, { status: 500 });
    }
    sent.bell = true;
  }

  if (channel === "email" || channel === "both") {
    if (!resend) {
      return NextResponse.json({ error: "メール送信が設定されていません" }, { status: 503 });
    }
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "ジサップ <onboarding@resend.dev>";
    const name = user.name ? `${user.name} 様` : "お客様";
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: `[ジサップ] ${title}`,
      text: `${name}\n\nジサップ運営からのお知らせです。\n\n---\n${message}\n\n---\nジサップ運営`,
    });
    if (error) {
      return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
    }
    sent.email = true;
  }

  return NextResponse.json({ ok: true, sent });
}
