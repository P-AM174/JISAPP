import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { touchAppLastAccessed } from "@/lib/apps/access";
import { recordUserAppOpen } from "@/lib/apps/user-opens";

/**
 * アプリを開いたことを記録する: POST /api/apps/:id/touch  body: { count?: boolean }
 * count が false のとき（同じタブで開き直したとき）は回数を数えず、自分の「最後に開いた日時」だけ更新する
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { count?: boolean };
  const count = body.count !== false;

  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id?: string })?.id ?? null;
  } catch {
    /* 未ログインとして扱う */
  }

  await Promise.all([
    count ? touchAppLastAccessed(id) : Promise.resolve(),
    userId ? recordUserAppOpen(userId, id, count) : Promise.resolve(),
  ]);
  return NextResponse.json({ ok: true });
}
