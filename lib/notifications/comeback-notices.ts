import { Resend } from "resend";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/db";
import { OFFICIAL_CREATOR_NAME, getOfficialCreator } from "@/lib/agent/official-creator";

/**
 * 作った人が、またジサップに戻ってくるきっかけを作るお知らせ。
 * 調査（2026-10-15）：作者22人のうち、アプリを作った日のあとに戻ってきたのは6人だけだった。
 *
 * 1. notifyAppOpened：自分のアプリが開かれたら、ベルで知らせる（読むまでは1つにまとめて回数を数える）
 * 2. sendNextDayReminders：はじめてアプリを作った翌日に1回だけ「その後どうですか？」をベルとメールで送る
 */

/** タイトルから「何回目か」を読み取る（まとめた通知を数え直すため） */
function countFromTitle(title: string): number {
  const m = title.match(/が開かれました（(\d+)回）$/);
  return m ? Number(m[1]) : 1;
}

/**
 * 自分のアプリが開かれたことを作者に知らせる（ベルマーク）。
 * 作者自身が開いたとき・ゲストで公開したアプリ・運営のアプリでは知らせない。
 * まだ読んでいない同じアプリの通知があれば、新しく作らずに回数をまとめて1つにする
 */
export async function notifyAppOpened(params: { appId: string; openerId: string | null }): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: app } = await supabase
      .from("apps")
      .select("title, creator_id, creator_name, status")
      .eq("id", params.appId)
      .maybeSingle();
    if (!app?.creator_id || app.status !== "active" || app.creator_id === params.openerId) return;
    if (app.creator_name === OFFICIAL_CREATOR_NAME) return;

    const title = app.title || "アプリ";
    const href = `/apps/${params.appId}`;
    const { data: unread } = await supabase
      .from("user_notifications")
      .select("id, title")
      .eq("user_id", app.creator_id)
      .eq("type", "app_opened")
      .eq("href", href)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const existing = unread?.[0];
    if (existing) {
      const count = countFromTitle(existing.title as string) + 1;
      await supabase
        .from("user_notifications")
        .update({
          title: `あなたの「${title}」が開かれました（${count}回）`,
          created_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("user_notifications").insert({
      user_id: app.creator_id,
      type: "app_opened",
      title: `あなたの「${title}」が開かれました（1回）`,
      body: "誰かがあなたのアプリを使っています。直したくなったら、開発スタジオで上書きすると同じURLのまま新しくなります。",
      href,
    });
  } catch {
    /* 通知の失敗でアプリを開くのを止めない */
  }
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://jisapp.app";

/** 日本語の文字が入っているか（メールの言語を決めるため。アカウントに言語の記録がないので、アプリ名で判断する） */
const hasJapanese = (s: string) => /[぀-ヿ㐀-鿿]/.test(s);

/**
 * 翌日のメール（案B：くだけた感じ。10代〜20代の作者が多いため）。
 * 押しつけにならないよう、お礼と様子うかがいを中心にし、困ったことや「こうしたいけど、どうしたらいい？」を気軽に聞けるようにする
 */
function reminderMail(name: string | null, title: string, url: string, contactUrl: string, ja: boolean): { subject: string; text: string } {
  if (ja) {
    return {
      subject: `「${title}」、その後どうですか？`,
      text: [
        name ? `${name} さん` : "こんにちは！",
        "",
        `ジサップです。昨日は「${title}」を作ってくれて、ありがとうございます！`,
        "使ってみて、困ったことはありませんでしたか？",
        "",
        "ちょっとしたコツを置いておきますね。",
        "・ホーム画面に置くと、次からすぐ開けます",
        "・友だちに送ると、一緒に使えます",
        "・直したくなったら、上書きすればURLはそのまま",
        "",
        `アプリを開く：${url}`,
        "",
        "「こうしたいけど、どうしたらいい？」「ここがわかりにくい」「こんな機能がほしい」など、なんでも聞いてください。運営が答えます！",
        contactUrl,
        "",
        "ジサップ運営",
        "※このメールは、はじめてアプリを作った翌日に1回だけお送りしています。",
      ].join("\n"),
    };
  }
  return {
    subject: `How's “${title}” going?`,
    text: [
      name ? `Hi ${name},` : "Hi there,",
      "",
      `It's Jisapp. Thanks so much for making “${title}” yesterday!`,
      "Did you run into anything tricky while using it?",
      "",
      "A few quick tips:",
      "- Add it to your home screen to open it in one tap next time",
      "- Send it to friends so you can use it together",
      "- Want to change something? Update it and the URL stays the same",
      "",
      `Open your app: ${url}`,
      "",
      "“I want to do this, but how?”, “this part is confusing”, “I wish it had this feature” — ask us anything. The Jisapp team will reply!",
      contactUrl,
      "",
      "The Jisapp team",
      "* We send this email only once, the day after you make your first app.",
    ].join("\n"),
  };
}

/**
 * はじめてアプリを作った人に、翌日1回だけ「使ってみましたか？」を送る（ベル＋メール）。
 * 毎日1回、Cron から呼ぶ。作ってから24〜48時間のアプリが対象。
 * 一人に送るのは一生に1回だけ（type = "comeback" のお知らせがすでにある人には送らない）
 */
export async function sendNextDayReminders(): Promise<{ sent: number; emailed: number; error?: string }> {
  const supabase = createServerSupabaseClient();
  const now = Date.now();
  const from = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const to = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const { data: apps, error } = await supabase
    .from("apps")
    .select("id, title, creator_id, created_at")
    .eq("status", "active")
    .not("creator_id", "is", null)
    .gte("created_at", from)
    .lt("created_at", to)
    .order("created_at", { ascending: false });
  if (error) return { sent: 0, emailed: 0, error: error.message };

  const official = await getOfficialCreator().catch(() => null);
  // 一人につき、いちばん新しいアプリ1つ
  const latest = new Map<string, { id: string; title: string }>();
  for (const a of apps ?? []) {
    const cid = a.creator_id as string;
    if (official && cid === official.id) continue;
    if (!latest.has(cid)) latest.set(cid, { id: a.id as string, title: (a.title as string) || "アプリ" });
  }
  if (latest.size === 0) return { sent: 0, emailed: 0 };

  const { data: already } = await supabase
    .from("user_notifications")
    .select("user_id")
    .eq("type", "comeback")
    .in("user_id", [...latest.keys()]);
  const done = new Set((already ?? []).map((r) => r.user_id as string));

  let sent = 0;
  let emailed = 0;
  for (const [userId, app] of latest) {
    if (done.has(userId)) continue;
    const href = `/apps/${app.id}`;
    const { error: insertError } = await supabase.from("user_notifications").insert({
      user_id: userId,
      type: "comeback",
      title: `「${app.title}」、その後どうですか？`,
      body: "ホーム画面に置くと、次からすぐ開けます。「こうしたいけど、どうしたらいい？」など、困ったことは運営になんでも聞いてください。",
      href,
    });
    if (insertError) continue;
    sent++;

    if (!resend) continue;
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, usernameSet: true } });
      if (!user?.email) continue;
      const ja = hasJapanese(app.title);
      const name = (user.usernameSet && user.name?.trim()) || null;
      const url = `${SITE}${ja ? "" : "/en"}${href}`;
      const contactUrl = ja ? `${SITE}/?contact=1` : `${SITE}/en?contact=1`;
      const mail = reminderMail(name, app.title, url, contactUrl, ja);
      const { error: mailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "ジサップ <onboarding@resend.dev>",
        to: user.email,
        subject: mail.subject,
        text: mail.text,
      });
      if (!mailError) emailed++;
    } catch {
      /* メールが送れなくても、ベルのお知らせは残す */
    }
  }
  return { sent, emailed };
}
