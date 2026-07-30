import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const VALID_CATEGORIES = [
  "ゲーム",
  "便利ツール",
  "学習・教育",
  "エンタメ",
  "生産性",
  "その他",
];

async function requireUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

/** 依頼一覧: GET /api/requests */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data: requests, error } = await supabase
    .from("app_requests")
    .select("id, user_id, author_name, title, content, category, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (requests ?? []).map((r) => r.id);
  let responseCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: responses } = await supabase
      .from("app_request_responses")
      .select("request_id")
      .in("request_id", ids);

    for (const row of responses ?? []) {
      const rid = row.request_id as string;
      responseCounts[rid] = (responseCounts[rid] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    requests: (requests ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      authorName: r.author_name,
      title: r.title,
      content: r.content,
      category: r.category,
      createdAt: r.created_at,
      responses: responseCounts[r.id] ?? 0,
    })),
  });
}

/** 依頼投稿: POST /api/requests */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: { title?: string; content?: string; category?: string; authorName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const content = (body.content ?? "").trim();
  const category = (body.category ?? "").trim();

  if (!title || title.length > 80) {
    return NextResponse.json({ error: "タイトルは1〜80文字で入力してください" }, { status: 400 });
  }
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "内容は1〜500文字で入力してください" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
  }

  let authorName = (body.authorName ?? "").trim();
  if (!authorName) {
    try {
      const session = await getServerSession(authOptions);
      authorName = (session?.user as { name?: string })?.name?.trim() || "ユーザー";
    } catch {
      authorName = "ユーザー";
    }
  }
  if (authorName.length > 30) {
    authorName = authorName.slice(0, 30);
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_requests")
    .insert({
      user_id: userId,
      author_name: authorName,
      title,
      content,
      category,
    })
    .select("id, author_name, title, content, category, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      request: {
        id: data.id,
        authorName: data.author_name,
        title: data.title,
        content: data.content,
        category: data.category,
        createdAt: data.created_at,
        responses: 0,
      },
    },
    { status: 201 }
  );
}
