"use client";

import { localeFromPath } from "@/lib/i18n/config";

/**
 * 計測（ブラウザ側）。イベントを /api/analytics に送る。
 * 送れなくても画面の動きには影響させない（失敗は無視する）。
 * 記録する内容と表は scripts/add-analytics-events.sql を参照
 */
export type AnalyticsEvent =
  | "page_view"
  | "prompt_copy"
  | "studio_paste"
  | "preview"
  | "publish"
  | "share"
  | "signup";

const SESSION_KEY = "jisapp:analytics:session";
const UTM_KEY = "jisapp:analytics:utm";

type Utm = { utm_source?: string; utm_medium?: string; utm_campaign?: string };

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** ブラウザのタブごとの訪問 ID（訪問数を数えるため。個人は特定しない） */
function sessionId(): string {
  const store = safeSession();
  let id = store?.getItem(SESSION_KEY) ?? "";
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    store?.setItem(SESSION_KEY, id);
  }
  return id;
}

/** 最初に来たときの UTM を覚えておき、その訪問のあいだのイベントにつける */
function currentUtm(): Utm {
  const store = safeSession();
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const v = params.get(key);
    if (v) fromUrl[key] = v.slice(0, 64);
  }
  if (Object.keys(fromUrl).length) {
    store?.setItem(UTM_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }
  try {
    return JSON.parse(store?.getItem(UTM_KEY) ?? "{}") as Utm;
  } catch {
    return {};
  }
}

export function trackEvent(name: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      name,
      locale: localeFromPath(window.location.pathname) ?? "ja",
      path: window.location.pathname.slice(0, 200),
      session_id: sessionId(),
      ...currentUtm(),
      props: props ?? null,
    });
    const url = "/api/analytics";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      void fetch(url, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    // 計測の失敗は無視する
  }
}
