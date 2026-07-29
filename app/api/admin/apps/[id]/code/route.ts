import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

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
