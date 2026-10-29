"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileIcon, FileText, Film, ImageIcon, TriangleAlert, X } from "lucide-react";
import { getClientLocaleState, useT } from "@/lib/i18n/client";
import { format, pick } from "@/lib/i18n/config";
import {
  DRIVE_REQUEST_EVENT,
  driveFileUrls,
  driveKindOf,
  type DriveAccept,
  type DriveFileInfo,
  type DriveRequest,
  type DriveRequestDetail,
} from "@/lib/drive/request";
import {
  DRIVE_CLIENT_ID,
  DriveError,
  cachedDriveToken,
  ensureAppFolder,
  forgetDriveToken,
  loadGoogleIdentity,
  requestDriveToken,
  shareWithAnyone,
  uploadToDrive,
  waitForThumbnail,
  type DriveErrorCode,
  type GoogleOAuth2,
} from "@/lib/drive/google";

type UploadRequest = Extract<DriveRequest, { op: "upload" }>;
type OpenRequest = Extract<DriveRequest, { op: "open" }>;
type Translate = ReturnType<typeof useT>;

/** 一度に選べる数と、1つのファイルの大きさの上限 */
const MAX_FILES = 20;
const MAX_FILE_BYTES = 1024 * 1024 * 1024;

const ACCEPT_ATTR: Record<DriveAccept, string | undefined> = {
  image: "image/*",
  video: "video/*",
  pdf: "application/pdf,.pdf",
  any: undefined,
};

function tx(ja: string, en: string): string {
  const { locale, dict } = getClientLocaleState();
  return pick(locale, ja, en, dict);
}

/**
 * アプリの window.Jisapp.drive を受け持つ画面。
 * ・upload：ファイルを選ぶ → Google の許可（初めてのときだけ）→ その人のドライブに保存して、ファイルの情報をアプリに返す
 * ・open：保存したファイルを、アプリの上に重ねて見せる（アプリの枠の中では、ドライブの動画・PDF を表示できないため）
 * ファイルを選ぶのも保存を押すのも、必ずこの画面（ジサップ側）で行う。アプリが勝手にドライブへ何かを入れられないようにするため
 */
export function AppDriveSheet() {
  const [current, setCurrent] = useState<DriveRequestDetail | null>(null);
  const currentRef = useRef<DriveRequestDetail | null>(null);

  useEffect(() => {
    const onRequest = (e: Event) => {
      const detail = (e as CustomEvent<DriveRequestDetail>).detail;
      if (!detail || detail.handled) return;
      detail.handled = true;
      if (currentRef.current) {
        detail.reject(tx("Google ドライブの画面を、すでに開いています", "The Google Drive screen is already open"));
        return;
      }
      currentRef.current = detail;
      setCurrent(detail);
    };
    window.addEventListener(DRIVE_REQUEST_EVENT, onRequest);
    return () => {
      window.removeEventListener(DRIVE_REQUEST_EVENT, onRequest);
      // 画面を離れるときは、待っているアプリに「やめた」と返す
      const pending = currentRef.current;
      currentRef.current = null;
      pending?.resolve(pending.request.op === "upload" ? [] : false);
    };
  }, []);

  const finish = (value: unknown) => {
    const detail = currentRef.current;
    currentRef.current = null;
    setCurrent(null);
    detail?.resolve(value);
  };

  if (!current) return null;
  const request = current.request;
  return createPortal(
    request.op === "upload" ? (
      <UploadSheet request={request} onDone={finish} />
    ) : (
      <DriveViewer request={request} onClose={() => finish(true)} />
    ),
    document.body
  );
}

type Phase =
  | { name: "choose" }
  | { name: "consent" }
  | { name: "saving" }
  | { name: "error"; code: DriveErrorCode | "setup" }
  | { name: "notShared"; count: number };

function UploadSheet({ request, onDone }: { request: UploadRequest; onDone: (files: DriveFileInfo[]) => void }) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>({ name: "choose" });
  const [files, setFiles] = useState<File[]>([]);
  /** 保存中のファイルの番号と、そのファイルを送り終えた大きさ */
  const [progress, setProgress] = useState({ index: 0, loaded: 0 });
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const oauthRef = useRef<GoogleOAuth2 | null>(null);
  /** 保存できたファイル（途中で止まったときは、ここから続ける） */
  const savedRef = useRef<DriveFileInfo[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const inApp = useMemo(() => detectInAppBrowser(), []);
  const kind = kindText(request.accept, request.multiple, t);

  useEffect(() => {
    let alive = true;
    // Google の許可の画面は、ボタンを押した処理の中でしか開けないので、スクリプトは先に読み込んでおく
    loadGoogleIdentity()
      .then((oauth2) => {
        if (alive) oauthRef.current = oauth2;
      })
      .catch(() => {});
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  const validate = (list: File[]): string | null => {
    const max = request.multiple ? MAX_FILES : 1;
    if (list.length > max) return format(t("一度に選べるのは{count}件までです", "You can choose up to {count} at a time"), { count: max });
    if (list.some((f) => f.size > MAX_FILE_BYTES)) return t("1GB より大きいファイルは保存できません", "Files larger than 1 GB can't be saved");
    if (!list.every((f) => matchesAccept(f, request.accept))) return format(t("{kind}だけ選べます", "You can only choose {kind}"), { kind: kind.noun });
    return null;
  };

  const save = async (list: File[], token: string) => {
    setPhase({ name: "saving" });
    setNote("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const folderId = await ensureAppFolder(token, t("ジサップ", "Jisapp"), request.folderName || t("アプリ", "App"));
      for (let i = savedRef.current.length; i < list.length; i++) {
        if (controller.signal.aborted) throw new DriveError("aborted");
        const file = list[i];
        setProgress({ index: i, loaded: 0 });
        const saved = await uploadToDrive(token, file, folderId, (loaded) => setProgress({ index: i, loaded }), controller.signal);
        setProgress({ index: i, loaded: file.size });
        const shared = await shareWithAnyone(token, saved.id);
        const fileKind = driveKindOf(saved.mimeType);
        // 表紙の画像ができるまで待ってから返す（動画は Google の処理に数分かかることがあるので待たない）
        if (fileKind === "image" || fileKind === "pdf") await waitForThumbnail(saved.id);
        const urls = driveFileUrls(saved.id);
        savedRef.current.push({
          id: saved.id,
          name: saved.name,
          kind: fileKind,
          mimeType: saved.mimeType,
          size: saved.size,
          url: urls.url,
          thumbnail: urls.thumbnail,
          shared,
        });
      }
      const notShared = savedRef.current.filter((f) => !f.shared).length;
      if (notShared > 0) setPhase({ name: "notShared", count: notShared });
      else onDone(savedRef.current);
    } catch (e) {
      const code = e instanceof DriveError ? e.code : "upload";
      if (code === "aborted") {
        onDone(savedRef.current);
      } else if (code === "auth") {
        // 許可が切れていたら、もう一度許可してもらって続きから保存する
        forgetDriveToken();
        setNote(t("Google の許可が切れていました。もう一度許可してください", "Your Google permission expired. Please allow again"));
        setPhase({ name: "consent" });
      } else {
        setPhase({ name: "error", code });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const onChosen = (list: FileList | null) => {
    const chosen = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (chosen.length === 0) return;
    const problem = validate(chosen);
    setNote(problem ?? "");
    if (problem) return;
    setFiles(chosen);
    savedRef.current = [];
    const token = cachedDriveToken();
    if (token) void save(chosen, token);
    else setPhase({ name: "consent" });
  };

  const allow = () => {
    if (!DRIVE_CLIENT_ID) {
      setPhase({ name: "error", code: "setup" });
      return;
    }
    const oauth2 = oauthRef.current;
    if (!oauth2) {
      // 読み込みを待ってから開くと、ボタンを押した扱いでなくなり Google の画面が開けないので、もう一度押してもらう
      setNote(t("準備しています。少し待ってから、もう一度押してください", "Getting ready. Wait a moment and tap again"));
      loadGoogleIdentity()
        .then((loaded) => {
          oauthRef.current = loaded;
          setNote("");
        })
        .catch(() => setPhase({ name: "error", code: "network" }));
      return;
    }
    setNote("");
    requestDriveToken(oauth2)
      .then((token) => save(files, token))
      .catch((e: unknown) => setPhase({ name: "error", code: e instanceof DriveError ? e.code : "upload" }));
  };

  const retry = () => {
    const token = cachedDriveToken();
    if (token) void save(files, token);
    else setPhase({ name: "consent" });
  };

  const close = () => {
    if (phase.name === "saving") {
      abortRef.current?.abort();
      return;
    }
    onDone(savedRef.current);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase.name !== "saving") onDone(savedRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase.name, onDone]);

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0) || 1;
  const sentBytes = files.slice(0, progress.index).reduce((sum, f) => sum + f.size, 0) + progress.loaded;
  const percent = Math.min(100, Math.round((sentBytes / totalBytes) * 100));
  const finishing = phase.name === "saving" && !!files[progress.index] && progress.loaded >= files[progress.index].size;
  const primaryButton =
    "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98]";
  const secondaryButton = "w-full rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={phase.name === "saving" ? undefined : close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Google ドライブに保存", "Save to Google Drive")}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-[#fbfdfc] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
        <div className="flex items-center px-5 pt-4">
          <h2 className="flex-1 text-lg font-extrabold tracking-tight text-slate-900">{t("Google ドライブに保存", "Save to Google Drive")}</h2>
          {phase.name !== "saving" && (
            <button
              type="button"
              onClick={close}
              aria-label={t("閉じる", "Close")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="max-h-[80dvh] overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          {phase.name === "choose" && (
            <>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <p>{t("選んだファイルは、あなたの Google ドライブの「ジサップ」フォルダに保存されます。", "The files you choose are saved in the “Jisapp” folder in your Google Drive.")}</p>
                <p>
                  {t(
                    "アプリで見られるように、リンクを知っている人なら見られる設定になります。人に見られて困るものは選ばないでください。",
                    "So the app can show them, anyone with the link will be able to view them. Don't choose anything you wouldn't want others to see."
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {t(
                    "ジサップがさわれるのは、ジサップが保存したファイルだけです。ドライブのほかのファイルは見えません。",
                    "Jisapp can only access the files it saves. It can't see anything else in your Drive."
                  )}
                </p>
              </div>
              {inApp ? (
                <InAppBrowserNotice kind={inApp} />
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()} className={primaryButton}>
                  <kind.Icon className="h-4 w-4" />
                  {kind.choose}
                </button>
              )}
            </>
          )}

          {phase.name === "consent" && (
            <>
              <FileSummary files={files} />
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {t("保存するには、Google の画面で許可してください（初めてのときだけです）。", "To save, give permission on Google's screen (only the first time).")}
              </p>
              <button type="button" onClick={allow} className={primaryButton}>
                {t("Google で許可して保存", "Allow with Google and save")}
              </button>
              {savedRef.current.length === 0 && (
                <button type="button" onClick={() => setPhase({ name: "choose" })} className="mt-2 w-full rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100">
                  {t("選び直す", "Choose again")}
                </button>
              )}
            </>
          )}

          {phase.name === "saving" && (
            <>
              <p className="text-sm font-bold text-slate-700">
                {finishing
                  ? t("仕上げています…", "Finishing up…")
                  : format(t("保存しています…（{done} / {total}）", "Saving… ({done} of {total})"), { done: progress.index + 1, total: files.length })}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">{files[progress.index]?.name}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${percent}%` }} />
              </div>
              <button type="button" onClick={() => abortRef.current?.abort()} className={`mt-4 ${secondaryButton}`}>
                {t("やめる", "Cancel")}
              </button>
            </>
          )}

          {phase.name === "error" && (
            <>
              <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-700">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{errorText(phase.code, t)}</p>
              </div>
              {savedRef.current.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">{format(t("{count}件は保存できています", "{count} saved so far"), { count: savedRef.current.length })}</p>
              )}
              <div className="mt-4 flex gap-2">
                {phase.code !== "setup" && files.length > 0 && (
                  <button type="button" onClick={retry} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                    {t("もう一度", "Try again")}
                  </button>
                )}
                <button type="button" onClick={close} className={`flex-1 ${secondaryButton}`}>
                  {t("閉じる", "Close")}
                </button>
              </div>
            </>
          )}

          {phase.name === "notShared" && (
            <>
              <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {format(
                    t(
                      "{count}件は「リンクを知っている全員」にできませんでした（学校や会社のアカウントでは、禁止されていることがあります）。あなた以外の人には見えません。",
                      "{count} file(s) couldn't be set to “Anyone with the link” (school and work accounts may not allow it). Only you can see them."
                    ),
                    { count: phase.count }
                  )}
                </p>
              </div>
              <button type="button" onClick={() => onDone(savedRef.current)} className={primaryButton}>
                OK
              </button>
            </>
          )}

          {note && <p className="mt-2 text-xs font-bold text-rose-600">{note}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR[request.accept]}
          multiple={request.multiple}
          className="hidden"
          onChange={(e) => onChosen(e.target.files)}
        />
      </div>
    </div>
  );
}

/** 保存したファイルを、アプリの上に重ねて見せる。写真はそのまま、動画・PDF などはドライブの表示を埋め込む */
function DriveViewer({ request, onClose }: { request: OpenRequest; onClose: () => void }) {
  const t = useT();
  const [embed, setEmbed] = useState(request.kind !== "image");
  const urls = driveFileUrls(request.id, 2000);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={request.name || t("ファイル", "File")} className="fixed inset-0 z-[520] flex flex-col bg-slate-950">
      <div className="flex items-center gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{request.name}</p>
        {/* 自分で押すリンクなので、どのブラウザでも新しいタブで開ける */}
        <a
          href={urls.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("ドライブで開く", "Open in Drive")}
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("閉じる", "Close")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {embed ? (
          <iframe
            src={urls.preview}
            title={request.name || t("ファイル", "File")}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="h-full w-full rounded-xl border-0 bg-black"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urls.thumbnail} alt={request.name} onError={() => setEmbed(true)} className="h-full w-full object-contain" />
        )}
      </div>
    </div>
  );
}

function InAppBrowserNotice({ kind }: { kind: "line" | "other" }) {
  const t = useT();
  // LINE は、URL に openExternalBrowser=1 を付けると、いつものブラウザで開く
  const openOutside = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("openExternalBrowser", "1");
    window.location.href = url.toString();
  };
  return (
    <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
      <p>
        {kind === "line"
          ? t(
              "LINE の中のブラウザでは、Google ドライブに保存できません（Google が許可していないため）。Safari や Chrome などのブラウザで開いてください。",
              "You can't save to Google Drive in LINE's built-in browser (Google doesn't allow it). Please open this page in a browser such as Safari or Chrome."
            )
          : t(
              "このアプリの中のブラウザでは、Google ドライブに保存できません（Google が許可していないため）。メニューから「ブラウザで開く」を選んでください。",
              "You can't save to Google Drive in this app's built-in browser (Google doesn't allow it). Choose “Open in browser” from the menu."
            )}
      </p>
      {kind === "line" && (
        <button type="button" onClick={openOutside} className="mt-3 w-full rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-amber-200">
          {t("ブラウザで開く", "Open in your browser")}
        </button>
      )}
    </div>
  );
}

function FileSummary({ files }: { files: File[] }) {
  const t = useT();
  const total = files.reduce((sum, f) => sum + f.size, 0);
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-bold text-slate-500">{format(t("{count}件・{size}", "{count} file(s) · {size}"), { count: files.length, size: formatBytes(total) })}</p>
      <ul className="mt-1.5 space-y-1">
        {files.slice(0, 3).map((f, i) => (
          <li key={i} className="truncate text-sm text-slate-700">
            {f.name}
          </li>
        ))}
      </ul>
      {files.length > 3 && <p className="mt-1 text-xs text-slate-400">{format(t("ほか {count}件", "and {count} more"), { count: files.length - 3 })}</p>}
    </div>
  );
}

/**
 * Google がログインを止めている、アプリの中のブラウザ（LINE・Instagram・Facebook・TikTok、Android のアプリに組み込まれた画面）。
 * そこでは Google の許可の画面が出ないので、先にいつものブラウザで開くよう案内する
 */
function detectInAppBrowser(): "line" | "other" | null {
  const ua = navigator.userAgent;
  if (/\bLine\//i.test(ua)) return "line";
  if (/Instagram|FBAN|FBAV|FB_IAB|BytedanceWebview|musical_ly|; wv\)/i.test(ua)) return "other";
  return null;
}

function matchesAccept(file: File, accept: DriveAccept): boolean {
  if (accept === "image") return file.type.startsWith("image/");
  if (accept === "video") return file.type.startsWith("video/");
  if (accept === "pdf") return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  return true;
}

function kindText(accept: DriveAccept, multiple: boolean, t: Translate) {
  switch (accept) {
    case "image":
      return { choose: multiple ? t("写真を選ぶ", "Choose photos") : t("写真を選ぶ", "Choose a photo"), noun: t("写真", "photos"), Icon: ImageIcon };
    case "video":
      return { choose: multiple ? t("動画を選ぶ", "Choose videos") : t("動画を選ぶ", "Choose a video"), noun: t("動画", "videos"), Icon: Film };
    case "pdf":
      return { choose: multiple ? t("PDF を選ぶ", "Choose PDFs") : t("PDF を選ぶ", "Choose a PDF"), noun: t("PDF ファイル", "PDFs"), Icon: FileText };
    default:
      return { choose: multiple ? t("ファイルを選ぶ", "Choose files") : t("ファイルを選ぶ", "Choose a file"), noun: t("ファイル", "files"), Icon: FileIcon };
  }
}

function errorText(code: DriveErrorCode | "setup", t: Translate): string {
  switch (code) {
    case "network":
      return t("通信できませんでした。電波のよいところで、もう一度お試しください", "Couldn't connect. Check your connection and try again");
    case "quota":
      return t("Google ドライブの空き容量が足りません", "Your Google Drive doesn't have enough space");
    case "denied":
      return t("Google ドライブへの保存が許可されませんでした", "Saving to Google Drive wasn't allowed");
    case "scope":
      return t("Google の画面で、ドライブへの保存にチェックを入れてから許可してください", "On Google's screen, tick the box for Google Drive, then allow");
    case "popup":
      return t("Google の画面を開けませんでした。ポップアップを許可してから、もう一度お試しください", "Couldn't open Google's screen. Allow pop-ups and try again");
    case "closed":
      return t("Google の画面が閉じられました", "Google's screen was closed");
    case "setup":
      return t("Google ドライブの準備ができていません。しばらくしてから、もう一度お試しください", "Google Drive isn't ready yet. Please try again later");
    case "auth":
      return t("Google の許可が切れていました。もう一度お試しください", "Your Google permission expired. Please try again");
    default:
      return t("保存できませんでした。もう一度お試しください", "Couldn't save. Please try again");
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}
