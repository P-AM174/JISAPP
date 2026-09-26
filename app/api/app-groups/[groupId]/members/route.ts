import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { db, requireGroupOwner } from "@/lib/groups/server";

type Ctx = { params: Promise<{ groupId: string }> };

/** メンバー一覧（作った人だけ）: GET /api/app-groups/[groupId]/members */
export async function GET(_req: Request, ctx: Ctx) {
  const { groupId } = await ctx.params;
  const owner = await requireGroupOwner(groupId, await getSessionUserId());
  if ("error" in owner) return NextResponse.json({ error: owner.error }, { status: owner.status });

  const { data } = await db()
    .from("app_group_members")
    .select("id, display_name, is_owner, user_id, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    members: ((data ?? []) as {
      id: string;
      display_name: string;
      is_owner: boolean;
      user_id: string | null;
      created_at: string;
    }[]).map((m) => ({
      id: m.id,
      name: m.display_name,
      isOwner: m.is_owner,
      loggedIn: !!m.user_id,
      joinedAt: m.created_at,
    })),
  });
}

/**
 * メンバーを外す（作った人だけ）: DELETE /api/app-groups/[groupId]/members?memberId=xxx
 * 外した人の鍵は使えなくなる。その人の書き込みは「退出したメンバー」として残る。
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const { groupId } = await ctx.params;
  const owner = await requireGroupOwner(groupId, await getSessionUserId());
  if ("error" in owner) return NextResponse.json({ error: owner.error }, { status: owner.status });

  const memberId = new URL(req.url).searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "外すメンバーが指定されていません" }, { status: 400 });

  const { data: member } = await db()
    .from("app_group_members")
    .select("id, is_owner")
    .eq("id", memberId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "メンバーが見つかりません" }, { status: 404 });
  if (member.is_owner) return NextResponse.json({ error: "グループを作った人は外せません" }, { status: 400 });

  const { error } = await db().from("app_group_members").delete().eq("id", memberId);
  if (error) return NextResponse.json({ error: "外せませんでした" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
