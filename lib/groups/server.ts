import { createHash, randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * アプリのグループ共有（サーバー側）。
 * メンバーはログインなしで参加できるため、参加時に渡す秘密の鍵（member key）で本人を確認する。
 * DB には鍵そのものではなくハッシュだけを保存する。
 */

export const GROUP_LIMITS = {
  /** 1つの値・項目の最大文字数 */
  valueChars: 100_000,
  /** 1つのキーに追加できる項目の数 */
  itemsPerKey: 2_000,
  groupName: 40,
  displayName: 20,
};

const KEY_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;

export function isValidDataKey(key: unknown): key is string {
  return typeof key === "string" && KEY_PATTERN.test(key);
}

export function newToken(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashMemberKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function cleanName(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export type GroupRow = {
  id: string;
  app_id: string;
  owner_id: string;
  name: string;
  invite_token: string;
  created_at: string;
};

export type MemberRow = {
  id: string;
  group_id: string;
  display_name: string;
  user_id: string | null;
  is_owner: boolean;
};

export function db() {
  return createServerSupabaseClient();
}

export async function findGroupById(groupId: string): Promise<GroupRow | null> {
  const { data } = await db().from("app_groups").select("*").eq("id", groupId).maybeSingle();
  return (data as GroupRow | null) ?? null;
}

export async function findGroupByInvite(token: string): Promise<GroupRow | null> {
  const { data } = await db().from("app_groups").select("*").eq("invite_token", token).maybeSingle();
  return (data as GroupRow | null) ?? null;
}

/** 鍵からメンバーを特定する。グループが違う・鍵が違うときは null */
export async function authenticateMember(groupId: string, memberKey: unknown): Promise<MemberRow | null> {
  if (typeof memberKey !== "string" || memberKey.length < 16) return null;
  const { data } = await db()
    .from("app_group_members")
    .select("id, group_id, display_name, user_id, is_owner")
    .eq("group_id", groupId)
    .eq("member_key_hash", hashMemberKey(memberKey))
    .maybeSingle();
  return (data as MemberRow | null) ?? null;
}

/** 新しいメンバー（または鍵を作り直したメンバー）を登録し、鍵を返す */
export async function createMember(input: {
  groupId: string;
  displayName: string;
  userId: string | null;
  isOwner: boolean;
}): Promise<{ member: MemberRow; memberKey: string }> {
  const memberKey = newToken(24);
  const { data, error } = await db()
    .from("app_group_members")
    .insert({
      group_id: input.groupId,
      member_key_hash: hashMemberKey(memberKey),
      display_name: input.displayName,
      user_id: input.userId,
      is_owner: input.isOwner,
    })
    .select("id, group_id, display_name, user_id, is_owner")
    .single();
  if (error || !data) throw new Error(error?.message ?? "メンバーを登録できませんでした");
  return { member: data as MemberRow, memberKey };
}

/** ログインしている人がすでにメンバーなら、鍵を作り直して同じメンバーとして使う（別の端末でも同じ人になる） */
export async function reissueMemberForUser(input: {
  groupId: string;
  userId: string;
  displayName?: string;
}): Promise<{ member: MemberRow; memberKey: string } | null> {
  const { data: existing } = await db()
    .from("app_group_members")
    .select("id, group_id, display_name, user_id, is_owner")
    .eq("group_id", input.groupId)
    .eq("user_id", input.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!existing) return null;

  const memberKey = newToken(24);
  const update: Record<string, string> = { member_key_hash: hashMemberKey(memberKey) };
  if (input.displayName) update.display_name = input.displayName;
  const { data, error } = await db()
    .from("app_group_members")
    .update(update)
    .eq("id", (existing as MemberRow).id)
    .select("id, group_id, display_name, user_id, is_owner")
    .single();
  if (error || !data) return null;
  return { member: data as MemberRow, memberKey };
}

export function toPublicGroup(group: GroupRow) {
  return { id: group.id, appId: group.app_id, name: group.name };
}

export function toPublicMember(member: MemberRow) {
  return { id: member.id, name: member.display_name, isOwner: member.is_owner };
}
