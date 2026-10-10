import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { hashClaimToken } from "@/lib/apps/claim";

const LIBRARY_KEY = "__in_library__";

/**
 * ゲストで公開したアプリを、ログインした本人の作品として引き継ぐ: POST /api/apps/claim
 * body: { items: [{ appId, token }] }（公開したときに端末に残した引き継ぎの印）
 * 返り値: claimed（引き継いだアプリ）・invalid（もう引き継げない印。端末から消してよい）
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, usernameSet: true } });
  if (!me?.usernameSet || !me.name?.trim()) {
    return NextResponse.json({ error: "先に、ジサップで表示する名前を決めてください", needUsername: true }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as { items?: { appId?: string; token?: string }[] } | null;
  const items = (body?.items ?? [])
    .filter((x) => typeof x?.appId === "string" && /^[0-9a-f-]{36}$/i.test(x.appId) && typeof x.token === "string" && x.token.length >= 32)
    .slice(0, 20);

  const supabase = createServerSupabaseClient();
  const claimed: { id: string; title: string }[] = [];
  const invalid: string[] = [];
  for (const item of items) {
    const appId = item.appId as string;
    const { data: app } = await supabase
      .from("apps")
      .select("id, title, description, html_code, css_code, js_code, category, is_listed, creator_id, claim_token_hash, status")
      .eq("id", appId)
      .maybeSingle();
    if (!app || app.status === "deleted" || app.creator_id || !app.claim_token_hash || app.claim_token_hash !== hashClaimToken(item.token as string)) {
      invalid.push(appId);
      continue;
    }
    const now = new Date().toISOString();
    // 印が正しいときだけ、作者を本人にする（作者がまだいないアプリだけ）
    const { data: updated, error } = await supabase
      .from("apps")
      .update({ creator_id: userId, creator_name: me.name.trim(), claim_token_hash: null })
      .eq("id", appId)
      .is("creator_id", null)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      invalid.push(appId);
      continue;
    }
    // マイプロジェクトとマイライブラリにも入れる（ログインして公開したときと同じ）
    await supabase.from("user_projects").insert({
      user_id: userId,
      title: app.title,
      description: app.description,
      html_code: app.html_code,
      css_code: app.css_code,
      js_code: app.js_code,
      app_id: appId,
      status: app.is_listed ? "listed" : "url_only",
      is_listed: !!app.is_listed,
      category: app.category,
      updated_at: now,
    });
    await supabase.from("app_user_data").upsert(
      { user_id: userId, app_id: appId, data_key: LIBRARY_KEY, data_value: JSON.stringify({ name: app.title, category: app.category ?? null, addedAt: now }), updated_at: now },
      { onConflict: "user_id,app_id,data_key" }
    );
    claimed.push({ id: appId, title: app.title });
  }
  return NextResponse.json({ claimed, invalid });
}
