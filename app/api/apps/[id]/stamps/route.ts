import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const STAMP_KEY_PREFIX = "__stamp__";
const STAMP_IDS = ["like", "genius", "useful", "design"] as const;
type StampId = typeof STAMP_IDS[number];

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

/** スタンプ集計取得: GET /api/apps/[id]/stamps */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;

  const counts: Record<StampId, number> = { like: 0, genius: 0, useful: 0, design: 0 };

  try {
    const { data, error } = await supabase
      .from("app_user_data")
      .select("data_key")
      .eq("app_id", appId)
      .eq("data_value", "true")
      .in("data_key", STAMP_IDS.map(id => `${STAMP_KEY_PREFIX}${id}`));

    if (!error && data) {
      for (const row of data) {
        const stampId = row.data_key.replace(STAMP_KEY_PREFIX, "") as StampId;
        if (stampId in counts) counts[stampId]++;
      }
    }
  } catch {
    // テーブルがなくてもゼロカウントで返す
  }

  return NextResponse.json({ counts });
}

/** スタンプ追加/削除: POST /api/apps/[id]/stamps */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  const userId = await getUserId();

  if (!userId) {
    // 未ログインは 200 で無視（localStorage側で管理）
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: { stampId?: StampId; action?: "add" | "remove" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { stampId, action } = body;
  if (!stampId || !STAMP_IDS.includes(stampId)) {
    return NextResponse.json({ error: "不正なstampId" }, { status: 400 });
  }

  const dataKey = `${STAMP_KEY_PREFIX}${stampId}`;

  if (action === "remove") {
    await supabase
      .from("app_user_data")
      .delete()
      .eq("user_id", userId)
      .eq("app_id", appId)
      .eq("data_key", dataKey);
  } else {
    await supabase.from("app_user_data").upsert(
      {
        user_id: userId,
        app_id: appId,
        data_key: dataKey,
        data_value: "true",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,app_id,data_key" }
    );
  }

  return NextResponse.json({ ok: true });
}
