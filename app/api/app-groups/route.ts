import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import {
  GROUP_LIMITS,
  cleanName,
  createMember,
  db,
  newToken,
  toPublicGroup,
  toPublicMember,
  type GroupRow,
} from "@/lib/groups/server";

/** グループを作る: POST /api/app-groups  （作る人だけログインが必要） */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "グループを作るにはログインが必要です" }, { status: 401 });
  }

  let body: { appId?: string; name?: string; displayName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const appId = typeof body.appId === "string" ? body.appId.trim() : "";
  const name = cleanName(body.name, GROUP_LIMITS.groupName);
  const displayName = cleanName(body.displayName, GROUP_LIMITS.displayName);
  if (!appId || !name || !displayName) {
    return NextResponse.json({ error: "グループ名と表示名を入力してください" }, { status: 400 });
  }

  const { data: app } = await db().from("apps").select("id, status").eq("id", appId).maybeSingle();
  if (!app || app.status !== "active") {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  const { data: group, error } = await db()
    .from("app_groups")
    .insert({ app_id: appId, owner_id: userId, name, invite_token: newToken(12) })
    .select("*")
    .single();
  if (error || !group) {
    console.error("[app-groups POST]", error);
    return NextResponse.json({ error: "グループを作れませんでした" }, { status: 500 });
  }

  const { member, memberKey } = await createMember({
    groupId: (group as GroupRow).id,
    displayName,
    userId,
    isOwner: true,
  });

  return NextResponse.json({
    group: toPublicGroup(group as GroupRow),
    inviteToken: (group as GroupRow).invite_token,
    member: toPublicMember(member),
    memberKey,
  });
}

/**
 * 自分のグループの一覧: GET /api/app-groups?appId=xxx
 * 作ったグループと、ログインした状態で参加したグループ（別の端末から戻るため）
 */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ groups: [] });

  const appId = new URL(req.url).searchParams.get("appId")?.trim();
  if (!appId) return NextResponse.json({ error: "appId が必要です" }, { status: 400 });

  const { data: memberships } = await db()
    .from("app_group_members")
    .select("group_id")
    .eq("user_id", userId);
  const joinedIds = [...new Set(((memberships ?? []) as { group_id: string }[]).map((m) => m.group_id))];

  const { data: owned } = await db().from("app_groups").select("*").eq("app_id", appId).eq("owner_id", userId);
  const { data: joined } = joinedIds.length
    ? await db().from("app_groups").select("*").eq("app_id", appId).in("id", joinedIds)
    : { data: [] as GroupRow[] };

  const byId = new Map<string, GroupRow>();
  for (const g of [...((owned ?? []) as GroupRow[]), ...((joined ?? []) as GroupRow[])]) byId.set(g.id, g);

  return NextResponse.json({
    groups: [...byId.values()]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((g) => ({ ...toPublicGroup(g), isOwner: g.owner_id === userId })),
  });
}
