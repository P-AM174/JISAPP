import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { looksLikePrompt } from "@/lib/playground/code-cleanup";

type Ctx = { params: Promise<{ id: string }> };
const LIBRARY_KEY = "__in_library__";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jisapp.app").replace(/\/$/, "");

/**
 * 運営画面「あきらめたプロンプト」の1件を操作する
 * POST { action: "deliver", html, title }：運営が作ったコードを、本人のアプリとして URL 発行（マーケットには出さない）
 * POST { action: "email", subject, text }：本人にメールで届ける（本文の {link} はアプリの URL に置き換える）
 * POST { action: "skip" | "reopen" }：対応しない／未対応に戻す
 */
export async function POST(request: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { action?: string; html?: string; title?: string; subject?: string; text?: string } | null;
  const supabase = createServerSupabaseClient();
  const { data: item } = await supabase.from("studio_stuck_prompts").select("*").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  const now = new Date().toISOString();

  if (body?.action === "skip" || body?.action === "reopen") {
    await supabase.from("studio_stuck_prompts").update({ status: body.action === "skip" ? "skipped" : "open", updated_at: now }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "deliver") {
    const html = (body.html ?? "").trim();
    const title = (body.title ?? "").trim().slice(0, 100) || "アプリ";
    if (!html) return NextResponse.json({ error: "コードを貼ってください" }, { status: 400 });
    if (looksLikePrompt(html)) return NextResponse.json({ error: "まだコードではなく文章のようです。AIが書き終わったコードを貼ってください" }, { status: 400 });
    const user = item.user_id ? await prisma.user.findUnique({ where: { id: item.user_id }, select: { id: true, name: true } }) : null;
    const { data: app, error } = await supabase
      .from("apps")
      .insert({
        title,
        description: null,
        html_code: html,
        css_code: null,
        js_code: null,
        category: null,
        // 本人のアプリとして URL だけ発行する（マーケットに出すかは本人が決める）
        is_listed: false,
        code_public: false,
        status: "active",
        last_accessed_at: now,
        creator_name: user?.name ?? "ゲスト",
        creator_id: user?.id ?? null,
        is_playground_app: true,
      })
      .select("id")
      .single();
    if (error || !app) return NextResponse.json({ error: "作れませんでした: " + (error?.message ?? "") }, { status: 500 });
    if (user) {
      await supabase.from("user_projects").insert({
        user_id: user.id, title, description: null, html_code: html, css_code: null, js_code: null,
        app_id: app.id, status: "url_only", is_listed: false, category: null, updated_at: now,
      });
      await supabase.from("app_user_data").upsert(
        { user_id: user.id, app_id: app.id, data_key: LIBRARY_KEY, data_value: JSON.stringify({ name: title, category: null, addedAt: now }), updated_at: now },
        { onConflict: "user_id,app_id,data_key" }
      );
    }
    await supabase.from("studio_stuck_prompts").update({ status: "made", app_id: app.id, updated_at: now }).eq("id", id);
    console.info("[admin] stuck prompt delivered", { id, appId: app.id, by: admin.userId ?? admin.via });
    return NextResponse.json({ ok: true, appId: app.id, url: `${site()}/apps/${app.id}` });
  }

  if (body?.action === "email") {
    if (!resend) return NextResponse.json({ error: "メール送信が設定されていません" }, { status: 503 });
    if (!item.app_id) return NextResponse.json({ error: "先にアプリを作ってください" }, { status: 400 });
    const to = item.email || (item.user_id ? (await prisma.user.findUnique({ where: { id: item.user_id }, select: { email: true } }))?.email : null);
    if (!to) return NextResponse.json({ error: "送り先のメールアドレスがありません" }, { status: 400 });
    const subject = (body.subject ?? "").trim().slice(0, 150);
    const text = (body.text ?? "").trim().slice(0, 5000);
    if (!subject || !text) return NextResponse.json({ error: "件名と本文を入れてください" }, { status: 400 });
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "ジサップ <onboarding@resend.dev>",
      to,
      subject,
      text: text.split("{link}").join(`${site()}/apps/${item.app_id}`),
    });
    if (error) return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 502 });
    await supabase.from("studio_stuck_prompts").update({ status: "emailed", emailed_at: now, updated_at: now }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
}
