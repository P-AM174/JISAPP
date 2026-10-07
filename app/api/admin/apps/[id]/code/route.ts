import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/db";
import { snapshotFromAppRow, upsertLibrarySnapshot } from "@/lib/library/snapshots";
import { queueLibraryUpdatesOnRepublish } from "@/lib/library/pending-updates";
import { createUserNotification } from "@/lib/notifications/create-notification";
import { Resend } from "resend";

type RouteContext = { params: Promise<{ id: string }> };

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await context.params;

  if (isUUID(id)) {
    const supabase = createServerSupabaseClient();
    const { data: app, error } = await supabase
      .from("apps")
      .select("id, title, html_code, css_code, js_code, code_public, status")
      .eq("id", id)
      .maybeSingle();

    if (error || !app || app.status === "deleted") {
      return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({
      title: app.title,
      html_code: app.html_code ?? "",
      css_code: app.css_code ?? "",
      js_code: app.js_code ?? "",
      code_public: !!app.code_public,
    });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { title: true, htmlCode: true, cssCode: true, jsCode: true },
  });

  if (!product) {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  return NextResponse.json({
    title: product.title,
    html_code: product.htmlCode ?? "",
    css_code: product.cssCode ?? "",
    js_code: product.jsCode ?? "",
    code_public: true,
  });
}

const MAX_CODE_BYTES = 512 * 1024; // 公開と同じ上限

/**
 * 運営がアプリのコードを書き換える: PUT /api/admin/apps/:id/code
 * body: { html_code, css_code?, js_code?, notes? }
 * 作者が上書き公開したときと同じく版を上げ、ライブラリに入れている人には更新のお知らせを出す。
 * 作者にもベルマークで知らせる（作者の手元のプロジェクトも同じコードにそろえ、次の上書きで元に戻らないようにする）
 */
export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!isUUID(id)) {
    return NextResponse.json({ error: "このアプリはコードを書き換えられません" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        html_code?: string;
        css_code?: string;
        js_code?: string;
        notes?: string;
        /** 作者にメールでも知らせるときだけ付ける。本文の {link} はアプリのURLに置き換える */
        email?: { subject?: string; text?: string };
      }
    | null;
  const html_code = (body?.html_code ?? "").trim();
  if (!html_code) {
    return NextResponse.json({ error: "HTML が空です" }, { status: 400 });
  }
  const css_code = body?.css_code?.trim() ? body.css_code : null;
  const js_code = body?.js_code?.trim() ? body.js_code : null;
  const totalBytes = Buffer.byteLength(html_code + (css_code ?? "") + (js_code ?? ""), "utf8");
  if (totalBytes > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "コードが大きすぎます（512KBまで）" }, { status: 413 });
  }
  const notes = (body?.notes ?? "").trim().slice(0, 200);

  const supabase = createServerSupabaseClient();
  const { data: app } = await supabase
    .from("apps")
    .select("id, title, description, category, creator_id, code_version, status")
    .eq("id", id)
    .maybeSingle();
  if (!app || app.status === "deleted") {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  const codeVersion = (app.code_version ?? 1) + 1;
  const { error } = await supabase
    .from("apps")
    .update({ html_code, css_code, js_code, code_version: codeVersion })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "保存できませんでした: " + error.message }, { status: 500 });
  }

  console.info("[admin] app code updated", { appId: id, codeVersion, by: admin.userId ?? admin.via });

  // 作者の手元のプロジェクトも同じコードにそろえる
  if (app.creator_id) {
    await supabase
      .from("user_projects")
      .update({ html_code, css_code, js_code, updated_at: new Date().toISOString() })
      .eq("user_id", app.creator_id)
      .eq("app_id", id);
    await upsertLibrarySnapshot(
      supabase,
      app.creator_id,
      id,
      snapshotFromAppRow({ ...app, html_code, css_code, js_code, code_version: codeVersion })
    );
    await createUserNotification({
      userId: app.creator_id,
      type: "admin_code_update",
      title: `「${app.title}」のコードを運営が修正しました`,
      body: notes || "運営がアプリのコードを修正しました。マイプロジェクトのコードも同じ内容になっています。",
      href: `/apps/${id}`,
    });
  }

  await queueLibraryUpdatesOnRepublish({
    supabase,
    appId: id,
    publisherUserId: app.creator_id ?? "",
    appTitle: app.title,
    codeVersion,
    resetUserData: false,
    updateNotes: notes || "運営がコードを修正しました",
  });

  // 作者にメールでも知らせる（運営が選んだときだけ）。送れなくても書き換え自体は成功として返す
  let emailSent = false;
  let emailError: string | undefined;
  const subject = (body?.email?.subject ?? "").trim().slice(0, 150);
  const text = (body?.email?.text ?? "").trim().slice(0, 5000);
  if (subject && text) {
    if (!resend) emailError = "メール送信が設定されていません";
    else if (!app.creator_id) emailError = "作者が見つかりません";
    else {
      const creator = await prisma.user.findUnique({ where: { id: app.creator_id }, select: { email: true } });
      if (!creator?.email) emailError = "作者のメールアドレスが見つかりません";
      else {
        const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jisapp.app").replace(/\/$/, "");
        const { error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "ジサップ <onboarding@resend.dev>",
          to: creator.email,
          subject,
          text: text.split("{link}").join(`${site}/apps/${id}`),
        });
        if (error) emailError = "メール送信に失敗しました";
        else emailSent = true;
      }
    }
    console.info("[admin] code update email", { appId: id, emailSent, emailError });
  }

  return NextResponse.json({ ok: true, codeVersion, emailSent, emailError });
}
