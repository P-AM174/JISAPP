import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { normalizeFields } from "@/lib/i18n/text";
import { prisma } from "@/lib/db";
import {
  GROUP_LIMITS,
  cleanName,
  createMember,
  db,
  findGroupByInvite,
  listGuestMembers,
  reclaimGuestMember,
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
  // 前に参加した人が入り直せるよう、ログインしないで参加したメンバーの名前を返す（招待リンクを持っている人だけが見られる）
  const guests = await listGuestMembers(group.id);

  return NextResponse.json({
    group: toPublicGroup(group),
    appTitle: (app?.title as string | undefined) ?? "",
    memberCount: count ?? 0,
    guests,
  });
}

/** 招待リンクから参加する（ログイン不要）: POST /api/app-groups/invite/[token] */
export async function POST(req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const group = await findGroupByInvite(token);
  if (!group) {
    return NextResponse.json({ error: "招待リンクが無効です。管理者に新しいリンクをもらってください" }, { status: 404 });
  }

  let body: { displayName?: string; reclaimMemberId?: string };
  try {
    body = normalizeFields(await req.json());
  } catch {
    body = {};
  }
  let displayName = cleanName(body.displayName, GROUP_LIMITS.displayName);
  const userId = await getSessionUserId().catch(() => null);

  // 前に参加した人として入り直す（ブラウザの保存が消えた・別のブラウザで開いたとき）
  if (typeof body.reclaimMemberId === "string" && body.reclaimMemberId) {
    const reclaimed = await reclaimGuestMember({ groupId: group.id, memberId: body.reclaimMemberId, userId });
    if (!reclaimed) {
      return NextResponse.json({ error: "そのメンバーとしては入り直せませんでした。名前を入れて参加してください" }, { status: 409 });
    }
    return NextResponse.json({
      group: toPublicGroup(group),
      member: toPublicMember(reclaimed.member),
      memberKey: reclaimed.memberKey,
    });
  }

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

  // ログインしている人は、名前を聞かずにアカウントの名前で参加する
  if (!displayName && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }).catch(() => null);
    displayName = cleanName(user?.name ?? "", GROUP_LIMITS.displayName);
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
