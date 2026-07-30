import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createUserNotification } from "@/lib/notifications/create-notification";

async function requireUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

/** 依頼詳細: GET /api/requests/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: request, error } = await supabase
    .from("app_requests")
    .select("id, user_id, author_name, title, content, category, created_at, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!request || request.status !== "open") {
    return NextResponse.json({ error: "リクエストが見つかりません" }, { status: 404 });
  }

  const { data: responses, error: respError } = await supabase
    .from("app_request_responses")
    .select("id, creator_name, message, app_url, created_at, user_id")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (respError) {
    return NextResponse.json({ error: respError.message }, { status: 500 });
  }

  return NextResponse.json({
    request: {
      id: request.id,
      userId: request.user_id,
      authorName: request.author_name,
      title: request.title,
      content: request.content,
      category: request.category,
      createdAt: request.created_at,
      responses: (responses ?? []).length,
    },
    responses: (responses ?? []).map((r) => ({
      id: r.id,
      creatorName: r.creator_name,
      message: r.message,
      appUrl: r.app_url ?? undefined,
      createdAt: r.created_at,
      userId: r.user_id,
    })),
  });
}

/** 返信投稿: POST /api/requests/[id] */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await params;
  let body: { creatorName?: string; message?: string; appUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message || message.length > 200) {
    return NextResponse.json({ error: "メッセージは1〜200文字で入力してください" }, { status: 400 });
  }

  let creatorName = (body.creatorName ?? "").trim();
  if (!creatorName) {
    try {
      const session = await getServerSession(authOptions);
      creatorName = (session?.user as { name?: string })?.name?.trim() || "ユーザー";
    } catch {
      creatorName = "ユーザー";
    }
  }
  if (creatorName.length > 30) {
    creatorName = creatorName.slice(0, 30);
  }

  const appUrl = (body.appUrl ?? "").trim();
  if (appUrl && !/^https?:\/\//i.test(appUrl)) {
    return NextResponse.json({ error: "アプリURLは http:// または https:// から入力してください" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: request } = await supabase
    .from("app_requests")
    .select("id, user_id, title, status")
    .eq("id", id)
    .maybeSingle();

  if (!request || request.status !== "open") {
    return NextResponse.json({ error: "リクエストが見つかりません" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("app_request_responses")
    .insert({
      request_id: id,
      user_id: userId,
      creator_name: creatorName,
      message,
      app_url: appUrl || null,
    })
    .select("id, creator_name, message, app_url, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (request.user_id !== userId) {
    await createUserNotification({
      userId: request.user_id,
      type: "request_response",
      title: `「${request.title}」に返信がありました`,
      body: `${creatorName} さんが「作ってみました」と報告しました`,
      href: `/requests/${id}`,
    });
  }

  return NextResponse.json(
    {
      response: {
        id: data.id,
        creatorName: data.creator_name,
        message: data.message,
        appUrl: data.app_url ?? undefined,
        createdAt: data.created_at,
      },
    },
    { status: 201 }
  );
}
