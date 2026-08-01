import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { userOwnsApp } from "@/lib/secrets/app-ownership";
import {
  appExistsForSecrets,
  appSecretExists,
  deleteAppSecret,
  listAppSecrets,
  updateAppSecret,
  upsertAppSecret,
} from "@/lib/secrets/app-secrets";
import { validateSecretName, type AttachType } from "@/lib/secrets/constants";

/** GET /api/secrets/app?appId=xxx */
export async function GET(req: Request) {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  const appId = new URL(req.url).searchParams.get("appId")?.trim();
  if (!appId) {
    return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  }

  if (!(await userOwnsApp(userId, appId))) {
    return NextResponse.json({ error: "このアプリを編集する権限がありません" }, { status: 403 });
  }

  const secrets = await listAppSecrets(appId);
  return NextResponse.json({ secrets });
}

/** POST /api/secrets/app — シークレット登録・更新 */
export async function POST(req: Request) {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  let body: {
    appId?: string;
    name?: string;
    value?: string;
    header_name?: string;
    prefix?: string;
    attach_type?: AttachType;
    param_name?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const appId = (body.appId ?? "").trim();
  const name = (body.name ?? "").trim();
  const value = (body.value ?? "").trim();

  if (!appId) {
    return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  }

  const nameError = validateSecretName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  if (value.length > 500) {
    return NextResponse.json({ error: "APIキーの値が長すぎます" }, { status: 400 });
  }

  if (!(await userOwnsApp(userId, appId))) {
    return NextResponse.json({ error: "このアプリを編集する権限がありません" }, { status: 403 });
  }

  if (!(await appExistsForSecrets(appId))) {
    return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
  }

  const attachType = body.attach_type ?? "header";
  if (!["header", "query"].includes(attachType)) {
    return NextResponse.json({ error: "attach_type が不正です" }, { status: 400 });
  }

  if (attachType === "query" && !(body.param_name ?? "").trim()) {
    return NextResponse.json({ error: "URLパラメータ名を入力してください" }, { status: 400 });
  }

  const exists = await appSecretExists(appId, name);

  // 既存キーの上書き編集で値を省略した場合は、登録済みキーを引き継ぐ
  if (!value) {
    if (!exists) {
      return NextResponse.json({ error: "APIキーの値を入力してください" }, { status: 400 });
    }
    try {
      await updateAppSecret({
        userId,
        appId,
        name,
        header_name: body.header_name?.trim() || "Authorization",
        prefix: body.prefix ?? "Bearer ",
        attach_type: attachType,
        param_name: attachType === "query" ? (body.param_name ?? "").trim() : null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新に失敗しました";
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ ok: true, name });
  }

  await upsertAppSecret({
    userId,
    appId,
    name,
    value,
    header_name: body.header_name?.trim() || "Authorization",
    prefix: body.prefix ?? "Bearer ",
    attach_type: attachType,
    param_name: attachType === "query" ? (body.param_name ?? "").trim() : null,
  });

  return NextResponse.json({ ok: true, name });
}

/** PATCH /api/secrets/app — 設定の更新（値は省略可） */
export async function PATCH(req: Request) {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  let body: {
    appId?: string;
    name?: string;
    value?: string;
    header_name?: string;
    prefix?: string;
    attach_type?: AttachType;
    param_name?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const appId = (body.appId ?? "").trim();
  const name = (body.name ?? "").trim();
  const value = (body.value ?? "").trim();

  if (!appId || !name) {
    return NextResponse.json({ error: "appId と name が必要です" }, { status: 400 });
  }

  const nameError = validateSecretName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  if (value.length > 500) {
    return NextResponse.json({ error: "APIキーの値が長すぎます" }, { status: 400 });
  }

  if (!(await userOwnsApp(userId, appId))) {
    return NextResponse.json({ error: "このアプリを編集する権限がありません" }, { status: 403 });
  }

  if (!(await appSecretExists(appId, name))) {
    return NextResponse.json({ error: "シークレットが見つかりません" }, { status: 404 });
  }

  const attachType = body.attach_type ?? "header";
  if (!["header", "query"].includes(attachType)) {
    return NextResponse.json({ error: "attach_type が不正です" }, { status: 400 });
  }

  if (attachType === "query" && !(body.param_name ?? "").trim()) {
    return NextResponse.json({ error: "URLパラメータ名を入力してください" }, { status: 400 });
  }

  try {
    await updateAppSecret({
      userId,
      appId,
      name,
      ...(value ? { value } : {}),
      header_name: body.header_name?.trim() || "Authorization",
      prefix: body.prefix ?? "Bearer ",
      attach_type: attachType,
      param_name: attachType === "query" ? (body.param_name ?? "").trim() : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新に失敗しました";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  return NextResponse.json({ ok: true, name });
}

/** DELETE /api/secrets/app?appId=xxx&name=WEATHER */
export async function DELETE(req: Request) {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  const params = new URL(req.url).searchParams;
  const appId = params.get("appId")?.trim();
  const name = params.get("name")?.trim();

  if (!appId || !name) {
    return NextResponse.json({ error: "appId と name が必要です" }, { status: 400 });
  }

  if (!(await userOwnsApp(userId, appId))) {
    return NextResponse.json({ error: "このアプリを編集する権限がありません" }, { status: 403 });
  }

  await deleteAppSecret(appId, name);
  return NextResponse.json({ ok: true });
}
