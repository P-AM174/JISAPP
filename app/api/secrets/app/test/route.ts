import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { userOwnsApp } from "@/lib/secrets/app-ownership";
import { getAppSecretConfig } from "@/lib/secrets/app-secrets";
import { applySecretToRequest } from "@/lib/secrets/apply-secret";
import { validateSecretName } from "@/lib/secrets/constants";
import { findSecretTargetUrl } from "@/lib/secrets/detect-api-use";
import { proxyExternalFetch } from "@/lib/zisup/fetch-proxy";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { countHit, isLimited, TOO_MANY_ATTEMPTS } from "@/lib/security/rate-limit";

export const maxDuration = 60;

const MAX_CODE_CHARS = 512 * 1024;

/**
 * AI のサービスは、料金のかからない「モデルの一覧」を読んでキーを確かめる（文を送ると料金がかかるため）
 */
const AI_TEST_URLS: Record<string, string> = {
  "generativelanguage.googleapis.com": "https://generativelanguage.googleapis.com/v1beta/models",
  "api.openai.com": "https://api.openai.com/v1/models",
  "api.groq.com": "https://api.groq.com/openai/v1/models",
  "api.mistral.ai": "https://api.mistral.ai/v1/models",
  "openrouter.ai": "https://openrouter.ai/api/v1/key",
};

/** ジサップのキーの付け方（URLパラメータか Authorization ヘッダー）では使えないサービス */
const UNSUPPORTED_HOSTS = ["api.anthropic.com"];

/**
 * POST /api/secrets/app/test — 登録したキーで、アプリの送り先に1回だけつないで結果を返す（アプリの持ち主だけ）。
 * 送り先はアプリのコードから探す。キーの値や、送り先の返事の中身は返さない
 */
export async function POST(req: Request) {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  let body: { appId?: string; name?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const appId = (body.appId ?? "").trim();
  const name = (body.name ?? "").trim();
  if (!appId) return NextResponse.json({ error: "appId が必要です" }, { status: 400 });
  const nameError = validateSecretName(name);
  if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

  if (!(await userOwnsApp(userId, appId))) {
    return NextResponse.json({ error: "このアプリを編集する権限がありません" }, { status: 403 });
  }

  // 試しすぎてキーの持ち主に料金がかからないように、10分に20回まで
  const limitKey = `secret-test:${userId}`;
  if ((await isLimited(limitKey, 20)).limited) {
    return NextResponse.json({ error: TOO_MANY_ATTEMPTS }, { status: 429 });
  }
  await countHit(limitKey, 600);

  const config = await getAppSecretConfig(appId, name);
  if (!config) return NextResponse.json({ error: "シークレットが見つかりません" }, { status: 404 });

  // 開発スタジオでは、まだ保存していない今のコードを使う。なければ公開しているコード
  let code = typeof body.code === "string" ? body.code.slice(0, MAX_CODE_CHARS) : "";
  if (!code.trim()) {
    const { data: app } = await createServerSupabaseClient()
      .from("apps")
      .select("html_code, js_code")
      .eq("id", appId)
      .maybeSingle();
    code = `${app?.html_code ?? ""}\n${app?.js_code ?? ""}`;
  }

  const target = findSecretTargetUrl(code, name);
  if (!target) return NextResponse.json({ state: "no_target" });

  let host = "";
  try {
    host = new URL(target).hostname.toLowerCase();
  } catch {
    return NextResponse.json({ state: "no_target" });
  }
  if (UNSUPPORTED_HOSTS.includes(host)) return NextResponse.json({ state: "unsupported", host });

  const testUrl = AI_TEST_URLS[host] ?? target;
  let applied: { url: string; headers: Record<string, string> };
  try {
    applied = applySecretToRequest(testUrl, { Accept: "application/json" }, config);
  } catch {
    return NextResponse.json({ state: "no_target" });
  }

  try {
    const result = await proxyExternalFetch({
      url: applied.url,
      method: "GET",
      headers: applied.headers,
      followRedirects: false,
      extraAllowedHeaders: config.attach_type === "query" ? [] : [config.header_name?.trim() || "Authorization"],
    });
    const status = result.status;
    const text = (typeof result.body === "string" ? result.body : JSON.stringify(result.body ?? "")).slice(0, 2000).toLowerCase();

    let state: string;
    if (status >= 200 && status < 300) state = "ok";
    else if (status === 401 || status === 403) state = "rejected";
    // Gemini などは、キーがちがうと 400 で「API key not valid」と返す
    else if (status === 400 && /api[ _-]?key/.test(text)) state = "rejected";
    else if (status === 402 || status === 429) state = "limit";
    else if (status >= 500) state = "server_error";
    else state = "unsure";

    return NextResponse.json({ state, status, host });
  } catch (err) {
    return NextResponse.json({
      state: "error",
      host,
      message: err instanceof Error ? err.message : "外部APIへの接続に失敗しました",
    });
  }
}
