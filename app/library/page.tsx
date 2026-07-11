"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  LibraryBig,
  ExternalLink,
  Trash2,
  LogIn,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { CATEGORY_MAP } from "@/lib/categories";
import { cn } from "@/lib/utils";

type LibraryEntry = {
  appId: string;
  addedAt: string;
  name?: string;
  category?: string;
  gradient?: string;
};

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;
  const router = useRouter();

  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
    // 楽観的更新
    const previous = library;
    setLibrary((prev) => prev.filter((e) => e.appId !== appId));
    try {
      const res = await fetch(`/api/library?appId=${encodeURIComponent(appId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除失敗");
    } catch {
      // API失敗時はロールバック
      setLibrary(previous);
    }
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
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50">
              <LibraryBig className="h-4 w-4 text-teal-600" />
            </span>
            <span className="text-sm font-black text-gray-900">マイライブラリ</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* 未ログイン */}
        {!isLoggedIn && status !== "loading" && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-100">
              <LibraryBig className="h-10 w-10 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">マイライブラリ</h2>
              <p className="mt-2 text-sm text-gray-500">
                気に入ったアプリをここに追加して、いつでもすぐ起動できます。<br />
                利用するにはログインが必要です。
              </p>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              ログインしてライブラリを使う
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
              <h2 className="text-lg font-black text-gray-900">まだアプリがありません</h2>
              <p className="mt-2 text-sm text-gray-500">
                ホームでアプリをタップして「マイライブラリに追加」を押してみよう！
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              アプリを探す
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ライブラリ一覧 */}
        {isLoggedIn && !loading && library.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400">{library.length}件のアプリ</p>
            {library.map((entry) => (
              <div
                key={entry.appId}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md"
              >
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl",
                  getGradient(entry)
                )}>
                  {entry.category ? CATEGORY_MAP[entry.category]?.emoji ?? "✨" : "✨"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{entry.name ?? "アプリ"}</p>
                  <p className="text-xs text-gray-400">
                    {entry.category && <span>{CATEGORY_MAP[entry.category]?.name ?? entry.category} · </span>}
                    {new Date(entry.addedAt).toLocaleDateString("ja-JP")}に追加
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => router.push(`/apps/${entry.appId}`)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    開く
                  </button>
                  <button
                    onClick={() => handleRemove(entry.appId)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 hover:bg-rose-50 hover:text-rose-400 transition-colors"
                    title="ライブラリから削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
