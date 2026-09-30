import { NextResponse } from "next/server";
import {
  GROUP_LIMITS,
  WRITE_LIMITS,
  allowWrite,
  authenticateMember,
  touchGroupActivity,
  db,
  findGroupById,
  isValidDataKey,
  toPublicGroup,
  toPublicMember,
  type GroupRow,
  type MemberRow,
} from "@/lib/groups/server";
import { APP_DATA_LIMITS, APP_DATA_LIMIT_MESSAGES, GROUP_QUOTA_MESSAGE, checkAppDataValue, utf8Bytes } from "@/lib/app-data-limits";
import { notifyGroupStorageAlmostFull, notifyGroupStorageFull } from "@/lib/notifications/storage-notices";

type Ctx = { params: Promise<{ groupId: string }> };

type Body = {
  memberKey?: string;
  op?: "me" | "group" | "get" | "set" | "list" | "add" | "remove" | "versions";
  key?: string;
  keys?: string[];
  /** JSON 文字列（アプリ側で JSON.stringify 済み） */
  value?: string;
  itemId?: string;
};

type ItemRow = { id: string; data_value: string; author_id: string | null; created_at: string };

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * 保存する値を確かめる（画像・動画でないか、グループの合計容量を超えないか）。
 * 問題があれば rejected にエラーの応答を入れて返す。almostFull は、保存後の合計が上限の8割を超えるとき true。
 * replacingKey：save で上書きするキー（その分は合計から除く）。add のときは null
 */
async function checkGroupValue(
  client: ReturnType<typeof db>,
  group: GroupRow,
  value: string,
  replacingKey: string | null
): Promise<{ rejected: NextResponse | null; almostFull: boolean }> {
  const problem = checkAppDataValue(value);
  if (problem) return { rejected: fail(APP_DATA_LIMIT_MESSAGES[problem], problem === "media_not_allowed" ? 415 : 413), almostFull: false };
  const { data: used, error } = await client.rpc("app_group_data_bytes", { p_group_id: group.id, p_data_key: replacingKey });
  if (error) {
    // 集計用の SQL（scripts/add-app-data-limits.sql）がまだ無いときは、保存は止めずに記録だけ残す
    console.error("[app-groups data] usage", error.message);
    return { rejected: null, almostFull: false };
  }
  const total = Number(used ?? 0) + utf8Bytes(value);
  if (total > APP_DATA_LIMITS.groupBytes) {
    await notifyGroupStorageFull(group.owner_id, group.app_id, group.id, group.name);
    return { rejected: fail(GROUP_QUOTA_MESSAGE, 507), almostFull: false };
  }
  const almostFull = total > APP_DATA_LIMITS.groupBytes * APP_DATA_LIMITS.warnRatio;
  // もうすぐいっぱいなら、グループを作った人のベルマークに届ける（30日に1回）
  if (almostFull) await notifyGroupStorageAlmostFull(group.owner_id, group.app_id, group.id, group.name, total);
  return { rejected: null, almostFull };
}

/**
 * グループの共有データ: POST /api/app-groups/[groupId]/data
 * アプリの window.Zisup.shared.* から、ジサップの画面（ブリッジ）経由で呼ばれる。
 */
export async function POST(req: Request, ctx: Ctx) {
  const { groupId } = await ctx.params;
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("不正なリクエストです");
  }

  const group = await findGroupById(groupId);
  if (!group) return fail("グループが見つかりません。削除された可能性があります", 404);

  const member = await authenticateMember(groupId, body.memberKey);
  if (!member) return fail("このグループのメンバーではありません。招待リンクから参加し直してください", 403);

  const client = db();

  // 書き込みが多すぎるときは断る（荒らし・誤作動の無限ループ対策）
  if ((body.op === "set" || body.op === "add" || body.op === "remove") && !allowWrite(member.id)) {
    return fail("書き込みが多すぎます。少し待ってからもう一度試してください", 429);
  }

  // 使われていることを記録（長く使われていないグループの自動削除用。確認だけの versions は除く）
  if (body.op !== "versions") {
    await touchGroupActivity(groupId).catch(() => {});
  }

  switch (body.op) {
    case "me":
      return NextResponse.json({ result: toPublicMember(member) });

    case "group":
      return NextResponse.json({ result: toPublicGroup(group) });

    case "get": {
      if (!isValidDataKey(body.key)) return fail("キー名は英数字で64文字以内にしてください");
      const { data } = await client
        .from("app_group_values")
        .select("data_value")
        .eq("group_id", groupId)
        .eq("data_key", body.key)
        .maybeSingle();
      return NextResponse.json({ result: data ? parseValue(data.data_value as string) : null });
    }

    case "set": {
      if (!isValidDataKey(body.key)) return fail("キー名は英数字で64文字以内にしてください");
      const value = typeof body.value === "string" ? body.value : "null";
      if (value.length > GROUP_LIMITS.valueChars) return fail("データが大きすぎます");
      const { rejected, almostFull } = await checkGroupValue(client, group, value, body.key);
      if (rejected) return rejected;
      const { error } = await client.from("app_group_values").upsert(
        {
          group_id: groupId,
          data_key: body.key,
          data_value: value,
          updated_by: member.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_id,data_key" }
      );
      if (error) return fail("保存できませんでした", 500);
      return NextResponse.json({ result: parseValue(value), warning: almostFull ? "group" : null });
    }

    case "list": {
      if (!isValidDataKey(body.key)) return fail("キー名は英数字で64文字以内にしてください");
      const { data: items } = await client
        .from("app_group_items")
        .select("id, data_value, author_id, created_at")
        .eq("group_id", groupId)
        .eq("data_key", body.key)
        .order("created_at", { ascending: true })
        .limit(GROUP_LIMITS.itemsPerKey);
      const { data: members } = await client
        .from("app_group_members")
        .select("id, display_name")
        .eq("group_id", groupId);
      const names = new Map(((members ?? []) as { id: string; display_name: string }[]).map((m) => [m.id, m.display_name]));
      return NextResponse.json({
        result: ((items ?? []) as ItemRow[]).map((item) => toItem(item, member, names)),
      });
    }

    case "add": {
      if (!isValidDataKey(body.key)) return fail("キー名は英数字で64文字以内にしてください");
      const value = typeof body.value === "string" ? body.value : "null";
      if (value.length > GROUP_LIMITS.valueChars) return fail("データが大きすぎます");
      const { rejected, almostFull } = await checkGroupValue(client, group, value, null);
      if (rejected) return rejected;
      const { count } = await client
        .from("app_group_items")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("data_key", body.key);
      if ((count ?? 0) >= GROUP_LIMITS.itemsPerKey) return fail("これ以上追加できません（上限に達しました）");
      const minuteAgo = new Date(Date.now() - 60_000).toISOString();
      const [{ count: recent }, { count: total }] = await Promise.all([
        client
          .from("app_group_items")
          .select("id", { count: "exact", head: true })
          .eq("author_id", member.id)
          .gt("created_at", minuteAgo),
        client.from("app_group_items").select("id", { count: "exact", head: true }).eq("group_id", groupId),
      ]);
      if ((recent ?? 0) >= WRITE_LIMITS.addsPerMinute) {
        return fail("追加が多すぎます。1分ほど待ってからもう一度試してください", 429);
      }
      if ((total ?? 0) >= WRITE_LIMITS.itemsPerGroup) {
        return fail("このグループのデータがいっぱいです。不要な項目を消してください");
      }
      const { data, error } = await client
        .from("app_group_items")
        .insert({ group_id: groupId, data_key: body.key, data_value: value, author_id: member.id })
        .select("id, data_value, author_id, created_at")
        .single();
      if (error || !data) return fail("追加できませんでした", 500);
      return NextResponse.json({
        result: toItem(data as ItemRow, member, new Map([[member.id, member.display_name]])),
        warning: almostFull ? "group" : null,
      });
    }

    case "remove": {
      if (!isValidDataKey(body.key) || typeof body.itemId !== "string") return fail("削除する項目が指定されていません");
      const { data: item } = await client
        .from("app_group_items")
        .select("id, author_id")
        .eq("id", body.itemId)
        .eq("group_id", groupId)
        .eq("data_key", body.key)
        .maybeSingle();
      if (!item) return NextResponse.json({ result: false });
      // 自分の項目だけ消せる。グループを作った人はすべて消せる
      if (item.author_id !== member.id && !member.is_owner) return fail("他の人の項目は消せません", 403);
      const { error } = await client.from("app_group_items").delete().eq("id", body.itemId);
      if (error) return fail("削除できませんでした", 500);
      return NextResponse.json({ result: true });
    }

    case "versions": {
      // 他のメンバーの更新を見つけるための「版」。変わったキーだけアプリに知らせる
      const keys = (Array.isArray(body.keys) ? body.keys : []).filter(isValidDataKey).slice(0, 20);
      const versions: Record<string, string> = {};
      for (const key of keys) {
        const [{ data: value }, { data: latest, count }] = await Promise.all([
          client.from("app_group_values").select("updated_at").eq("group_id", groupId).eq("data_key", key).maybeSingle(),
          client
            .from("app_group_items")
            .select("created_at", { count: "exact" })
            .eq("group_id", groupId)
            .eq("data_key", key)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);
        const newest = (latest as { created_at: string }[] | null)?.[0]?.created_at ?? "";
        versions[key] = `${value?.updated_at ?? ""}|${count ?? 0}|${newest}`;
      }
      return NextResponse.json({ result: versions });
    }

    default:
      return fail("不明な操作です");
  }
}

function toItem(item: ItemRow, me: MemberRow, names: Map<string, string>) {
  return {
    id: item.id,
    value: parseValue(item.data_value),
    author: item.author_id ? { id: item.author_id, name: names.get(item.author_id) ?? "退出したメンバー" } : null,
    createdAt: item.created_at,
    mine: item.author_id === me.id,
  };
}
