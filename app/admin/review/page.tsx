"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, X,
  Clock, Trash2, Eye, EyeOff, Lock, BarChart3, Package,
  TrendingUp, Users, Globe, RefreshCw, ExternalLink,
  ChevronDown, ChevronUp, Tag, Layers,
} from "lucide-react";

// ─── 型定義（実際のDBスキーマに合わせたもの）───────────────────────
type Creator = { id: string; name: string | null; email: string };

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  status: string;
  isPlaygroundApp: boolean;
  isDemo: boolean;
  listingType: string;
  productType: string;
  sourceUrl: string | null;
  creator: Creator;
  createdAt: string;
};

type Tab = "dashboard" | "pending" | "active" | "all";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:   { label: "公開中",   cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending:  { label: "審査待ち", cls: "bg-amber-50   text-amber-700   ring-amber-200"   },
  rejected: { label: "却下",     cls: "bg-rose-50    text-rose-600    ring-rose-200"    },
};

const LISTING_LABEL: Record<string, string> = {
  file:       "ファイル販売",
  playground: "プレイグラウンドアプリ",
  external:   "外部リンク",
};

// ══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  // ─── 認証 ───
  const [authed,  setAuthed]  = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [pwError, setPwError] = useState(false);

  // ─── データ ───
  const [products,   setProducts]   = useState<Product[]>([]);
  const [userCount,  setUserCount]  = useState(0);
  const [mounted,    setMounted]    = useState(false);
  const [tab,        setTab]        = useState<Tab>("dashboard");
  const [actionMsg,  setActionMsg]  = useState("");
  const [selected,   setSelected]   = useState<Product | null>(null);
  const [loadingId,  setLoadingId]  = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setUserCount(data.userCount ?? 0);
        setAuthed(true);
      } else if (res.status === 403) {
        setAuthed(false);
      }
    } catch {
      setAuthed(false);
    }
    setMounted(true);
  };

  // ─── 派生データ ───
  const pendingProducts  = useMemo(() => products.filter(p => p.status === "pending"),  [products]);
  const activeProducts   = useMemo(() => products.filter(p => p.status === "active"),   [products]);
  const rejectedProducts = useMemo(() => products.filter(p => p.status === "rejected"), [products]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category ?? "その他";
      map[cat] = (map[cat] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [products]);
  const maxCatCount = useMemo(() => Math.max(1, ...categoryStats.map(c => c[1])), [categoryStats]);

  // ─── 認証ハンドラ ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwInput }),
    });
    if (res.ok) { setAuthed(true); setPwError(false); await loadAll(); }
    else { setPwError(true); setPwInput(""); }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false); setPwInput("");
  };

  // ─── 通知 ───
  const notify = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 4000);
  };

  // ─── アクション ───
  const handleStatus = async (product: Product, status: "active" | "rejected" | "pending") => {
    setLoadingId(product.id);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadAll();
      setSelected(null);
      const labels = { active: "承認・公開", rejected: "却下", pending: "審査待ちに戻す" };
      notify(`「${product.title}」を${labels[status]}しました`);
    }
    setLoadingId(null);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`「${product.title}」を完全に削除しますか？この操作は取り消せません。`)) return;
    setLoadingId(product.id);
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      await loadAll();
      setSelected(null);
      notify(`「${product.title}」を削除しました`);
    }
    setLoadingId(null);
  };

  // ══════ ログイン画面 ══════
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f3f6f4] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">運営管理ダッシュボード</h1>
              <p className="text-xs text-gray-400 mt-0.5">ジサップ 運営専用エリア</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                placeholder="管理者パスワード"
                autoComplete="current-password"
                className={`w-full rounded-2xl border px-4 py-3 pr-10 text-sm outline-none transition ${
                  pwError ? "border-rose-300 bg-rose-50" : "border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                }`}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwError && <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-500"><X className="h-3.5 w-3.5" />パスワードが正しくありません</p>}
            <button type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98]">
              ログイン
            </button>
          </form>
          <p className="mt-5 text-center text-[10px] text-gray-300">このページは運営スタッフ専用です</p>
        </div>
      </div>
    );
  }

  // ══════ メイン管理画面 ══════
  return (
    <div className="min-h-screen bg-[#f0f4f2]">
      <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <JisappLogo href="/" />
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-700">運営管理</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={loadAll}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
              <RefreshCw className="h-3 w-3" />更新
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-rose-200 hover:text-rose-500 transition-colors">
              <X className="h-3 w-3" />ログアウト
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className="mx-auto max-w-7xl px-4 flex gap-1 pb-0">
          {([
            { id: "dashboard", label: "📊 ダッシュボード" },
            { id: "pending",   label: `⏳ 審査待ち (${pendingProducts.length})` },
            { id: "active",    label: `🌐 公開中 (${activeProducts.length})` },
            { id: "all",       label: `📋 全出品 (${products.length})` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
                tab === t.id
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/60"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* 通知トースト */}
      {actionMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          style={{ animation: "fadeInScale .2s ease-out" }}>
          {actionMsg}
          <button onClick={() => setActionMsg("")}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* ══════ DASHBOARD ══════ */}
        {tab === "dashboard" && (
          <div className="space-y-8">
            {/* 統計カード */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "登録ユーザー数", value: `${userCount}人`,            icon: Users,         bg: "from-emerald-500 to-green-600"  },
                { label: "総出品数",       value: `${products.length}件`,       icon: Package,       bg: "from-teal-500 to-emerald-600"   },
                { label: "公開中",         value: `${activeProducts.length}件`, icon: Globe,         bg: "from-green-500 to-teal-600"     },
                { label: "審査待ち",       value: `${pendingProducts.length}件`,icon: AlertTriangle, bg: pendingProducts.length > 0 ? "from-amber-500 to-orange-500" : "from-gray-400 to-gray-500" },
              ].map(c => (
                <div key={c.label} className={`rounded-2xl bg-gradient-to-br ${c.bg} p-5 text-white shadow-md`}>
                  <c.icon className="h-5 w-5 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{mounted ? c.value : "—"}</p>
                  <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* ステータス内訳 */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-black text-gray-900">出品ステータス内訳</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "公開中",   value: activeProducts.length,   cls: "bg-emerald-50 text-emerald-700" },
                  { label: "審査待ち", value: pendingProducts.length,  cls: "bg-amber-50   text-amber-700"   },
                  { label: "却下済み", value: rejectedProducts.length, cls: "bg-rose-50    text-rose-600"    },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl ${s.cls} p-4`}>
                    <p className="text-[11px] font-semibold mb-1">{s.label}</p>
                    <p className="text-2xl font-black">{mounted ? s.value : "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* カテゴリ分布 */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-black text-gray-900">カテゴリ分布</h2>
              </div>
              {!mounted || categoryStats.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">出品データがありません</p>
              ) : (
                <div className="space-y-3">
                  {categoryStats.map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{cat}</p>
                        <p className="text-[10px] text-gray-400">{count}件</p>
                      </div>
                      <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700"
                          style={{ width: `${Math.round((count / maxCatCount) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 審査待ち件数があればリンク */}
            {pendingProducts.length > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm font-bold text-amber-700">
                    審査待ちの出品が {pendingProducts.length} 件あります
                  </p>
                </div>
                <button onClick={() => setTab("pending")}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors">
                  審査する
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════ 審査待ち ══════ */}
        {tab === "pending" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-base font-black text-gray-900">審査待ち一覧</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{pendingProducts.length} 件</span>
            </div>

            {pendingProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 text-center shadow-sm">
                <ShieldCheck className="h-12 w-12 text-emerald-200" />
                <p className="font-bold text-gray-600">審査待ちの出品はありません</p>
              </div>
            ) : (
              pendingProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isSelected={selected?.id === p.id}
                  isLoading={loadingId === p.id}
                  onToggle={() => setSelected(selected?.id === p.id ? null : p)}
                  onApprove={() => handleStatus(p, "active")}
                  onReject={() => handleStatus(p, "rejected")}
                  onDelete={() => handleDelete(p)}
                />
              ))
            )}
          </div>
        )}

        {/* ══════ 公開中 ══════ */}
        {tab === "active" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-base font-black text-gray-900">公開中アプリ</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{activeProducts.length} 件</span>
            </div>

            {activeProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 text-center shadow-sm">
                <Globe className="h-12 w-12 text-gray-200" />
                <p className="font-bold text-gray-600">公開中の出品はありません</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="px-5 py-3">タイトル</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">価格</th>
                      <th className="px-4 py-3">種別</th>
                      <th className="px-4 py-3">出品者</th>
                      <th className="px-4 py-3">登録日</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeProducts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-3 font-semibold text-gray-800 max-w-[200px]">
                          <Link href={`/apps/${p.id}`} target="_blank"
                            className="hover:text-emerald-600 transition-colors flex items-center gap-1 truncate">
                            {p.title}
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {p.category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{p.category}</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">
                          {p.price === 0 ? "無料" : `¥${p.price.toLocaleString()}`}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{LISTING_LABEL[p.listingType] ?? p.listingType}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{p.creator.name ?? p.creator.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{p.createdAt}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStatus(p, "pending")} disabled={loadingId === p.id}
                              className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
                              <Clock className="h-3 w-3" />審査待ちに戻す
                            </button>
                            <button onClick={() => handleDelete(p)} disabled={loadingId === p.id}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
                              <Trash2 className="h-3 w-3" />削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════ 全出品 ══════ */}
        {tab === "all" && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-gray-900">全出品一覧</h2>
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">出品データがありません</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="px-5 py-3">タイトル</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">価格</th>
                      <th className="px-4 py-3">ステータス</th>
                      <th className="px-4 py-3">種別</th>
                      <th className="px-4 py-3">出品者</th>
                      <th className="px-4 py-3">登録日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => {
                      const st = STATUS_LABEL[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-500 ring-gray-200" };
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-2.5 font-medium text-gray-800 max-w-[200px] truncate">{p.title}</td>
                          <td className="px-4 py-2.5 text-gray-500">{p.category ?? "—"}</td>
                          <td className="px-4 py-2.5 font-semibold text-emerald-600">
                            {p.price === 0 ? "無料" : `¥${p.price.toLocaleString()}`}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">{LISTING_LABEL[p.listingType] ?? p.listingType}</td>
                          <td className="px-4 py-2.5 text-gray-400">{p.creator.name ?? p.creator.email}</td>
                          <td className="px-4 py-2.5 text-gray-400">{p.createdAt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── 審査カードコンポーネント ───────────────────────────────────────
function ProductCard({
  product, isSelected, isLoading, onToggle, onApprove, onReject, onDelete,
}: {
  product: Product;
  isSelected: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-800 truncate">{product.title}</p>
            {product.category && (
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                <Tag className="h-2.5 w-2.5" />{product.category}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600 ring-1 ring-blue-100">
              <Layers className="h-2.5 w-2.5" />{LISTING_LABEL[product.listingType] ?? product.listingType}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            by {product.creator.name ?? product.creator.email} ·{" "}
            {product.price === 0 ? "無料" : `¥${product.price.toLocaleString()}`} ·{" "}
            {product.createdAt}
          </p>
        </div>
        <button onClick={onToggle}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors shrink-0">
          {isSelected ? <><ChevronUp className="h-3.5 w-3.5" />閉じる</> : <><Eye className="h-3.5 w-3.5" />詳細・審査</>}
        </button>
      </div>

      {isSelected && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-4">
          {/* 説明文 */}
          {product.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">説明文</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* メタ情報 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "価格",     value: product.price === 0 ? "無料" : `¥${product.price.toLocaleString()}` },
              { label: "種別",     value: LISTING_LABEL[product.listingType] ?? product.listingType },
              { label: "カテゴリ", value: product.category ?? "—" },
              { label: "出品者",   value: product.creator.email },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-gray-400 mb-0.5">{m.label}</p>
                <p className="text-xs font-bold text-gray-700 truncate">{m.value}</p>
              </div>
            ))}
          </div>

          {/* 外部リンク */}
          {product.sourceUrl && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">リンク</p>
              <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline">
                {product.sourceUrl} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3 pt-1">
            <button onClick={onApprove} disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98] disabled:opacity-50">
              {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 className="h-4 w-4" />}
              承認・公開
            </button>
            <button onClick={onReject} disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-all active:scale-[0.98] disabled:opacity-50">
              <Clock className="h-4 w-4" />却下
            </button>
            <button onClick={onDelete} disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-all active:scale-[0.98] disabled:opacity-50">
              <Trash2 className="h-4 w-4" />削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
