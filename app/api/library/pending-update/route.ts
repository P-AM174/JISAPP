import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  acceptPendingUpdate,
  declinePendingUpdate,
  getPendingUpdate,
  snapshotFromLiveApp,
} from "@/lib/library/pending-updates";
import { userHasInLibrary } from "@/lib/library/snapshots";

/** 保留中のアップデート取得: GET /api/library/pending-update?appId=xxx */
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const appId = new URL(req.url).searchParams.get("appId");
  if (!appId) {
    return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const pending = await getPendingUpdate(supabase, userId, appId);
  return NextResponse.json({ pending });
}

/** アップデート承認/却下: POST /api/library/pending-update */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: { appId?: string; action?: "accept" | "decline" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const appId = (body.appId ?? "").trim();
  const action = body.action;
  if (!appId || !action || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "appId と action が必要です" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const inLibrary = await userHasInLibrary(supabase, userId, appId);
  if (!inLibrary) {
    return NextResponse.json({ error: "マイライブラリに登録されていません" }, { status: 403 });
  }

  if (action === "decline") {
    const result = await declinePendingUpdate(supabase, userId, appId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action: "decline" });
  }

  const liveSnapshot = await snapshotFromLiveApp(supabase, appId);
  if (!liveSnapshot) {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  const result = await acceptPendingUpdate(supabase, userId, appId, liveSnapshot);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, action: "accept" });
}

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}
