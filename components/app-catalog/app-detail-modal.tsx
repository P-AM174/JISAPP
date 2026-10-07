"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "@/lib/i18n/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useSession } from "next-auth/react";
import {
  X,
  Heart,
  MessageCirclePlus,
  CheckCircle2,
  Send,
  LogIn,
  ExternalLink,
  LibraryBig,
  ChevronRight,
  Flag,
  Brain,
  Wrench,
  Palette,
  AlertTriangle,
  Smartphone,
  Wand2,
} from "lucide-react";
import { AppReportModal } from "./app-report-modal";
import { cn } from "@/lib/utils";
import { ShareButtonRow } from "@/components/share-button";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import { getAppShareUrl } from "@/lib/share";
import { MiniPreview } from "./mini-preview";
import { GroupAppNotice } from "./group-app-badge";
import { displayCreatorName, getCreatorProfilePath } from "./utils";
import { useLocale, useT } from "@/lib/i18n/client";
import type { ModalApp } from "./types";
import { format } from "@/lib/i18n/config";
import { isComposing } from "@/lib/i18n/text";

const STAMPS = [
  { id: "like", Icon: Heart, label: "いいね！", labelEn: "Love it!" },
  { id: "genius", Icon: Brain, label: "天才！", labelEn: "Genius!" },
  { id: "useful", Icon: Wrench, label: "便利！", labelEn: "So useful!" },
  { id: "design", Icon: Palette, label: "デザインが好き！", labelEn: "Great design!" },
] as const;
type StampId = (typeof STAMPS)[number]["id"];

export function AppDetailModal({
  app,
  onClose,
}: {
  app: ModalApp;
  onClose: () => void;
}) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;
  const router = useRouter();
  const t = useT();
  const locale = useLocale();

  const [libState, setLibState] = useState<"idle" | "loading" | "done" | "login_required">("idle");

  useEffect(() => {
    setLibState("idle");
    if (!isLoggedIn) return;
    fetch(`/api/library/check?appId=${encodeURIComponent(String(app.id))}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.inLibrary) setLibState("done");
      })
      .catch(() => {});
  }, [app.id, isLoggedIn]);

  // コードを公開しているアプリだけ「このアプリをもとに作る」を出す
  const [remixable, setRemixable] = useState(false);
  useEffect(() => {
    setRemixable(false);
    const id = String(app.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return;
    let cancelled = false;
    fetch(`/api/apps/${id}/remix?check=1`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.available) setRemixable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [app.id]);

  const storageKey = `jisapp_stamps_${app.id}`;
  const [myStamps, setMyStamps] = useState<StampId[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });
  const [stampCounts, setStampCounts] = useState<Record<StampId, number>>({
    like: 0,
    genius: 0,
    useful: 0,
    design: 0,
  });

  useEffect(() => {
    fetch(`/api/apps/${app.id}/stamps`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.counts) setStampCounts(data.counts);
      })
      .catch(() => {});
  }, [app.id]);

  const handleStamp = useCallback(
    async (stampId: StampId) => {
      const isOn = myStamps.includes(stampId);
      const next = isOn ? myStamps.filter((s) => s !== stampId) : [...myStamps, stampId];
      setMyStamps(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStampCounts((prev) => ({
        ...prev,
        [stampId]: Math.max(0, (prev[stampId] ?? 0) + (isOn ? -1 : 1)),
      }));
      fetch(`/api/apps/${app.id}/stamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stampId, action: isOn ? "remove" : "add" }),
      }).catch(() => {});
    },
    [myStamps, app.id, storageKey]
  );

  const [requestText, setRequestText] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "loading" | "done">("idle");
  const [reportOpen, setReportOpen] = useState(false);

  const handleRequest = useCallback(async () => {
    if (!requestText.trim()) return;
    setRequestState("loading");
    try {
      const res = await fetch(`/api/apps/${app.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestText.trim().slice(0, 300) }),
      });
      if (!res.ok) throw new Error("request failed");
      setRequestState("done");
      setRequestText("");
    } catch {
      setRequestState("idle");
    }
  }, [requestText, app.id]);

  const handleAddLibrary = useCallback(async () => {
    if (!isLoggedIn) {
      setLibState("login_required");
      return;
    }
    setLibState("loading");
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: String(app.id),
          name: app.name,
          category: app.category,
          gradient: app.gradient,
        }),
      });
      if (!res.ok) throw new Error();
      setLibState("done");
    } catch {
      setLibState("idle");
    }
  }, [isLoggedIn, app]);

  const creatorPath = getCreatorProfilePath(app.creator);
  const showCreator = app.creator.trim() && app.creator !== "匿名";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-y-auto max-h-[90dvh] rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <MiniPreview
            id={app.id}
            fallbackGradient={app.gradient}
            fallbackCategoryId={app.categoryId}
            height={180}
            live="always"
          />
          <button
            onClick={onClose}
            aria-label={t("閉じる", "Close")}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {app.category && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                  {app.category}
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-gray-900">{app.name}</h2>
            {app.description && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">{app.description}</p>
            )}
          </div>

          {app.groupSharing && <GroupAppNotice />}

          {showCreator && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-4 shadow-sm">
              <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                {t("出品者", "Creator")}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href={creatorPath}
                  onClick={onClose}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-black text-white shadow-md ring-4 ring-white"
                >
                  {app.creator[0]?.toUpperCase() ?? "?"}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={creatorPath}
                    onClick={onClose}
                    className="flex items-center gap-1 text-base font-black text-gray-900 hover:text-emerald-700 transition-colors"
                  >
                    <span className="truncate">{displayCreatorName(app.creator, locale)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600" />
                  </Link>
                  <div className="mt-1 text-xs font-semibold text-emerald-700">
                    {t("プロフィール・出品一覧を見る", "View profile & apps")}
                  </div>
                </div>
                <CreatorFollowButton creatorName={app.creator} size="md" />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
              <p className="text-xs font-bold text-emerald-800">{t("応援バッジを送る", "Send a cheer badge")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STAMPS.map(({ id, Icon, label, labelEn }) => {
                const active = myStamps.includes(id);
                const count = stampCounts[id] ?? 0;
                return (
                  <button
                    key={id}
                    onClick={() => handleStamp(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all active:scale-95",
                      active
                        ? "border-emerald-400 bg-emerald-100 text-emerald-800 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                    <span className="flex-1 text-left text-xs">{t(label, labelEn)}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                          active ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCirclePlus className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-bold text-violet-800">{t("こうなったらもっと最高！", "It'd be even better if…")}</p>
            </div>
            <p className="text-[11px] text-violet-600 mb-3">
              {t("改善リクエストを作者に届けよう。批判じゃなく「期待」として受け取ってもらえます。", "Send the creator an idea. It reaches them as encouragement, not criticism.")}
            </p>
            {requestState === "done" ? (
              <div className="flex items-center gap-2 rounded-xl bg-violet-100 px-3 py-2.5 text-xs font-bold text-violet-700">
                <CheckCircle2 className="h-4 w-4" />
                {t("リクエストを送りました！ありがとうございます！", "Sent! Thank you!")}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder={t("例：ダークモードがあると最高！", "e.g. A dark mode would be awesome!")}
                  className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs placeholder:text-gray-300 focus:border-violet-400 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isComposing(e)) handleRequest();
                  }}
                />
                <button
                  onClick={handleRequest}
                  disabled={!requestText.trim() || requestState === "loading"}
                  aria-label={t("送信", "Send")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {requestState === "loading" ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {!isLoggedIn && status !== "loading" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
              <p className="mb-0.5 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {t("ログインせずにご利用の場合", "Using without signing in")}
              </p>
              <p>
                {t("アプリは使えますが、データの保存はお使いのブラウザにのみ保存されます。ブラウザデータを削除すると消えることがあります。", "You can use the app, but your data is only saved in this browser and may be lost if you clear browser data.")}
                <Link href="/login" className="font-bold underline ml-1">
                  {t("ログイン", "Sign in")}
                </Link>
                {t("するとクラウドに安全に保存されます。", " to keep it safely in the cloud.")}
              </p>
            </div>
          )}

          {libState === "done" && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-800 leading-relaxed">
              <p className="mb-1 flex items-center gap-1.5 font-bold">
                <Smartphone className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {t("ホーム画面に追加しよう！", "Add it to your home screen!")}
              </p>
              <p>{t("ブラウザの「共有」→「ホーム画面に追加」でアプリのように起動できます。", "Use your browser's “Share” → “Add to Home Screen” to open it like an app.")}</p>
            </div>
          )}

          {libState === "login_required" && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <LogIn className="h-4 w-4 shrink-0" />
              <span>
                {t("マイライブラリへの追加には", "Please")}
                <Link href="/login" className="font-bold underline ml-1">
                  {t("ログイン", "sign in")}
                </Link>
                {t("が必要です", " to add apps to your library")}
              </span>
            </div>
          )}

          <div className="space-y-2 pb-2">
            <ShareButtonRow
              url={getAppShareUrl(String(app.id))}
              title={app.name}
              text={format(t("{name} | ジサップで作った無料アプリ", "{name} | a free app made on Jisapp"), { name: app.name })}
            />

            <button
              onClick={() => router.push(`/apps/${app.id}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              {t("アプリを開く", "Open app")}
            </button>

            {libState === "done" ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-200 py-3 text-sm font-bold text-teal-700">
                <CheckCircle2 className="h-4 w-4" />
                {t("マイライブラリに追加済み", "In your library")}
              </div>
            ) : (
              <button
                onClick={handleAddLibrary}
                disabled={libState === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 py-3 text-sm font-bold text-teal-700 hover:bg-teal-100 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {libState === "loading" ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                ) : (
                  <LibraryBig className="h-4 w-4" />
                )}
                {t("マイライブラリに追加", "Add to my library")}
              </button>
            )}
            {remixable && (
              <button
                type="button"
                onClick={() => router.push(`/playground?remix=${app.id}`)}
                className="flex w-full flex-col items-center justify-center rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-violet-700 hover:bg-violet-100 active:scale-[0.98] transition-all"
              >
                <span className="flex items-center gap-2 text-sm font-bold">
                  <Wand2 className="h-4 w-4" />
                  {t("このアプリをもとに作る", "Make your own version")}
                </span>
                <span className="text-[11px] font-medium text-violet-500">
                  {t("自分用に作り変えられます。元のアプリは変わりません", "Make it your own. The original app stays as it is")}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 py-1 text-xs text-gray-400 hover:text-rose-500 transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
              {t("このアプリを報告する", "Report this app")}
            </button>
          </div>
        </div>
      </div>

      <AppReportModal
        appId={app.id}
        appName={app.name}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
