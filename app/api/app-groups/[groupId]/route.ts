import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { db, findGroupById, newToken } from "@/lib/groups/server";

type Ctx = { params: Promise<{ groupId: string }> };

async function requireOwner(groupId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }) };
  const group = await findGroupById(groupId);
  if (!group) return { error: NextResponse.json({ error: "グループが見つかりません" }, { status: 404 }) };
  if (group.owner_id !== userId) {
    return { error: NextResponse.json({ error: "グループを作った人だけが操作できます" }, { status: 403 }) };
  }
  return { group };
}

/**
 * グループの管理（作った人だけ）: PATCH /api/app-groups/[groupId]
 * - regenerate_invite: 招待リンクを作り直す（古いリンクは使えなくなる。参加済みのメンバーはそのまま）
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { groupId } = await ctx.params;
  const result = await requireOwner(groupId);
  if ("error" in result) return result.error;

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "regenerate_invite") {
    return NextResponse.json({ error: "不明な操作です" }, { status: 400 });
  }

  const inviteToken = newToken(12);
  const { error } = await db().from("app_groups").update({ invite_token: inviteToken }).eq("id", groupId);
  if (error) return NextResponse.json({ error: "作り直せませんでした" }, { status: 500 });
  return NextResponse.json({ inviteToken });
}

/** グループを削除する（作った人だけ。共有データもすべて消える）: DELETE /api/app-groups/[groupId] */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { groupId } = await ctx.params;
  const result = await requireOwner(groupId);
  if ("error" in result) return result.error;

  const { error } = await db().from("app_groups").delete().eq("id", groupId);
  if (error) return NextResponse.json({ error: "削除できませんでした" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
