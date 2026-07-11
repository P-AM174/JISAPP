"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles,
  ShoppingBag,
  Search,
  ArrowUpRight,
  Star,
} from "lucide-react";

type PurchasedApp = {
  id: string | number;
  name: string;
  price: number;
  category?: string;
  creator?: string;
  gradient?: string;
  rating?: number;
};

const STATIC_APPS: PurchasedApp[] = [
  { id: 1,  name: "AIスケジュール最適化",       price: 2980, category: "生産性",      creator: "TechStudio",   gradient: "from-emerald-600 via-green-600 to-teal-700", rating: 4.8 },
  { id: 2,  name: "マーケットレポーター",        price: 1980, category: "分析",        creator: "DataWave",     gradient: "from-rose-500 via-pink-600 to-red-600",       rating: 4.6 },
  { id: 3,  name: "SNSコンテンツAI",            price: 3480, category: "マーケ",      creator: "CreativeLab",  gradient: "from-amber-500 via-orange-500 to-red-500",     rating: 4.9 },
  { id: 4,  name: "コード品質チェッカー",        price: 2480, category: "開発",        creator: "DevTools",     gradient: "from-emerald-500 via-teal-600 to-cyan-700",    rating: 4.7 },
  { id: 5,  name: "タスク管理Pro",              price: 0,    category: "生産性",      creator: "SimpleApps",   gradient: "from-green-500 via-emerald-600 to-teal-600",   rating: 4.5 },
  { id: 6,  name: "メール文章アシスト",          price: 0,    category: "ビジネス",    creator: "MailGenius",   gradient: "from-emerald-500 via-green-600 to-teal-600",   rating: 4.4 },
  { id: 7,  name: "音楽プレイリスト生成",        price: 0,    category: "エンタメ",    creator: "MusicAI",      gradient: "from-green-500 via-emerald-600 to-teal-700",   rating: 4.6 },
  { id: 8,  name: "EC商品説明ジェネレーター",   price: 0,    category: "EC",          creator: "ShopTools",    gradient: "from-orange-500 via-amber-500 to-yellow-500",  rating: 4.3 },
  { id: 9,  name: "ワンクリック議事録作成GAS",  price: 980,  category: "業務効率化",  creator: "GASマスター",  gradient: "from-emerald-500 via-green-600 to-teal-600",   rating: 4.8 },
  { id: 10, name: "自動シフト調整ツール",        price: 500,  category: "シフト管理",  creator: "ShiftPro",     gradient: "from-teal-500 via-emerald-600 to-green-700",   rating: 4.5 },
  { id: 11, name: "かんたん請求書メーカー",      price: 780,  category: "フリーランス",creator: "FreelanceKit", gradient: "from-green-500 via-teal-600 to-emerald-700",   rating: 4.7 },
  { id: 12, name: "SNS予約投稿スケジューラー",  price: 980,  category: "SNS運用",     creator: "SocialAI",     gradient: "from-emerald-400 via-teal-500 to-cyan-600",    rating: 4.8 },
];

export default function PurchasesPage() {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [userListings, setUserListings] = useState<PurchasedApp[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("purchased_apps");
      if (raw) setPurchasedIds(JSON.parse(raw));

      const rawListings = localStorage.getItem("jisapp_listings");
      if (rawListings) {
        const listings = JSON.parse(rawListings);
        setUserListings(
          listings.map((l: Record<string, unknown>) => ({
            id: l.id,
            name: (l.name as string) ?? "無題のアプリ",
            price: (l.priceNum as number) ?? 0,
            category: (l.category as string) ?? "その他",
            creator: (l.creator as string) ?? "クリエイター",
            gradient: (l.gradient as string) ?? "from-emerald-500 to-green-600",
            rating: (l.rating as number) ?? 5.0,
          }))
        );
      }
    } catch {
      /* noop */
    } finally {
      setMounted(true);
    }
  }, []);

  const allApps = [...STATIC_APPS, ...userListings];
  const purchasedApps = allApps.filter((a) =>
    purchasedIds.includes(String(a.id))
  );

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">購入した商品</span>
          <div className="ml-auto">
            <Link
              href="/search"
              className="flex items-center gap-1.5 rounded-full border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              アプリを探す
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* サマリー */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-1">購入済み</p>
            <p className="text-2xl font-black text-gray-900">
              {mounted ? purchasedApps.length : "—"}
              <span className="text-sm font-medium text-gray-400 ml-1">件</span>
            </p>
          </div>
          <div className="rounded-2xl bg-teal-50 p-4 shadow-sm">
            <p className="text-xs text-teal-600 font-medium mb-1">すべて</p>
            <p className="text-2xl font-black text-teal-700">FREE</p>
          </div>
        </div>

        {/* 一覧 */}
        {!mounted ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">読み込み中...</p>
          </div>
        ) : purchasedApps.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <ShoppingBag className="h-8 w-8 text-teal-300" />
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-1">購入履歴がありません</p>
              <p className="text-xs text-gray-400">気になるアプリを探してみましょう</p>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              アプリを探す
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">購入一覧</p>
            {purchasedApps.map((app) => {
              const priceLabel = "FREE";
              return (
                <Link
                  key={String(app.id)}
                  href={`/apps/${app.id}/success`}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient ?? "from-teal-500 to-cyan-600"}`}>
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate group-hover:text-teal-600 transition-colors">
                      {app.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-teal-600">{priceLabel}</span>
                      {app.category && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                          {app.category}
                        </span>
                      )}
                      {app.rating && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {app.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {app.creator && (
                      <p className="mt-0.5 text-[10px] text-gray-400">by {app.creator}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600">
                      購入済み
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
