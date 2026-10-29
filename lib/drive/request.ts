/**
 * アプリの Google ドライブ機能（window.Jisapp.drive）の、ブリッジと画面のあいだの受け渡し。
 *
 * アプリは画像・動画・PDF などのファイルをジサップに保存できない（文字のデータだけ）。
 * そのかわり、使う人が選んだファイルを、その人の Google ドライブに保存して、リンク（文字）をアプリに返す。
 * アプリから頼まれたら、ブリッジがこのイベントを出し、AppDriveSheet が画面を出して結果を返す。
 */
export const DRIVE_REQUEST_EVENT = "jisapp:drive-request";

/** アプリが選ばせるファイルの種類 */
export const DRIVE_ACCEPTS = ["image", "video", "pdf", "any"] as const;
export type DriveAccept = (typeof DRIVE_ACCEPTS)[number];

/** 保存したファイルの種類 */
export const DRIVE_KINDS = ["image", "video", "pdf", "file"] as const;
export type DriveFileKind = (typeof DRIVE_KINDS)[number];

/** アプリに返す、保存したファイルの情報（すべて文字なので、そのまま saveData・shared.add で保存できる） */
export type DriveFileInfo = {
  id: string;
  name: string;
  kind: DriveFileKind;
  mimeType: string;
  size: number;
  url: string;
  thumbnail: string;
  /** 「リンクを知っている全員」にできたか（学校・会社のアカウントでは禁止されていることがある） */
  shared: boolean;
};

export type DriveRequest =
  | { op: "upload"; accept: DriveAccept; multiple: boolean; folderName: string }
  | { op: "open"; id: string; kind: DriveFileKind | null; name: string };

export type DriveRequestDetail = {
  request: DriveRequest;
  /** 画面が受け取ったら true にする（受け取る画面がないときに、すぐ断るため） */
  handled: boolean;
  resolve: (value: unknown) => void;
  reject: (message: string) => void;
};

/** Google ドライブのファイルID の形（今の形は33文字前後、古い形は28文字前後） */
const DRIVE_ID = /^[A-Za-z0-9_-]{10,200}$/;

/**
 * ファイルID・共有リンク・アプリに返したファイルの情報のどれからでも、ファイルID を取り出す。
 * 開くときはこの ID から drive.google.com の URL を作り直すので、アプリが渡した URL をそのまま開くことはない
 */
export function parseDriveFileId(input: unknown): string | null {
  const text = String(input ?? "").trim();
  if (DRIVE_ID.test(text)) return text;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || !/^(drive|docs)\.google\.com$/.test(url.hostname)) return null;
    const id = url.pathname.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1] ?? url.searchParams.get("id") ?? "";
    return DRIVE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** ファイルID から、見る・表紙の画像・埋め込みの URL を作る */
export function driveFileUrls(id: string, width = 1000) {
  return {
    url: `https://drive.google.com/file/d/${id}/view`,
    thumbnail: `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`,
    preview: `https://drive.google.com/file/d/${id}/preview`,
  };
}

export function driveKindOf(mimeType: string): DriveFileKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
}

/**
 * ブリッジから呼ぶ：画面に頼んで、結果を待つ。
 * 受け取る画面がない（サムネイルの枠など）ときは null を返す
 */
export function requestDrive(request: DriveRequest): Promise<unknown> | null {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const detail: DriveRequestDetail = { request, handled: false, resolve, reject: (message) => reject(new Error(message)) };
  window.dispatchEvent(new CustomEvent(DRIVE_REQUEST_EVENT, { detail }));
  return detail.handled ? promise : null;
}
