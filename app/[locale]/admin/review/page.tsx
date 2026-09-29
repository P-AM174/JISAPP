"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "@/lib/i18n/navigation";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, X,
  Trash2, Eye, EyeOff, Lock, BarChart3, Package,
  TrendingUp, Users, Globe, RefreshCw, ExternalLink,
  Flag, Hash, Search, UserX, MessageSquare, Star, Code2, Mail, Bell, Send,
  Smartphone, Copy, Download, LogOut, ClipboardCheck, LayoutTemplate, Link2,
  ArrowRight, Inbox, Clock, type LucideIcon,
} from "lucide-react";
import { ADMIN_FLAG_OPTIONS, adminFlagLabel } from "@/lib/support/admin-flags";
import { copyText } from "@/lib/playground/ai-launch";
import { codeFileName, combineAppCode, saveTextFile } from "@/lib/admin/code-file";
import { cn } from "@/lib/utils";

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
  isListed: boolean;
  isFeatured: boolean;
  adminFlags: string[];
  listingType: string;
  productType: string;
  sourceUrl: string | null;
  source?: "supabase" | "prisma";
  creator: Creator;
  createdAt: string;
};

type Inquiry = {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  subject: string;
  body: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
};

type Tab = "dashboard" | "apps" | "inquiries" | "reports" | "users";
type AppSubTab = "listed" | "url_only";
type MessageChannel = "bell" | "email" | "both";
type CodeTab = "html" | "css" | "js";

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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:   { label: "公開中",   cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending:  { label: "審査待ち", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  rejected: { label: "却下",     cls: "bg-rose-50 text-rose-600 ring-rose-200" },
};

const REPORT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "未対応",   cls: "bg-rose-50 text-rose-600 ring-rose-200" },
  resolved:  { label: "対応済み", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  dismissed: { label: "却下",     cls: "bg-gray-100 text-gray-500 ring-gray-200" },
};

const CARD = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

function AppNum({ n }: { n: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
      <Hash className="h-2.5 w-2.5" />{String(n).padStart(4, "0")}
    </span>
  );
}

function Pill({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1", cls)}>{children}</span>;
}

function SectionTitle({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <h2 className="text-base font-black text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className={cn(CARD, "flex flex-col items-center gap-3 py-16 text-center")}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
        <Icon className="h-7 w-7 text-slate-300" />
      </span>
      <p className="text-sm font-bold text-gray-500">{text}</p>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:ml-auto sm:w-80">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="検索をクリア" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/70 p-1 ring-1 ring-black/5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
            value === o.id ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [authed,  setAuthed]  = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [pwError, setPwError] = useState(false);

  const [products,           setProducts]           = useState<Product[]>([]);
  const [inquiries,          setInquiries]          = useState<Inquiry[]>([]);
  const [openInquiryCount,   setOpenInquiryCount]   = useState(0);
  const [reports,            setReports]            = useState<Report[]>([]);
  const [users,              setUsers]              = useState<UserRecord[]>([]);
  const [userCount,          setUserCount]          = useState(0);
  const [mounted,            setMounted]            = useState(false);
  const [refreshing,         setRefreshing]         = useState(false);
  const [tab,                setTab]                = useState<Tab>("dashboard");
  const [appSubTab,          setAppSubTab]          = useState<AppSubTab>("listed");
  const [inquiryFilter,      setInquiryFilter]      = useState<"open" | "all">("open");
  const [reportFilter,       setReportFilter]       = useState<"pending" | "all">("pending");
  const [actionMsg,          setActionMsg]          = useState("");
  const [loadingId,          setLoadingId]          = useState<string | null>(null);
  const [replyDrafts,        setReplyDrafts]        = useState<Record<string, string>>({});
  const [messageTarget,      setMessageTarget]      = useState<UserRecord | null>(null);
  const [messageTitle,       setMessageTitle]       = useState("");
  const [messageBody,        setMessageBody]        = useState("");
  const [messageChannel,     setMessageChannel]     = useState<MessageChannel>("both");
  const [codeTarget,         setCodeTarget]         = useState<Product | null>(null);
  const [codeData,           setCodeData]           = useState<{
    title: string;
    html_code: string;
    css_code: string;
    js_code: string;
  } | null>(null);
  const [codeTab,            setCodeTab]            = useState<CodeTab>("html");

  // 検索
  const [appSearch,  setAppSearch]  = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [prodRes, repRes, userRes, inqRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/users"),
        fetch("/api/admin/inquiries"),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products ?? []);
        setUserCount(data.userCount ?? 0);
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
      if (inqRes.ok) {
        const d = await inqRes.json();
        setInquiries(d.inquiries ?? []);
        setOpenInquiryCount(d.openCount ?? 0);
      }
    } catch {
      setAuthed(false);
    }
    setMounted(true);
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const activeProducts  = useMemo(() => products.filter(p => p.status === "active"),  [products]);
  const pendingProducts = useMemo(() => products.filter(p => p.status === "pending"), [products]);
  const pendingReports  = useMemo(() => reports.filter(r => r.status === "pending"),  [reports]);
  const recentProducts  = useMemo(() => products.slice(0, 6), [products]);

  // 検索フィルター
  const filteredProducts = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    const base = products.filter((p) =>
      appSubTab === "listed" ? p.isListed : !p.isListed
    );
    if (!q) return base;
    return base.filter(p =>
      String(p.appNumber).includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.creator.name ?? "").toLowerCase().includes(q) ||
      p.creator.email.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  }, [products, appSearch, appSubTab]);

  const listedCount = useMemo(() => products.filter((p) => p.isListed).length, [products]);
  const urlOnlyCount = useMemo(() => products.filter((p) => !p.isListed).length, [products]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const visibleInquiries = useMemo(
    () => (inquiryFilter === "open" ? inquiries.filter((i) => i.status === "open") : inquiries),
    [inquiries, inquiryFilter]
  );
  const visibleReports = useMemo(
    () => (reportFilter === "pending" ? pendingReports : reports),
    [reports, pendingReports, reportFilter]
  );

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
    } else {
      alert("更新に失敗しました");
    }
    setLoadingId(null);
  };

  const handleForceDeleteReported = async (r: Report) => {
    if (!confirm(`「${r.product.title}」を削除しますか？`)) return;
    setLoadingId(r.product.id);
    try {
      const res = await fetch(`/api/admin/products/${r.product.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAll();
        notify(`「${r.product.title}」を削除しました`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`削除に失敗しました\n\n${(data as { error?: string }).error ?? `HTTP ${res.status}`}`);
      }
    } catch (err) {
      alert(`ネットワークエラー: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoadingId(null);
  };

  const handleToggleFeatured = async (product: Product) => {
    if (product.source !== "supabase") return;
    setLoadingId(product.id);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !product.isFeatured }),
    });
    if (res.ok) {
      await loadAll();
      notify(product.isFeatured ? "注目から外しました" : "注目のアプリに設定しました");
    }
    setLoadingId(null);
  };

  const handleToggleFlag = async (product: Product, flagId: string) => {
    if (product.source !== "supabase") return;
    setLoadingId(`${product.id}-${flagId}`);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleFlag: flagId }),
    });
    if (res.ok) await loadAll();
    setLoadingId(null);
  };

  const handleReplyInquiry = async (inquiry: Inquiry) => {
    const reply = (replyDrafts[inquiry.id] ?? "").trim();
    if (!reply) return;
    setLoadingId(inquiry.id);
    const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    if (res.ok) {
      setReplyDrafts((prev) => ({ ...prev, [inquiry.id]: "" }));
      await loadAll();
      notify("返信を送信しました");
    } else {
      alert("返信に失敗しました");
    }
    setLoadingId(null);
  };

  const handleSendUserMessage = async () => {
    if (!messageTarget) return;
    setLoadingId(messageTarget.id);
    const res = await fetch(`/api/admin/users/${messageTarget.id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: messageTitle,
        message: messageBody,
        channel: messageChannel,
      }),
    });
    if (res.ok) {
      setMessageTarget(null);
      setMessageTitle("");
      setMessageBody("");
      setMessageChannel("both");
      notify(`「${messageTarget.name ?? messageTarget.email}」にメッセージを送信しました`);
    } else {
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error ?? "送信に失敗しました");
    }
    setLoadingId(null);
  };

  const openMessage = (u: UserRecord) => {
    setMessageTarget(u);
    setMessageTitle("");
    setMessageBody("");
    setMessageChannel("both");
  };

  const handleViewCode = async (product: Product) => {
    setCodeTarget(product);
    setCodeData(null);
    setCodeTab("html");
    setLoadingId(product.id);
    const res = await fetch(`/api/admin/apps/${product.id}/code`);
    if (res.ok) {
      const data = await res.json();
      setCodeData({
        title: data.title,
        html_code: data.html_code ?? "",
        css_code: data.css_code ?? "",
        js_code: data.js_code ?? "",
      });
    } else {
      alert("コードの取得に失敗しました");
      setCodeTarget(null);
    }
    setLoadingId(null);
  };

  const closeCode = () => { setCodeTarget(null); setCodeData(null); };

  const fullCode = codeData ? combineAppCode(codeData.html_code, codeData.css_code, codeData.js_code) : "";

  const handleCopyCode = async () => {
    if (!fullCode) return;
    notify((await copyText(fullCode)) ? "コードを一括コピーしました" : "コピーできませんでした");
  };

  const handleSaveCode = async () => {
    if (!fullCode || !codeTarget) return;
    const fileName = codeFileName(codeData?.title ?? codeTarget.title, codeTarget.appNumber);
    const result = await saveTextFile(fullCode, fileName);
    if (result === "downloaded") notify(`${fileName} を保存しました`);
    else if (result === "failed") {
      notify((await copyText(fullCode)) ? "このブラウザでは保存できないため、コードをコピーしました" : "保存できませんでした");
    }
  };

  // ══════ ログイン画面 ══════
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-jisapp-ambient p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/90 shadow-xl ring-1 ring-black/5 backdrop-blur">
          <div aria-hidden className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
          <div className="p-8">
            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-md shadow-emerald-600/20">
                <Lock className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900">運営管理ダッシュボード</h1>
                <p className="mt-0.5 text-xs text-gray-400">ジサップ 運営専用エリア</p>
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
                  className={cn(
                    "h-12 w-full rounded-2xl border px-4 pr-10 text-sm outline-none transition",
                    pwError
                      ? "border-rose-300 bg-rose-50"
                      : "border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  )}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "パスワードを隠す" : "パスワードを表示"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwError && <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-500"><X className="h-3.5 w-3.5" />パスワードが正しくありません</p>}
              <button type="submit"
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]">
                ログイン
              </button>
            </form>
            <p className="mt-5 text-center text-[10px] text-gray-300">このページは運営スタッフ専用です</p>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: LucideIcon; count?: number; countCls?: string }[] = [
    { id: "dashboard", label: "ダッシュボード", icon: BarChart3 },
    { id: "apps",      label: "アプリ",        icon: Smartphone,    count: products.length,       countCls: "bg-slate-400" },
    { id: "inquiries", label: "問い合わせ",    icon: MessageSquare, count: openInquiryCount,      countCls: "bg-sky-500" },
    { id: "reports",   label: "報告",          icon: Flag,          count: pendingReports.length, countCls: "bg-rose-500" },
    { id: "users",     label: "ユーザー",      icon: Users,         count: users.length,          countCls: "bg-emerald-600" },
  ];

  const todo = [
    { key: "reports",   label: "未対応の報告",         count: pendingReports.length,  icon: Flag,          tab: "reports" as Tab,   cls: "from-rose-50 to-pink-50 ring-rose-200",    text: "text-rose-700",  btn: "bg-rose-500 hover:bg-rose-600" },
    { key: "inquiries", label: "未返信の問い合わせ",   count: openInquiryCount,       icon: Inbox,         tab: "inquiries" as Tab, cls: "from-sky-50 to-cyan-50 ring-sky-200",      text: "text-sky-700",   btn: "bg-sky-500 hover:bg-sky-600" },
    { key: "pending",   label: "審査待ちのアプリ",     count: pendingProducts.length, icon: AlertTriangle, tab: "apps" as Tab,      cls: "from-amber-50 to-orange-50 ring-amber-200", text: "text-amber-700", btn: "bg-amber-500 hover:bg-amber-600" },
  ].filter((t) => t.count > 0);

  // ══════ メイン管理画面 ══════
  return (
    <div className="min-h-screen bg-jisapp-ambient">
      <style>{`@keyframes fadeInScale{from{opacity:0;transform:translate(-50%,0) scale(.93)}to{opacity:1;transform:translate(-50%,0) scale(1)}}`}</style>

      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div aria-hidden className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <JisappLogo href="/" />
          <span className="ml-1 hidden text-sm text-gray-400 sm:inline">/</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-gray-700">
            <ShieldCheck className="hidden h-4 w-4 text-emerald-600 sm:block" />
            運営管理
          </span>
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/admin/approvals"
              title="承認キュー"
              className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:h-9 sm:px-2.5 text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden md:inline">承認キュー</span>
            </Link>
            <Link
              href="/admin/hero"
              title="ヒーロー編集"
              className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:h-9 sm:px-2.5 text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-violet-50 hover:text-violet-700 hover:ring-violet-200"
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden md:inline">ヒーロー編集</span>
            </Link>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              title="最新の情報に更新"
              className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:h-9 sm:px-2.5 text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200 disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="hidden md:inline">更新</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="ログアウト"
              className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:h-9 sm:px-2.5 text-gray-500 ring-1 ring-gray-200 transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">ログアウト</span>
            </button>
          </div>
        </div>

        {/* タブ */}
        <nav className="mx-auto max-w-6xl px-4 pb-2.5">
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white/60 p-1 ring-1 ring-black/5 [scrollbar-width:none]">
            {TABS.map(({ id, label, icon: Icon, count, countCls }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all sm:text-sm",
                  tab === id
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-emerald-600"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                {label}
                {count !== undefined && count > 0 && (
                  <span className={cn("flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-black text-white", countCls)}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* トースト */}
      {actionMsg && (
        <div className="fixed left-1/2 top-24 z-[700] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          style={{ animation: "fadeInScale .2s ease-out", transform: "translate(-50%,0)" }}>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="min-w-0">{actionMsg}</span>
          <button type="button" onClick={() => setActionMsg("")} aria-label="閉じる"><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 pb-16">

        {/* ══════ ダッシュボード ══════ */}
        {tab === "dashboard" && (
          <>
            {/* 対応が必要なもの */}
            <section className={cn(CARD, "p-5")}>
              <SectionTitle icon={Bell} title="対応が必要なもの" />
              {!mounted ? (
                <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-100" />
              ) : todo.length === 0 ? (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-emerald-50/70 px-4 py-3.5 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  いま対応が必要なものはありません
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {todo.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.tab)}
                      className={cn("group flex items-center gap-3 rounded-xl bg-gradient-to-br px-4 py-3.5 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-md", t.cls)}
                    >
                      <t.icon className={cn("h-5 w-5 shrink-0", t.text)} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-xs font-bold", t.text)}>{t.label}</span>
                        <span className="text-2xl font-black text-gray-900">{t.count}<span className="ml-0.5 text-xs font-bold text-gray-500">件</span></span>
                      </span>
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white transition", t.btn)}>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 数字 */}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "登録ユーザー", value: userCount,           unit: "人", icon: Users,   bg: "from-emerald-50 to-teal-50",  ic: "text-emerald-600" },
                { label: "全アプリ",     value: products.length,     unit: "件", icon: Package, bg: "from-sky-50 to-cyan-50",      ic: "text-sky-600" },
                { label: "出品中",       value: listedCount,         unit: "件", icon: Globe,   bg: "from-teal-50 to-emerald-50",  ic: "text-teal-600" },
                { label: "URL発行のみ",  value: urlOnlyCount,        unit: "件", icon: Link2,   bg: "from-violet-50 to-indigo-50", ic: "text-violet-600" },
              ].map((c) => (
                <div key={c.label} className={cn(CARD, "bg-gradient-to-br p-4", c.bg)}>
                  <c.icon className={cn("mb-2 h-5 w-5", c.ic)} />
                  <p className="text-2xl font-black tracking-tight text-gray-900">
                    {mounted ? c.value.toLocaleString() : "—"}
                    <span className="ml-0.5 text-xs font-bold text-gray-500">{c.unit}</span>
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">{c.label}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* 新しいアプリ */}
              <section className={cn(CARD, "p-5")}>
                <SectionTitle icon={Clock} title="新しいアプリ">
                  <button type="button" onClick={() => setTab("apps")} className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline">
                    すべて見る <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </SectionTitle>
                {recentProducts.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-400">まだアプリはありません</p>
                ) : (
                  <ul className="mt-3 divide-y divide-gray-100">
                    {recentProducts.map((p) => {
                      const st = STATUS_LABEL[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-500 ring-gray-200" };
                      return (
                        <li key={p.id} className="flex items-center gap-2.5 py-2.5">
                          <AppNum n={p.appNumber} />
                          <div className="min-w-0 flex-1">
                            <Link href={`/apps/${p.id}`} target="_blank" className="block truncate text-sm font-bold text-gray-800 hover:text-emerald-700">
                              {p.title}
                            </Link>
                            <p className="truncate text-[11px] text-gray-400">{p.creator.name ?? p.creator.email} · {p.createdAt}</p>
                          </div>
                          <Pill cls={p.isListed ? "bg-teal-50 text-teal-700 ring-teal-200" : "bg-violet-50 text-violet-700 ring-violet-200"}>
                            {p.isListed ? "出品" : "URL"}
                          </Pill>
                          <Pill cls={st.cls}>{st.label}</Pill>
                          <button
                            type="button"
                            onClick={() => handleViewCode(p)}
                            title="コードを見る"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-violet-600 ring-1 ring-violet-200 hover:bg-violet-50"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <div className="space-y-5">
                {/* ステータス内訳 */}
                <section className={cn(CARD, "p-5")}>
                  <SectionTitle icon={BarChart3} title="ステータス内訳" />
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "公開中",   value: activeProducts.length,                             cls: "from-emerald-50 to-teal-50 text-emerald-700" },
                      { label: "審査待ち", value: pendingProducts.length,                            cls: "from-amber-50 to-orange-50 text-amber-700" },
                      { label: "却下済み", value: products.filter(p => p.status === "rejected").length, cls: "from-rose-50 to-pink-50 text-rose-600" },
                    ].map(s => (
                      <div key={s.label} className={cn("rounded-xl bg-gradient-to-br px-3 py-3", s.cls)}>
                        <p className="text-[11px] font-bold">{s.label}</p>
                        <p className="mt-0.5 text-xl font-black text-gray-900">{mounted ? s.value : "—"}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* カテゴリ分布 */}
                {categoryStats.length > 0 && (
                  <section className={cn(CARD, "p-5")}>
                    <SectionTitle icon={TrendingUp} title="カテゴリ分布" />
                    <div className="mt-4 space-y-2.5">
                      {categoryStats.map(([cat, count]) => (
                        <div key={cat} className="flex items-center gap-3">
                          <p className="w-24 shrink-0 truncate text-xs font-semibold text-gray-600">{cat}</p>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                              style={{ width: `${Math.round((count / maxCatCount) * 100)}%` }} />
                          </div>
                          <span className="w-8 text-right text-xs font-bold text-gray-700">{count}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        )}

        {/* ══════ アプリ管理 ══════ */}
        {tab === "apps" && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <SectionTitle icon={Smartphone} title="アプリ管理" />
              <Segmented
                value={appSubTab}
                onChange={setAppSubTab}
                options={[
                  { id: "listed", label: `出品済み (${listedCount})` },
                  { id: "url_only", label: `URL発行のみ (${urlOnlyCount})` },
                ]}
              />
              <SearchBox value={appSearch} onChange={setAppSearch} placeholder="管理番号・タイトル・出品者で検索" />
            </div>
            <p className="-mt-2 text-xs text-gray-400">{filteredProducts.length} 件を表示中</p>

            {filteredProducts.length === 0 ? (
              <EmptyState icon={ShieldCheck} text={appSearch ? "該当するアプリが見つかりません" : appSubTab === "listed" ? "出品済みアプリはありません" : "URL発行のみのアプリはありません"} />
            ) : (
              <ul className="space-y-2.5">
                {filteredProducts.map(p => {
                  const st = STATUS_LABEL[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-500 ring-gray-200" };
                  const flagged = p.adminFlags.length > 0;
                  return (
                    <li key={p.id} className={cn(CARD, "p-4 transition hover:ring-emerald-200", flagged && "ring-amber-200")}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* 基本情報 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <AppNum n={p.appNumber} />
                            <Pill cls={st.cls}>{st.label}</Pill>
                            {p.category && <Pill cls="bg-slate-50 text-slate-500 ring-slate-200">{p.category}</Pill>}
                          </div>
                          <Link href={`/apps/${p.id}`} target="_blank"
                            className="mt-1.5 flex items-center gap-1 text-sm font-black text-gray-900 hover:text-emerald-700">
                            <span className="truncate">{p.title}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                          </Link>
                          <p className="mt-0.5 truncate text-[11px] text-gray-400">
                            {p.creator.name ?? p.creator.email} · {p.createdAt}
                          </p>
                        </div>

                        {/* フラグ・注目 */}
                        <div className="flex flex-wrap items-center gap-1.5 lg:max-w-[300px] lg:justify-end">
                          {p.source === "supabase" ? (
                            <>
                              {ADMIN_FLAG_OPTIONS.map((f) => {
                                const active = p.adminFlags.includes(f.id);
                                return (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => handleToggleFlag(p, f.id)}
                                    disabled={loadingId === `${p.id}-${f.id}`}
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 transition-colors disabled:opacity-50",
                                      active ? "bg-amber-50 text-amber-700 ring-amber-300" : "bg-white text-gray-400 ring-gray-200 hover:bg-gray-50"
                                    )}
                                  >
                                    {f.label}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(p)}
                                disabled={loadingId === p.id}
                                className={cn(
                                  "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 transition-colors disabled:opacity-50",
                                  p.isFeatured ? "bg-violet-50 text-violet-700 ring-violet-300" : "bg-white text-gray-400 ring-gray-200 hover:bg-violet-50 hover:text-violet-600"
                                )}
                              >
                                <Star className={cn("h-3 w-3", p.isFeatured && "fill-violet-500")} />
                                {p.isFeatured ? "注目中" : "注目に設定"}
                              </button>
                            </>
                          ) : null}
                          {p.adminFlags.filter((f) => !ADMIN_FLAG_OPTIONS.some((o) => o.id === f)).map((f) => (
                            <span key={f} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{adminFlagLabel(f)}</span>
                          ))}
                        </div>

                        {/* 操作 */}
                        <div className="flex gap-1.5 lg:shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewCode(p)}
                            disabled={loadingId === p.id}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 ring-1 ring-violet-200 transition-colors hover:bg-violet-100 disabled:opacity-50 lg:flex-none"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            コード
                          </button>
                          <button onClick={() => handleDeleteProduct(p)} disabled={loadingId === p.id}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-600 ring-1 ring-rose-200 transition-colors hover:bg-rose-50 disabled:opacity-50 lg:flex-none">
                            {loadingId === p.id
                              ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                            削除
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* ══════ 問い合わせ ══════ */}
        {tab === "inquiries" && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <SectionTitle icon={MessageSquare} title="運営への問い合わせ" />
              <Segmented
                value={inquiryFilter}
                onChange={setInquiryFilter}
                options={[
                  { id: "open", label: `未返信 (${openInquiryCount})` },
                  { id: "all", label: `すべて (${inquiries.length})` },
                ]}
              />
            </div>

            {visibleInquiries.length === 0 ? (
              <EmptyState icon={MessageSquare} text={inquiryFilter === "open" ? "未返信の問い合わせはありません" : "問い合わせはありません"} />
            ) : (
              <div className="space-y-3">
                {visibleInquiries.map((inq) => {
                  const isOpen = inq.status === "open";
                  return (
                    <div key={inq.id} className={cn(CARD, "overflow-hidden", isOpen && "ring-sky-200")}>
                      <div className="p-5">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Pill cls={
                            isOpen ? "bg-sky-50 text-sky-700 ring-sky-200" :
                            inq.status === "replied" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
                            "bg-gray-100 text-gray-500 ring-gray-200"
                          }>
                            {isOpen ? "未返信" : inq.status === "replied" ? "返信済み" : inq.status}
                          </Pill>
                          <p className="text-sm font-bold text-gray-900">{inq.subject}</p>
                        </div>
                        <p className="mb-3 text-xs text-gray-400">
                          {inq.name ? `${inq.name} · ` : ""}{inq.email}
                          {inq.user_id ? " · ログインユーザー" : ""}
                          {" · "}{inq.created_at.slice(0, 16).replace("T", " ")}
                        </p>
                        <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-gray-700">{inq.body}</p>
                        {inq.admin_reply && (
                          <div className="mt-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                            <p className="mb-1 text-[10px] font-bold text-emerald-700">運営からの返信</p>
                            <p className="whitespace-pre-wrap text-sm text-gray-700">{inq.admin_reply}</p>
                            {inq.replied_at && (
                              <p className="mt-2 text-[10px] text-gray-400">{inq.replied_at.slice(0, 16).replace("T", " ")}</p>
                            )}
                          </div>
                        )}
                      </div>
                      {isOpen && (
                        <div className="space-y-2 border-t border-gray-100 bg-slate-50/70 p-4">
                          <textarea
                            rows={3}
                            value={replyDrafts[inq.id] ?? ""}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                            placeholder="返信内容を入力..."
                            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleReplyInquiry(inq)}
                            disabled={loadingId === inq.id || !(replyDrafts[inq.id] ?? "").trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {loadingId === inq.id ? "送信中..." : "返信を送信（メール＋通知）"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════ 報告一覧 ══════ */}
        {tab === "reports" && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <SectionTitle icon={Flag} title="報告一覧" />
              <Segmented
                value={reportFilter}
                onChange={setReportFilter}
                options={[
                  { id: "pending", label: `未対応 (${pendingReports.length})` },
                  { id: "all", label: `すべて (${reports.length})` },
                ]}
              />
            </div>

            {visibleReports.length === 0 ? (
              <EmptyState icon={Flag} text={reportFilter === "pending" ? "未対応の報告はありません" : "報告はありません"} />
            ) : (
              <div className="space-y-3">
                {visibleReports.map(r => {
                  const rs = REPORT_STATUS[r.status] ?? REPORT_STATUS.pending;
                  const isPending = r.status === "pending";
                  return (
                    <div key={r.id} className={cn(CARD, "overflow-hidden", isPending && "ring-rose-200")}>
                      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", isPending ? "bg-rose-50" : "bg-slate-50")}>
                          <Flag className={cn("h-5 w-5", isPending ? "text-rose-500" : "text-gray-400")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <AppNum n={r.product.appNumber} />
                            <Link href={`/apps/${r.product.id}`} target="_blank"
                              className="flex items-center gap-1 text-sm font-bold text-gray-800 hover:text-emerald-700">
                              {r.product.title}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                            <Pill cls={rs.cls}>{rs.label}</Pill>
                          </div>
                          <p className="mb-0.5 text-sm font-semibold text-gray-700">理由：{r.reason}</p>
                          {r.detail && <p className="text-xs leading-relaxed text-gray-500">{r.detail}</p>}
                          <p className="mt-1 text-[10px] text-gray-400">
                            {r.createdAt.slice(0, 10)} {r.reporterId ? `（報告者ID: ${r.reporterId.slice(0, 8)}…）` : "（匿名）"}
                          </p>
                        </div>
                        {isPending && (
                          <div className="flex shrink-0 gap-2">
                            <button onClick={() => handleReportAction(r.id, "resolved")} disabled={loadingId === r.id}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 disabled:opacity-50 sm:flex-none">
                              <CheckCircle2 className="h-3.5 w-3.5" />対応済み
                            </button>
                            <button onClick={() => handleReportAction(r.id, "dismissed")} disabled={loadingId === r.id}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:flex-none">
                              <X className="h-3.5 w-3.5" />却下
                            </button>
                          </div>
                        )}
                      </div>
                      {isPending && (
                        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 bg-slate-50/70 px-5 py-3">
                          <p className="text-[11px] text-gray-400">このアプリを対処：</p>
                          <Link href={`/apps/${r.product.id}`} target="_blank"
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">
                            アプリページを開く <ExternalLink className="h-3 w-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              const p = products.find((x) => x.id === r.product.id);
                              if (p) void handleViewCode(p);
                            }}
                            disabled={!products.some((x) => x.id === r.product.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:underline disabled:opacity-40"
                          >
                            <Code2 className="h-3 w-3" />コードを見る
                          </button>
                          <button
                            type="button"
                            onClick={() => handleForceDeleteReported(r)}
                            disabled={loadingId === r.product.id}
                            className="ml-auto flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200 transition-colors hover:bg-rose-50 disabled:opacity-50">
                            <Trash2 className="h-3 w-3" />アプリを強制削除
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════ ユーザー管理 ══════ */}
        {tab === "users" && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <SectionTitle icon={Users} title="ユーザー管理">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-gray-500 ring-1 ring-black/5">{filteredUsers.length} 人</span>
              </SectionTitle>
              <SearchBox value={userSearch} onChange={setUserSearch} placeholder="名前・メール・ユーザーIDで検索" />
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState icon={Users} text={userSearch ? "該当するユーザーが見つかりません" : "ユーザーデータがありません"} />
            ) : (
              <ul className="space-y-2.5">
                {filteredUsers.map(u => (
                  <li key={u.id} className={cn(CARD, "p-4")}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-black/5" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-xs font-bold text-emerald-700">
                            {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-800">{u.name ?? "（名前なし）"}</p>
                          <p className="truncate text-xs text-gray-500">{u.email}</p>
                          <p className="font-mono text-[10px] text-gray-300">{u.id.slice(0, 12)}…</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-center text-[11px] text-gray-400 md:w-56 md:justify-end">
                        <div><p className="text-sm font-black text-gray-800">{u.productCount}</p>出品</div>
                        <div><p className="text-sm font-black text-gray-800">{u.purchaseCount}</p>取得</div>
                        <div><p className="text-xs font-bold text-gray-600">{u.createdAt}</p>登録日</div>
                      </div>
                      <div className="flex gap-1.5 md:shrink-0">
                        <button
                          type="button"
                          onClick={() => openMessage(u)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-200 transition-colors hover:bg-sky-100 md:flex-none"
                        >
                          <Send className="h-3.5 w-3.5" />
                          メッセージ
                        </button>
                        <button onClick={() => handleDeleteUser(u)} disabled={loadingId === u.id}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-600 ring-1 ring-rose-200 transition-colors hover:bg-rose-50 disabled:opacity-50 md:flex-none">
                          {loadingId === u.id
                            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                            : <UserX className="h-3.5 w-3.5" />}
                          強制退会
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

      </main>

      {/* ══════ メッセージ送信 ══════ */}
      {messageTarget && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setMessageTarget(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="flex items-center gap-1.5 text-base font-black text-gray-900">
                <Send className="h-4 w-4 text-sky-600" />
                ユーザーにメッセージ送信
              </h3>
              <button type="button" onClick={() => setMessageTarget(null)} aria-label="閉じる" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-gray-500">
                宛先: <span className="font-bold text-gray-700">{messageTarget.name ?? "（名前なし）"}</span> · {messageTarget.email}
              </p>
              <div className="mb-4 flex gap-2">
                {([
                  { id: "bell" as const, label: "通知ベル", icon: Bell },
                  { id: "email" as const, label: "メール", icon: Mail },
                  { id: "both" as const, label: "両方", icon: Send },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMessageChannel(id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-bold ring-1 transition-colors",
                      messageChannel === id
                        ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500"
                        : "bg-white text-gray-500 ring-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="件名"
                className="mb-3 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
              <textarea
                rows={5}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="メッセージ本文"
                className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
              <button
                type="button"
                onClick={handleSendUserMessage}
                disabled={loadingId === messageTarget.id}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
              >
                {loadingId === messageTarget.id ? "送信中..." : "送信する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ ソースコード ══════ */}
      {codeTarget && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeCode}>
          <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                <Code2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <AppNum n={codeTarget.appNumber} />
                  <span className="text-[11px] font-bold text-gray-400">ソースコード（管理者閲覧）</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-black text-gray-900">{codeData?.title ?? codeTarget.title}</p>
              </div>
              <Link href={`/apps/${codeTarget.id}`} target="_blank" title="アプリを開く"
                className="hidden h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 sm:flex">
                アプリを開く <ExternalLink className="h-3 w-3" />
              </Link>
              <button type="button" onClick={closeCode} aria-label="閉じる" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {!codeData ? (
              <div className="flex justify-center py-20">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* コピー・保存 */}
                <div className="flex flex-col gap-2 border-b border-gray-100 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center">
                  <p className="flex-1 text-[11px] leading-relaxed text-gray-500">
                    {codeData.css_code.trim() || codeData.js_code.trim()
                      ? "HTML・CSS・JS を 1 つのファイルにまとめて、コピー・保存します。"
                      : `全 ${fullCode.split("\n").length.toLocaleString()} 行 · ${fullCode.length.toLocaleString()} 文字`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      disabled={!fullCode}
                      className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 sm:flex-none sm:px-4"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      コードを一括コピー
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCode}
                      disabled={!fullCode}
                      className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50 sm:flex-none sm:px-4"
                    >
                      <Download className="h-3.5 w-3.5" />
                      テキストファイルで保存
                    </button>
                  </div>
                </div>

                {(codeData.css_code.trim() || codeData.js_code.trim()) && (
                  <div className="flex gap-1 px-5 pt-3">
                    {(["html", "css", "js"] as const).map((t) => {
                      const src = t === "html" ? codeData.html_code : t === "css" ? codeData.css_code : codeData.js_code;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCodeTab(t)}
                          className={cn(
                            "rounded-t-lg px-4 py-2 text-xs font-bold uppercase",
                            codeTab === t ? "bg-slate-900 text-white" : "text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          {t}
                          <span className="ml-1 text-[10px] font-semibold normal-case opacity-60">{src.trim() ? `${src.split("\n").length}行` : "空"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <pre className="min-h-[240px] flex-1 overflow-auto bg-slate-950 p-4 text-xs leading-relaxed text-emerald-100">
                  <code>{(codeTab === "html" ? codeData.html_code : codeTab === "css" ? codeData.css_code : codeData.js_code) || "（空）"}</code>
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
