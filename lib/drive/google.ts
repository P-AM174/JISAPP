/**
 * 使う人の Google ドライブにファイルを保存する。ファイルはブラウザから Google に直接送り、ジサップのサーバーは通らない。
 *
 * ・権限は drive.file だけ。ジサップが保存したファイルにしかさわれない（その人のドライブのほかのファイルは見えない）
 * ・Google の許可（アクセストークン）は、このタブの中だけで使う。ジサップのサーバーには送らない・保存しない
 * ・アプリ（枠の中）には、トークンもファイルの中身も渡さない。返すのは保存したファイルの情報（文字）だけ
 */
import { driveFileUrls } from "@/lib/drive/request";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
/** ジサップの Google ログインと同じクライアントID（秘密の値ではない。next.config.ts でブラウザに渡している） */
export const DRIVE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const TOKEN_STORAGE_KEY = "jisapp_drive_token";
/** これより小さいファイルは1回で送る（multipart）。大きいファイルは、送る場所を先に作ってから送る（resumable）。Google のおすすめに合わせる */
const SIMPLE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const FOLDER_MIME = "application/vnd.google-apps.folder";
const UPLOAD_FIELDS = "id,name,mimeType,size";

export type DriveErrorCode =
  | "auth" // 許可が切れた・取り消された
  | "denied" // 許可されなかった
  | "scope" // 許可の画面で、ドライブのチェックを外した
  | "popup" // Google の画面を開けなかった
  | "closed" // Google の画面を閉じた
  | "quota" // ドライブの空き容量が足りない
  | "network"
  | "aborted"
  | "upload";

export class DriveError extends Error {
  code: DriveErrorCode;
  constructor(code: DriveErrorCode) {
    super(code);
    this.code = code;
  }
}

type TokenResponse = { access_token?: string; expires_in?: number | string; scope?: string; error?: string };
export type GoogleOAuth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => { requestAccessToken: (override?: { prompt?: string }) => void };
  hasGrantedAllScopes: (response: TokenResponse, ...scopes: string[]) => boolean;
};

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

/* ── Google の許可（アクセストークン） ── */

let memoryToken: { token: string; expiresAt: number } | null = null;
/** 見つけた・作ったフォルダの ID（許可をもらい直したら、別のアカウントかもしれないので忘れる） */
const folderCache = new Map<string, string>();

/** まだ使える許可があれば返す。ページを読み込み直しても1時間は使えるよう、このタブの sessionStorage にも置く */
export function cachedDriveToken(): string | null {
  const now = Date.now() + 60_000;
  if (memoryToken && memoryToken.expiresAt > now) return memoryToken.token;
  try {
    const saved = JSON.parse(sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "null") as { token?: string; expiresAt?: number } | null;
    if (saved?.token && typeof saved.expiresAt === "number" && saved.expiresAt > now) {
      memoryToken = { token: saved.token, expiresAt: saved.expiresAt };
      return saved.token;
    }
  } catch {
    /* noop */
  }
  return null;
}

export function forgetDriveToken() {
  memoryToken = null;
  folderCache.clear();
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

function rememberToken(token: string, expiresInSec: number) {
  folderCache.clear();
  memoryToken = { token, expiresAt: Date.now() + expiresInSec * 1000 };
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(memoryToken));
  } catch {
    /* noop */
  }
}

let gisPromise: Promise<GoogleOAuth2> | null = null;

/** Google の許可の画面を出すためのスクリプトを読み込む（ボタンを押す前に、先に読み込んでおく） */
export function loadGoogleIdentity(): Promise<GoogleOAuth2> {
  const ready = window.google?.accounts?.oauth2;
  if (ready) return Promise.resolve(ready);
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<GoogleOAuth2>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => {
      const oauth2 = window.google?.accounts?.oauth2;
      if (oauth2) resolve(oauth2);
      else reject(new DriveError("popup"));
    };
    script.onerror = () => {
      gisPromise = null;
      script.remove();
      reject(new DriveError("network"));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

/**
 * Google の許可の画面を出して、アクセストークンをもらう。
 * ポップアップを開くので、ボタンを押した処理の中で（await をはさまずに）呼ぶ
 */
export function requestDriveToken(oauth2: GoogleOAuth2): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: DRIVE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new DriveError(response.error === "access_denied" ? "denied" : "auth"));
          return;
        }
        if (!oauth2.hasGrantedAllScopes(response, DRIVE_SCOPE)) {
          reject(new DriveError("scope"));
          return;
        }
        rememberToken(response.access_token, Number(response.expires_in) || 3600);
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new DriveError(error?.type === "popup_failed_to_open" ? "popup" : "closed")),
    });
    // 一度許可した人には、許可の画面を出さない（Google の画面が一瞬開いて閉じる）
    client.requestAccessToken({ prompt: "" });
  });
}

/* ── ドライブの操作 ── */

function errorFrom(status: number, body: string): DriveError {
  if (status === 401) return new DriveError("auth");
  if (/storageQuotaExceeded|quotaExceeded/.test(body)) return new DriveError("quota");
  return new DriveError("upload");
}

async function driveApi<T>(token: string, path: string, init: { method?: string; body?: string } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json; charset=UTF-8" } : {}),
      },
      body: init.body,
    });
  } catch {
    throw new DriveError("network");
  }
  if (!res.ok) throw errorFrom(res.status, await res.text().catch(() => ""));
  return (await res.json()) as T;
}

/** ドライブの検索の文字（'…'）の中に入れるため、\ と ' を逃がす */
function quote(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

async function findOrCreateFolder(token: string, name: string, parent: string): Promise<string> {
  const cacheKey = `${parent}/${name}`;
  const cached = folderCache.get(cacheKey);
  if (cached) return cached;
  // drive.file の権限では、ジサップが作ったフォルダだけが見つかる
  const q = `name = ${quote(name)} and mimeType = '${FOLDER_MIME}' and ${quote(parent)} in parents and trashed = false`;
  const found = await driveApi<{ files?: { id: string }[] }>(token, `files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&spaces=drive`);
  let id = found.files?.[0]?.id;
  if (!id) {
    const created = await driveApi<{ id: string }>(token, "files?fields=id", {
      method: "POST",
      body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parent] }),
    });
    id = created.id;
  }
  folderCache.set(cacheKey, id);
  return id;
}

/** 「ジサップ」フォルダの中の、アプリの名前のフォルダ（あとで消したいときに探しやすいように、アプリごとに分ける） */
export async function ensureAppFolder(token: string, rootName: string, appName: string): Promise<string> {
  const root = await findOrCreateFolder(token, rootName, "root");
  return findOrCreateFolder(token, appName.trim().slice(0, 100) || rootName, root);
}

function xhrSend(
  method: string,
  url: string,
  body: Blob,
  headers: Record<string, string>,
  onProgress: (loaded: number) => void,
  signal: AbortSignal
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DriveError("aborted"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(errorFrom(xhr.status, xhr.responseText));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        reject(new DriveError("upload"));
      }
    };
    xhr.onerror = () => reject(new DriveError("network"));
    xhr.onabort = () => reject(new DriveError("aborted"));
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

/** ファイルをフォルダに保存する。onProgress には、送り終えた大きさ（バイト）が届く */
export async function uploadToDrive(
  token: string,
  file: File,
  folderId: string,
  onProgress: (loaded: number) => void,
  signal: AbortSignal
): Promise<{ id: string; name: string; mimeType: string; size: number }> {
  const mimeType = file.type || "application/octet-stream";
  const metadata = JSON.stringify({ name: file.name || "file", parents: [folderId] });
  let result: unknown;
  if (file.size <= SIMPLE_UPLOAD_MAX_BYTES) {
    const boundary = `jisapp${Math.random().toString(36).slice(2)}`;
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ]);
    result = await xhrSend(
      "POST",
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${UPLOAD_FIELDS}`,
      body,
      { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      onProgress,
      signal
    );
  } else {
    let start: Response;
    try {
      start = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=${UPLOAD_FIELDS}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(file.size),
        },
        body: metadata,
        signal,
      });
    } catch {
      throw new DriveError(signal.aborted ? "aborted" : "network");
    }
    if (!start.ok) throw errorFrom(start.status, await start.text().catch(() => ""));
    const session = start.headers.get("Location");
    if (!session) throw new DriveError("upload");
    result = await xhrSend("PUT", session, file, { "Content-Type": mimeType }, onProgress, signal);
  }
  const saved = result as { id?: string; name?: string; mimeType?: string; size?: string | number };
  if (!saved.id) throw new DriveError("upload");
  return { id: saved.id, name: saved.name ?? file.name, mimeType: saved.mimeType ?? mimeType, size: Number(saved.size) || file.size };
}

/**
 * 「リンクを知っている全員」が見られるようにする（グループのほかの人や、別の端末からも見えるように）。
 * 学校・会社のアカウントでは禁止されていることがあり、そのときは false を返す
 */
export async function shareWithAnyone(token: string, fileId: string): Promise<boolean> {
  try {
    await driveApi(token, `files/${encodeURIComponent(fileId)}/permissions?fields=id`, {
      method: "POST",
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });
    return true;
  } catch (e) {
    if (e instanceof DriveError && e.code === "auth") throw e;
    return false;
  }
}

/** 保存した直後は表紙の画像がまだできていないことがあるので、見られるようになるまで少し待つ */
export function waitForThumbnail(id: string, timeoutMs = 12_000): Promise<boolean> {
  const until = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const attempt = () => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => {
        if (Date.now() + 1500 < until) window.setTimeout(attempt, 1500);
        else resolve(false);
      };
      // 失敗した結果を覚えられないよう、毎回ちがう URL にする（アプリに渡す URL とは別）
      img.src = `${driveFileUrls(id, 200).thumbnail}&t=${Date.now()}`;
    };
    attempt();
  });
}
