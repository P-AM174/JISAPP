import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

export type UserProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  html_code: string | null;
  css_code: string | null;
  js_code: string | null;
  app_id: string | null;
  status: string;
  is_listed: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
};

/** GET /api/my-projects — ログインユーザーのプロジェクト一覧 */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ projects: [], logged_in: false });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[my-projects GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [], logged_in: true });
}

/** POST /api/my-projects — プロジェクト作成・更新 */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: {
    id?: string;
    title?: string;
    description?: string;
    html_code?: string;
    css_code?: string;
    js_code?: string;
    app_id?: string;
    status?: "draft" | "listed" | "url_only";
    is_listed?: boolean;
    category?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "タイトルが必要です" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    title,
    description: (body.description ?? "").trim() || null,
    html_code: body.html_code ?? null,
    css_code: body.css_code ?? null,
    js_code: body.js_code ?? null,
    app_id: body.app_id ?? null,
    status: body.status ?? "draft",
    is_listed: body.is_listed ?? false,
    category: body.category ?? null,
    updated_at: now,
  };

  // 下書き保存は既存の作業中プロジェクトを更新（1件のみ）
  if (!body.id && (body.status ?? "draft") === "draft" && !body.app_id) {
    const { data: existing } = await supabase
      .from("user_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "draft")
      .is("app_id", null)
      .maybeSingle();

    if (existing) {
      body.id = existing.id;
    }
  }

  if (body.id) {
    const { data, error } = await supabase
      .from("user_projects")
      .update(row)
      .eq("id", body.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("[my-projects PATCH via POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ project: data });
  }

  const { data, error } = await supabase
    .from("user_projects")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("[my-projects POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data }, { status: 201 });
}
