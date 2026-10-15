"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Share, SquarePlus, Smartphone, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { rich } from "@/lib/i18n/rich";

/**
 * 「ホーム画面に追加」の案内。
 * 一人で使うアプリは、URL を覚えていないと二度と開けない（調査：作者本人も数日で開かなくなる）。
 * ホーム画面にアイコンを置いてもらい、次からすぐ開けるようにする。
 */

type Platform = "ios" | "ios_inapp" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) {
    // LINE・Instagram などのアプリの中のブラウザでは、ホーム画面に追加できない
    return /Line\/|Instagram|FBAN|FBAV|Twitter|TikTok|BytedanceWebview/i.test(ua) ? "ios_inapp" : "ios";
  }
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

/** ホーム画面のアイコンから開いているか */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{n}</span>
      <span className="pt-0.5 leading-snug">{children}</span>
    </li>
  );
}

const icon = "mx-0.5 inline h-4 w-4 align-[-3px] text-sky-600";

/** 端末に合わせた手順。openFirst のときは「まずアプリを開く」を1番目に入れる（公開直後の画面用） */
export function AddToHomeSteps({ openFirst = false }: { openFirst?: boolean }) {
  const t = useT();
  const [platform, setPlatform] = useState<Platform>("desktop");
  useEffect(() => setPlatform(detectPlatform()), []);
  const first = openFirst ? 1 : 0;

  if (platform === "desktop") {
    return (
      <p className="text-sm leading-relaxed text-slate-700">
        {t(
          "スマホでこのアプリのURLを開いて、ホーム画面に追加すると、アプリのようにすぐ開けます。パソコンでは、ブックマーク（Ctrl+D／⌘+D）に入れておくと便利です。",
          "Open this app's URL on your phone and add it to your home screen to open it like an app. On a computer, bookmark it (Ctrl+D / ⌘+D)."
        )}
      </p>
    );
  }

  return (
    <ol className="space-y-2 text-sm text-slate-700">
      {openFirst && <Step n={1}>{t("下の「アプリを開く」でアプリを開く", "Open the app with “Open app” below")}</Step>}
      {platform === "ios_inapp" && (
        <Step n={first + 1}>
          {t("右上（または右下）のメニューから「Safariで開く」を選ぶ", "From the menu at the top (or bottom) right, choose “Open in Safari”")}
        </Step>
      )}
      {platform === "android" ? (
        <>
          <Step n={first + 1}>
            {rich(t("Chrome の右上の {icon} を押す", "Tap {icon} at the top right of Chrome"), {}, { icon: <MoreVertical className={icon} /> })}
          </Step>
          <Step n={first + 2}>{t("「ホーム画面に追加」を押す", "Tap “Add to Home screen”")}</Step>
          <Step n={first + 3}>{t("「追加」を押す", "Tap “Add”")}</Step>
        </>
      ) : (
        <>
          <Step n={first + (platform === "ios_inapp" ? 2 : 1)}>
            {rich(t("Safari の共有ボタン {icon} を押す（画面の下か上にあります）", "Tap the Share button {icon} in Safari (at the bottom or top of the screen)"), {}, { icon: <Share className={icon} /> })}
          </Step>
          <Step n={first + (platform === "ios_inapp" ? 3 : 2)}>
            {rich(t("下にスクロールして「ホーム画面に追加」{icon} を押す", "Scroll down and tap “Add to Home Screen” {icon}"), {}, { icon: <SquarePlus className={icon} /> })}
          </Step>
          <Step n={first + (platform === "ios_inapp" ? 4 : 3)}>{t("右上の「追加」を押す", "Tap “Add” at the top right")}</Step>
        </>
      )}
    </ol>
  );
}

/**
 * アプリのページの下に出す「ホーム画面に置くと次からすぐ開けます」の帯。
 * どのアプリでも、初めて開いたときから出す。
 * 閉じたら、そのアプリではもう出さない。ホーム画面から開いているときは出さない。
 */
export function HomeScreenNudge({ appId, enabled }: { appId: string; enabled: boolean }) {
  const t = useT();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const offKey = `jisapp_home_nudge_off:${appId}`;

  useEffect(() => {
    if (!enabled || isStandalone()) return;
    try {
      setShow(localStorage.getItem(offKey) !== "1");
    } catch {
      /* 記録できないときは出さない */
    }
  }, [enabled, offKey]);

  if (!show) return null;

  const close = () => {
    setShow(false);
    setOpen(false);
    try { localStorage.setItem(offKey, "1"); } catch { /* noop */ }
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-t border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900">
        <Smartphone className="h-4 w-4 shrink-0 text-sky-600" />
        <p className="min-w-0 flex-1 font-semibold leading-snug">{t("ホーム画面に置くと、次からすぐ開けます", "Add it to your home screen to open it quickly next time")}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-full bg-sky-600 px-3 py-1.5 font-bold text-white hover:bg-sky-700"
        >
          {t("やり方", "How")}
        </button>
        <button type="button" onClick={close} aria-label={t("閉じる", "Close")} className="shrink-0 rounded-full p-1 text-sky-700 hover:bg-sky-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="flex items-center gap-1.5 text-base font-black text-slate-900">
              <Smartphone className="h-5 w-5 text-sky-600" />
              {t("ホーム画面に追加する", "Add to your home screen")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t("アプリのようにアイコンから開けるようになります。データはそのまま使えます。", "You can open it from an icon like an app. Your data stays as it is.")}
            </p>
            <div className="mt-4">
              <AddToHomeSteps />
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={close} className="flex-1 rounded-xl py-2.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50">
                {t("もう出さない", "Don't show again")}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                {t("わかった", "Got it")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
