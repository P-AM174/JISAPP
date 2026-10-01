"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/i18n/navigation";
import { ChevronRight, Database, ExternalLink, Pin, PinOff, Trash2, X } from "lucide-react";
import { MiniPreview } from "@/components/app-catalog/mini-preview";
import { displayCreatorName, getCreatorProfilePath } from "@/components/app-catalog/utils";
import { categoryName } from "@/lib/categories";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, format } from "@/lib/i18n/config";
import { lastOpenedLabel, type LibraryEntry } from "@/lib/library/sort";
import { AppStorageBar } from "@/components/app-storage-bar";

type Detail = {
  title: string;
  description: string | null;
  category: string | null;
  creatorName: string | null;
  removedByCreator: boolean;
  libraryCount: number;
  stampCount: number;
};

/** マイライブラリのカードをタップしたときに、下から出す詳細シート */
export function LibraryDetailSheet({
  entry,
  gradient,
  storageBytes,
  maxKeyBytes,
  onDeleteData,
  onClose,
  onOpen,
  onTogglePin,
  onRemove,
}: {
  entry: LibraryEntry;
  gradient: string;
  /** このアプリに自分が保存しているデータの量（取得できないときは undefined） */
  storageBytes?: number;
  /** いちばん大きい保存データ（1回に保存できる量と比べる） */
  maxKeyBytes?: number;
  /** 保存データを消す（確認は呼び出し側で行う） */
  onDeleteData?: () => void;
  onClose: () => void;
  onOpen: () => void;
  onTogglePin: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setFailed(false);
    fetch(`/api/library/detail?appId=${encodeURIComponent(entry.appId)}`)
      .then((res) => (res.ok ? (res.json() as Promise<Detail>) : Promise.reject()))
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [entry.appId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = detail?.title ?? entry.name ?? t("アプリ", "App");
  const category = detail?.category ?? entry.category;
  const creator = detail?.creatorName?.trim();
  const showCreator = !!creator && creator !== "匿名";
  const pinned = !!entry.pinnedAt;

  const stats = [
    { label: t("ライブラリ登録", "In libraries"), value: detail ? detail.libraryCount.toLocaleString() : "–" },
    { label: t("スタンプ", "Stamps"), value: detail ? detail.stampCount.toLocaleString() : "–" },
    { label: t("自分が開いた", "You opened"), value: format(t("{openCount}回", "{openCount}×"), { openCount: entry.openCount ?? 0 }) },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <MiniPreview id={entry.appId} fallbackGradient={gradient} fallbackCategoryId={category} height={160} />
          {pinned && (
            <span className="absolute left-3 top-10 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950 shadow">
              <Pin className="h-3 w-3" />
              {t("ピン留め中", "Pinned")}
            </span>
          )}
          <button
            onClick={onClose}
            aria-label={t("閉じる", "Close")}
            className="absolute right-3 top-10 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            {category && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                {categoryName(category, locale)}
              </span>
            )}
            <h2 className="mt-1.5 text-lg font-black text-gray-900">{title}</h2>
            <p className="mt-0.5 text-xs text-gray-400">{lastOpenedLabel(entry, t, intlLocale(locale))}</p>
            {detail?.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{detail.description}</p>
            )}
            {detail?.removedByCreator && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {t(
                  "作者がこのアプリを削除しました。ライブラリに保存された版は、このまま使えます。",
                  "The creator deleted this app. The copy saved in your library still works."
                )}
              </p>
            )}
          </div>

          {showCreator && (
            <Link
              href={getCreatorProfilePath(creator)}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 transition-colors hover:bg-emerald-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-black text-white">
                {creator[0]?.toUpperCase() ?? "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-emerald-700">{t("作者", "Creator")}</span>
                <span className="block truncate text-sm font-bold text-gray-900">{displayCreatorName(creator, locale)}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600" />
            </Link>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-50 px-2 py-2.5">
                <p className="text-base font-black text-gray-900">{s.value}</p>
                <p className="text-[10px] font-semibold text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          {storageBytes !== undefined &&
            (storageBytes > 0 ? (
              <AppStorageBar bytes={storageBytes} maxKeyBytes={maxKeyBytes ?? storageBytes} onDelete={onDeleteData} />
            ) : (
              <p className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                <Database className="h-4 w-4 shrink-0 text-emerald-600" />
                {t("このアプリには、まだデータを保存していません", "You haven't saved any data in this app yet")}
              </p>
            ))}
          {failed && (
            <p className="text-center text-xs text-gray-400">{t("詳しい情報を読み込めませんでした", "Couldn't load the details")}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onOpen}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <ExternalLink className="h-4 w-4" />
              {t("開く", "Open")}
            </button>
            <button
              onClick={onTogglePin}
              className={
                pinned
                  ? "flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-3 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-200"
                  : "flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
              }
            >
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {pinned ? t("ピンを外す", "Unpin") : t("ピン留め", "Pin")}
            </button>
            <button
              onClick={onRemove}
              aria-label={t("ライブラリから削除", "Remove from library")}
              title={t("ライブラリから削除", "Remove from library")}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
