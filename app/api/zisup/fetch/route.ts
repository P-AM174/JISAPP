import { NextResponse } from "next/server";
import { proxyExternalFetch } from "@/lib/zisup/fetch-proxy";
import { getAppSecretConfig } from "@/lib/secrets/app-secrets";
import { applySecretToRequest } from "@/lib/secrets/apply-secret";
import { validateSecretName } from "@/lib/secrets/constants";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/** Gemini 等の AI API 呼び出し向け（Vercel Pro 以上推奨） */
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string | null;
    appId?: string;
    secret?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "URLが必要です" }, { status: 400 });
  }

  let fetchUrl = url;
  let headers = { ...(body.headers ?? {}) };

  const secretName = (body.secret ?? "").trim();
  if (secretName) {
    const appId = (body.appId ?? "").trim();
    if (!appId) {
      return NextResponse.json({ error: "secret 利用時は appId が必要です" }, { status: 400 });
    }

    const nameError = validateSecretName(secretName);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: app } = await supabase
      .from("apps")
      .select("id, admin_deleted, status")
      .eq("id", appId)
      .maybeSingle();

    if (!app || app.admin_deleted) {
      return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
    }

    const secretConfig = await getAppSecretConfig(appId, secretName);
    if (!secretConfig) {
      return NextResponse.json({ error: "シークレットが見つかりません" }, { status: 404 });
    }

    const applied = applySecretToRequest(fetchUrl, headers, secretConfig);
    fetchUrl = applied.url;
    headers = applied.headers;
  }

  try {
    const result = await proxyExternalFetch({
      url: fetchUrl,
      method: body.method,
      headers,
      body: body.body ?? null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const raw = err instanceof Error ? err.message : "外部APIへの接続に失敗しました";
    const timedOut =
      raw.includes("タイムアウト") ||
      raw.toLowerCase().includes("abort");
    const message = timedOut
      ? "外部APIの応答がタイムアウトしました。AIの処理に時間がかかっている可能性があります。"
      : raw;
    return NextResponse.json({ error: message }, { status: timedOut ? 504 : 400 });
  }
}
