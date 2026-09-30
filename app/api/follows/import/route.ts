import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importFollows } from "@/lib/follows/server";

/**
 * この端末に残っていたフォローを、ログインしたアカウントに移す: POST /api/follows/import  body: { creatorNames }
 * お知らせは送らない（昔のフォローをまとめて移すだけなので）
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { creatorNames?: unknown } | null;
  const names = Array.isArray(body?.creatorNames)
    ? body.creatorNames.filter((n): n is string => typeof n === "string" && n.trim().length > 0 && n.length <= 100)
    : [];
  const ok = await importFollows(userId, names);
  if (!ok) return NextResponse.json({ error: "フォローを保存できませんでした" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
