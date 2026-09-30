import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findCreatorUserId, listFollowing, setFollow } from "@/lib/follows/server";
import { notifyFollowed } from "@/lib/notifications/follow-notices";

async function getSessionUser() {
  try {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string } | undefined)?.id ?? null;
    return id ? { id, name: session?.user?.name ?? null } : null;
  } catch {
    return null;
  }
}

/** 自分がフォローしている作者: GET /api/follows */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const following = await listFollowing(user.id);
  // 表がまだない（scripts/add-creator-follows.sql 未実行）ときは available: false
  if (!following) return NextResponse.json({ available: false, following: [] });
  return NextResponse.json({ available: true, following });
}

/** フォローする・外す: POST /api/follows  body: { creatorName, follow } */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { creatorName?: string; follow?: boolean } | null;
  const creatorName = body?.creatorName?.trim();
  if (!creatorName || creatorName.length > 100 || typeof body?.follow !== "boolean") {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const result = await setFollow(user.id, creatorName, body.follow);
  if (!result.ok) return NextResponse.json({ error: "フォローを保存できませんでした" }, { status: 500 });

  // 新しくフォローしたときだけ作者に知らせる（自分自身は除く）
  if (result.added) {
    const creatorUserId = await findCreatorUserId(creatorName);
    if (creatorUserId && creatorUserId !== user.id) {
      await notifyFollowed({ creatorUserId, creatorName, followerName: user.name });
    }
  }
  return NextResponse.json({ ok: true, following: body.follow });
}
