"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, X,
  Code2, Wifi, Clock, Trash2, Eye, EyeOff, Lock, BarChart3, Package,
  TrendingUp, DollarSign, Plus, Globe, EyeOff as EyeOffIcon, RefreshCw,
} from "lucide-react";

// ─── デフォルトホワイトリスト（表示用・審査参考） ────────────────────────────
const DEFAULT_WHITELIST = [
  { domain: "google.com",           name: "Google"             },
  { domain: "googleapis.com",       name: "Google"             },
  { domain: "line.me",              name: "LINE"               },
  { domain: "discord.com",          name: "Discord"            },
  { domain: "slack.com",            name: "Slack"              },
  { domain: "teams.microsoft.com",  name: "Microsoft Teams"    },
  { domain: "chatwork.com",         name: "Chatwork"           },
  { domain: "notion.so",            name: "Notion"             },
  { domain: "trello.com",           name: "Trello"             },
  { domain: "kintone.cybozu.co.jp", name: "kintone"            },
  { domain: "deepl.com",            name: "DeepL翻訳"          },
  { domain: "openai.com",           name: "OpenAI"             },
  { domain: "anthropic.com",        name: "Anthropic (Claude)" },
  { domain: "box.com",              name: "Box"                },
  { domain: "dropbox.com",          name: "Dropbox"            },
  { domain: "github.com",           name: "GitHub"             },
  { domain: "stripe.com",           name: "Stripe"             },
];

// ─── 型定義 ───────────────────────────────────────────────
type AppRecord = {
  id: number | string;
  name: string;
  description?: string;
  priceNum?: number;
  category?: string;
  creator?: string;
  createdAt?: string;
  safetyStatus?: string;
  detectedServices?: string[];
  aiVerdict?: string;
  adminReviewNote?: string;
  isAppealed?: boolean;
  status?: string;
  productFiles?: { name: string; content: string }[];
  previewFiles?: { name: string; content: string }[];
};

type Tab = "dashboard" | "review" | "whitelist" | "monitor";

// ══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  // ─── 認証 state ───
  const [authed,       setAuthed]       = useState(false);
  const [pwInput,      setPwInput]      = useState("");
  const [pwError,      setPwError]      = useState(false);
  const [showPw,       setShowPw]       = useState(false);

  // PW変更 state
  const [showChangePw, setShowChangePw] = useState(false);
  const [cpOld,        setCpOld]        = useState("");
  const [cpNew1,       setCpNew1]       = useState("");
  const [cpNew2,       setCpNew2]       = useState("");
  const [cpError,      setCpError]      = useState("");
  const [cpSuccess,    setCpSuccess]    = useState(false);
  const [showCpOld,    setShowCpOld]    = useState(false);
  const [showCpNew,    setShowCpNew]    = useState(false);

  // ─── データ state ───
  const [allApps,      setAllApps]      = useState<AppRecord[]>([]);
  const [mounted,      setMounted]      = useState(false);
  const [tab,          setTab]          = useState<Tab>("dashboard");
  const [actionMsg,    setActionMsg]    = useState("");

  // レビュー詳細
  const [selected,     setSelected]     = useState<AppRecord | null>(null);
  const [showCode,     setShowCode]     = useState(false);
  const [activeFile,   setActiveFile]   = useState(0);

  // ホワイトリスト
  const [customWL,     setCustomWL]     = useState<string[]>([]);
  const [wlInput,      setWlInput]      = useState("");
  const [wlError,      setWlError]      = useState("");

  // ─── 起動 ───
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setAllApps(
          (data.products ?? []).map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.title,
            description: p.description,
            priceNum: p.price,
            category: p.category,
            creator: (p.creator as { name?: string })?.name,
            createdAt: p.createdAt,
            status: p.status,
          }))
        );
        setAuthed(true);
      } else if (res.status === 403) {
        setAuthed(false);
      }
    } catch {
      setAllApps([]);
      setAuthed(false);
    }
    setMounted(true);
  };

  // ─── 派生データ ───
  const pendingApps  = useMemo(() => allApps.filter(a => a.status === "pending"), [allApps]);
  const activeApps   = useMemo(() => allApps.filter(a => a.status === "active"), [allApps]);
  const totalRevenue = useMemo(() => allApps.reduce((s, a) => s + (Number(a.priceNum) || 0), 0), [allApps]);

  // 価格アナリティクス
  const priceStats = useMemo(() => {
    const prices = allApps.map(a => Number(a.priceNum) || 0).filter(p => p > 0);
    if (!prices.length) return { avg: 0, max: 0, min: 0 };
    return {
      avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      max: Math.max(...prices),
      min: Math.min(...prices),
    };
  }, [allApps]);

  // カテゴリ別集計
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const a of allApps) {
      const cat = a.category ?? "その他";
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count++;
      map[cat].total += Number(a.priceNum) || 0;
    }
    return Object.entries(map)
      .map(([cat, { count, total }]) => ({
        cat, count, avg: count > 0 ? Math.round(total / count) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allApps]);

  const maxCatCount = useMemo(
    () => Math.max(1, ...categoryStats.map(c => c.count)),
    [categoryStats]
  );

  // ─── 認証ハンドラ ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwInput }),
    });
    if (res.ok) {
      setAuthed(true);
      setPwError(false);
      await loadAll();
    } else {
      setPwError(true);
      setPwInput("");
    }
  };
  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setPwInput("");
  };
  const openChangePw = () => {
    setCpError("パスワード変更は .env の ADMIN_PASSWORD を更新してください");
    setCpSuccess(false);
    setShowChangePw(true);
  };
  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    setCpError("パスワード変更はサーバー環境変数 ADMIN_PASSWORD で管理されます");
  };

  // ─── アクションハンドラ ───
  const notify = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const handleApprove = async (app: AppRecord) => {
    const res = await fetch(`/api/admin/products/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (res.ok) {
      await loadAll();
      setSelected(null);
      notify(`✅ 「${app.name}」を承認してストア公開しました`);
    } else {
      notify("承認に失敗しました");
    }
  };

  const handleReject = async (app: AppRecord) => {
    const res = await fetch(`/api/admin/products/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    if (res.ok) {
      await loadAll();
      setSelected(null);
      notify(`🗑️ 「${app.name}」を却下しました`);
    }
  };

  const handleForceUnpublish = async (app: AppRecord) => {
    const res = await fetch(`/api/admin/products/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    if (res.ok) {
      await loadAll();
      notify(`🔒 「${app.name}」を強制非公開にしました`);
    }
  };

  const handleDelete = async (app: AppRecord) => {
    await handleReject(app);
  };

  // ─── ホワイトリスト ───
  const addCustomDomain = () => {
    const d = wlInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d || !d.includes(".")) { setWlError("有効なドメインを入力してください（例: example.com）"); return; }
    if ([...DEFAULT_WHITELIST.map(w => w.domain), ...customWL].includes(d)) {
      setWlError("すでに登録されています"); return;
    }
    const next = [...customWL, d];
    setCustomWL(next);
    setWlInput(""); setWlError("");
    notify(`✅ 「${d}」をホワイトリストに追加しました`);
  };
  const removeCustomDomain = (d: string) => {
    const next = customWL.filter(c => c !== d);
    setCustomWL(next);
    notify(`削除: ${d}`);
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
            <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98]">
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

      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <BackButton label="戻る" />
          <JisappLogo href="/" />
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-700">運営総合ダッシュボード</span>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={loadAll} className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
              <RefreshCw className="h-3 w-3" />更新
            </button>
            <button onClick={openChangePw} className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors">
              <Lock className="h-3 w-3" />PW変更
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-rose-200 hover:text-rose-500 transition-colors">
              <X className="h-3 w-3" />ログアウト
            </button>
          </div>
        </div>

        {/* タブナビ */}
        <div className="mx-auto max-w-7xl px-4 flex gap-1 pb-0">
          {([
            { id: "dashboard", label: "📊 ダッシュボード" },
            { id: "review",    label: `🔍 再審査 (${pendingApps.length})` },
            { id: "whitelist", label: "🛡️ ホワイトリスト" },
            { id: "monitor",   label: `👁️ 公開中監視 (${activeApps.length})` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 ${
                tab === t.id
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/60"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* アクション通知 */}
      {actionMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl" style={{ animation: "fadeInScale .2s ease-out" }}>
          {actionMsg}
          <button onClick={() => setActionMsg("")}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* ══════════════ TAB: DASHBOARD ══════════════ */}
        {tab === "dashboard" && (
          <div className="space-y-8">

            {/* 統計カード */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "総出品数",             value: `${allApps.length}件`,                              icon: Package,     bg: "from-emerald-500 to-green-600" },
                { label: "プラットフォーム総売上", value: `¥${totalRevenue.toLocaleString()}`,               icon: DollarSign,  bg: "from-teal-500 to-emerald-600"  },
                { label: "公開中アプリ",           value: `${activeApps.length}件`,                          icon: Globe,       bg: "from-green-500 to-teal-600"    },
                { label: "要目視審査（再請求中）", value: `${pendingApps.length}件`,                         icon: AlertTriangle, bg: pendingApps.length > 0 ? "from-amber-500 to-orange-500" : "from-gray-400 to-gray-500" },
              ].map(c => (
                <div key={c.label} className={`rounded-2xl bg-gradient-to-br ${c.bg} p-5 text-white shadow-md`}>
                  <c.icon className="h-5 w-5 mb-2 opacity-80" />
                  <p className="text-2xl font-black">{mounted ? c.value : "—"}</p>
                  <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* 価格アナリティクス */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-black text-gray-900">価格アナリティクス</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "平均価格",   value: mounted ? `¥${priceStats.avg.toLocaleString()}` : "—" },
                  { label: "最高価格",   value: mounted ? `¥${priceStats.max.toLocaleString()}` : "—" },
                  { label: "最低価格（有料のみ）", value: mounted ? `¥${priceStats.min.toLocaleString()}` : "—" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-[11px] font-semibold text-emerald-600 mb-1">{s.label}</p>
                    <p className="text-xl font-black text-gray-900">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* カテゴリ傾向分析 */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-black text-gray-900">カテゴリ傾向分析</h2>
              </div>
              {!mounted || categoryStats.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">データがありません</p>
              ) : (
                <div className="space-y-3">
                  {categoryStats.map(c => (
                    <div key={c.cat} className="flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{c.cat}</p>
                        <p className="text-[10px] text-gray-400">{c.count}件 / 平均 ¥{c.avg.toLocaleString()}</p>
                      </div>
                      <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700"
                          style={{ width: `${Math.round((c.count / maxCatCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 w-8 text-right">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 全アプリ一覧（ミニ） */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-base font-black text-gray-900 mb-4">全出品データ一覧</h2>
              {allApps.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">出品データがありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-gray-400">
                        <th className="pb-2 pr-3">名前</th>
                        <th className="pb-2 pr-3">カテゴリ</th>
                        <th className="pb-2 pr-3">価格</th>
                        <th className="pb-2 pr-3">ステータス</th>
                        <th className="pb-2">作成日</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allApps.map(a => (
                        <tr key={String(a.id)} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 pr-3 font-medium text-gray-800 max-w-[180px] truncate">{a.name}</td>
                          <td className="py-2 pr-3 text-gray-500">{a.category ?? "—"}</td>
                          <td className="py-2 pr-3 font-semibold text-emerald-600">
                            {(a.priceNum ?? 0) === 0 ? "無料" : `¥${(a.priceNum ?? 0).toLocaleString()}`}
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              a.status === "active"  ? "bg-emerald-50 text-emerald-700" :
                              a.status === "pending" ? "bg-amber-50 text-amber-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>{a.status ?? "—"}</span>
                          </td>
                          <td className="py-2 text-gray-400">{a.createdAt ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: REVIEW ══════════════ */}
        {tab === "review" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-base font-black text-gray-900">再審査請求リスト</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{pendingApps.length} 件待機中</span>
            </div>

            {pendingApps.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 text-center shadow-sm">
                <ShieldCheck className="h-12 w-12 text-emerald-200" />
                <p className="font-bold text-gray-600">再審査請求はありません</p>
                <p className="text-xs text-gray-400">クリエイターが請求するとここに表示されます</p>
              </div>
            ) : (
              pendingApps.map(app => (
                <div key={String(app.id)} className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800">{app.name}</p>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">再審査請求</span>
                        {app.category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{app.category}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        by {app.creator ?? "あなた"} ·{" "}
                        {(app.priceNum ?? 0) === 0 ? "無料" : `¥${(app.priceNum ?? 0).toLocaleString()}`}
                        {app.createdAt && ` · ${app.createdAt}`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelected(selected?.id === app.id ? null : app); setShowCode(false); setActiveFile(0); }}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {selected?.id === app.id ? "閉じる" : "詳細審査"}
                    </button>
                  </div>

                  {selected?.id === app.id && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-4">
                      {/* AI レポート */}
                      <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">Groq AI セキュリティレポート</p>
                        {app.aiVerdict && <p className="text-sm text-gray-700 mb-1"><span className="font-semibold text-amber-700">AIコメント：</span>{app.aiVerdict}</p>}
                        {app.adminReviewNote && <p className="text-xs text-gray-500"><span className="font-semibold">詳細：</span>{app.adminReviewNote}</p>}
                        {(app.detectedServices ?? []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {app.detectedServices!.map(s => (
                              <span key={s} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                                <Wifi className="h-3 w-3" />{s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 説明文 */}
                      {app.description && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">アプリ説明</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{app.description}</p>
                        </div>
                      )}

                      {/* ソースコード */}
                      {(app.productFiles ?? []).length > 0 && (
                        <div>
                          <button onClick={() => setShowCode(v => !v)}
                            className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:underline">
                            {showCode ? <EyeOffIcon className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
                            {showCode ? "コードを隠す" : "製品版ソースコードを確認する"}
                          </button>
                          {showCode && (
                            <div className="mt-3 rounded-2xl bg-gray-900 overflow-hidden">
                              <div className="flex gap-1 border-b border-gray-700 px-3 pt-2">
                                {app.productFiles!.map((f, i) => (
                                  <button key={f.name} onClick={() => setActiveFile(i)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                                      i === activeFile ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"
                                    }`}>
                                    {f.name}
                                  </button>
                                ))}
                              </div>
                              <pre className="overflow-x-auto p-4 text-xs text-green-300 font-mono leading-relaxed max-h-72">
                                {app.productFiles![activeFile]?.content ?? ""}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 承認 / 却下 */}
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => handleApprove(app)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98]">
                          <CheckCircle2 className="h-4 w-4" />承認してストア公開
                        </button>
                        <button onClick={() => handleReject(app)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-all active:scale-[0.98]">
                          <Trash2 className="h-4 w-4" />却下・削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════ TAB: WHITELIST ══════════════ */}
        {tab === "whitelist" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-black text-gray-900">ホワイトリスト管理</h2>
                <span className="ml-auto text-xs text-gray-400">{DEFAULT_WHITELIST.length + customWL.length} ドメイン登録中</span>
              </div>

              {/* カスタムドメイン追加 */}
              <div className="mb-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-xs font-bold text-emerald-700 mb-3">カスタムドメインを追加（出品審査に即時反映）</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wlInput}
                    onChange={e => { setWlInput(e.target.value); setWlError(""); }}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomDomain())}
                    placeholder="example.com"
                    className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition"
                  />
                  <button onClick={addCustomDomain}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
                    <Plus className="h-4 w-4" />追加
                  </button>
                </div>
                {wlError && <p className="mt-1.5 text-xs text-rose-500">{wlError}</p>}
              </div>

              {/* カスタムリスト */}
              {customWL.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">カスタム追加済み</p>
                  <div className="flex flex-wrap gap-2">
                    {customWL.map(d => (
                      <span key={d} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                        <Globe className="h-3 w-3" />{d}
                        <button onClick={() => removeCustomDomain(d)} className="ml-1 text-blue-400 hover:text-rose-500 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* デフォルトリスト */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">デフォルト公認ドメイン（変更不可）</p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_WHITELIST.map(w => (
                    <span key={w.domain} className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <ShieldCheck className="h-3 w-3" />{w.name} <span className="font-normal text-emerald-500">({w.domain})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: MONITOR ══════════════ */}
        {tab === "monitor" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-base font-black text-gray-900">公開中アプリ監視</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{activeApps.length} 件公開中</span>
            </div>

            {activeApps.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 text-center shadow-sm">
                <Globe className="h-12 w-12 text-gray-200" />
                <p className="font-bold text-gray-600">公開中のアプリがありません</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="px-5 py-3">アプリ名</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">価格</th>
                      <th className="px-4 py-3">出品者</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeApps.map(app => (
                      <tr key={String(app.id)} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-3.5 font-semibold text-gray-800 max-w-[200px]">
                          <Link href={`/apps/${app.id}`} target="_blank"
                            className="hover:text-emerald-600 transition-colors truncate block">
                            {app.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          {app.category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{app.category}</span>}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-emerald-600">
                          {(app.priceNum ?? 0) === 0 ? "無料" : `¥${(app.priceNum ?? 0).toLocaleString()}`}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-400">{app.creator ?? "—"}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleForceUnpublish(app)}
                              className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors">
                              <EyeOffIcon className="h-3 w-3" />強制非公開
                            </button>
                            <button onClick={() => handleDelete(app)}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors">
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
      </main>

      {/* ══════ パスワード変更モーダル ══════ */}
      {showChangePw && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !cpSuccess && setShowChangePw(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl" style={{ animation: "fadeInScale .2s ease-out" }}
            onClick={e => e.stopPropagation()}>
            {cpSuccess ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="text-base font-black text-gray-900 mb-2">パスワードを変更しました</h2>
                <p className="text-xs text-gray-400 mb-5">次回ログインから新しいパスワードが有効になります</p>
                <button onClick={() => setShowChangePw(false)}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white transition-all">
                  閉じる
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                      <Lock className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h2 className="text-base font-black text-gray-900">パスワード変更</h2>
                  </div>
                  <button onClick={() => setShowChangePw(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleChangePw} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">現在のパスワード</label>
                    <div className="relative">
                      <input type={showCpOld ? "text" : "password"} value={cpOld}
                        onChange={e => { setCpOld(e.target.value); setCpError(""); }}
                        placeholder="現在のパスワード"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 transition" />
                      <button type="button" onClick={() => setShowCpOld(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCpOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">新しいパスワード（6文字以上）</label>
                    <div className="relative">
                      <input type={showCpNew ? "text" : "password"} value={cpNew1}
                        onChange={e => { setCpNew1(e.target.value); setCpError(""); }}
                        placeholder="新しいパスワード"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 transition" />
                      <button type="button" onClick={() => setShowCpNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCpNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">新しいパスワード（確認）</label>
                    <input type={showCpNew ? "text" : "password"} value={cpNew2}
                      onChange={e => { setCpNew2(e.target.value); setCpError(""); }}
                      placeholder="もう一度入力"
                      className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition ${
                        cpNew2 && cpNew1 !== cpNew2 ? "border-rose-300 bg-rose-50" : "border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                      }`} />
                    {cpNew2 && cpNew1 !== cpNew2 && <p className="mt-1 text-[10px] text-rose-500">パスワードが一致していません</p>}
                  </div>
                  {cpError && <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-500"><X className="h-3.5 w-3.5" />{cpError}</p>}
                  <button type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98] mt-1">
                    パスワードを変更する
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
