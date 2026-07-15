"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, X,
  Trash2, Eye, EyeOff, Lock, BarChart3, Package,
  TrendingUp, Users, Globe, RefreshCw, ExternalLink,
  Tag, Layers, Flag, Hash, Search, UserX,
} from "lucide-react";

// ─── 型定義 ────────────────────────────────────────────────────────
type Creator = { id: string; name: string | null; email: string };

type Product = {
  id: string;
  appNumber: number;
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

type Report = {
  id: string;
  productId: string;
  reporterId: string | null;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
  product: { id: string; appNumber: number; title: string; status: string };
};

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  productCount: number;
  purchaseCount: number;
};

type Tab = "dashboard" | "apps" | "reports" | "users";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:   { label: "公開中",   cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending:  { label: "審査待ち", cls: "bg-amber-50   text-amber-700   ring-amber-200"  },
  rejected: { label: "却下",     cls: "bg-rose-50    text-rose-600    ring-rose-200"   },
};

const REPORT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "未対応",   cls: "bg-rose-50    text-rose-600    ring-rose-200"   },
  resolved:  { label: "対応済み", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200"},
  dismissed: { label: "却下",     cls: "bg-gray-100   text-gray-500    ring-gray-200"   },
};

const LISTING_LABEL: Record<string, string> = {
  file:       "ファイル販売",
  playground: "プレイグラウンド",
  external:   "外部リンク",
};

function AppNum({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500">
      <Hash className="h-2.5 w-2.5" />{String(n).padStart(4, "0")}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [authed,  setAuthed]  = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [pwError, setPwError] = useState(false);

  const [products,           setProducts]           = useState<Product[]>([]);
  const [reports,            setReports]            = useState<Report[]>([]);
  const [users,              setUsers]              = useState<UserRecord[]>([]);
  const [userCount,          setUserCount]          = useState(0);
  const [pendingReportCount, setPendingReportCount] = useState(0);
  const [mounted,            setMounted]            = useState(false);
  const [tab,                setTab]                = useState<Tab>("dashboard");
  const [actionMsg,          setActionMsg]          = useState("");
  const [loadingId,          setLoadingId]          = useState<string | null>(null);

  // 検索
  const [appSearch,  setAppSearch]  = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [prodRes, repRes, userRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/users"),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products ?? []);
        setUserCount(data.userCount ?? 0);
        setPendingReportCount(data.pendingReportCount ?? 0);
        setAuthed(true);
      } else if (prodRes.status === 403) {
        setAuthed(false);
      }
      if (repRes.ok) {
        const d = await repRes.json();
        setReports(d.reports ?? []);
      }
      if (userRes.ok) {
        const d = await userRes.json();
        setUsers(d.users ?? []);
      }
    } catch {
      setAuthed(false);
    }
    setMounted(true);
  };

  const activeProducts  = useMemo(() => products.filter(p => p.status === "active"),  [products]);
  const pendingProducts = useMemo(() => products.filter(p => p.status === "pending"), [products]);
  const pendingReports  = useMemo(() => reports.filter(r => r.status === "pending"),  [reports]);

  // 検索フィルター
  const filteredProducts = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      String(p.appNumber).includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.creator.name ?? "").toLowerCase().includes(q) ||
      p.creator.email.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  }, [products, appSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category ?? "その他";
      map[cat] = (map[cat] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [products]);
  const maxCatCount = useMemo(() => Math.max(1, ...categoryStats.map(c => c[1])), [categoryStats]);

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

  const notify = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`「${product.title}」（#${String(product.appNumber).padStart(4,"0")}）を完全に削除しますか？この操作は取り消せません。`)) return;
    setLoadingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAll();
        notify(`「${product.title}」を削除しました`);
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = (data as { detail?: string }).detail ?? (data as { error?: string }).error ?? `HTTP ${res.status}`;
        alert(`削除に失敗しました\n\n${detail}`);
      }
    } catch (err) {
      alert(`ネットワークエラー: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoadingId(null);
  };

  const handleDeleteUser = async (user: UserRecord) => {
    if (!confirm(`「${user.name ?? user.email}」を強制退会させますか？このユーザーのデータはすべて削除されます。`)) return;
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAll();
        notify(`「${user.name ?? user.email}」を退会させました`);
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = (data as { detail?: string }).detail ?? (data as { error?: string }).error ?? `HTTP ${res.status}`;
        alert(`削除に失敗しました\n\n${detail}`);
      }
    } catch (err) {
      alert(`ネットワークエラー: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoadingId(null);
  };

  const handleReportAction = async (reportId: string, status: "resolved" | "dismissed") => {
    setLoadingId(reportId);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadAll();
      notify(status === "resolved" ? "報告を対応済みにしました" : "報告を却下しました");
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
                  pwError ? "border-rose-300 bg-rose-50" : "border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white"
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
        <div className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto">
          {([
            { id: "dashboard", label: "📊 ダッシュボード" },
            { id: "apps",      label: "📱 アプリ管理",    count: products.length,       countCls: "bg-gray-400"    },
            { id: "reports",   label: "🚨 報告",          count: pendingReports.length, countCls: "bg-rose-500"    },
            { id: "users",     label: "👤 ユーザー管理",   count: users.length,          countCls: "bg-emerald-500" },
          ] as { id: Tab; label: string; count?: number; countCls?: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
                tab === t.id
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/60"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${t.countCls}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* トースト */}
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "登録ユーザー数", value: `${userCount}人`,             icon: Users,         bg: "from-emerald-500 to-green-600"   },
                { label: "総出品数",        value: `${products.length}件`,        icon: Package,       bg: "from-teal-500 to-emerald-600"    },
                { label: "公開中",          value: `${activeProducts.length}件`,  icon: Globe,         bg: "from-green-500 to-teal-600"      },
                { label: "未対応の報告",    value: `${pendingReportCount}件`,     icon: Flag,          bg: pendingReportCount > 0 ? "from-rose-500 to-rose-600" : "from-gray-400 to-gray-500" },
              ].map(c => (
                <div key={c.label} className={`rounded-2xl bg-gradient-to-br ${c.bg} p-5 text-white shadow-md`}>
                  <c.icon className="h-5 w-5 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{mounted ? c.value : "—"}</p>
                  <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-black text-gray-900">出品ステータス内訳</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "公開中",   value: activeProducts.length,                               cls: "bg-emerald-50 text-emerald-700" },
                  { label: "審査待ち", value: pendingProducts.length,                              cls: "bg-amber-50   text-amber-700"   },
                  { label: "却下済み", value: products.filter(p=>p.status==="rejected").length,   cls: "bg-rose-50    text-rose-600"    },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl ${s.cls} p-4`}>
                    <p className="text-[11px] font-semibold mb-1">{s.label}</p>
                    <p className="text-2xl font-black">{mounted ? s.value : "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            {categoryStats.length > 0 && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-black text-gray-900">カテゴリ分布</h2>
                </div>
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
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {pendingReports.length > 0 && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-rose-500" />
                    <p className="text-sm font-bold text-rose-700">未対応の報告 {pendingReports.length} 件</p>
                  </div>
                  <button onClick={() => setTab("reports")}
                    className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-colors">
                    確認する
                  </button>
                </div>
              )}
              {pendingProducts.length > 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-bold text-amber-700">審査待ち出品 {pendingProducts.length} 件</p>
                  </div>
                  <button onClick={() => setTab("apps")}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors">
                    確認する
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ アプリ管理 ══════ */}
        {tab === "apps" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-black text-gray-900">アプリ管理</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">{filteredProducts.length} 件</span>
              {/* 検索バー */}
              <div className="ml-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm w-full sm:w-80">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                  placeholder="管理番号・タイトル・出品者で検索"
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                />
                {appSearch && (
                  <button onClick={() => setAppSearch("")} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 text-center shadow-sm">
                <ShieldCheck className="h-12 w-12 text-gray-200" />
                <p className="font-bold text-gray-600">{appSearch ? "該当するアプリが見つかりません" : "出品データがありません"}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="px-4 py-3">管理番号</th>
                      <th className="px-4 py-3">タイトル</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">ステータス</th>
                      <th className="px-4 py-3">種別</th>
                      <th className="px-4 py-3">出品者</th>
                      <th className="px-4 py-3">登録日</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map(p => {
                      const st = STATUS_LABEL[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-500 ring-gray-200" };
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-2.5"><AppNum n={p.appNumber} /></td>
                          <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[180px]">
                            <Link href={`/apps/${p.id}`} target="_blank"
                              className="hover:text-emerald-600 flex items-center gap-1 truncate">
                              {p.title}
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">{p.category ?? "—"}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">{LISTING_LABEL[p.listingType] ?? p.listingType}</td>
                          <td className="px-4 py-2.5 text-gray-400 max-w-[140px] truncate">{p.creator.name ?? p.creator.email}</td>
                          <td className="px-4 py-2.5 text-gray-400">{p.createdAt}</td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => handleDeleteProduct(p)} disabled={loadingId === p.id}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
                              {loadingId === p.id
                                ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                                : <Trash2 className="h-3 w-3" />}
                              強制削除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════ 報告一覧 ══════ */}
        {tab === "reports" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-base font-black text-gray-900">報告一覧</h2>
              {pendingReports.length > 0 && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">未対応 {pendingReports.length} 件</span>
              )}
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">計 {reports.length} 件</span>
            </div>

            {reports.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 text-center shadow-sm">
                <Flag className="h-12 w-12 text-gray-200" />
                <p className="font-bold text-gray-600">報告はありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(r => {
                  const rs = REPORT_STATUS[r.status] ?? REPORT_STATUS.pending;
                  const isPending = r.status === "pending";
                  return (
                    <div key={r.id} className={`rounded-2xl bg-white shadow-sm ring-1 ${isPending ? "ring-rose-200" : "ring-black/5"} overflow-hidden`}>
                      <div className="flex items-start gap-4 p-5">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isPending ? "bg-rose-100" : "bg-gray-100"}`}>
                          <Flag className={`h-5 w-5 ${isPending ? "text-rose-500" : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <AppNum n={r.product.appNumber} />
                            <Link href={`/apps/${r.product.id}`} target="_blank"
                              className="font-bold text-sm text-gray-800 hover:text-emerald-600 flex items-center gap-1">
                              {r.product.title}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${rs.cls}`}>{rs.label}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-0.5">理由：{r.reason}</p>
                          {r.detail && <p className="text-xs text-gray-500 leading-relaxed">{r.detail}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {r.createdAt.slice(0, 10)} {r.reporterId ? `（報告者ID: ${r.reporterId.slice(0, 8)}…）` : "（匿名）"}
                          </p>
                        </div>
                        {isPending && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleReportAction(r.id, "resolved")} disabled={loadingId === r.id}
                              className="flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50">
                              <CheckCircle2 className="h-3.5 w-3.5" />対応済み
                            </button>
                            <button onClick={() => handleReportAction(r.id, "dismissed")} disabled={loadingId === r.id}
                              className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                              <X className="h-3.5 w-3.5" />却下
                            </button>
                          </div>
                        )}
                      </div>
                      {isPending && (
                        <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-3 bg-gray-50">
                          <p className="text-[11px] text-gray-400">このアプリを対処：</p>
                          <Link href={`/apps/${r.product.id}`} target="_blank"
                            className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1">
                            アプリページを開く <ExternalLink className="h-3 w-3" />
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm(`「${r.product.title}」を削除しますか？`)) return;
                              setLoadingId(r.product.id);
                              const res = await fetch(`/api/admin/products/${r.product.id}`, { method: "DELETE" });
                              if (res.ok) { await loadAll(); notify(`「${r.product.title}」を削除しました`); }
                              setLoadingId(null);
                            }}
                            disabled={loadingId === r.product.id}
                            className="ml-auto flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
                            <Trash2 className="h-3 w-3" />アプリを強制削除
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════ ユーザー管理 ══════ */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-black text-gray-900">ユーザー管理</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">{filteredUsers.length} 人</span>
              <div className="ml-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm w-full sm:w-80">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="名前・メール・ユーザーIDで検索"
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch("")} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 text-center shadow-sm">
                <Users className="h-12 w-12 text-gray-200" />
                <p className="font-bold text-gray-600">{userSearch ? "該当するユーザーが見つかりません" : "ユーザーデータがありません"}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="px-4 py-3">ユーザー</th>
                      <th className="px-4 py-3">メールアドレス</th>
                      <th className="px-4 py-3">出品数</th>
                      <th className="px-4 py-3">取得数</th>
                      <th className="px-4 py-3">登録日</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.image ? (
                              <img src={u.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800">{u.name ?? "（名前なし）"}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{u.id.slice(0, 12)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700">{u.productCount}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700">{u.purchaseCount}</td>
                        <td className="px-4 py-3 text-gray-400">{u.createdAt}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteUser(u)} disabled={loadingId === u.id}
                            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
                            {loadingId === u.id
                              ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                              : <UserX className="h-3 w-3" />}
                            強制退会
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
