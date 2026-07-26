"use client";

import { useState } from "react";
import Link from "next/link";
import { Cloud, LibraryBig, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncInfoModalProps = {
  open: boolean;
  variant: "login" | "add_library";
  appId: string;
  appName?: string;
  appCategory?: string;
  appGradient?: string;
  loginCallbackUrl: string;
  onClose: () => void;
  onAddedToLibrary?: () => void;
};

export function SyncInfoModal({
  open,
  variant,
  appId,
  appName,
  appCategory,
  appGradient,
  loginCallbackUrl,
  onClose,
  onAddedToLibrary,
}: SyncInfoModalProps) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAddLibrary = async () => {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          name: appName,
          category: appCategory,
          gradient: appGradient,
        }),
      });
      if (!res.ok) throw new Error("追加に失敗しました");
      onAddedToLibrary?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  const isLogin = variant === "login";

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("px-5 pb-5 pt-6", isLogin ? "bg-sky-50" : "bg-emerald-50")}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 hover:bg-white"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
          <div
            className={cn(
              "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
              isLogin ? "bg-sky-100 text-sky-600" : "bg-emerald-100 text-emerald-600"
            )}
          >
            {isLogin ? <LogIn className="h-6 w-6" /> : <LibraryBig className="h-6 w-6" />}
          </div>
          <h2 className="text-center text-base font-black text-gray-900">
            {isLogin ? "同期機能について" : "保存機能について"}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-gray-600">
            {isLogin ? (
              <>
                ログインして、マイライブラリに登録すると
                <span className="font-bold text-gray-800">端末をまたいでデータを同期</span>
                できます。
              </>
            ) : (
              <>
                マイライブラリに追加すると
                <span className="font-bold text-gray-800">データの保存・同期機能</span>
                が使えるようになります。
              </>
            )}
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
            <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>
              追加しなくてもアプリはそのまま使えます。この端末だけの一時保存になります。
            </span>
          </div>

          {error && <p className="text-center text-xs text-rose-600">{error}</p>}

          {isLogin ? (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <LogIn className="h-4 w-4" />
              ログインする
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddLibrary}
              disabled={adding}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <LibraryBig className="h-4 w-4" />
              {adding ? "追加中…" : "マイライブラリに追加"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            このまま使う
          </button>
        </div>
      </div>
    </div>
  );
}
