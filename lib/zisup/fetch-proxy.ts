const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "metadata.google.internal",
]);

const MAX_BODY_BYTES = 256 * 1024;
const MAX_RESPONSE_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 22_000;

function isPrivateIp(hostname: string): boolean {
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  const m = hostname.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

export function validateExternalFetchUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URLが不正です");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("https の URL のみ利用できます");
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || isPrivateIp(host)) {
    throw new Error("この URL には接続できません");
  }

  return parsed;
}

export async function proxyExternalFetch(input: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
}): Promise<{ ok: boolean; status: number; contentType: string | null; body: unknown }> {
  validateExternalFetchUrl(input.url);

  const method = (input.method ?? "GET").toUpperCase();
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(method)) {
    throw new Error("許可されていない HTTP メソッドです");
  }

  const headers = new Headers();
  const allowedHeaderNames = ["accept", "authorization", "content-type", "x-api-key"];
  for (const [key, value] of Object.entries(input.headers ?? {})) {
    const lower = key.toLowerCase();
    if (allowedHeaderNames.includes(lower) && typeof value === "string") {
      headers.set(lower, value);
    }
  }

  if (input.body && Buffer.byteLength(input.body, "utf8") > MAX_BODY_BYTES) {
    throw new Error("リクエストボディが大きすぎます");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(input.url, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : input.body ?? undefined,
      signal: controller.signal,
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type");
    const raw = await res.arrayBuffer();
    if (raw.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error("レスポンスが大きすぎます");
    }

    const text = new TextDecoder().decode(raw);
    let body: unknown = text;
    if (contentType?.includes("application/json")) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return { ok: res.ok, status: res.status, contentType, body };
  } finally {
    clearTimeout(timer);
  }
}
