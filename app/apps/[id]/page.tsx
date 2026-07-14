"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Star,
  Lock,
  X,
  Heart,
  Calendar,
  BarChart3,
  Camera,
  Code2,
  FileText,
  Mail,
  Music,
  ShoppingCart,
  Users,
  ArrowRight,
  Globe,
  Gamepad2,
  Share2,
  Cloud,
  LogIn,
  Flag,
  AlertCircle,
} from "lucide-react";
import { supabase, type AppRow } from "@/lib/supabase";
import { buildSrcDoc as buildAppSrcDoc } from "@/lib/products/build-srcdoc";
import { useZisupBridge } from "@/lib/hooks/use-zisup-bridge";



// UUID 形式かどうかを判定するヘルパー
function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ─── Supabase 版の専用実行画面 ────────────────────────────────
function SupabaseAppPage({ id }: { id: string }) {
  const [app, setApp]     = useState<AppRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [notFound, setNotFound] = useState(false);

  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Zisup ブリッジ: ログイン時はクラウド、未ログイン時は localStorage
  useZisupBridge(iframeRef, id, isLoggedIn ? userId : null);

  useEffect(() => {
    supabase
      .from("apps")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setApp(data as AppRow); }
        setLoading(false);
      });
  }, [id]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-gray-400">アプリを読み込み中...</p>
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <span className="text-3xl">🔍</span>
        </div>
        <p className="text-lg font-bold text-gray-700">アプリが見つかりませんでした</p>
        <p className="text-sm text-gray-400">URLが正しいか確認してください</p>
        <Link href="/" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          トップに戻る
        </Link>
      </div>
    );
  }

  const srcDoc = buildAppSrcDoc(app.html_code ?? "", app.css_code, app.js_code);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-13 max-w-5xl items-center gap-3 px-4 py-2">
          <BackButton />
          <div className="flex flex-1 flex-col min-w-0">
            <h1 className="truncate text-sm font-black text-gray-900">{app.title}</h1>
            {app.description && (
              <p className="truncate text-[11px] text-gray-400">{app.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden sm:inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              プレイグラウンドアプリ
            </span>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "コピーしました！" : "共有"}
            </button>
          </div>
        </div>
      </header>

      {/* アプリ実行エリア（全画面 iframe） */}
      <main className="relative flex flex-1 flex-col">
        <iframe
          ref={iframeRef}
          key={id}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-modals"
          className="flex-1 border-0 bg-white w-full"
          style={{ minHeight: "calc(100vh - 53px)" }}
          title={app.title}
          allow="clipboard-write"
        />
        {/* 対策B: 未ログイン時のみ表示するクラウド同期ボタン */}
        {status !== "loading" && !isLoggedIn && (
          <Link
            href="/login"
            className="absolute bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-lg ring-1 ring-emerald-200 backdrop-blur-sm transition-all hover:bg-emerald-50 active:scale-95"
            title="ログインしてデータをクラウドに保存する"
          >
            <Cloud className="h-3.5 w-3.5" />
            <LogIn className="h-3 w-3" />
            <span>ログインして同期</span>
          </Link>
        )}
      </main>

      {/* フッター（最小限） */}
      <div className="border-t border-gray-100 bg-gray-50 py-2 text-center">
        <p className="text-[10px] text-gray-400">
          <Link href="/playground" className="hover:text-emerald-600">ジサップ プレイグラウンド</Link>
          {" "}で作成されました ·{" "}
          <Link href="/" className="hover:text-emerald-600">jisapp.vercel.app</Link>
        </p>
      </div>
    </div>
  );
}

export default function AppDetailPage() {
  const routeParams = useParams();
  const id = String(routeParams?.id ?? "");

  // UUID の場合は Supabase 版の専用実行画面に委譲
  if (isUUID(id)) {
    return <SupabaseAppPage id={id} />;
  }

  return <MarketplaceAppPage id={id} />;
}

function MarketplaceAppPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  type AppDetail = {
    id: string | number;
    name: string;
    description: string;
    creator: string;
    creatorScore: number;
    price: number;
    rating: number;
    reviews: number;
    tag: string;
    gradient: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    demoHtml: string;
    type?: "file" | "url";
    url?: string | null;
  };
  const [app, setApp]               = useState<AppDetail | null>(null);
  const [previewSrc, setPreviewSrc] = useState("");

  // GET確認モーダルの状態
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // URL安全アラートモーダル
  const [urlSafetyOpen, setUrlSafetyOpen] = useState(false);
  // 未ログイン案内モーダル
  const [authModalOpen, setAuthModalOpen] = useState(false);
  // 報告モーダル
  const [reportOpen,    setReportOpen]    = useState(false);
  const [reportReason,  setReportReason]  = useState("");
  const [reportDetail,  setReportDetail]  = useState("");
  const [reportDone,    setReportDone]    = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // 購入済み判定（ハイドレーションエラー防止のため useEffect 内で読み込む）
  const [mounted, setMounted]       = useState(false);
  const [purchased, setPurchased]   = useState(false);
  const [isSaved,   setIsSaved]     = useState(false);

  useEffect(() => {
    async function load() {
      let resolved: AppDetail | null = null;

      try {
        const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.product;
          if (p) {
            const demoHtml = p.htmlCode
              ? `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${p.cssCode ?? ""}</style></head><body>${p.htmlCode ?? ""}<script>${p.jsCode ?? ""}<\/script></body></html>`
              : "";
            resolved = {
              id: p.id,
              name: p.title,
              description: p.description ?? "",
              creator: p.creator?.name ?? "出品者",
              creatorScore: 5,
              price: p.price ?? 0,
              rating: 5,
              reviews: 0,
              tag: p.status === "active" ? "公開中" : "審査中",
              gradient: p.gradient ?? "from-emerald-600 via-green-600 to-teal-700",
              category: p.category ?? "その他",
              icon: Sparkles,
              demoHtml,
              type: p.listingType ?? "file",
              url: p.sourceUrl ?? null,
            };
          }
        }
      } catch { /* noop */ }

      setApp(resolved);
      setPreviewSrc(resolved?.demoHtml ?? "");

      try {
        const purchaseRes = await fetch("/api/purchases");
        if (purchaseRes.ok) {
          const d = await purchaseRes.json();
          setPurchased(
            (d.purchases ?? []).some((p: { id: string }) => String(p.id) === id)
          );
        }
      } catch { /* noop */ }

      setMounted(true);
    }
    load();
  }, [id]);

  const toggleSave = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("jisapp_saved_apps") ?? "[]");
      const next = isSaved ? saved.filter((s) => s !== id) : [...saved, id];
      localStorage.setItem("jisapp_saved_apps", JSON.stringify(next));
      setIsSaved(!isSaved);
    } catch { /* noop */ }
  };

  // localStorage に購入済み id を保存するヘルパー
  const savePurchase = async () => {
    await fetch(`/api/products/${id}/purchase`, { method: "POST" });
  };


  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center">
        <p className="text-lg font-bold text-gray-700">アプリが見つかりませんでした</p>
        <Link href="/" className="text-sm text-emerald-600 hover:underline">トップに戻る</Link>
      </div>
    );
  }

  const Icon = app.icon;

  // アプリごとのダミーソースコード（購入後モーダルで表示）
  // ダミービジュアルのグリッドセル（実際の画像がないためグラデーションで代替）
  const dummyScreenshots = [
    { label: "ダッシュボード", sub: "メイン画面", accent: "from-emerald-400 to-teal-500" },
    { label: "設定・カスタマイズ", sub: "オプション画面", accent: "from-green-400 to-emerald-500" },
    { label: "レポート出力", sub: "データ画面", accent: "from-teal-400 to-cyan-500" },
    { label: "通知・アラート", sub: "お知らせ画面", accent: "from-cyan-400 to-sky-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <BackButton />
          <JisappLogo href="/" />
          <Link href="/mypage" className="text-sm font-medium text-gray-400 hover:text-emerald-600">
            マイページ
          </Link>
        </div>
      </header>

      {/* ── コンテンツ（fixed bottom bar の高さ分だけ padding-bottom） ── */}
      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-32 pt-6">

        {/* ① ビジュアルエリア（ダミースクリーンショット） */}
        <section>
          {/* メインビジュアル */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${app.gradient} shadow-xl shadow-emerald-200/50`} style={{ height: 220 }}>
            <div className="absolute inset-0 flex items-center justify-center gap-4 p-6">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-2xl`}>
                <Icon className="h-10 w-10 text-white" />
              </div>
              <div className="text-white">
                <p className="text-xs font-semibold text-white/70 mb-1">{app.category}</p>
                <p className="text-xl font-black leading-snug">{app.name}</p>
                <p className="text-sm text-white/80 mt-1">{app.creator}</p>
              </div>
            </div>
            {/* 装飾 */}
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10" />
            {/* タグ */}
            <span className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-white border border-white/30">
              {app.tag}
            </span>
          </div>
          {/* サムネイルグリッド */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {dummyScreenshots.map((s) => (
              <div
                key={s.label}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${s.accent} aspect-video flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-sm`}
              >
                <span className="text-[9px] font-bold text-white/90 text-center px-1 leading-tight">{s.label}</span>
                <span className="text-[8px] text-white/60 text-center px-1">{s.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ② 基本情報カード */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  {app.category}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  {app.tag}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-snug">{app.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{app.creator} が開発</p>
              {/* 評価 */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(app.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-800">{app.rating}</span>
                <span className="text-xs text-gray-400">{app.reviews.toLocaleString()}件のレビュー</span>
              </div>
            </div>
            {/* お気に入りボタン */}
            {mounted && (
              <button
                onClick={toggleSave}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  isSaved
                    ? "border-rose-300 bg-rose-50 text-rose-500"
                    : "border-gray-200 bg-white text-gray-400 hover:border-rose-300 hover:text-rose-400"
                }`}
                title={isSaved ? "お気に入りから削除" : "お気に入りに追加"}
              >
                <Heart className={`h-4 w-4 ${isSaved ? "fill-rose-500" : ""}`} />
              </button>
            )}
          </div>
          {/* 安心バッジ */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Gemini AI 安全スキャン済
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              動作確認済
            </span>
          </div>
        </section>

        {/* ③ FREE バッジエリア */}
        <section className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 p-5 ring-1 ring-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="rounded-xl bg-emerald-600 px-5 py-1.5 text-2xl font-black tracking-widest text-white shadow-md">FREE</span>
            <span className="text-sm font-semibold text-emerald-700">完全無料 · 全機能利用可</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-emerald-800">
            <p className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              セキュリティ審査済み
            </p>
            <p className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              マイページにすぐ追加
            </p>
          </div>
        </section>

        {/* ④ アプリの説明 */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">✓</span>
            このアプリで解決できること
          </h2>
          <p className="text-sm leading-relaxed text-gray-600">{app.description}</p>
        </section>

        {/* ⑤ 仮体験エリア（目玉機能） */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              🎮 購入前に無料で仮体験できます
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/60">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-gray-200">
                <div className="h-3 w-3 shrink-0 rounded-full bg-emerald-400" />
                <span className="truncate font-mono text-xs text-gray-400">
                  jisapp.vercel.app/apps/{id}/demo
                </span>
              </div>
            </div>
            <iframe
              srcDoc={previewSrc}
              sandbox="allow-scripts"
              className="h-[440px] w-full border-0 bg-white"
              title={`${app.name} デモ`}
            />
          </div>
        </section>

        {/* ⑥ 出品者情報 */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-sm font-bold text-gray-700">出品者情報</h2>
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${app.gradient} text-base font-black text-white shadow-md`}>
              {app.creator.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base">{app.creator}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-700">{app.creatorScore}</span>
                  <span>/ 信頼スコア</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">認証済みクリエイター</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ⑦ 報告リンク */}
        <div className="flex justify-center pb-2">
          <button
            onClick={() => { setReportOpen(true); setReportDone(false); setReportReason(""); setReportDetail(""); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            このアプリを報告する
          </button>
        </div>

      </main>

      {/* ── 報告モーダル ── */}
      {reportOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setReportOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
                  <Flag className="h-4 w-4 text-rose-500" />
                </div>
                <span className="text-sm font-black text-gray-900">アプリを報告</span>
              </div>
              <button onClick={() => setReportOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            {reportDone ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="font-bold text-gray-900 mb-1">報告を受け付けました</p>
                <p className="text-xs text-gray-500 mb-5">内容を確認後、適切に対処いたします。</p>
                <button onClick={() => setReportOpen(false)}
                  className="w-full rounded-2xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                  閉じる
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-600">報告理由 *</label>
                  <div className="space-y-2">
                    {["不適切なコンテンツ", "スパム・詐欺", "悪意のあるコード", "著作権侵害", "その他"].map(r => (
                      <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                        <input type="radio" name="reason" value={r} checked={reportReason === r}
                          onChange={e => setReportReason(e.target.value)}
                          className="h-4 w-4 accent-rose-500" />
                        <span className="text-sm text-gray-700">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">詳細（任意）</label>
                  <textarea
                    value={reportDetail}
                    onChange={e => setReportDetail(e.target.value)}
                    placeholder="具体的な問題点を教えてください"
                    rows={3}
                    className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:bg-white transition resize-none"
                  />
                </div>
                {!reportReason && (
                  <p className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />理由を選択してください
                  </p>
                )}
                <button
                  disabled={!reportReason || reportLoading}
                  onClick={async () => {
                    if (!reportReason) return;
                    setReportLoading(true);
                    try {
                      await fetch(`/api/apps/${id}/report`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reason: reportReason, detail: reportDetail }),
                      });
                      setReportDone(true);
                    } finally {
                      setReportLoading(false);
                    }
                  }}
                  className="w-full rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {reportLoading
                    ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : "報告を送信"
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 固定 GET バー ── */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-2xl shadow-black/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">{app.name}</p>
            <span className="inline-block rounded-lg bg-emerald-600 px-3 py-0.5 text-base font-black tracking-widest text-white">FREE</span>
          </div>
          {mounted && (
            purchased ? (
              <button
                onClick={() => router.push(`/apps/${id}/success`)}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-100 px-5 py-3.5 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-200 active:scale-[0.97]"
              >
                <CheckCircle2 className="h-4 w-4" />
                取得済み ✓ ライブラリへ
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!session) { setAuthModalOpen(true); return; }
                  setCheckoutOpen(true);
                }}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-300/50 transition-all hover:bg-emerald-700 hover:shadow-emerald-400/50 active:scale-[0.97]"
              >
                GET する
                <ArrowRight className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      </div>

      {/* ── 未ログイン案内モーダル ── */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-1">🔒 ログインが必要です</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              安全な取引のためにログインが必要です。<br />
              ログイン画面へ移動しますか？
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/apps/${id}`)}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all"
              >
                ログイン・新規登録へ
              </Link>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="rounded-2xl border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── URL 安全アラートモーダル ── */}
      {urlSafetyOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setUrlSafetyOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <span className="text-xl">🔗</span>
              </div>
              <div>
                <h2 className="text-base font-black text-amber-900">外部サイトへ移動します</h2>
                <p className="text-xs text-amber-600 mt-0.5">ご利用の前に確認してください</p>
              </div>
            </div>

            {/* 本文 */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm leading-relaxed text-gray-700">
                ここから先は<span className="font-bold">外部サイト（Googleドライブ等）</span>へ移動します。
              </p>
              <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 space-y-2.5">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  💡 安全にコピーする方法
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                    <span className="shrink-0 mt-0.5">📊</span>
                    <span><span className="font-semibold">Googleスプレッドシートの場合</span>：「ファイル」→「コピーを作成」を押して、ご自身のGoogleドライブにコピーしてください。</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                    <span className="shrink-0 mt-0.5">📓</span>
                    <span><span className="font-semibold">Notionの場合</span>：ページ右上の「・・・」→「複製」を押して、ご自身のワークスペースにコピーしてください。</span>
                  </li>
                </ul>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                ※ コンテンツの閲覧は無料です。外部サービスのアカウントが別途必要な場合があります。
              </p>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setUrlSafetyOpen(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                戻る
              </button>
              <button
                onClick={() => {
                  const appUrl = (app as { url?: string | null }).url;
                  if (appUrl) window.open(appUrl, "_blank", "noopener,noreferrer");
                  setUrlSafetyOpen(false);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-sm font-black text-white shadow-md shadow-amber-200 hover:bg-amber-600 active:scale-[0.98] transition-all"
              >
                <ArrowRight className="h-4 w-4" />
                同意して進む（外部リンクを開く）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GET 確認モーダル ── */}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}
        >
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">

            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-black text-gray-900">ライブラリに追加</span>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">

              {/* アプリ情報 */}
              <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${app.gradient} shadow-md`}>
                  <app.icon className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 text-base leading-snug">{app.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{app.category} · {app.creator}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-700">FREE</span>
                    {(app as { type?: string }).type === "url" && (
                      <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">🔗 URLリンク</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 確認メッセージ */}
              <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100 text-center space-y-1">
                <p className="text-base font-black text-gray-800">このアプリをマイページに追加しますか？</p>
                <p className="text-sm text-emerald-700">取得後すぐにソースコードを確認できます ✅</p>
              </div>

              {/* ボタン */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    savePurchase();
                    setPurchased(true);
                    setCheckoutOpen(false);
                    try {
                      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
                      if (res.ok) {
                        const data = await res.json();
                        if (data.product?.isPlaygroundApp) {
                          router.push(`/apps/${id}/run`);
                          return;
                        }
                      }
                    } catch { /* noop */ }
                    router.push(`/apps/${id}/success`);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
                >
                  <ArrowRight className="h-4 w-4" />
                  GET する
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
