"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Package,
  Users,
  Star,
  UserPlus,
  Zap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AppDetailModal } from "@/components/app-catalog/app-detail-modal";
import { CatalogAppCard } from "@/components/app-catalog/catalog-app-card";
import { getCreatorProfilePath, getCreatorApiPath } from "@/components/app-catalog/utils";
import type { CatalogCardApp, ModalApp } from "@/components/app-catalog/types";
import { CreatorFollowButton } from "@/components/creator-follow-button";
import {
  getCreatorFollowerCount,
  getFollowedCreatorNames,
} from "@/lib/follow-creators";

type CreatorProfile = {
  name: string;
  apps: CatalogCardApp[];
  appCount: number;
  totalStamps: number;
  rating: number;
};

export function CreatorProfileClient({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ModalApp | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCreators, setFollowingCreators] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(getCreatorApiPath(slug))
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data: CreatorProfile) => {
        setProfile(data);
        const stored = getCreatorFollowerCount(data.name);
        setFollowerCount(Math.max(stored, Math.floor(data.totalStamps / 2)));
        setFollowingCreators(
          getFollowedCreatorNames().filter((n) => n !== data.name)
        );
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4]">
        <div className="flex items-center gap-3 text-emerald-600">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f6f4] px-4 text-center">
        <p className="font-bold text-gray-700">クリエイターが見つかりませんでした</p>
        <Link
          href="/search"
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          アプリを探す
        </Link>
      </div>
    );
  }

  const initial = profile.name[0]?.toUpperCase() ?? "?";
  const colorIdx =
    Math.abs(
      profile.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    ) % 4;
  const gradients = [
    "from-emerald-500 to-teal-600",
    "from-green-500 to-emerald-600",
    "from-teal-500 to-cyan-600",
    "from-emerald-400 to-green-600",
  ];

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="truncate text-sm font-semibold text-gray-700">{profile.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div className={`bg-gradient-to-br ${gradients[colorIdx]} px-6 pb-8 pt-10`}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/25 text-3xl font-black text-white shadow-lg backdrop-blur-sm ring-4 ring-white/30">
                {initial}
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-white/80">
                  クリエイター
                </p>
                <h1 className="text-2xl font-black text-white sm:text-3xl">{profile.name}</h1>
                <p className="mt-1 text-sm font-semibold text-white/80">
                  ジサップで {profile.appCount} 本のアプリを公開中
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 sm:grid-cols-4">
            {[
              { label: "出品数", value: String(profile.appCount), unit: "本" },
              { label: "フォロワー", value: String(followerCount), unit: "人" },
              { label: "総応援", value: String(profile.totalStamps), unit: "" },
              {
                label: "評価",
                value: profile.rating > 0 ? String(profile.rating) : "—",
                unit: profile.rating > 0 ? "" : "",
              },
            ].map((s) => (
              <div key={s.label} className="py-4 text-center">
                <p className="text-lg font-black text-gray-900">
                  {s.value}
                  {s.unit && (
                    <span className="text-xs font-semibold text-gray-400">{s.unit}</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 border-b border-gray-100 py-3">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-black text-gray-900">
              {profile.rating > 0 ? profile.rating : "—"}
            </span>
            <span className="text-xs text-gray-400">/ クリエイター評価（応援数ベース）</span>
          </div>

          <div className="px-6 py-5">
            <CreatorFollowButton
              creatorName={profile.name}
              size="md"
              className="w-full justify-center py-3"
            />
          </div>
        </section>

        {followingCreators.length > 0 && (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-black text-gray-900">フォロー中のクリエイター</h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {followingCreators.length}人
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {followingCreators.map((name) => (
                <Link
                  key={name}
                  href={getCreatorProfilePath(name)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                    {name[0]?.toUpperCase() ?? "?"}
                  </span>
                  {name}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">出品アプリ一覧</h2>
                <p className="text-xs text-gray-400">{profile.apps.length}件</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Zap className="h-3.5 w-3.5" />
              タップで詳細
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {profile.apps.map((app) => (
              <CatalogAppCard
                key={app.id}
                app={app}
                compact
                onSelect={setSelectedApp}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-600" />
            <h2 className="text-base font-black text-gray-900">クリエイター評価について</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            評価は出品アプリへの応援バッジ（👍いいね・🧠天才・⚡便利・🎨デザイン）の合計から算出しています。
            フォロワー数はフォロー操作と応援数をもとに表示されます。
          </p>
        </section>
      </main>

      {selectedApp && (
        <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
}
