"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "@/lib/i18n/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/back-button";
import { JisappLogo, JisappLogoIcon } from "@/components/jisapp-logo";
import {
  LibraryBig,
  ExternalLink,
  LogIn,
  ArrowRight,
  Pin,
  MoreHorizontal,
} from "lucide-react";
import { CATEGORY_MAP } from "@/lib/categories";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MiniPreview } from "@/components/app-catalog/mini-preview";
import { LibraryDetailSheet } from "@/components/library/library-detail-sheet";
import {
  LIBRARY_SORT_MODES,
  lastOpenedLabel,
  librarySortLabel,
  sortLibrary,
  type LibraryEntry,
  type LibrarySortMode,
} from "@/lib/library/sort";

/** 選んだ並べ方を、この端末に覚えておく */
const SORT_STORAGE_KEY = "jisapp_library_sort";

function readSavedSort(): LibrarySortMode {
  try {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    if (saved && (LIBRARY_SORT_MODES as string[]).includes(saved)) return saved as LibrarySortMode;
  } catch {
    /* 読めなければ既定の並べ方 */
  }
  return "recent";
}

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;
  const router = useRouter();
  const t = useT();
  const locale = useLocale();

  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<LibraryEntry | null>(null);
  const [removing, setRemoving] = useState(false);
  const [sortMode, setSortMode] = useState<LibrarySortMode>("recent");
  const [selected, setSelected] = useState<LibraryEntry | null>(null);

  useEffect(() => {
    setSortMode(readSavedSort());
  }, []);

  const changeSort = (mode: LibrarySortMode) => {
    setSortMode(mode);
    try {
      localStorage.setItem(SORT_STORAGE_KEY, mode);
    } catch {
      /* 覚えられなくても並べ替えはできる */
    }
  };

  const sorted = useMemo(() => sortLibrary(library, sortMode), [library, sortMode]);

  useEffect(() => {
    if (status === "loading") return;
    if (!isLoggedIn) { setLoading(false); return; }

    fetch("/api/library")
      .then((r) => r.json())
      .then((json) => setLibrary(json.library ?? []))
      .catch(() => setLibrary([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, status]);

  const handleRemove = async (appId: string) => {
    const previous = library;
    setLibrary((prev) => prev.filter((e) => e.appId !== appId));
    try {
      const res = await fetch(`/api/library?appId=${encodeURIComponent(appId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setLibrary(previous);
    }
  };

  /** ピン留めする・外す（先に画面を変え、失敗したら戻す） */
  const togglePin = async (entry: LibraryEntry) => {
    const pinned = !entry.pinnedAt;
    const pinnedAt = pinned ? new Date().toISOString() : null;
    const apply = (value: string | null) => {
      setLibrary((prev) => prev.map((e) => (e.appId === entry.appId ? { ...e, pinnedAt: value } : e)));
      setSelected((cur) => (cur?.appId === entry.appId ? { ...cur, pinnedAt: value } : cur));
    };
    apply(pinnedAt);
    try {
      const res = await fetch("/api/library/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: entry.appId, pinned }),
      });
      if (!res.ok) throw new Error("pin failed");
    } catch {
      apply(entry.pinnedAt ?? null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    await handleRemove(removeTarget.appId);
    setRemoving(false);
    setRemoveTarget(null);
    setSelected(null);
  };

  const getGradient = (entry: LibraryEntry) => {
    if (entry.gradient) return entry.gradient;
    if (entry.category) return CATEGORY_MAP[entry.category]?.gradient ?? "from-emerald-500 to-teal-600";
    return "from-emerald-500 to-teal-600";
  };

  return (
    <div className="min-h-screen bg-emerald-50/40">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 border-b border-emerald-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile />
          <JisappLogo href="/" />
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50">
              <LibraryBig className="h-4 w-4 text-teal-600" />
            </span>
            <span className="text-sm font-black text-gray-900">{t("マイライブラリ", "My library")}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* 未ログイン */}
        {!isLoggedIn && status !== "loading" && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-100">
              <LibraryBig className="h-10 w-10 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{t("マイライブラリ", "My library")}</h2>
              <p className="mt-2 text-sm text-gray-500">
                {t(<>気に入ったアプリをここに追加して、いつでもすぐ起動できます。<br />利用するにはログインが必要です。</>, <>Add apps you like here and open them anytime.<br />Sign in to use your library.</>)}
              </p>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              {t("ログインしてライブラリを使う", "Sign in to use your library")}
            </Link>
          </div>
        )}

        {/* ローディング */}
        {isLoggedIn && loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          </div>
        )}

        {/* ライブラリが空 */}
        {isLoggedIn && !loading && library.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50">
              <LibraryBig className="h-10 w-10 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">{t("まだアプリがありません", "No apps yet")}</h2>
              <p className="mt-2 text-sm text-gray-500">
                {t("ホームでアプリをタップして「マイライブラリに追加」を押してみよう！", "Tap an app on the home page and choose “Add to my library”!")}
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              <JisappLogoIcon className="h-4 w-4" />
              {t("アプリを探す", "Browse apps")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ライブラリ一覧 */}
        {isLoggedIn && !loading && library.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-gray-400">{t(`${library.length}件のアプリ`, `${library.length} ${library.length === 1 ? "app" : "apps"}`)}</p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0" role="radiogroup" aria-label={t("並べ替え", "Sort")}>
                {LIBRARY_SORT_MODES.map((mode) => (
                  <button
                    key={mode}
                    role="radio"
                    aria-checked={sortMode === mode}
                    onClick={() => changeSort(mode)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                      sortMode === mode
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-white text-gray-600 ring-1 ring-black/10 hover:bg-teal-50"
                    )}
                  >
                    {librarySortLabel(mode, t)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sorted.map((entry) => (
                <div
                  key={entry.appId}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md hover:ring-teal-300"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(entry)}
                    className="relative block text-left"
                    aria-label={t(`「${entry.name ?? "アプリ"}」の詳細`, `Details for “${entry.name ?? "this app"}”`)}
                  >
                    <MiniPreview
                      id={entry.appId}
                      fallbackGradient={getGradient(entry)}
                      fallbackCategoryId={entry.category}
                      height={110}
                    />
                    {entry.pinnedAt && (
                      <span className="absolute left-2 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow" title={t("ピン留め中", "Pinned")}>
                        <Pin className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <button type="button" onClick={() => setSelected(entry)} className="min-w-0 text-left">
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-teal-700">
                        {entry.name ?? t("アプリ", "App")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{lastOpenedLabel(entry, t, intlLocale(locale))}</p>
                    </button>
                    <div className="mt-auto flex items-center gap-1.5">
                      <button
                        onClick={() => router.push(`/apps/${entry.appId}`)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("開く", "Open")}
                      </button>
                      <button
                        onClick={() => setSelected(entry)}
                        aria-label={t("詳細", "Details")}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selected && (
        <LibraryDetailSheet
          entry={selected}
          gradient={getGradient(selected)}
          onClose={() => setSelected(null)}
          onOpen={() => router.push(`/apps/${selected.appId}`)}
          onTogglePin={() => togglePin(selected)}
          onRemove={() => setRemoveTarget(selected)}
        />
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title={t("ライブラリから削除", "Remove from library")}
        message={
          removeTarget
            ? t(`「${removeTarget.name ?? "アプリ"}」をマイライブラリから削除しますか？`, `Remove “${removeTarget.name ?? "this app"}” from your library?`)
            : ""
        }
        confirmLabel={t("削除する", "Remove")}
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
