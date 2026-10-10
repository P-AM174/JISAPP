import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * 開発スタジオで、コードではなく文章（プロンプト）を貼ったまま進めなかったときの記録（scripts/add-claim-and-stuck-prompts.sql）。
 * 運営が代わりにアプリにして、メールで届けるために使う。
 *
 * POST { prompt, locale?, requested?, email? }
 *   ・ログインしている人：自動で残す（スタジオと利用規約で知らせている）
 *   ・ログインしていない人：本人が「運営にアプリを作ってもらう」を押してメールアドレスを書いたときだけ残す
 * PATCH { id }：そのあと自分でアプリにできた（一覧に出さない）
 */
const MAX_PROMPT = 20000;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

async function sessionUser() {
  try {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string } | undefined)?.id;
    if (!id) return null;
    return prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: string; locale?: string; requested?: boolean; email?: string } | null;
  const prompt = (body?.prompt ?? "").trim().slice(0, MAX_PROMPT);
  if (prompt.length < 10) return NextResponse.json({ error: "内容が短すぎます" }, { status: 400 });
  const requested = body?.requested === true;
  const user = await sessionUser();
  const guestEmail = (body?.email ?? "").trim().toLowerCase();
  if (!user) {
    // ログインしていない人は、本人が頼んだときだけ（メールアドレスが必要）
    if (!requested || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) || guestEmail.length > 200) {
      return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
    }
  }

  const supabase = createServerSupabaseClient();
  const hash = sha(prompt);
  // 同じ人の同じ文章は、1日に1件にまとめる
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let q = supabase.from("studio_stuck_prompts").select("id, requested").eq("prompt_hash", hash).gte("created_at", since).limit(1);
  q = user ? q.eq("user_id", user.id) : q.eq("email", guestEmail);
  const { data: same, error: findError } = await q.maybeSingle();
  if (findError) return NextResponse.json({ ok: false }, { status: 503 });
  const now = new Date().toISOString();
  if (same) {
    if (requested && !same.requested) {
      await supabase.from("studio_stuck_prompts").update({ requested: true, resolved: false, updated_at: now }).eq("id", same.id);
    }
    return NextResponse.json({ ok: true, id: same.id });
  }
  const { data, error } = await supabase
    .from("studio_stuck_prompts")
    .insert({
      user_id: user?.id ?? null,
      email: user?.email ?? guestEmail,
      name: user?.name ?? null,
      prompt,
      prompt_hash: hash,
      locale: ["ja", "en", "vi"].includes(body?.locale ?? "") ? body?.locale : null,
      requested,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const supabase = createServerSupabaseClient();
  // 本人が頼んだものは、自分でできても運営の一覧に残す（頼まれたことには応える）
  await supabase.from("studio_stuck_prompts").update({ resolved: true, updated_at: new Date().toISOString() }).eq("id", id).eq("requested", false);
  return NextResponse.json({ ok: true });
}
