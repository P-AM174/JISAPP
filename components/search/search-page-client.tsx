"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "@/lib/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo, JisappLogoIcon } from "@/components/jisapp-logo";
import {
  Search,
  User,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { CATEGORIES, CATEGORY_MAP, categoryName } from "@/lib/categories";
import { useLocale, useT } from "@/lib/i18n/client";
import type { CatalogApp } from "@/lib/home/catalog";
import { AppDetailModal } from "@/components/app-catalog/app-detail-modal";
import { CatalogAppCard } from "@/components/app-catalog/catalog-app-card";
import type { ModalApp } from "@/components/app-catalog/types";

type AppItem = CatalogApp;

type SortMethod = "default" | "new" | "popular";

const SORT_OPTIONS: { value: SortMethod; label: string; labelEn: string }[] = [
  { value: "default", label: "新着順", labelEn: "Newest" },
  { value: "new",     label: "古い順", labelEn: "Oldest" },
  { value: "popular", label: "人気順（スタンプ数）", labelEn: "Most cheered" },
];

const ALL = "all";

/** URL の category（id・日本語名・英語名のどれでも）を id にそろえる */
function resolveCategory(value: string | null): string {
  if (!value || value === "すべて" || value === ALL) return ALL;
  if (CATEGORY_MAP[value]) return value;
  const hit = CATEGORIES.find((c) => c.name === value || c.nameEn.toLowerCase() === value.toLowerCase());
  return hit ? hit.id : value;
}

// ─── 検索ページ本体（useSearchParams 使用のため Suspense でラップ） ───
export function SearchPageClient({
  initialApps,
}: {
  initialApps: CatalogApp[];
}) {
  const searchParams = useSearchParams();
  const t = useT();
  const locale = useLocale();

  const initSort     = (searchParams.get("sort") as SortMethod) ?? "default";
  const initCategory = resolveCategory(searchParams.get("category"));
  const initQuery    = searchParams.get("q") ?? "";

  const [query,          setQuery]          = useState(initQuery);
  const [activeCategory, setActiveCategory] = useState(initCategory);
  const [sortMethod,     setSortMethod]     = useState<SortMethod>(
    SORT_OPTIONS.some(o => o.value === initSort) ? initSort : "default"
  );
  const [selectedApp, setSelectedApp] = useState<ModalApp | null>(null);
  const allApps = initialApps;
  const loading = false;
  const error = false;

  const categoryKeys = useMemo(() => [ALL, ...CATEGORIES.map(c => c.id)], []);
  const categoryLabel = (key: string) => (key === ALL ? t("すべて", "All") : categoryName(key, locale));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = allApps.filter((app) => {
      const cat = app.category ? CATEGORY_MAP[app.category] : null;
      const appCatName = cat ? `${cat.name} ${cat.nameEn}` : app.category ?? "";
      const matchCat = activeCategory === ALL || app.category === activeCategory;
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

  const hasFilter = !!(query || activeCategory !== ALL || sortMethod !== "default");
  const resetAll  = () => { setQuery(""); setActiveCategory(ALL); setSortMethod("default"); };

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile />
          <JisappLogo href="/" />

          {/* 検索バー */}
          <div className="flex flex-1 items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("アプリ名・クリエイター名で検索...", "Search by app or creator...")}
                className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label={t("検索語を消す", "Clear search")} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
              <span className="hidden sm:inline">{t("検索", "Search")}</span>
            </button>
          </div>

          <Link href="/mypage" aria-label={t("マイページ", "My page")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600">
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
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">{t("カテゴリ", "Category")}</h3>
                <div className="space-y-0.5">
                  {categoryKeys.map((cat) => {
                    const count = cat === ALL
                      ? allApps.length
                      : allApps.filter(a => a.category === cat).length;
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
                        <span>{categoryLabel(cat)}</span>
                        <span className={`text-[11px] ${activeCategory === cat ? "text-emerald-200" : "text-gray-400"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 並び替え */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">{t("並び替え", "Sort")}</h3>
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
                      {t(opt.label, opt.labelEn)}
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
                {categoryKeys.map((cat) => (
                  <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeCategory === cat ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300"
                    }`}>
                    {categoryLabel(cat)}
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
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(o.label, o.labelEn)}</option>)}
                </select>
              </div>
            </div>

            {/* 結果ステータスバー */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {!loading ? (
                  <>
                    <span>{t(<><span className="font-semibold text-emerald-700">{filtered.length}件</span> 表示中</>, <>Showing <span className="font-semibold text-emerald-700">{filtered.length}</span> {filtered.length === 1 ? "app" : "apps"}</>)}</span>
                    {activeCategory !== ALL && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {categoryLabel(activeCategory)}<button onClick={() => setActiveCategory(ALL)} aria-label={t("カテゴリの絞り込みを外す", "Remove category filter")}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {query && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        {t(`「${query}」`, `“${query}”`)}<button onClick={() => setQuery("")} aria-label={t("検索語を消す", "Clear search")}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                  </>
                ) : <span className="text-gray-400">{t("読み込み中...", "Loading...")}</span>}
              </div>
              {hasFilter && (
                <button onClick={resetAll} className="text-xs text-gray-400 underline underline-offset-2 hover:text-emerald-600">
                  {t("すべてリセット", "Reset all")}
                </button>
              )}
            </div>

            {/* グリッド */}
            {error ? (
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-red-200 bg-white py-24 text-center">
                <p className="font-bold text-gray-700">{t("データの取得に失敗しました", "Couldn't load apps")}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700"
                >
                  {t("再読み込み", "Reload")}
                </button>
              </div>
            ) : !loading && filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filtered.map((app) => (
                  <CatalogAppCard
                    key={app.id}
                    app={app}
                    compact
                    onSelect={setSelectedApp}
                  />
                ))}
              </div>
            ) : !loading ? (
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-700">
                    {allApps.length === 0 ? t("まだアプリが公開されていません", "No apps have been published yet") : t("お探しのアプリは見つかりませんでした", "No apps found")}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {allApps.length === 0 ? t("開発スタジオで最初のアプリを作ってみよう！", "Make the first one in the Studio!") : t("キーワードを変えるか、絞り込みをリセットしてください。", "Try another keyword or reset the filters.")}
                  </p>
                </div>
                {hasFilter && (
                  <button onClick={resetAll} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700">
                    {t("すべて表示する", "Show everything")}
                  </button>
                )}
                <Link
                  href="/playground"
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700"
                >
                  <JisappLogoIcon className="h-4 w-4" />
                  {t("アプリ開発スタジオへ", "Open the Studio")}
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

      {selectedApp && (
        <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
}

export default function SearchPageClientRoot({
  initialApps,
}: {
  initialApps: CatalogApp[];
}) {
  const t = useT();
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4]">
        <div className="flex items-center gap-3 text-emerald-600">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-sm font-semibold">{t("読み込み中...", "Loading...")}</span>
        </div>
      </div>
    }>
      <SearchPageClient initialApps={initialApps} />
    </Suspense>
  );
}
