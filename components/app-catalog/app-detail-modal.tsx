"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  X,
  ThumbsUp,
  MessageCirclePlus,
  CheckCircle2,
  Send,
  LogIn,
  ExternalLink,
  LibraryBig,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareButtonRow } from "@/components/share-button";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import { getAppShareUrl } from "@/lib/share";
import { MiniPreview } from "./mini-preview";
import { getCreatorProfilePath } from "./utils";
import type { ModalApp } from "./types";

const STAMPS = [
  { id: "like", emoji: "👍", label: "いいね！" },
  { id: "genius", emoji: "🧠", label: "天才！" },
  { id: "useful", emoji: "⚡", label: "便利！" },
  { id: "design", emoji: "🎨", label: "デザインが好き！" },
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

  const handleRequest = useCallback(async () => {
    if (!requestText.trim()) return;
    setRequestState("loading");
    try {
      const res = await fetch(`/api/apps/${app.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestText.trim().slice(0, 300) }),
      });
      if (!res.ok) throw new Error("送信失敗");
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
            fallbackEmoji={app.emoji}
            height={180}
          />
          <button
            onClick={onClose}
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

          {showCreator && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-4 shadow-sm">
              <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                出品者
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
                    <span className="truncate">{app.creator}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600" />
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    プロフィール・出品一覧を見る
                  </div>
                </div>
                <CreatorFollowButton creatorName={app.creator} size="md" />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-800">応援バッジを送る</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STAMPS.map(({ id, emoji, label }) => {
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
                    <span className="text-base">{emoji}</span>
                    <span className="flex-1 text-left text-xs">{label}</span>
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
              <p className="text-xs font-bold text-violet-800">こうなったらもっと最高！</p>
            </div>
            <p className="text-[11px] text-violet-600 mb-3">
              改善リクエストを作者に届けよう。批判じゃなく「期待」として受け取ってもらえます。
            </p>
            {requestState === "done" ? (
              <div className="flex items-center gap-2 rounded-xl bg-violet-100 px-3 py-2.5 text-xs font-bold text-violet-700">
                <CheckCircle2 className="h-4 w-4" />
                リクエストを送りました！ありがとうございます🙌
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="例：ダークモードがあると最高！"
                  className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs placeholder:text-gray-300 focus:border-violet-400 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRequest();
                  }}
                />
                <button
                  onClick={handleRequest}
                  disabled={!requestText.trim() || requestState === "loading"}
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
              <p className="font-bold mb-0.5">⚠️ ログインせずにご利用の場合</p>
              <p>
                アプリは使えますが、データの保存はお使いのブラウザにのみ保存されます。
                ブラウザデータを削除すると消えることがあります。
                <Link href="/login" className="font-bold underline ml-1">
                  ログイン
                </Link>
                するとクラウドに安全に保存されます。
              </p>
            </div>
          )}

          {libState === "done" && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-800 leading-relaxed">
              <p className="font-bold mb-1">📱 ホーム画面に追加しよう！</p>
              <p>ブラウザの「共有」→「ホーム画面に追加」でアプリのように起動できます。</p>
            </div>
          )}

          {libState === "login_required" && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <LogIn className="h-4 w-4 shrink-0" />
              <span>
                マイライブラリへの追加には
                <Link href="/login" className="font-bold underline ml-1">
                  ログイン
                </Link>
                が必要です
              </span>
            </div>
          )}

          <div className="space-y-2 pb-2">
            <ShareButtonRow
              url={getAppShareUrl(String(app.id))}
              title={app.name}
              text={`${app.name} | ジサップで作った無料アプリ`}
            />

            <button
              onClick={() => router.push(`/apps/${app.id}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              アプリを開く
            </button>

            {libState === "done" ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-200 py-3 text-sm font-bold text-teal-700">
                <CheckCircle2 className="h-4 w-4" />
                マイライブラリに追加済み ✓
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
                マイライブラリに追加
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
