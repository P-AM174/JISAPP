import { NextResponse } from "next/server";
import { proxyExternalFetch } from "@/lib/zisup/fetch-proxy";

export async function POST(request: Request) {
  let body: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string | null;
    appId?: string;
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

  try {
    const result = await proxyExternalFetch({
      url,
      method: body.method,
      headers: body.headers,
      body: body.body ?? null,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "外部APIへの接続に失敗しました";
    const status = message.includes("abort") ? 504 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
