import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { looksLikePrompt } from "@/lib/playground/code-cleanup";
import { hashClaimToken, newClaimToken } from "@/lib/apps/claim";
import { isReservedOfficialName } from "@/lib/official-name";
import { GUEST_NICKNAME_MAX, guestNickname, withGuestMark } from "@/lib/guest-name";
import { prisma } from "@/lib/db";
import { OFFICIAL_CREATOR_NAME, getOfficialCreator } from "@/lib/agent/official-creator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  snapshotFromAppRow,
  upsertLibrarySnapshot,
} from "@/lib/library/snapshots";
import { normalizeFields } from "@/lib/i18n/text";
import { codeHash, codeSimilarity, normalizeCode, normalizeTitle, titleSimilarity } from "@/lib/apps/code-hash";
import { notifyRemixed } from "@/lib/notifications/remix-notices";
import {
  queueLibraryUpdatesOnRepublish,
} from "@/lib/library/pending-updates";

const MAX_CODE_BYTES = 512 * 1024; // 512KB
const LIBRARY_KEY = "__in_library__";

async function addAppToUserLibrary(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  appId: string,
  meta: { name: string; category?: string | null }
) {
  await supabase.from("app_user_data").upsert(
    {
      user_id: userId,
      app_id: appId,
      data_key: LIBRARY_KEY,
      data_value: JSON.stringify({
        name: meta.name,
        category: meta.category ?? null,
        addedAt: new Date().toISOString(),
      }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,app_id,data_key" }
  );
}

async function userOwnsApp(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  appId: string,
  projectId?: string
): Promise<boolean> {
  if (projectId) {
    const { data } = await supabase
      .from("user_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .eq("app_id", appId)
      .maybeSingle();
    if (data) return true;
  }

  const { data: byProject } = await supabase
    .from("user_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();
  if (byProject) return true;

  const { data: byCreator } = await supabase
    .from("apps")
    .select("id")
    .eq("id", appId)
    .eq("creator_id", userId)
    .maybeSingle();
  return !!byCreator;
}

/**
 * 同じ人が公開している別のアプリに、まったく同じコードのものがあれば返す。
 * 開発スタジオのプレビュー用に作られる下書きのアプリは対象外（出品・URL発行したものだけ比べる）
 */
async function findSameCodeApp(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  code: string,
  excludeAppId: string | null
): Promise<{ id: string; title: string } | null> {
  const { data: published } = await supabase
    .from("user_projects")
    .select("app_id")
    .eq("user_id", userId)
    .in("status", ["listed", "url_only"])
    .not("app_id", "is", null);
  const appIds = [...new Set((published ?? []).map((p) => p.app_id as string))].filter(
    (id) => id !== excludeAppId
  );
  if (appIds.length === 0) return null;

  const { data } = await supabase
    .from("apps")
    .select("id, title, html_code, css_code, js_code")
    .in("id", appIds)
    .eq("creator_id", userId)
    .eq("status", "active");
  const same = (data ?? []).find(
    (a) => normalizeCode(a.html_code ?? "", a.css_code, a.js_code) === code
  );
  return same ? { id: same.id as string, title: (same.title as string) ?? "" } : null;
}

/**
 * 同じ人が、同じ名前のアプリをすでに公開していれば返す（出品・URL発行したものだけ。上書きする本人のアプリは除く）。
 * 出品ルール：同じ人が同じ名前のアプリを重ねて出すことはできない。上書きするか、名前を変えてもらう
 */
async function findSameTitleApp(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  title: string,
  excludeAppId: string | null
): Promise<{ appId: string; projectId: string | null; title: string } | null> {
  const { data: published } = await supabase
    .from("user_projects")
    .select("id, app_id")
    .eq("user_id", userId)
    .in("status", ["listed", "url_only"])
    .not("app_id", "is", null);
  const projectOf = new Map<string, string>();
  for (const p of published ?? []) if (p.app_id && p.app_id !== excludeAppId) projectOf.set(p.app_id as string, p.id as string);
  if (projectOf.size === 0) return null;
  const { data } = await supabase
    .from("apps")
    .select("id, title")
    .in("id", [...projectOf.keys()])
    .eq("creator_id", userId)
    .eq("status", "active");
  const want = normalizeTitle(title);
  const same = (data ?? []).find((a) => normalizeTitle((a.title as string) ?? "") === want);
  return same ? { appId: same.id as string, projectId: projectOf.get(same.id as string) ?? null, title: (same.title as string) ?? "" } : null;
}

/**
 * 同じ人が公開している、似たアプリ（名前が似ている、またはコードの多くが同じ）を返す。
 * 調査（2026-10-15）：直すたびに新しく公開して、1日に14個出した人がいた。URL が変わると、送ったリンクが古いまま残る。
 * 似たアプリがあれば「上書き（URL はそのまま）」を勧める。本人が「別のアプリとして公開」を選べばそのまま出せる
 */
async function findSimilarOwnApp(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  title: string,
  html: string
): Promise<{ appId: string; projectId: string | null; title: string } | null> {
  const { data: published } = await supabase
    .from("user_projects")
    .select("id, app_id")
    .eq("user_id", userId)
    .in("status", ["listed", "url_only"])
    .not("app_id", "is", null);
  const projectOf = new Map<string, string>();
  for (const p of published ?? []) if (p.app_id) projectOf.set(p.app_id as string, p.id as string);
  if (projectOf.size === 0) return null;
  const { data } = await supabase
    .from("apps")
    .select("id, title, html_code, created_at")
    .in("id", [...projectOf.keys()])
    .eq("creator_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);
  let best: { id: string; title: string; score: number } | null = null;
  for (const a of data ?? []) {
    const t = titleSimilarity(title, (a.title as string) ?? "");
    const c = codeSimilarity(html, (a.html_code as string) ?? "");
    const score = Math.max(t >= 0.5 ? t : 0, c >= 0.45 ? c : 0);
    if (score > 0 && (!best || score > best.score)) best = { id: a.id as string, title: (a.title as string) ?? "", score };
  }
  return best ? { appId: best.id, projectId: projectOf.get(best.id) ?? null, title: best.title } : null;
}

/**
 * 誰かがマーケットに出品しているアプリに、まったく同じコードのものがあれば返す（出品するときだけ調べる）。
 * 出品ルール：まったく同じコードのアプリは、作者に関係なく出品できない（URL だけの公開は対象外）。
 * code_hash 列がまだないとき（scripts/add-code-hash-and-remix.sql の実行前）は調べない
 */
async function findListedSameCodeApp(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  hash: string,
  excludeAppId: string | null
): Promise<{ id: string; title: string; creator_name: string | null } | null> {
  let query = supabase
    .from("apps")
    .select("id, title, creator_name")
    .eq("code_hash", hash)
    .eq("status", "active")
    .eq("is_listed", true)
    .limit(5);
  if (excludeAppId) query = query.neq("id", excludeAppId);
  const { data, error } = await query;
  if (error || !data?.length) return null;
  const a = data[0];
  return { id: a.id as string, title: (a.title as string) ?? "", creator_name: (a.creator_name as string | null) ?? null };
}

/** 列がまだないとき（SQL の実行前）は、その列を外して保存し直す */
function isMissingColumn(message: string | undefined, col: string): boolean {
  return !!message && message.includes(col);
}

export async function POST(request: Request) {
  // コンテンツサイズ事前チェック
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "コードサイズが大きすぎます（最大512KB）" }, { status: 413 });
  }

  let body: {
    title?: string;
    description?: string;
    html_code?: string;
    css_code?: string;
    js_code?: string;
    creator_name?: string;
    category?: string;
    is_listed?: boolean;
    code_public?: boolean;
    /** グループ共有を使うか（送られたときだけ更新する） */
    group_sharing?: boolean;
    project_id?: string;
    app_id?: string;
    reset_user_data?: boolean;
    update_notes?: string;
    /** 開発スタジオの運営モード：ジサップ公式のアカウントとして出品する（運営だけ） */
    as_official?: boolean;
    /** 「このアプリをもとに作る」から作ったとき、もとのアプリの ID */
    remix_of?: string;
    /** 似たアプリがあっても、別のアプリとして公開する（本人が選んだとき） */
    allow_new?: boolean;
  };

  try {
    body = normalizeFields(await request.json(), ["html_code", "code"]);
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title || title.length > 100) {
    return NextResponse.json({ error: "タイトルは1〜100文字で入力してください" }, { status: 400 });
  }

  const html_code = (body.html_code ?? "").trim();
  if (!html_code) {
    return NextResponse.json({ error: "HTMLコードは必須です" }, { status: 400 });
  }
  if (Buffer.byteLength(html_code, "utf8") > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "コードサイズが大きすぎます（最大512KB）" }, { status: 413 });
  }
  // コードではなく文章（AIに送るプロンプトなど）のままでは公開しない
  if (looksLikePrompt(html_code)) {
    return NextResponse.json({ error: "まだコードではなく文章が入っています。AIが最後まで書き終わってから、返事のコードをコピーして貼り直してください。" }, { status: 400 });
  }

  // セッションからクリエイター名・IDを補完
  let sessionCreatorName: string | null = null;
  let sessionUserId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    sessionCreatorName = (session?.user as { name?: string })?.name ?? null;
    sessionUserId = (session?.user as { id?: string })?.id ?? null;
  } catch { /* noop */ }

  // 運営モード：運営としてログインしていることを確かめ、公式アカウントとして出品する（コードは必ず公開）
  if (body.as_official) {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: "公式アプリの出品は運営だけができます" }, { status: 403 });
    }
    const official = await getOfficialCreator();
    if (!official) {
      return NextResponse.json({ error: "公式アカウントがまだありません。運営画面の承認キューから作ってください" }, { status: 400 });
    }
    sessionUserId = official.id;
    sessionCreatorName = official.name ?? OFFICIAL_CREATOR_NAME;
    body.creator_name = sessionCreatorName;
    body.code_public = true;
    // 運営の人のマイプロジェクトとは結びつけない
    body.project_id = undefined;
  }

  // 作者名
  // ・運営モード：ジサップ公式
  // ・ログインしている人：本人が決めたジサップ用の名前（決めていなければ公開できない）
  // ・ログインしていない人：入力したニックネーム＋「（ゲスト）」（ニックネームは必須）
  let creatorName: string;
  if (body.as_official) {
    creatorName = sessionCreatorName || OFFICIAL_CREATOR_NAME;
  } else if (sessionUserId) {
    const me = await prisma.user.findUnique({ where: { id: sessionUserId }, select: { name: true, usernameSet: true } });
    if (!me?.usernameSet || !me.name?.trim()) {
      return NextResponse.json({ error: "公開する前に、ジサップで表示する名前を決めてください" }, { status: 403 });
    }
    creatorName = me.name.trim();
  } else {
    const nickname = guestNickname(body.creator_name);
    if (!nickname) {
      return NextResponse.json({ error: "ニックネームを入力してください" }, { status: 400 });
    }
    if (nickname.length > GUEST_NICKNAME_MAX) {
      return NextResponse.json({ error: `ニックネームは${GUEST_NICKNAME_MAX}文字以内にしてください` }, { status: 400 });
    }
    if (isReservedOfficialName(nickname)) {
      return NextResponse.json({ error: "「ジサップ公式」など、運営とまぎらわしい名前は使えません" }, { status: 400 });
    }
    creatorName = withGuestMark(nickname);
  }
  const now = new Date().toISOString();
  const appPayload = {
    title,
    description: (body.description ?? "").trim() || null,
    html_code,
    css_code: body.css_code ?? null,
    js_code: body.js_code ?? null,
    category: body.category ?? null,
    is_listed: body.is_listed ?? true,
    code_public: body.code_public ?? false,
    status: "active" as const,
    last_accessed_at: now,
    // 送られてこなかったとき（マイプロジェクトからの再公開など）は、今の設定を変えない
    ...(typeof body.group_sharing === "boolean" ? { group_sharing: body.group_sharing } : {}),
  };

  const supabase = createServerSupabaseClient();
  const overwriteAppId = (body.app_id ?? "").trim() || null;
  let appId: string;
  let claimToken: string | null = null;
  const hash = codeHash(html_code, body.css_code, body.js_code);

  // 出品ルール1：同じ人が、同じ名前のアプリを重ねて出すことはできない（上書きするか、名前を変えてもらう）
  if (sessionUserId) {
    const sameTitle = await findSameTitleApp(supabase, sessionUserId, title, overwriteAppId);
    if (sameTitle) {
      return NextResponse.json(
        {
          error: `同じ名前のアプリ「${sameTitle.title}」をすでに公開しています。そのアプリに上書きするか、名前を変えて出品してください。`,
          code: "same_title",
          existing: { app_id: sameTitle.appId, project_id: sameTitle.projectId, title: sameTitle.title },
        },
        { status: 409 }
      );
    }
  }

  // 似たアプリがあれば、上書きを勧める（本人が「別のアプリとして公開」を選んだときはそのまま出す）
  if (sessionUserId && !overwriteAppId && !body.allow_new && !body.as_official) {
    const similar = await findSimilarOwnApp(supabase, sessionUserId, title, html_code);
    if (similar) {
      return NextResponse.json(
        {
          error: `似たアプリ「${similar.title}」をすでに公開しています。直したものなら、そのアプリに上書きするとURLが変わらず、送った人もそのまま新しい版を使えます。`,
          code: "similar",
          existing: { app_id: similar.appId, project_id: similar.projectId, title: similar.title },
        },
        { status: 409 }
      );
    }
  }

  // 出品ルール2：まったく同じコードのアプリが、マーケットにすでに出品されていれば出品できない（作者に関係なく）
  if (appPayload.is_listed) {
    const other = await findListedSameCodeApp(supabase, hash, overwriteAppId);
    if (other) {
      return NextResponse.json(
        {
          error: `このアプリは、すでに出品されている「${other.title}」（作者：${other.creator_name || "ゲスト"}）とまったく同じコードなので、出品できません。`,
          code: "same_code",
          other: { app_id: other.id, title: other.title, creator_name: other.creator_name },
        },
        { status: 409 }
      );
    }
  }

  // 「このアプリをもとに作る」から作ったとき：もとのアプリが公開中なら覚えておく（新規のときだけ）
  let remixOf: { id: string; title: string; creator_id: string | null } | null = null;
  const remixId = (body.remix_of ?? "").trim();
  if (remixId && !overwriteAppId && /^[0-9a-f-]{36}$/i.test(remixId)) {
    const { data: src } = await supabase.from("apps").select("id, title, creator_id, status").eq("id", remixId).maybeSingle();
    if (src && src.status === "active") remixOf = { id: src.id as string, title: (src.title as string) ?? "", creator_id: (src.creator_id as string | null) ?? null };
  }

  // 同じ人が、まったく同じコードのアプリを重ねて公開することはできない
  if (sessionUserId) {
    const same = await findSameCodeApp(
      supabase,
      sessionUserId,
      normalizeCode(html_code, body.css_code, body.js_code),
      overwriteAppId
    );
    if (same) {
      return NextResponse.json(
        {
          error: `まったく同じコードのアプリ「${same.title}」をすでに公開しています。同じアプリを重ねて公開することはできません。内容を変えたいときは、マイプロジェクトからそのアプリを上書き公開してください。`,
          duplicate_app_id: same.id,
        },
        { status: 409 }
      );
    }
  }

  if (overwriteAppId) {
    if (!sessionUserId) {
      return NextResponse.json({ error: "上書き公開にはログインが必要です" }, { status: 401 });
    }
    const owns = await userOwnsApp(supabase, sessionUserId, overwriteAppId, body.project_id);
    if (!owns) {
      return NextResponse.json({ error: "このアプリを上書きする権限がありません" }, { status: 403 });
    }

    const { data: existingApp } = await supabase
      .from("apps")
      .select("code_version")
      .eq("id", overwriteAppId)
      .maybeSingle();

    const nextCodeVersion = (existingApp?.code_version ?? 1) + 1;
    const resetUserData = body.reset_user_data === true;
    const updateNotes = (body.update_notes ?? "").trim();
    if (updateNotes.length > 200) {
      return NextResponse.json({ error: "更新内容は200文字以内で入力してください" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("apps")
      .update({
        ...appPayload,
        code_version: nextCodeVersion,
        admin_deleted: false,
      })
      .eq("id", overwriteAppId)
      .select("id")
      .single();

    if (error) {
      console.error("[publish overwrite]", error);
      return NextResponse.json(
        { error: "上書きに失敗しました: " + error.message },
        { status: 500 }
      );
    }
    appId = data.id;

    const publisherSnapshot = snapshotFromAppRow({
      ...appPayload,
      code_version: nextCodeVersion,
    });
    await upsertLibrarySnapshot(supabase, sessionUserId, appId, publisherSnapshot);

    await queueLibraryUpdatesOnRepublish({
      supabase,
      appId,
      publisherUserId: sessionUserId,
      appTitle: title,
      codeVersion: nextCodeVersion,
      resetUserData,
      updateNotes: updateNotes || null,
    });
  } else {
    const { data, error } = await supabase
      .from("apps")
      .insert({
        ...appPayload,
        creator_name: creatorName,
        creator_id: sessionUserId,
        is_playground_app: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[publish]", error);
      return NextResponse.json(
        { error: "保存に失敗しました: " + error.message },
        { status: 500 }
      );
    }
    appId = data.id;

    // ゲストで公開したときは、ログインしたあと自分の作品として引き継げるよう、引き継ぎの印を渡す
    // （サーバーにはハッシュだけを残し、元の文字列は本人の端末だけが持つ。列がまだなくても公開は止めない）
    if (!sessionUserId) {
      const token = newClaimToken();
      const { error: claimError } = await supabase.from("apps").update({ claim_token_hash: hashClaimToken(token) }).eq("id", appId);
      if (!claimError) claimToken = token;
    }
  }

  // コードの指紋と、もとにしたアプリを残す（列がまだないとき＝SQL の実行前は、公開は止めずに飛ばす）
  {
    const extra: Record<string, string> = { code_hash: hash };
    if (remixOf) extra.remix_of = remixOf.id;
    const { error: e1 } = await supabase.from("apps").update(extra).eq("id", appId);
    if (e1 && remixOf && isMissingColumn(e1.message, "remix_of")) {
      await supabase.from("apps").update({ code_hash: hash }).eq("id", appId);
    }
  }
  // もとのアプリの作者に、ベルで知らせる（マーケットに出品したときだけ。自分のアプリをもとにしたときは知らせない）
  if (remixOf && appPayload.is_listed && remixOf.creator_id && remixOf.creator_id !== sessionUserId) {
    await notifyRemixed({ sourceAppId: remixOf.id, sourceTitle: remixOf.title, sourceCreatorId: remixOf.creator_id, newAppId: appId, newTitle: title, makerName: creatorName });
  }

  // ログイン済みならマイプロジェクト・マイライブラリにも登録
  if (sessionUserId) {
    const status = body.is_listed ? "listed" : "url_only";
    const projectRow = {
      user_id: sessionUserId,
      title,
      description: (body.description ?? "").trim() || null,
      html_code,
      css_code: body.css_code ?? null,
      js_code: body.js_code ?? null,
      app_id: appId,
      status,
      is_listed: body.is_listed ?? true,
      category: body.category ?? null,
      updated_at: now,
    };

    if (body.project_id) {
      await supabase
        .from("user_projects")
        .update(projectRow)
        .eq("id", body.project_id)
        .eq("user_id", sessionUserId);
    } else if (!overwriteAppId) {
      await supabase.from("user_projects").insert(projectRow);
    } else {
      await supabase
        .from("user_projects")
        .update(projectRow)
        .eq("user_id", sessionUserId)
        .eq("app_id", appId);
    }

    await addAppToUserLibrary(supabase, sessionUserId, appId, {
      name: title,
      category: body.category ?? null,
    });

    if (!overwriteAppId) {
      const snap = snapshotFromAppRow({
        ...appPayload,
        code_version: 1,
      });
      await upsertLibrarySnapshot(supabase, sessionUserId, appId, snap);
    }
  }

  return NextResponse.json({ id: appId, updated: !!overwriteAppId, claim_token: claimToken }, { status: overwriteAppId ? 200 : 201 });
}
