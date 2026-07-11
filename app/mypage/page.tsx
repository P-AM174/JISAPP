"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles,
  Package,
  ShieldCheck,
  Heart,
  Users,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Wrench,
  Plus,
  Edit3,
  LogOut,
  Code2,
  FolderOpen,
  Rocket,
  Clock,
} from "lucide-react";

// ダミーデータは廃止
const STATIC_APPS: { id: number; name: string; price: number; category: string; creator: string }[] = [];
const CREATORS: { id: number; name: string; handle: string; avatar: string; badge: string; specialty: string; color: string }[] = [];

type AppItem = {
  id: string;
  name: string;
  description: string;
  priceNum: number;
  category?: string;
  createdAt?: string;
  creatorName?: string;
  status?: string;
};

type RequestItem = {
  id: string;
  title: string;
  budget: string;
  proposalCount?: number;
};

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [listings, setListings]                 = useState<AppItem[]>([]);
  const [savedApps, setSavedApps]               = useState<string[]>([]);
  const [followedCreators, setFollowedCreators] = useState<number[]>([]);
  const [purchasedApps, setPurchasedApps]       = useState<string[]>([]);
  const [myRequests, setMyRequests]             = useState<RequestItem[]>([]);
  const [playgroundCode, setPlaygroundCode]     = useState<string>("");
  const [apiPurchases, setApiPurchases]         = useState<
    Array<{ id: string | number; title: string; category?: string; is_playground_app?: boolean }>
  >([]);
  const [mounted, setMounted]                   = useState(false);

  // ─── 未ログインなら /login へリダイレクト ───
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/mypage");
    }
  }, [status, router]);

  useEffect(() => {
    try {
      const rawListings = localStorage.getItem("jisapp_listings");
      if (rawListings) setListings(JSON.parse(rawListings));

      const rawSaved = localStorage.getItem("jisapp_saved_apps");
      if (rawSaved) setSavedApps(JSON.parse(rawSaved));

      const rawFollowed = localStorage.getItem("jisapp_followed_creators");
      if (rawFollowed) setFollowedCreators(JSON.parse(rawFollowed));

      const rawPurchased = localStorage.getItem("purchased_apps");
      if (rawPurchased) setPurchasedApps(JSON.parse(rawPurchased));

      const rawReqs = localStorage.getItem("jisapp_requests");
      if (rawReqs) {
        const all = JSON.parse(rawReqs);
        setMyRequests(all.slice(0, 5));
      }

      const savedCode = localStorage.getItem("jisapp_playground_code");
      if (savedCode?.trim()) setPlaygroundCode(savedCode);
    } catch (e) {
      console.error("localStorage parse error", e);
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/purchases")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.purchases) {
          setApiPurchases(data.purchases);
          setPurchasedApps(data.purchases.map((p: { id: string }) => String(p.id)));
        }
      })
      .catch(() => {});
    fetch("/api/products/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.products) {
          setListings(
            data.products.map((p: Record<string, unknown>) => ({
              id: String(p.id),
              name: String(p.title),
              description: String(p.description ?? ""),
              priceNum: Number(p.price ?? 0),
              category: String(p.category ?? ""),
              status: String(p.status ?? ""),
            }))
          );
        }
      })
      .catch(() => {});
  }, [status]);

  // データ結合
  const savedAppData     = STATIC_APPS.filter(a => savedApps.includes(String(a.id)));
  const followedCreData  = CREATORS.filter(c => followedCreators.includes(c.id));
  const purchasedAppData = apiPurchases.map((p) => ({
    id: String(p.id),
    name: p.title,
    category: p.category ?? "その他",
    is_playground_app: Boolean(p.is_playground_app),
  }));

  // 自分の出品だけ絞り込み（セッション名またはメールで照合）
  const myListings = listings.filter(a => {
    if (!session?.user) return true; // ログイン前は全件表示（フォールバック）
    return (
      a.creatorName === session.user.name ||
      a.creatorName === session.user.email
    );
  });

  // プレイグラウンドで保存したコードのライン数
  const playgroundLines = playgroundCode ? playgroundCode.split("\n").length : 0;

  // セッション読込中 or 未認証リダイレクト中
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // セッションユーザー情報
  const userName  = session?.user?.name  ?? "ジサップユーザー";
  const userEmail = session?.user?.email ?? "";
  const userImage = session?.user?.image ?? null;
  const initials  = userName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">マイページ</span>
          <div className="ml-auto">
            <Link
              href="/create"
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              出品する
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 pb-16">

        {/* ─── やることリスト ─── */}
        {mounted && purchasedApps.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">やることリスト</p>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-rose-600">納品されたツールがあります。</span>
                    {" "}実際に動かして問題なければ【受け取り完了】を押してください。
                  </p>
                </div>
                <Link
                  href={`/apps/${purchasedApps[0]}/success`}
                  className="shrink-0 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  動作確認へ
                </Link>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-blue-600">依頼者からチャットの返信が届いています。</span>
                  </p>
                </div>
                <Link
                  href="/requests"
                  className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  チャットを開く
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ─── プロフィール & ウォレット ─── */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* プロフィール */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* アバター：Googleの顔写真 or イニシャル */}
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-emerald-100"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-base font-bold text-white shadow-sm">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{userName}</p>
                  {userEmail && (
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{userEmail}</p>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    本人確認済
                  </span>
                </div>
              </div>
              {/* ログアウトボタン */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-rose-300 hover:text-rose-500 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                ログアウト
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "プロジェクト", value: mounted ? (myListings.length + (playgroundCode ? 1 : 0)) : "—" },
                { label: "取得アプリ",   value: mounted ? purchasedApps.length     : "—" },
                { label: "フォロー",     value: mounted ? followedCreators.length  : "—" },
                { label: "お気に入り",   value: mounted ? savedApps.length         : "—" },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-gray-50 py-2">
                  <p className="text-base font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ライブラリ情報 */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="mb-1 text-xs text-gray-400">取得済みアプリ</p>
            <p className="text-3xl font-bold tracking-tight text-gray-900">
              {mounted ? purchasedApps.length : "—"}
              <span className="ml-1 text-sm font-medium text-gray-400">件</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-400">取得済みアプリの数</p>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <Link
                href="/search"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <Package className="h-4 w-4" />
                アプリを探す →
              </Link>
            </div>
          </div>
        </div>

        {/* ─── マイプロジェクト ─── */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-bold text-gray-700">マイプロジェクト</h2>
              {mounted && (
                <span className="ml-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                  {myListings.length + (playgroundCode ? 1 : 0)}
                </span>
              )}
            </div>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              すべて見る
            </Link>
          </div>

          <div className="p-5 space-y-3">
            {!mounted ? (
              <LoadingRows />
            ) : (
              <>
                {/* プレイグラウンドで保存したコード */}
                {playgroundCode && (
                  <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 p-4 ring-1 ring-violet-100">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                      <Code2 className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">プレイグラウンドの作業中コード</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {playgroundLines} 行 · {playgroundCode.length.toLocaleString()} 文字
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        href="/playground"
                        className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        編集
                      </Link>
                      <Link
                        href="/create"
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                      >
                        <Rocket className="h-3 w-3" />
                        出品
                      </Link>
                    </div>
                  </div>
                )}

                {/* 出品済みアプリ */}
                {myListings.map(app => (
                  <div key={app.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f5f5f3] px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                        <Package className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{app.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            app.status === "pending"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {app.status === "pending" ? "審査中" : "掲載中"}
                          </span>
                          {app.category && <span className="text-[10px] text-gray-400">{app.category}</span>}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/apps/${app.id}`}
                      className="shrink-0 flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      詳細
                    </Link>
                  </div>
                ))}

                {/* 空のとき */}
                {!playgroundCode && myListings.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <Code2 className="h-7 w-7 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">まだプロジェクトがありません</p>
                      <p className="text-xs text-gray-400 mt-0.5">プレイグラウンドでコードを作ってみよう</p>
                    </div>
                    <Link
                      href="/playground"
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
                    >
                      <Code2 className="h-4 w-4" />
                      プレイグラウンドを開く
                    </Link>
                  </div>
                )}

                {/* 新規作成ボタン */}
                {(playgroundCode || myListings.length > 0) && (
                  <Link
                    href="/playground"
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 py-3 text-sm font-semibold text-violet-500 hover:border-violet-400 hover:bg-violet-50 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    新しいプロジェクトを作る
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── 利用メニュー（旧：買う人メニュー） ─── */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-700">取得・お気に入り</h2>
            </div>
          </div>

          <div className="divide-y divide-gray-100">

            {/* GETしたアプリ */}
            <section className="p-5">
              <SectionTitle icon={<Package className="h-4 w-4 text-emerald-600" />} label="GETしたアプリ一覧" count={mounted ? purchasedAppData.length : null} />
              {mounted ? (
                purchasedAppData.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {purchasedAppData.map(app => (
                      <div key={app.id} className="flex items-center justify-between gap-4 rounded-xl bg-[#f5f5f3] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{app.name}</p>
                          <p className="text-xs text-gray-400">{app.category}</p>
                        </div>
                        <Link
                          href={app.is_playground_app ? `/apps/${app.id}/run` : `/apps/${app.id}/success`}
                          className="shrink-0 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {app.is_playground_app ? "起動" : "開く"}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<Package className="h-8 w-8" />} text="まだGETしたアプリはありません">
                    <Link href="/search" className="mt-1 text-xs text-emerald-600 hover:underline">アプリを探す →</Link>
                  </EmptyState>
                )
              ) : <LoadingRows />}
            </section>

            {/* お気に入り */}
            <section className="p-5">
              <SectionTitle icon={<Heart className="h-4 w-4 text-rose-400" />} label="お気に入りに保存したアプリ" count={mounted ? savedAppData.length : null} />
              {mounted ? (
                savedAppData.length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {savedAppData.map(app => (
                      <Link
                        key={app.id}
                        href={`/apps/${app.id}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#f5f5f3] p-3 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                          <Package className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 group-hover:text-emerald-700">{app.name}</p>
                          <p className="text-xs text-gray-400">{app.creator}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<Heart className="h-8 w-8" />} text="まだお気に入りに追加したアプリはありません">
                    <Link href="/search" className="mt-1 text-xs text-emerald-600 hover:underline">アプリを探す →</Link>
                  </EmptyState>
                )
              ) : <LoadingRows />}
            </section>

            {/* フォロー中のクリエイター */}
            <section className="p-5">
              <SectionTitle icon={<Users className="h-4 w-4 text-blue-400" />} label="フォロー中のクリエイター" count={mounted ? followedCreData.length : null} />
              {mounted ? (
                followedCreData.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {followedCreData.map(creator => (
                      <Link
                        key={creator.id}
                        href={`/creators/${creator.id}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#f5f5f3] p-3 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${creator.color} text-sm font-bold text-white`}>
                          {creator.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">{creator.name}</p>
                          <p className="text-xs text-gray-400">{creator.handle}</p>
                          <p className="text-xs text-emerald-600">{creator.badge}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<Users className="h-8 w-8" />} text="まだフォロー中のクリエイターはいません">
                    <Link href="/" className="mt-1 text-xs text-emerald-600 hover:underline">クリエイターを探す →</Link>
                  </EmptyState>
                )
              ) : <LoadingRows />}
            </section>

            {/* 投稿したリクエスト */}
            <section className="p-5">
              <div className="flex items-center justify-between">
                <SectionTitle icon={<Wrench className="h-4 w-4 text-amber-500" />} label="投稿したリクエスト履歴" count={mounted ? myRequests.length : null} />
                <Link href="/requests" className="text-xs text-emerald-600 hover:underline">すべて見る →</Link>
              </div>
              {mounted ? (
                myRequests.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {myRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#f5f5f3] px-4 py-3">
                        <p className="flex-1 truncate text-sm text-gray-800">{req.title}</p>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {req.proposalCount ? `${req.proposalCount}名と相談中` : "提案待ち"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<Wrench className="h-8 w-8" />} text="まだリクエストを投稿していません">
                    <Link href="/requests" className="mt-1 text-xs text-emerald-600 hover:underline">リクエストを投稿する →</Link>
                  </EmptyState>
                )
              ) : <LoadingRows />}
            </section>
          </div>
        </div>

        {/*
        ══════════════════════════════════════════════
        売る人メニュー（売買機能実装まで非表示）
        ※ 機能実装時にこのコメントを外してください
        ══════════════════════════════════════════════

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-700">売る人メニュー（出品管理）</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            <section className="p-5">
              <div className="flex items-center justify-between">
                <SectionTitle icon={<Package className="h-4 w-4 text-emerald-600" />} label="出品中のアプリ管理" count={myListings.length} />
                <Link href="/create" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  <Plus className="h-3.5 w-3.5" />新しく出品する
                </Link>
              </div>
              ... 出品リスト ...
            </section>
            <section className="p-5">
              <SectionTitle icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} label="売上・振込履歴" />
              ... 売上履歴 ...
            </section>
          </div>
        </div>
        */}
      </main>
    </div>
  );
}

// ─── 小コンポーネント ───

function SectionTitle({
  icon, label, count,
}: {
  icon: React.ReactNode; label: string; count?: number | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-bold text-gray-700">{label}</h2>
      {count !== null && count !== undefined && (
        <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({
  icon, text, children,
}: {
  icon: React.ReactNode; text: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
      {icon}
      <p className="text-sm">{text}</p>
      {children}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="mt-3 space-y-2 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="h-12 rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
