import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { userOwnsApp } from "@/lib/secrets/app-ownership";

const PLACEHOLDER_HTML =
  '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>';
const MAX_CODE_BYTES = 512 * 1024;

/** POST /api/playground/ensure-app — プレビュー用に appId を確保（APIキー登録前） */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: {
    app_id?: string;
    project_id?: string;
    html_code?: string;
    title?: string;
  };

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supabase = createServerSupabaseClient();
  const requestedAppId = (body.app_id ?? "").trim();

  if (requestedAppId) {
    if (await userOwnsApp(userId, requestedAppId)) {
      return NextResponse.json({ appId: requestedAppId });
    }
    return NextResponse.json({ error: "このアプリを編集する権限がありません" }, { status: 403 });
  }

  const projectId = (body.project_id ?? "").trim();
  if (projectId) {
    const { data: project } = await supabase
      .from("user_projects")
      .select("app_id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (project?.app_id && (await userOwnsApp(userId, project.app_id))) {
      return NextResponse.json({ appId: project.app_id });
    }
  }

  const { data: draftWithApp } = await supabase
    .from("user_projects")
    .select("app_id")
    .eq("user_id", userId)
    .eq("status", "draft")
    .not("app_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (draftWithApp?.app_id && (await userOwnsApp(userId, draftWithApp.app_id))) {
    return NextResponse.json({ appId: draftWithApp.app_id });
  }

  const html_code = (body.html_code ?? "").trim() || PLACEHOLDER_HTML;
  if (Buffer.byteLength(html_code, "utf8") > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "コードサイズが大きすぎます（最大512KB）" }, { status: 413 });
  }

  const title = (body.title ?? "").trim() || "下書きアプリ";
  const creatorName = (session?.user as { name?: string })?.name ?? "ゲスト";
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("apps")
    .insert({
      title,
      html_code,
      creator_name: creatorName,
      creator_id: userId,
      is_playground_app: true,
      is_listed: false,
      status: "active",
      last_accessed_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ensure-app]", error);
    return NextResponse.json(
      { error: "アプリの準備に失敗しました: " + error.message },
      { status: 500 }
    );
  }

  const appId = data.id;

  if (projectId) {
    await supabase
      .from("user_projects")
      .update({ app_id: appId, updated_at: now })
      .eq("id", projectId)
      .eq("user_id", userId);
  }

  return NextResponse.json({ appId }, { status: 201 });
}
