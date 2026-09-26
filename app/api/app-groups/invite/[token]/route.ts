import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import {
  GROUP_LIMITS,
  cleanName,
  createMember,
  db,
  findGroupByInvite,
  reissueMemberForUser,
  toPublicGroup,
  toPublicMember,
} from "@/lib/groups/server";

type Ctx = { params: Promise<{ token: string }> };

/** 招待リンクのグループ情報: GET /api/app-groups/invite/[token] */
export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const group = await findGroupByInvite(token);
  if (!group) {
    return NextResponse.json({ error: "招待リンクが無効です。管理者に新しいリンクをもらってください" }, { status: 404 });
  }
  const { count } = await db()
    .from("app_group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);
  const { data: app } = await db().from("apps").select("title").eq("id", group.app_id).maybeSingle();

  return NextResponse.json({
    group: toPublicGroup(group),
    appTitle: (app?.title as string | undefined) ?? "",
    memberCount: count ?? 0,
  });
}

/** 招待リンクから参加する（ログイン不要）: POST /api/app-groups/invite/[token] */
export async function POST(req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const group = await findGroupByInvite(token);
  if (!group) {
    return NextResponse.json({ error: "招待リンクが無効です。管理者に新しいリンクをもらってください" }, { status: 404 });
  }

  let body: { displayName?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const displayName = cleanName(body.displayName, GROUP_LIMITS.displayName);
  const userId = await getSessionUserId().catch(() => null);

  // ログインしていて、すでにメンバーなら同じメンバーとして使う（別の端末でも同じ人になる）
  if (userId) {
    const reissued = await reissueMemberForUser({ groupId: group.id, userId, displayName: displayName || undefined });
    if (reissued) {
      return NextResponse.json({
        group: toPublicGroup(group),
        member: toPublicMember(reissued.member),
        memberKey: reissued.memberKey,
      });
    }
  }

  if (!displayName) {
    return NextResponse.json({ error: "表示名を入力してください" }, { status: 400 });
  }

  const { member, memberKey } = await createMember({
    groupId: group.id,
    displayName,
    userId,
    isOwner: userId === group.owner_id,
  });

  return NextResponse.json({
    group: toPublicGroup(group),
    member: toPublicMember(member),
    memberKey,
  });
}
