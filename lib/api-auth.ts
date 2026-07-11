import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/** セッションからユーザーIDを取得する。未ログインなら null を返す。 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id ?? null;
}

/**
 * ログイン必須のAPI用ガード。
 * 未ログインなら 401 レスポンスを返す。
 * @returns ログイン済みなら userId 文字列、未ログインなら NextResponse（401）
 */
export async function requireAuth(): Promise<string | NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  return userId;
}
