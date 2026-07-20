"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Search,
  Sparkles,
  ArrowRight,
  User,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import type { CatalogApp } from "@/lib/home/catalog";

type AppItem = CatalogApp;

type SortMethod = "default" | "new" | "popular";

const SORT_OPTIONS: { value: SortMethod; label: string }[] = [
  { value: "default", label: "新着順" },
  { value: "new",     label: "古い順" },
  { value: "popular", label: "人気順（スタンプ数）" },
];

// ─── アプリカード ───
function AppCard({ app }: { app: AppItem }) {
  const cat = app.category ? CATEGORY_MAP[app.category] : null;
  const gradient = cat?.gradient ?? "from-emerald-500 to-teal-600";
  const catName  = cat?.name ?? app.category ?? "その他";
  const catEmoji = cat?.emoji ?? "✨";

  return (
    <Link href={`/apps/${app.id}`} className="group block">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/60 hover:ring-emerald-200">
        {/* グラデーションビジュアル */}
        <div className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} px-5 py-6`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="text-3xl">{catEmoji}</span>
          </div>
          {(app.stamp_count ?? 0) > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
              <Zap className="h-3 w-3" /> {app.stamp_count}
            </span>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-emerald-700">
            FREE
          </span>
        </div>
        {/* コンテンツ */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">{catName}</span>
          <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">{app.title}</h3>
          {app.description && (
            <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">{app.description}</p>
          )}
          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2.5">
            <span className="text-xs text-gray-400">by {app.creator_name ?? "匿名"}</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
              詳細を見る <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── 検索ページ本体（useSearchParams 使用のため Suspense でラップ） ───
export function SearchPageClient({
  initialApps,
}: {
  initialApps: CatalogApp[];
}) {
  const searchParams = useSearchParams();

  const initSort     = (searchParams.get("sort") as SortMethod) ?? "default";
  const initCategory = searchParams.get("category") ?? "すべて";
  const initQuery    = searchParams.get("q") ?? "";

  const [query,          setQuery]          = useState(initQuery);
  const [activeCategory, setActiveCategory] = useState(initCategory);
  const [sortMethod,     setSortMethod]     = useState<SortMethod>(
    SORT_OPTIONS.some(o => o.value === initSort) ? initSort : "default"
  );
  const allApps = initialApps;
  const loading = false;
  const error = false;

  const categoryNames = useMemo(() => ["すべて", ...CATEGORIES.map(c => c.name)], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = allApps.filter((app) => {
      const appCatName = app.category ? (CATEGORY_MAP[app.category]?.name ?? app.category) : "";
      const matchCat = activeCategory === "すべて" || appCatName === activeCategory || app.category === activeCategory;
      const matchQ   = !q
        || app.title.toLowerCase().includes(q)
        || (app.description ?? "").toLowerCase().includes(q)
        || (app.creator_name ?? "").toLowerCase().includes(q)
        || appCatName.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    switch (sortMethod) {
      case "new":     return [...result].sort((a, b) =>
        new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      );
      case "popular": return [...result].sort((a, b) => (b.stamp_count ?? 0) - (a.stamp_count ?? 0));
      default:        return [...result].sort((a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );
    }
  }, [allApps, query, activeCategory, sortMethod]);

  const hasFilter = !!(query || activeCategory !== "すべて" || sortMethod !== "default");
  const resetAll  = () => { setQuery(""); setActiveCategory("すべて"); setSortMethod("default"); };

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />

          {/* 検索バー */}
          <div className="flex flex-1 items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="アプリ名・クリエイター名で検索..."
                className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => { /* trigger re-filter via state */ }}
              className="shrink-0 flex items-center gap-1.5 h-9 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.97]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">検索</span>
            </button>
          </div>

          <Link href="/mypage" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600">
            <User className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">

          {/* ─── サイドバー（デスクトップ） ─── */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20 space-y-5">

              {/* カテゴリ */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">カテゴリ</h3>
                <div className="space-y-0.5">
                  {categoryNames.map((cat) => {
                    const count = cat === "すべて"
                      ? allApps.length
                      : allApps.filter(a => {
                          const name = a.category ? (CATEGORY_MAP[a.category]?.name ?? a.category) : "";
                          return name === cat || a.category === cat;
                        }).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-all ${
                          activeCategory === cat
                            ? "bg-emerald-600 font-bold text-white"
                            : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[11px] ${activeCategory === cat ? "text-emerald-200" : "text-gray-400"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 並び替え */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">並び替え</h3>
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortMethod(opt.value)}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition-all ${
                        sortMethod === opt.value
                          ? "bg-emerald-50 font-bold text-emerald-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-emerald-700"
                      }`}
                    >
                      {sortMethod === opt.value && <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ─── メインコンテンツ ─── */}
          <div className="min-w-0 flex-1">

            {/* モバイル用フィルタバー */}
            <div className="mb-4 lg:hidden">
              {/* カテゴリタブ */}
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categoryNames.map((cat) => (
                  <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeCategory === cat ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* ソート */}
              <div className="flex items-center gap-1 justify-end">
                <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={sortMethod}
                  onChange={(e) => setSortMethod(e.target.value as SortMethod)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 outline-none focus:border-emerald-400"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* 結果ステータスバー */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {!loading ? (
                  <>
                    <span><span className="font-semibold text-emerald-700">{filtered.length}件</span> 表示中</span>
                    {activeCategory !== "すべて" && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {activeCategory}<button onClick={() => setActiveCategory("すべて")}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {query && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        「{query}」<button onClick={() => setQuery("")}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                  </>
                ) : <span className="text-gray-400">読み込み中...</span>}
              </div>
              {hasFilter && (
                <button onClick={resetAll} className="text-xs text-gray-400 underline underline-offset-2 hover:text-emerald-600">
                  すべてリセット
                </button>
              )}
            </div>

            {/* グリッド */}
            {error ? (
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-red-200 bg-white py-24 text-center">
                <p className="font-bold text-gray-700">データの取得に失敗しました</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700"
                >
                  再読み込み
                </button>
              </div>
            ) : !loading && filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((app) => <AppCard key={app.id} app={app} />)}
              </div>
            ) : !loading ? (
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-700">
                    {allApps.length === 0 ? "まだアプリが公開されていません" : "お探しのアプリは見つかりませんでした"}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {allApps.length === 0 ? "プレイグラウンドで最初のアプリを作ってみよう！" : "キーワードを変えるか、絞り込みをリセットしてください。"}
                  </p>
                </div>
                {hasFilter && (
                  <button onClick={resetAll} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700">
                    すべて表示する
                  </button>
                )}
                <Link
                  href="/playground"
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700"
                >
                  <Sparkles className="h-4 w-4" />
                  アプリを作ってみる
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPageClientRoot({
  initialApps,
}: {
  initialApps: CatalogApp[];
}) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4]">
        <div className="flex items-center gap-3 text-emerald-600">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">読み込み中...</span>
        </div>
      </div>
    }>
      <SearchPageClient initialApps={initialApps} />
    </Suspense>
  );
}
