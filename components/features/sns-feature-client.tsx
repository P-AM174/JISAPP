"use client";

import { useMemo, useState } from "react";
import { Clapperboard, Search, Wand2, X } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { CatalogAppCard } from "@/components/app-catalog/catalog-app-card";
import { AppDetailModal } from "@/components/app-catalog/app-detail-modal";
import type { ModalApp } from "@/components/app-catalog/types";
import { HowToRemixModal } from "@/components/features/how-to-remix-modal";
import { CATEGORIES } from "@/lib/categories";
import type { CatalogApp } from "@/lib/home/catalog";
import { cn } from "@/lib/utils";

/** 特集ページ「ショート動画で紹介したアプリ」（日本語版だけ）。並びは運営画面で決めた順 */
export function SnsFeatureClient({ apps }: { apps: CatalogApp[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<ModalApp | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // このページにあるアプリのカテゴリだけを絞り込みに出す
  const cats = useMemo(() => CATEGORIES.filter((c) => apps.some((a) => a.category === c.id)), [apps]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter(
      (a) =>
        (!category || a.category === category) &&
        (!q || a.title.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q) || (a.creator_name ?? "").toLowerCase().includes(q))
    );
  }, [apps, query, category]);

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="ml-1 hidden text-sm text-gray-400 sm:inline">/</span>
          <span className="hidden text-sm font-semibold text-gray-700 sm:inline">SNSで紹介したアプリ</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-16">
        {/* 見出し */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 p-6 text-white shadow-lg sm:p-8">
          <p className="flex items-center gap-1.5 text-xs font-bold text-white/90">
            <Clapperboard className="h-4 w-4" />特集
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">ショート動画で紹介したアプリ</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
            TikTok・YouTube・Instagram で紹介したアプリをまとめました。動画で見たアプリを、そのまま遊べます。
          </p>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-rose-600 shadow-md transition hover:bg-rose-50 active:scale-[0.98]"
          >
            <Wand2 className="h-4 w-4" />
            アプリを自分仕様にする方法
          </button>
        </section>

        {/* 検索とカテゴリ */}
        <section className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="この特集の中から探す（アプリ名・説明）"
              className="h-11 w-full rounded-full border border-gray-200 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-200/50"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="検索語を消す" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {cats.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[{ id: null as string | null, name: "すべて" }, ...cats.map((c) => ({ id: c.id as string | null, name: c.name }))].map((c) => (
                <button
                  key={c.id ?? "all"}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold ring-1 transition",
                    category === c.id ? "bg-rose-500 text-white ring-rose-500" : "bg-white text-gray-600 ring-gray-200 hover:bg-rose-50"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* アプリ */}
        {shown.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((app) => (
              <CatalogAppCard key={app.id} app={app} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
            {apps.length === 0 ? "まだありません" : "見つかりませんでした"}
          </p>
        )}
      </main>

      {selected && <AppDetailModal app={selected} onClose={() => setSelected(null)} />}
      {guideOpen && <HowToRemixModal onClose={() => setGuideOpen(false)} />}
    </div>
  );
}
