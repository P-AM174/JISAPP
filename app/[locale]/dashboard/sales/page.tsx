"use client";

import { useState, useEffect } from "react";
import Link from "@/lib/i18n/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { useT } from "@/lib/i18n/client";
import {
  Package,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

type Listing = {
  id: number | string;
  name: string;
  description?: string;
  priceNum?: number;
  category?: string;
  createdAt?: string;
  status?: string;
  gradient?: string;
};

const statusConfig: Record<string, { label: string; labelEn: string; icon: typeof Clock; bg: string; text: string }> = {
  "AI審査中":   { label: "AI審査中", labelEn: "AI review",   icon: Clock,         bg: "bg-amber-50",   text: "text-amber-600"  },
  "販売中":     { label: "販売中", labelEn: "Live",     icon: CheckCircle2,  bg: "bg-emerald-50", text: "text-emerald-600" },
  "審査通過":   { label: "審査通過", labelEn: "Approved",   icon: CheckCircle2,  bg: "bg-emerald-50", text: "text-emerald-600" },
  "差し戻し":   { label: "差し戻し", labelEn: "Returned",   icon: AlertCircle,   bg: "bg-rose-50",    text: "text-rose-500"   },
};

export default function SalesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [mounted, setMounted] = useState(false);
  const t = useT();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jisapp_listings");
      if (raw) setListings(JSON.parse(raw));
    } catch {
      /* noop */
    } finally {
      setMounted(true);
    }
  }, []);

  const totalRevenue = listings.reduce((s, l) => s + (l.priceNum ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">{t("出品した商品", "Your listings")}</span>
          <div className="ml-auto">
            <Link
              href="/create"
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("出品する", "Publish")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-1">{t("出品数", "Listings")}</p>
            <p className="text-2xl font-black text-gray-900">{mounted ? listings.length : "—"}{t(<span className="text-sm font-medium text-gray-400 ml-1">件</span>, null)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-1">{t("ステータス", "Status")}</p>
            <p className="text-lg font-black text-emerald-600">
              {mounted && listings.length > 0 ? t("公開中", "Live") : "—"}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 shadow-sm text-white">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <p className="text-xs font-medium opacity-90">{t("ステータス", "Status")}</p>
            </div>
            <p className="text-sm font-bold">
              {mounted && listings.length > 0 ? t("出品中", "Listed") : t("まだ出品なし", "Nothing listed yet")}
            </p>
          </div>
        </div>

        {/* 一覧 */}
        {!mounted ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">{t("読み込み中...", "Loading...")}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Package className="h-8 w-8 text-emerald-300" />
            </div>
            <div>
              <p className="font-bold text-gray-700 mb-1">{t("まだ出品がありません", "No listings yet")}</p>
              <p className="text-xs text-gray-400">{t("あなたのアプリをジサップで販売しましょう", "Share your app on Jisapp")}</p>
            </div>
            <Link
              href="/create"
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("はじめて出品する", "Publish your first app")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">{t("出品一覧", "Your listings")}</p>
            {listings.map((item) => {
              const cfg = statusConfig[item.status ?? "AI審査中"] ?? statusConfig["AI審査中"];
              const StatusIcon = cfg.icon;
              const priceLabel = "FREE";
              return (
                <Link
                  key={String(item.id)}
                  href={`/apps/${item.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient ?? "from-emerald-500 to-green-600"}`}>
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate group-hover:text-emerald-600 transition-colors">
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-emerald-600">{priceLabel}</span>
                      {item.category && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                          {item.category}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {t(cfg.label, cfg.labelEn)}
                      </span>
                    </div>
                    {item.createdAt && (
                      <p className="mt-0.5 text-[10px] text-gray-400">{item.createdAt}</p>
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
