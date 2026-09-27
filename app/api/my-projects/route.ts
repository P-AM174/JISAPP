import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getLibraryCounts } from "@/lib/library-counts";
import { usesSharedData } from "@/lib/groups/client";

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

type AppStats = { openCount: number; groupSharing: boolean | null };

/** アプリが開かれた回数と、グループ共有を使うかの設定（回数の仕組みがまだないときは回数なし） */
async function getAppStats(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  appIds: string[]
): Promise<Record<string, AppStats>> {
  if (appIds.length === 0) return {};
  type Row = { id: string; open_count?: number | null; group_sharing: boolean | null };
  const withCount = await supabase.from("apps").select("id, open_count, group_sharing").in("id", appIds);
  let rows = withCount.data as Row[] | null;
  if (withCount.error) {
    const withoutCount = await supabase.from("apps").select("id, group_sharing").in("id", appIds);
    if (withoutCount.error) return {};
    rows = withoutCount.data as Row[] | null;
  }
  const stats: Record<string, AppStats> = {};
  for (const row of rows ?? []) {
    stats[row.id] = { openCount: row.open_count ?? 0, groupSharing: row.group_sharing };
  }
  return stats;
}

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

  const projects = (data ?? []).map(({ html_code, css_code, js_code, ...rest }) => ({
    ...rest,
    code_lines: html_code ? html_code.split("\n").length : 0,
    code_chars: html_code?.length ?? 0,
    code_uses_shared: html_code ? usesSharedData(html_code) : false,
  }));

  const appIds = projects.map((p) => p.app_id).filter(Boolean) as string[];
  const [libraryCounts, appStats] = await Promise.all([
    getLibraryCounts(appIds),
    getAppStats(supabase, appIds),
  ]);
  const projectsWithStats = projects.map(({ code_uses_shared, ...p }) => {
    const stats = p.app_id ? appStats[p.app_id] : undefined;
    return {
      ...p,
      library_count: p.app_id ? libraryCounts[p.app_id] ?? 0 : 0,
      open_count: stats?.openCount ?? 0,
      // 公開時に選んだ設定。選んでいない古いアプリはコードから判断する（アプリのページと同じ決め方）
      group_sharing: p.app_id ? (stats?.groupSharing ?? code_uses_shared) : false,
    };
  });

  return NextResponse.json({ projects: projectsWithStats, logged_in: true });
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
