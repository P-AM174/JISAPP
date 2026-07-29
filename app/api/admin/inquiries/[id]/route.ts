import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { reply?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const reply = (body.reply ?? "").trim();
  if (!reply || reply.length > 5000) {
    return NextResponse.json({ error: "返信内容は1〜5000文字で入力してください" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: inquiry, error: fetchError } = await supabase
    .from("support_inquiries")
    .select("id, user_id, email, name, subject, body")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !inquiry) {
    return NextResponse.json({ error: "問い合わせが見つかりません" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("support_inquiries")
    .update({
      admin_reply: reply,
      status: body.status === "closed" ? "closed" : "replied",
      replied_at: now,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const notifTitle = `「${inquiry.subject}」への返信`;
  const notifBody = reply.length > 120 ? reply.slice(0, 120) + "…" : reply;

  if (inquiry.user_id) {
    await supabase.from("user_notifications").insert({
      user_id: inquiry.user_id,
      type: "support_reply",
      title: notifTitle,
      body: notifBody,
      href: "/mypage?tab=notifications",
    });
  }

  if (resend && inquiry.email) {
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "ジサップ <onboarding@resend.dev>";
    const name = inquiry.name ? `${inquiry.name} 様` : "お客様";
    try {
      await resend.emails.send({
        from: fromEmail,
        to: inquiry.email,
        subject: `[ジサップ] ${inquiry.subject} への返信`,
        text: `${name}\n\nお問い合わせありがとうございます。\n\n--- お問い合わせ内容 ---\n${inquiry.body}\n\n--- 運営からの返信 ---\n${reply}\n\n---\nジサップ運営`,
      });
    } catch (err) {
      console.error("[admin/inquiries reply email]", err);
    }
  }

  return NextResponse.json({ ok: true });
}
