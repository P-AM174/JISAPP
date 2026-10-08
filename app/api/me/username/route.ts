import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { validateUsername } from "@/lib/services/store";

/**
 * ジサップで表示する名前を決める・変える: POST /api/me/username  { name }
 * 公開済みのアプリの作者名・リクエストへの返信の名前・フォローも新しい名前にそろえる
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = (body?.name ?? "").normalize("NFKC").trim();
  const problem = await validateUsername(name, userId);
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, isOfficial: true } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }
  if (user.isOfficial) {
    return NextResponse.json({ error: "公式アカウントの名前は変えられません" }, { status: 400 });
  }

  const oldName = user.name?.trim() ?? "";
  await prisma.user.update({ where: { id: userId }, data: { name, usernameSet: true } });

  // 公開済みのものにも新しい名前を反映する（失敗しても名前の変更自体は成功として返す）
  const supabase = createServerSupabaseClient();
  try {
    await supabase.from("apps").update({ creator_name: name }).eq("creator_id", userId);
    await supabase.from("app_request_responses").update({ creator_name: name }).eq("user_id", userId);
    if (oldName && oldName !== name) {
      // フォローは作者名でつながっている。前の名前をほかの人が使っていなければ、新しい名前に付け替える
      const { count } = await supabase
        .from("apps")
        .select("id", { count: "exact", head: true })
        .eq("creator_name", oldName)
        .neq("status", "deleted");
      if (!count) {
        await supabase.from("creator_follows").update({ creator_name: name }).eq("creator_name", oldName);
      }
    }
  } catch (e) {
    console.error("[me/username] propagate", e);
  }

  return NextResponse.json({ ok: true, name });
}
