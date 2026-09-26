import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { findGroupById, reissueMemberForUser, toPublicGroup, toPublicMember } from "@/lib/groups/server";

type Ctx = { params: Promise<{ groupId: string }> };

/**
 * ログインしている人が、別の端末でも同じメンバーとしてグループに戻る:
 * POST /api/app-groups/[groupId]/rejoin
 */
export async function POST(_req: Request, ctx: Ctx) {
  const { groupId } = await ctx.params;
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const group = await findGroupById(groupId);
  if (!group) return NextResponse.json({ error: "グループが見つかりません" }, { status: 404 });

  const reissued = await reissueMemberForUser({ groupId, userId });
  if (!reissued) {
    return NextResponse.json({ error: "このグループのメンバーではありません。招待リンクから参加してください" }, { status: 403 });
  }

  return NextResponse.json({
    group: toPublicGroup(group),
    member: toPublicMember(reissued.member),
    memberKey: reissued.memberKey,
    // 作った人には招待リンクも返す（メンバーを招待し直せるように）
    inviteToken: group.owner_id === userId ? group.invite_token : undefined,
  });
}
