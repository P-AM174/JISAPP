/**
 * アプリから外の API を呼ぶための代理（/api/zisup/fetch）。
 *
 * ジサップのサーバーが代わりにつなぐので、サーバーの内側（社内ネットワーク・クラウドの管理用アドレスなど）に
 * つながせないことが大事（SSRF 対策）。送り先は名前ではなく、実際につなぐ IP アドレスで確かめる：
 * ・つなぐ直前に DNS で調べた IP アドレスを確かめる（名前がだまして内側を指していても止まる）
 * ・転送（3xx）は自分で1回ずつたどり、毎回同じように確かめる（転送で内側へ連れて行かれない）
 * ・https だけ。応答の大きさと時間にも上限をつける
 */
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { gunzipSync, inflateSync } from "node:zlib";

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata", "instance-data"]);

const MAX_BODY_BYTES = 256 * 1024;
const MAX_RESPONSE_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
/** AI API（Gemini 等）向け。Vercel maxDuration（60秒）より短く設定 */
export const FETCH_TIMEOUT_MS = 50_000;

/** IPv4 を 32 ビットの数にする（形が正しくなければ null） */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function inV4Range(n: number, base: string, bits: number): boolean {
  const b = ipv4ToInt(base);
  if (b === null) return false;
  const size = 2 ** (32 - bits);
  return n >= b && n < b + size;
}

/** つないではいけない IPv4（内側・ローカル・特別な用途のアドレス） */
function isBlockedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true;
  const ranges: [string, number][] = [
    ["0.0.0.0", 8], // 「このネットワーク」
    ["10.0.0.0", 8], // 内側
    ["100.64.0.0", 10], // 通信会社の内側（CGNAT）
    ["127.0.0.0", 8], // 自分自身
    ["169.254.0.0", 16], // リンクローカル（クラウドの管理用アドレスを含む）
    ["172.16.0.0", 12], // 内側
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16], // 内側
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4], // マルチキャスト
    ["240.0.0.0", 4], // 予約
  ];
  return ranges.some(([base, bits]) => inV4Range(n, base, bits));
}

/** つないではいけない IPv6（IPv4 を中に入れた形も、中の IPv4 で確かめる） */
function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (lower === "::" || lower === "::1") return true;
  // ::ffff:127.0.0.1 のような、IPv4 を中に入れた形
  const mapped = lower.match(/^(?:::ffff:|::|64:ff9b::)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  const hexMapped = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16), lo = parseInt(hexMapped[2], 16);
    return isBlockedIpv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  const first = parseInt(lower.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 内側
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 リンクローカル
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 マルチキャスト
  if (lower.startsWith("2001:db8:") || lower.startsWith("2001:0db8:")) return true; // 説明用
  if (lower.startsWith("100::") || lower.startsWith("0100:")) return true; // 捨てる用
  if (lower.startsWith("64:ff9b:")) return true; // NAT64（中身を確かめられない形は止める）
  return false;
}

/** この IP アドレスにつないではいけないか */
export function isBlockedIp(ip: string): boolean {
  const kind = isIP(ip.replace(/^\[|\]$/g, ""));
  if (kind === 4) return isBlockedIpv4(ip);
  if (kind === 6) return isBlockedIpv6(ip);
  return true;
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
  if (parsed.username || parsed.password) {
    throw new Error("この URL には接続できません");
  }
  if (parsed.port && parsed.port !== "443") {
    throw new Error("この URL には接続できません");
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new Error("この URL には接続できません");
  }
  // IP アドレスがそのまま書かれているときは、ここで確かめる（名前のときは、つなぐ直前に確かめる）
  if (isIP(host) && isBlockedIp(host)) {
    throw new Error("この URL には接続できません");
  }

  return parsed;
}

/** つなぐ直前に DNS で調べた IP アドレスを確かめる（内側を指していたら、つながない） */
function safeLookup(
  hostname: string,
  options: { all?: boolean; family?: number } | number | undefined,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void
) {
  const opts = typeof options === "object" && options ? options : {};
  dnsLookup(hostname, { all: true, family: opts.family ?? 0 }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as LookupAddress[];
    if (!list.length || list.some((a) => isBlockedIp(a.address))) {
      const e = new Error("この URL には接続できません") as NodeJS.ErrnoException;
      e.code = "EBLOCKED";
      return callback(e, "", 0);
    }
    if (opts.all) return callback(null, list);
    return callback(null, list[0].address, list[0].family);
  });
}

type RawResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: Buffer };

/** 1回分の https のやりとり（転送はたどらない） */
function requestOnce(url: URL, method: string, headers: Record<string, string>, body: string | undefined, deadline: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new Error("abort: timeout"));
    const req = httpsRequest(
      url,
      {
        method,
        headers: { ...headers, "accept-encoding": "gzip, deflate" },
        // 名前の解決は、内側を指していないかを確かめる関数で行う
        lookup: safeLookup as never,
        timeout: remaining,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > MAX_RESPONSE_BYTES * 2) {
            req.destroy(new Error("レスポンスが大きすぎます"));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => {
          let buf = Buffer.concat(chunks);
          const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
          try {
            if (enc === "gzip" || enc === "x-gzip") buf = gunzipSync(buf, { maxOutputLength: MAX_RESPONSE_BYTES + 1 });
            else if (enc === "deflate") buf = inflateSync(buf, { maxOutputLength: MAX_RESPONSE_BYTES + 1 });
            else if (enc && enc !== "identity") return reject(new Error("この形式の応答は受け取れません"));
          } catch {
            return reject(new Error("レスポンスが大きすぎます"));
          }
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body: buf });
        });
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("abort: timeout")));
    // 少しずつしか返ってこない相手でも、全体の時間の上限で切る
    const overall = setTimeout(() => req.destroy(new Error("abort: timeout")), remaining);
    req.on("close", () => clearTimeout(overall));
    req.on("error", (err) => {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "EBLOCKED") return reject(new Error("この URL には接続できません"));
      reject(err);
    });
    if (body !== undefined) req.write(body);
    req.end();
  });
}

export async function proxyExternalFetch(input: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
  /** false のときは転送（3xx）についていかない（APIキーを付けたときに使う） */
  followRedirects?: boolean;
  /** ふつうは通さないが、今回だけ通すヘッダー（APIキーを付けるヘッダーなど） */
  extraAllowedHeaders?: string[];
}): Promise<{ ok: boolean; status: number; contentType: string | null; body: unknown }> {
  let url = validateExternalFetchUrl(input.url);

  let method = (input.method ?? "GET").toUpperCase();
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(method)) {
    throw new Error("許可されていない HTTP メソッドです");
  }

  const allowedHeaderNames = new Set(["accept", "authorization", "content-type", "x-api-key", ...(input.extraAllowedHeaders ?? []).map((h) => h.toLowerCase())]);
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.headers ?? {})) {
    const lower = key.toLowerCase();
    if (allowedHeaderNames.has(lower) && typeof value === "string" && !/[\r\n]/.test(value)) {
      headers[lower] = value;
    }
  }

  let body: string | undefined = method === "GET" || method === "HEAD" ? undefined : input.body ?? undefined;
  if (body && Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    throw new Error("リクエストボディが大きすぎます");
  }

  const deadline = Date.now() + FETCH_TIMEOUT_MS;
  try {
    let res: RawResponse | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      res = await requestOnce(url, method, headers, body, deadline);
      const location = res.headers.location;
      const isRedirect = [301, 302, 303, 307, 308].includes(res.status) && typeof location === "string";
      if (!isRedirect || input.followRedirects === false) break;
      if (hop === MAX_REDIRECTS) throw new Error("転送が多すぎます");
      const next = validateExternalFetchUrl(new URL(location, url).toString());
      // 別のサーバーへの転送では、認証のヘッダーを持っていかない
      if (next.host !== url.host) {
        delete headers.authorization;
        delete headers["x-api-key"];
        for (const h of input.extraAllowedHeaders ?? []) delete headers[h.toLowerCase()];
      }
      if (res.status === 303 || ((res.status === 301 || res.status === 302) && method === "POST")) {
        method = "GET";
        body = undefined;
        delete headers["content-type"];
      }
      url = next;
    }
    if (!res) throw new Error("外部APIへの接続に失敗しました");

    if (res.body.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error("レスポンスが大きすぎます");
    }
    const contentType = typeof res.headers["content-type"] === "string" ? res.headers["content-type"] : null;
    const text = new TextDecoder().decode(res.body);
    let parsed: unknown = text;
    if (contentType?.includes("application/json")) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, contentType, body: parsed };
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes("abort")) {
      throw new Error(
        "外部APIの応答がタイムアウトしました。AIの処理に時間がかかっている可能性があります。しばらく待ってから再試行してください。"
      );
    }
    throw err;
  }
}
