"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Search,
  Bell,
  User,
  Heart,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  Code2,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Lock,
  UserPlus,
  Search as SearchIcon,
  MessageSquarePlus,
  MessageSquare,
  Wrench,
  MessagesSquare,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Gamepad2,
  ChevronRight,
  Terminal,
  LibraryBig,
  LogIn,
  ThumbsUp,
  Send,
  MessageCirclePlus,
  Crown,
  Menu,
  X,
  Package,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";

// ─── 通知データ（将来的にAPIから取得）───
const NOTIFICATIONS: { id: number; Icon: React.ComponentType<{ className?: string }>; iconBg: string; iconColor: string; text: string; href: string; time: string }[] = [];

// ─── モーダル用共通アプリ型 ───
type ModalApp = {
  id: string | number;
  name: string;
  description: string;
  creator: string;
  rating: number;
  reviews: number;
  category: string;
  gradient: string;
  emoji?: string;
};

// ─── スタンプ定義 ───
const STAMPS = [
  { id: "like",    emoji: "👍", label: "いいね！" },
  { id: "genius",  emoji: "🧠", label: "天才！" },
  { id: "useful",  emoji: "⚡", label: "便利！" },
  { id: "design",  emoji: "🎨", label: "デザインが好き！" },
] as const;
type StampId = typeof STAMPS[number]["id"];

// ─── アプリ詳細モーダル ───
function AppDetailModal({
  app,
  onClose,
}: {
  app: ModalApp;
  onClose: () => void;
}) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;
  const router = useRouter();

  const [libState, setLibState] = useState<"idle" | "loading" | "done" | "login_required">("idle");

  // ─ スタンプ状態（localStorageで管理）
  const storageKey = `jisapp_stamps_${app.id}`;
  const [myStamps, setMyStamps] = useState<StampId[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { return []; }
  });
  const [stampCounts, setStampCounts] = useState<Record<StampId, number>>({ like: 0, genius: 0, useful: 0, design: 0 });

  // スタンプ数をAPIから取得
  useEffect(() => {
    fetch(`/api/apps/${app.id}/stamps`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.counts) setStampCounts(data.counts); })
      .catch(() => {});
  }, [app.id]);

  const handleStamp = useCallback(async (stampId: StampId) => {
    const isOn = myStamps.includes(stampId);
    const next = isOn
      ? myStamps.filter(s => s !== stampId)
      : [...myStamps, stampId];
    setMyStamps(next);
    localStorage.setItem(storageKey, JSON.stringify(next));

    // カウント楽観的更新
    setStampCounts(prev => ({
      ...prev,
      [stampId]: Math.max(0, (prev[stampId] ?? 0) + (isOn ? -1 : 1)),
    }));

    // APIへ送信（fire-and-forget）
    fetch(`/api/apps/${app.id}/stamps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stampId, action: isOn ? "remove" : "add" }),
    }).catch(() => {});
  }, [myStamps, app.id, storageKey]);

  // ─ リクエスト状態
  const [requestText, setRequestText] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "loading" | "done">("idle");

  const handleRequest = useCallback(async () => {
    if (!requestText.trim()) return;
    setRequestState("loading");
    try {
      const res = await fetch(`/api/apps/${app.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestText.trim().slice(0, 300) }),
      });
      if (!res.ok) throw new Error("送信失敗");
      setRequestState("done");
      setRequestText("");
    } catch {
      setRequestState("idle");
    }
  }, [requestText, app.id]);

  // ─ ライブラリ追加
  const handleAddLibrary = useCallback(async () => {
    if (!isLoggedIn) { setLibState("login_required"); return; }
    setLibState("loading");
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: String(app.id),
          name: app.name,
          category: app.category,
          gradient: app.gradient,
        }),
      });
      if (!res.ok) throw new Error();
      setLibState("done");
    } catch {
      setLibState("idle");
    }
  }, [isLoggedIn, app]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-y-auto max-h-[90dvh] rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* サムネ（拡大） */}
        <div className="relative">
          <MiniPreview
            id={app.id}
            fallbackGradient={app.gradient}
            fallbackEmoji={app.emoji}
            height={180}
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* アプリ情報 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              {app.category && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                  {app.category}
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-gray-900">{app.name}</h2>
            <p className="mt-0.5 text-xs text-gray-400">by {app.creator}</p>
            {app.description && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">{app.description}</p>
            )}
          </div>

          {/* ─── 応援バッジ ─── */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-800">応援バッジを送る</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STAMPS.map(({ id, emoji, label }) => {
                const active = myStamps.includes(id);
                const count = stampCounts[id] ?? 0;
                return (
                  <button
                    key={id}
                    onClick={() => handleStamp(id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all active:scale-95",
                      active
                        ? "border-emerald-400 bg-emerald-100 text-emerald-800 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
                    )}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="flex-1 text-left text-xs">{label}</span>
                    {count > 0 && (
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                        active ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── リクエスト機能 ─── */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCirclePlus className="h-4 w-4 text-violet-600" />
              <p className="text-xs font-bold text-violet-800">こうなったらもっと最高！</p>
            </div>
            <p className="text-[11px] text-violet-600 mb-3">
              改善リクエストを作者に届けよう。批判じゃなく「期待」として受け取ってもらえます。
            </p>
            {requestState === "done" ? (
              <div className="flex items-center gap-2 rounded-xl bg-violet-100 px-3 py-2.5 text-xs font-bold text-violet-700">
                <CheckCircle2 className="h-4 w-4" />
                リクエストを送りました！ありがとうございます🙌
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={requestText}
                  onChange={e => setRequestText(e.target.value)}
                  placeholder="例：ダークモードがあると最高！"
                  className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs placeholder:text-gray-300 focus:border-violet-400 focus:outline-none"
                  onKeyDown={e => { if (e.key === "Enter") handleRequest(); }}
                />
                <button
                  onClick={handleRequest}
                  disabled={!requestText.trim() || requestState === "loading"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {requestState === "loading"
                    ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <Send className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            )}
          </div>

          {/* 未ログイン注意書き */}
          {!isLoggedIn && status !== "loading" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-0.5">⚠️ ログインせずにご利用の場合</p>
              <p>
                アプリは使えますが、データの保存はお使いのブラウザにのみ保存されます。
                ブラウザデータを削除すると消えることがあります。
                <Link href="/login" className="font-bold underline ml-1">ログイン</Link>するとクラウドに安全に保存されます。
              </p>
            </div>
          )}

          {/* ライブラリ追加後 → ホーム画面への追加を促す */}
          {libState === "done" && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-800 leading-relaxed">
              <p className="font-bold mb-1">📱 ホーム画面に追加しよう！</p>
              <p>ブラウザの「共有」→「ホーム画面に追加」でアプリのように起動できます。</p>
            </div>
          )}

          {/* ログイン案内（ライブラリ追加試行時） */}
          {libState === "login_required" && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <LogIn className="h-4 w-4 shrink-0" />
              <span>マイライブラリへの追加には<Link href="/login" className="font-bold underline ml-1">ログイン</Link>が必要です</span>
            </div>
          )}

          {/* ボタン群 */}
          <div className="space-y-2 pb-2">
            <button
              onClick={() => router.push(`/apps/${app.id}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              アプリを開く
            </button>

            {libState === "done" ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-200 py-3 text-sm font-bold text-teal-700">
                <CheckCircle2 className="h-4 w-4" />
                マイライブラリに追加済み ✓
              </div>
            ) : (
              <button
                onClick={handleAddLibrary}
                disabled={libState === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 py-3 text-sm font-bold text-teal-700 hover:bg-teal-100 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {libState === "loading" ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                ) : (
                  <LibraryBig className="h-4 w-4" />
                )}
                マイライブラリに追加
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── チャットルーム型 ───
type ChatRoom = {
  id: string;
  title: string;
  budget?: string;
  status?: string;
  lastMessage?: string;
};

// ─── ヘッダー ───
function SiteHeader({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  const router = useRouter();

  // 通知
  const [showNotif, setShowNotif] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // ハンバーガーメニュー
  const [showMenu, setShowMenu] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  // お気に入りモーダル
  const [showFavModal, setShowFavModal]       = useState(false);
  const [favApps, setFavApps]                 = useState<Array<{ id: string | number; name: string; price: number; gradient?: string; category?: string }>>([]);

  // フォロー中クリエイターモーダル
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followedList, setFollowedList]       = useState<Array<{ id: number; name: string; handle: string; avatar: string; color: string }>>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // 外側クリックで通知を閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // メニューを開いたときにチャット一覧を読み込む
  useEffect(() => {
    if (!showMenu) return;
    try {
      const rooms: ChatRoom[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("jisapp_chatroom_")) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            const chatId = key.replace("jisapp_chatroom_", "");
            rooms.push({
              id: chatId,
              title: data.title ?? "チャット",
              budget: data.budget,
              status: data.status ?? "相談中",
              lastMessage: data.lastMessage,
            });
          }
        }
      }
      setChatRooms(rooms);
    } catch {
      setChatRooms([]);
    }
  }, [showMenu]);

  // ESCキーでメニューを閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu(false);
        setShowNotif(false);
        setShowFavModal(false);
        setShowFollowModal(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // メニュー表示時にスクロールを止める
  useEffect(() => {
    document.body.style.overflow = showMenu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const closeMenu = () => setShowMenu(false);

  const openFavModal = () => {
    try {
      const savedIds: string[] = JSON.parse(localStorage.getItem("jisapp_saved_apps") ?? "[]");
      const listings: Array<{ id: number | string; name: string; priceNum?: number; category?: string; gradient?: string }> =
        JSON.parse(localStorage.getItem("jisapp_listings") ?? "[]");
      const apps = listings.map((l) => ({ id: l.id, name: l.name, price: l.priceNum ?? 0, category: l.category, gradient: l.gradient }));
      setFavApps(apps.filter((a) => savedIds.includes(String(a.id))));
    } catch { setFavApps([]); }
    setShowMenu(false);
    setShowFavModal(true);
  };

  const openFollowModal = () => {
    setFollowedList([]);
    setShowMenu(false);
    setShowFollowModal(true);
  };

  const statusColor = (s?: string) => {
    if (s === "完了") return "bg-gray-100 text-gray-500";
    if (s === "納品済み") return "bg-blue-50 text-blue-600";
    if (s === "開発中") return "bg-amber-50 text-amber-700";
    return "bg-emerald-50 text-emerald-700";
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4">

          {/* 上段：メニュー ｜ ロゴ（中央） ｜ 通知・マイページ */}
          <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3">
            <button
              onClick={() => setShowMenu(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
              aria-label="メニューを開く"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex justify-center">
              <JisappLogo href="/" size="lg" className="drop-shadow-sm" />
            </div>

            <div className="flex items-center justify-end gap-2">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif((v) => !v)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <Bell className="h-4 w-4" />
                {hasUnread && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-10 z-[100] w-80 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10 sm:w-96">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-black text-gray-900">お知らせ</span>
                      {hasUnread && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {NOTIFICATIONS.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setHasUnread(false)}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      すべて既読にする
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto">
                    {NOTIFICATIONS.map((n, i) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setShowNotif(false)}
                        className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                          i < NOTIFICATIONS.length - 1 ? "border-b border-gray-50" : ""
                        } ${hasUnread && i < 4 ? "bg-blue-50/30" : ""}`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${n.iconBg}`}>
                          <n.Icon className={`h-4 w-4 ${n.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed text-gray-700 line-clamp-2">{n.text}</p>
                          <p className="mt-1 text-[10px] text-gray-400">{n.time}</p>
                        </div>
                        {hasUnread && i < 4 && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                    <Link
                      href="/mypage"
                      onClick={() => setShowNotif(false)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      すべての通知を見る →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/mypage"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
            >
              <User className="h-4 w-4" />
            </Link>
            </div>
          </div>

          {/* 下段：検索バー + アプリを作るボタン */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 pb-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="アプリを検索..."
                className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <button
              type="submit"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-xs font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-200 active:scale-[0.97]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">検索</span>
            </button>
            <Link
              href="/playground"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.97]"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>作る</span>
            </Link>
          </form>
        </div>
      </header>

      {/* ─── ハンバーガーメニュー オーバーレイ ─── */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* ─── ドロワー本体（左側スライドイン） ─── */}
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 z-[210] flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          showMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* ドロワーヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <JisappLogo href="/" onClick={closeMenu} />
          <button
            onClick={closeMenu}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* スクロールコンテンツ */}
        <div className="flex-1 overflow-y-auto">

          {/* メインナビ */}
          <nav className="px-3 pt-4 pb-2">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">メインメニュー</p>
            {([
              { icon: <Search className="h-4 w-4" />,      label: "アプリを探す",       href: "/search",    bg: "bg-emerald-50 text-emerald-600" },
              { icon: <Terminal className="h-4 w-4" />,    label: "アプリを開発する",   href: "/playground",bg: "bg-violet-50 text-violet-600"   },
              { icon: <Package className="h-4 w-4" />,     label: "マイプロジェクト",   href: "/projects",  bg: "bg-violet-50 text-violet-600"   },
              { icon: <BookOpen className="h-4 w-4" />,    label: "入手したアプリ",     href: "/library",   bg: "bg-teal-50 text-teal-600"       },
              { icon: <Wrench className="h-4 w-4" />,      label: "開発依頼掲示板",     href: "/requests",  bg: "bg-amber-50 text-amber-600"     },
              { icon: <User className="h-4 w-4" />,        label: "マイページ",         href: "/mypage",    bg: "bg-blue-50 text-blue-600"       },
            ] as { icon: React.ReactNode; label: string; href: string; bg: string }[]).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                  {item.icon}
                </span>
                {item.label}
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
              </Link>
            ))}

            {/* お気に入り（モーダル） */}
            <button
              onClick={openFavModal}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <Heart className="h-4 w-4" />
              </span>
              お気に入り
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
            </button>

            {/* フォロー中のクリエイター（モーダル） */}
            <button
              onClick={openFollowModal}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Users className="h-4 w-4" />
              </span>
              フォロー中のクリエイター
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
            </button>
          </nav>

          <div className="mx-5 h-px bg-gray-100" />

          {/* 進行中のチャット */}
          <div className="px-3 py-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">進行中のチャット</p>
              <Link href="/requests" onClick={closeMenu} className="text-[10px] font-semibold text-emerald-600 hover:underline">
                すべて →
              </Link>
            </div>

            {chatRooms.length > 0 ? (
              <div className="space-y-1">
                {chatRooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/chat/${room.id}`}
                    onClick={closeMenu}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{room.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(room.status)}`}>
                          {room.status ?? "相談中"}
                        </span>
                        {room.budget && <span className="text-[10px] text-gray-400">{room.budget}</span>}
                      </div>
                    </div>
                    <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 py-6 text-center">
                <MessagesSquare className="h-7 w-7 text-gray-300" />
                <p className="text-xs text-gray-400">進行中のチャットはありません</p>
                <Link
                  href="/requests"
                  onClick={closeMenu}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  依頼掲示板を見る →
                </Link>
              </div>
            )}
          </div>

          <div className="mx-5 h-px bg-gray-100" />

          {/* クリエイター / カテゴリ */}
          <nav className="px-3 py-3">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">カテゴリ・探索</p>
            {[
              { label: "生産性ツール",           href: "/search?category=生産性"     },
              { label: "業務効率化",             href: "/search?category=業務効率化" },
              { label: "SNS運用",                href: "/search?category=SNS運用"    },
              { label: "🎮 個人開発のゲーム",    href: "/search?category=ゲーム"     },
              { label: "無料アプリ",             href: "/search?filter=free"         },
              { label: "みんなのリクエスト",     href: "/requests"                   },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </Link>
            ))}
          </nav>

          <div className="mx-5 h-px bg-gray-100" />

          {/* ヘルプ */}
          <nav className="px-3 py-3 pb-8">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">サポート</p>
            <Link
              href="/playground"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                <HelpCircle className="h-4 w-4" />
              </span>
              使い方・プレイグラウンドへ
            </Link>
            <Link
              href="/terms"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                <BookOpen className="h-4 w-4" />
              </span>
              利用規約・プライバシー
            </Link>
          </nav>
        </div>

        {/* ドロワーフッター */}
        <div className="border-t border-gray-100 px-5 py-4">
          <Link
            href="/playground"
            onClick={closeMenu}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
          >
            <Terminal className="h-4 w-4" />
            アプリを作る
          </Link>
        </div>
      </div>

      {/* ─── お気に入りモーダル ─── */}
      {showFavModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowFavModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-[fadeInScale_0.2s_ease-out]"
            style={{ animation: "fadeInScale 0.2s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                  <Heart className="h-4 w-4 text-rose-500" />
                </span>
                <h2 className="text-base font-black text-gray-900">お気に入り</h2>
              </div>
              <button
                onClick={() => setShowFavModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {favApps.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Heart className="h-10 w-10 text-gray-200" />
                <p className="text-sm text-gray-400">お気に入りがまだありません</p>
                <Link
                  href="/search"
                  onClick={() => setShowFavModal(false)}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  アプリを探す →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {favApps.map((app) => (
                  <Link
                    key={String(app.id)}
                    href={`/apps/${app.id}`}
                    onClick={() => setShowFavModal(false)}
                    className="flex items-center gap-3 rounded-2xl hover:bg-gray-50 p-2 transition-colors group"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient ?? "from-emerald-500 to-green-600"}`}>
                      <Heart className="h-5 w-5 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate group-hover:text-emerald-600 transition-colors">{app.name}</p>
                      <p className="text-xs text-gray-400">
                        <span className="font-semibold text-emerald-600">FREE</span>
                        {app.category && <span className="ml-1">· {app.category}</span>}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── フォロー中クリエイターモーダル ─── */}
      {showFollowModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowFollowModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            style={{ animation: "fadeInScale 0.2s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <Users className="h-4 w-4 text-violet-600" />
                </span>
                <h2 className="text-base font-black text-gray-900">フォロー中のクリエイター</h2>
              </div>
              <button
                onClick={() => setShowFollowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {followedList.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Users className="h-10 w-10 text-gray-200" />
                <p className="text-sm text-gray-400">フォロー中のクリエイターがいません</p>
                <Link
                  href="/#creators"
                  onClick={() => setShowFollowModal(false)}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  クリエイターを探す →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {followedList.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/creators/${creator.id}`}
                    onClick={() => setShowFollowModal(false)}
                    className="flex items-center gap-3 rounded-2xl hover:bg-gray-50 p-2 transition-colors group"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${creator.color} text-white text-sm font-black`}>
                      {creator.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 group-hover:text-violet-600 transition-colors">{creator.name}</p>
                      <p className="text-xs text-gray-400">{creator.handle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── セクションヘッダー ───
function SectionHeader({ icon, title, sub, href }: { icon: React.ReactNode; title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h2 className="text-lg font-black text-gray-900">{title}</h2>
        </div>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
          すべて見る <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── ミニプレビュー（iframeサムネイル） ───
function MiniPreview({
  id,
  fallbackGradient,
  fallbackEmoji,
  height = 120,
}: {
  id: string | number;
  fallbackGradient: string;
  fallbackEmoji?: string;
  height?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [errored, setErrored] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-gray-950"
      style={{ height: `${height}px` }}
    >
      {/* ブラウザ風クロームバー */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1 bg-gray-900 px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500/70" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
        <span className="h-2 w-2 rounded-full bg-green-500/70" />
        <div className="mx-2 h-3.5 flex-1 rounded-sm bg-gray-700/60 text-[9px] text-gray-500 flex items-center px-1.5 truncate">
          {String(id).slice(0, 8)}…
        </div>
      </div>

      {/* フォールバック（読み込み中 or エラー時） */}
      {(!loaded || errored) && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${fallbackGradient} opacity-75`}
          style={{ top: "26px" }}
        >
          {fallbackEmoji && (
            <span className="text-3xl drop-shadow">{fallbackEmoji}</span>
          )}
        </div>
      )}

      {/* iframe プレビュー */}
      {visible && !errored && (
        <div
          className="absolute overflow-hidden"
          style={{ top: "26px", left: 0, right: 0, bottom: 0 }}
        >
          <iframe
            src={`/api/apps/${id}/preview`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "500%",
              height: "470px",
              transform: "scale(0.2)",
              transformOrigin: "top left",
              pointerEvents: "none",
              border: "none",
            }}
            sandbox="allow-scripts"
            tabIndex={-1}
            aria-hidden
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        </div>
      )}
    </div>
  );
}

// ─── プレイグラウンドアプリカード ───
type PlaygroundApp = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  creator_name: string | null;
  created_at: string;
  stamp_count?: number;
};

type PopularCreator = {
  name: string;
  appCount: number;
  totalStamps: number;
  topApp: { id: string; title: string; category: string | null } | null;
};

function PlaygroundAppCard({ app, onSelect }: { app: PlaygroundApp; onSelect: (a: ModalApp) => void }) {
  const cat = app.category ? CATEGORY_MAP[app.category] : null;
  const gradient = cat?.gradient ?? "from-emerald-500 to-teal-600";
  const emoji    = cat?.emoji    ?? "✨";
  const tagColor = cat?.tagColor ?? "bg-gray-100 text-gray-500";
  const tagName  = cat ? `${cat.emoji} ${cat.name}` : null;

  const modalApp: ModalApp = {
    id: app.id,
    name: app.title,
    description: app.description ?? "",
    creator: app.creator_name ?? "匿名",
    rating: 5.0,
    reviews: 0,
    category: cat?.name ?? app.category ?? "",
    gradient,
    emoji,
  };

  return (
    <button
      onClick={() => onSelect(modalApp)}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all hover:shadow-md hover:ring-emerald-300 text-left w-full"
    >
      <MiniPreview id={app.id} fallbackGradient={gradient} fallbackEmoji={emoji} />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="font-bold text-sm text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1">
          {app.title}
        </p>
        {app.description && (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{app.description}</p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-1.5 flex-wrap">
          {tagName && (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tagColor}`}>
              {tagName}
            </span>
          )}
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 ml-auto">
            FREE
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── メインページ ───
export default function HomePage() {
  const [query,           setQuery]           = useState("");
  const [playgroundApps,  setPlaygroundApps]  = useState<PlaygroundApp[]>([]);
  const [popularMonth,    setPopularMonth]    = useState<PlaygroundApp[]>([]);
  const [popularCreators, setPopularCreators] = useState<PopularCreator[]>([]);
  const [loadingPG,       setLoadingPG]       = useState(true);
  const [pgCategoryFilter, setPgCategoryFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp]         = useState<ModalApp | null>(null);

  // APIからアプリ一覧を取得（Supabase apps テーブルに統一）
  useEffect(() => {
    async function fetchPlaygroundApps() {
      try {
        // 人気順で取得
        const res = await fetch("/api/apps?sort=popular&limit=50");
        const data = await res.json().catch(() => ({ apps: [] }));
        setPlaygroundApps(data.apps ?? []);
      } catch { /* noop */ } finally {
        setLoadingPG(false);
      }
    }

    async function fetchPopularMonth() {
      try {
        const res = await fetch("/api/apps/popular-month");
        const data = await res.json().catch(() => ({ apps: [] }));
        setPopularMonth(data.apps ?? []);
      } catch { /* noop */ }
    }

    async function fetchPopularCreators() {
      try {
        const res = await fetch("/api/creators/popular");
        const data = await res.json().catch(() => ({ creators: [] }));
        setPopularCreators(data.creators ?? []);
      } catch { /* noop */ }
    }

    fetchPlaygroundApps();
    fetchPopularMonth();
    fetchPopularCreators();
  }, []);

  // 人気順（応援バッジ数）でフィルタ済み
  const filteredPlaygroundApps = useMemo(() => {
    return playgroundApps.filter((a) => {
      const catMatch = pgCategoryFilter === "all" || a.category === pgCategoryFilter;
      const textMatch = !query || a.title.includes(query) || (a.description ?? "").includes(query);
      return catMatch && textMatch;
    });
  }, [playgroundApps, pgCategoryFilter, query]);

  // 新着順（同データを created_at 降順で再ソート）
  const newApps = useMemo(() =>
    [...playgroundApps]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter(a => !query || a.title.includes(query) || (a.description ?? "").includes(query)),
  [playgroundApps, query]);

  // ゲームカテゴリ（新着順）
  const gameApps = useMemo(() =>
    newApps.filter(a => a.category === "ゲーム"),
  [newApps]);

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <SiteHeader query={query} setQuery={setQuery} />

      {/* ─── ヒーロー ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 pb-16 pt-12">
        {/* 背景装飾 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-8 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">

          {/* 上部バッジ */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            ジサップ 開発スタジオ
          </div>

          {/* メインコピー */}
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            AIにコードを作ってもらって、<br className="hidden sm:block" />
            <span className="text-emerald-200">貼るだけでアプリが完成。</span>
          </h1>

          {/* サブコピー */}
          <p className="mt-4 text-base font-bold text-white/90 sm:text-lg">
            サーバー設定もデータベースも、むずかしい知識も一切不要。
          </p>

          {/* 説明文 */}
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
            使い慣れたAI（ChatGPT・Claude・Geminiなど）でコードを生成して、<br className="hidden sm:block" />
            プレイグラウンドに貼るだけ。初心者でも数分でアプリを公開できます。
          </p>

          {/* 安心バッジ */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              "✓ プログラミング知識不要",
              "✓ サーバー・DB設定ゼロ",
              "✓ 貼るだけで即公開",
              "✓ スマホ・タブレットからも開発できる",
            ].map((badge) => (
              <span key={badge} className="rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                {badge}
              </span>
            ))}
          </div>

          {/* CTAボタン */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {/* メイン：作る */}
            <Link
              href="/playground"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-emerald-700 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl active:scale-[0.98] sm:w-auto"
            >
              <Terminal className="h-4 w-4" />
              アプリを作る
            </Link>
            {/* サブ：依頼する */}
            <Link
              href="/requests"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98] sm:w-auto"
            >
              <MessageSquarePlus className="h-4 w-4" />
              開発依頼掲示板をみる
            </Link>
            {/* サブ2：マーケット */}
            <Link
              href="/search"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98] sm:w-auto"
            >
              <SearchIcon className="h-4 w-4" />
              みんなが作ったアプリをさがす
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 3ステップ ─── */}
      <div className="bg-white px-4 py-12 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 text-center text-sm font-bold uppercase tracking-widest text-emerald-600">How it works</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: <Sparkles className="h-6 w-6 text-emerald-600" />,
                title: "AIにアイデアを伝える",
                desc: "ChatGPT・Claude・Geminiなど、使い慣れたAIに「こんなアプリを作って」と送るだけ。コードが自動で生成されます。",
                color: "bg-emerald-50 border-emerald-100",
              },
              {
                step: "02",
                icon: <Code2 className="h-6 w-6 text-teal-600" />,
                title: "コードをコピーして貼る",
                desc: "生成されたコードをコピーして、ジサップのプレイグラウンドに貼り付けるだけ。サーバーもDBも設定不要です。",
                color: "bg-teal-50 border-teal-100",
              },
              {
                step: "03",
                icon: <Globe className="h-6 w-6 text-cyan-600" />,
                title: "即公開・シェア",
                desc: "コードを貼り付けたらすぐ公開。URLを発行してSNSやメッセージで友だちに共有できます。",
                color: "bg-cyan-50 border-cyan-100",
              },
            ].map(({ step, icon, title, desc, color }) => (
              <div key={step} className={`relative rounded-2xl border p-6 ${color}`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-4xl font-black text-gray-300 select-none leading-none">{step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                    {icon}
                  </div>
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
            >
              <Terminal className="h-4 w-4" />
              プレイグラウンドを開く
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <main id="browse" className="mx-auto max-w-6xl space-y-12 px-4 py-10">

        {/* ─── 今月の人気アプリ TOP5 ─── */}
        {popularMonth.length > 0 && (
          <section>
            <SectionHeader
              icon={<Crown className="h-5 w-5 text-amber-500" />}
              title="👑 今月の人気アプリ TOP5"
              sub="今月最も応援バッジをもらったアプリ"
            />
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {popularMonth.map((app, i) => {
                  const cat = app.category ? CATEGORY_MAP[app.category] : null;
                  const gradient = cat?.gradient ?? "from-emerald-500 to-teal-600";
                  const emoji    = cat?.emoji    ?? "✨";
                  const modalApp: ModalApp = {
                    id: app.id,
                    name: app.title,
                    description: app.description ?? "",
                    creator: app.creator_name ?? "匿名",
                    rating: 5.0,
                    reviews: app.stamp_count ?? 0,
                    category: cat?.name ?? app.category ?? "",
                    gradient,
                    emoji,
                  };
                  const rankColors = [
                    "bg-amber-400 text-amber-900",
                    "bg-gray-300 text-gray-700",
                    "bg-orange-300 text-orange-800",
                    "bg-gray-100 text-gray-600",
                    "bg-gray-100 text-gray-600",
                  ];
                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApp(modalApp)}
                      className="group relative shrink-0 w-40 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] hover:shadow-md hover:ring-emerald-300 transition-all text-left overflow-hidden"
                    >
                      {/* ランク */}
                      <div className={`absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${rankColors[i] ?? rankColors[4]}`}>
                        {i + 1}
                      </div>
                      <MiniPreview id={app.id} fallbackGradient={gradient} fallbackEmoji={emoji} height={96} />
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                          {app.title}
                        </p>
                        {(app.stamp_count ?? 0) > 0 && (
                          <p className="mt-1 text-[10px] text-emerald-600 font-semibold">
                            👍 {app.stamp_count}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── 人気クリエイター ─── */}
        {popularCreators.length > 0 && (
          <section>
            <SectionHeader
              icon={<Users className="h-5 w-5 text-blue-500" />}
              title="🌟 人気クリエイター"
              sub="たくさんのアプリを作った注目のユーザー"
            />
            <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {popularCreators.map((creator) => {
                const initial = creator.name[0]?.toUpperCase() ?? "?";
                const colors = [
                  "from-emerald-500 to-teal-600",
                  "from-violet-500 to-purple-600",
                  "from-rose-500 to-pink-600",
                  "from-amber-500 to-orange-600",
                  "from-blue-500 to-cyan-600",
                  "from-indigo-500 to-violet-600",
                  "from-teal-500 to-emerald-600",
                  "from-fuchsia-500 to-rose-600",
                ];
                const colorIdx = Math.abs(creator.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length;
                return (
                  <div
                    key={creator.name}
                    className="shrink-0 w-36 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 text-center"
                  >
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${colors[colorIdx]} text-2xl font-black text-white shadow-md`}>
                      {initial}
                    </div>
                    <p className="mt-2 text-sm font-black text-gray-900 truncate">{creator.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">アプリ {creator.appCount}本</p>
                    {creator.totalStamps > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600">{creator.totalStamps} バッジ</span>
                      </div>
                    )}
                    {creator.topApp && (
                      <button
                        onClick={() => {
                          const cat = creator.topApp!.category ? CATEGORY_MAP[creator.topApp!.category] : null;
                          setSelectedApp({
                            id: creator.topApp!.id,
                            name: creator.topApp!.title,
                            description: "",
                            creator: creator.name,
                            rating: 5.0,
                            reviews: 0,
                            category: cat?.name ?? creator.topApp!.category ?? "",
                            gradient: cat?.gradient ?? "from-emerald-500 to-teal-600",
                            emoji: cat?.emoji,
                          });
                        }}
                        className="mt-2 w-full rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors line-clamp-1"
                      >
                        {creator.topApp.title}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── プレイグラウンドアプリ（人気順） ─── */}
        <section>
          <SectionHeader
            icon={<Terminal className="h-5 w-5 text-violet-500" />}
            title="🛠️ みんなが作ったアプリ"
            sub="応援バッジが多い順 · プレイグラウンドで作成・公開"
            href="/search?source=playground"
          />
          {/* カテゴリフィルタータブ */}
          {!loadingPG && playgroundApps.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setPgCategoryFilter("all")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                  pgCategoryFilter === "all"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                )}
              >
                すべて
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setPgCategoryFilter(pgCategoryFilter === cat.id ? "all" : cat.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                    pgCategoryFilter === cat.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                  )}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          )}
          {loadingPG ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : filteredPlaygroundApps.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {filteredPlaygroundApps.map((app) => <PlaygroundAppCard key={app.id} app={app} onSelect={setSelectedApp} />)}
            </div>
          ) : playgroundApps.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-gray-500">まだ公開されたアプリがありません</p>
              <p className="mt-2 text-xs text-gray-400">プレイグラウンドでアプリを作って出品してみましょう！</p>
              <Link href="/playground" className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700">
                プレイグラウンドへ <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-gray-500">このカテゴリのアプリはまだありません</p>
            </div>
          )}
        </section>

        {/* ─── 新着・注目アプリ ─── */}
        <section>
          <SectionHeader
            icon={<Sparkles className="h-5 w-5 text-emerald-500" />}
            title="✨ 新着アプリ"
            sub="最近プレイグラウンドで公開された新しいアプリ"
            href="/search?sort=new"
          />
          {loadingPG ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : newApps.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {newApps.slice(0, 8).map((app) => <PlaygroundAppCard key={app.id} app={app} onSelect={setSelectedApp} />)}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-gray-500">
                {query ? `「${query}」に一致するアプリはありません` : "まだアプリが登録されていません"}
              </p>
              <p className="mt-2 text-xs text-gray-400">プレイグラウンドでアプリを作って公開してみましょう！</p>
              <Link href="/playground" className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                プレイグラウンドへ <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {/* ─── 個人開発ゲーム ─── */}
        {gameApps.length > 0 && (
          <section>
            <SectionHeader
              icon={<Gamepad2 className="h-5 w-5 text-violet-500" />}
              title="🎮 ゲームアプリ"
              sub="ジサップで作られた遊べるゲーム集。ブラウザひとつで今すぐプレイ！"
              href="/search?category=ゲーム"
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {gameApps.map((app) => <PlaygroundAppCard key={app.id} app={app} onSelect={setSelectedApp} />)}
            </div>
          </section>
        )}

        {/* ─── アプリリクエスト ─── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionHeader
              icon={<Heart className="h-5 w-5 text-rose-500" />}
              title="こんなアプリが欲しい！リクエスト"
              sub="作ってほしいアプリをリクエスト。ジサップユーザーがAIで作ってくれるかも"
              href="/requests"
            />
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-6 ring-1 ring-rose-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-gray-800 text-sm">「こんなゲームが欲しい」「こんなツールがあったら便利」</p>
                <p className="mt-1 text-xs text-gray-500">リクエストを投稿すると、他のジサップユーザーがAIで作って返信してくれます。</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href="/requests"
                  className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-600 transition-colors">
                  リクエストを見る <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 他の開発環境との違い ─── */}
        <section className="py-2">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">他の開発環境とここが違う</h2>
            <p className="mt-2 text-sm text-gray-500">むずかしい設定は一切なし。初心者が詰まるポイントをすべて取り除きました。</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: "72rem", margin: "0 auto" }}>
            {([
              {
                Icon: Zap,
                title: "サーバー設定ゼロ",
                desc: "VPS・クラウド・ドメイン取得など、一切不要。コードを貼った瞬間から動くアプリが手に入ります。Vercel や Heroku すら使いません。",
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                Icon: ShieldCheck,
                title: "データベース設定不要",
                desc: "MySQL・PostgreSQL・Firebaseなどのセットアップ知識は必要なし。ローカルストレージやAPIで完結するアプリならそのまま動きます。",
                bg: "bg-teal-50",
                iconColor: "text-teal-600",
              },
              {
                Icon: Code2,
                title: "AIが作ったコードをそのまま貼る",
                desc: "ChatGPT・Claude・Gemini が出力したコードを、npm install も環境構築も一切せずにそのままプレイグラウンドに貼るだけで完成。",
                bg: "bg-cyan-50",
                iconColor: "text-cyan-600",
              },
              {
                Icon: Globe,
                title: "スマホ・タブレットから開発できる",
                desc: "専用アプリのインストール不要。ブラウザさえあればどこからでも開発・公開が可能。電車の中でもカフェでもアプリが作れます。",
                bg: "bg-violet-50",
                iconColor: "text-violet-600",
              },
              {
                Icon: Lock,
                title: "ブラウザ完結で安心・安全",
                desc: "アプリはブラウザの sandbox 内で動作し、外部サーバーへの不正アクセスはできません。作る側も使う側も安心して利用できます。",
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                Icon: UserPlus,
                title: "作ったアプリをそのまま公開・シェア",
                desc: "完成したアプリはURLで誰でも使えます。マーケットに公開してみんなに使ってもらおう。",
                bg: "bg-rose-50",
                iconColor: "text-rose-600",
              },
            ] as { Icon: React.ComponentType<{ className?: string }>; title: string; desc: string; bg: string; iconColor: string }[]).map(({ Icon, title, desc, bg, iconColor }) => (
              <div key={title} className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <h3 className="mb-2 mt-4 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── スタジオCTAバナー ─── */}
        <section>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg shadow-emerald-700/30 sm:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Terminal className="h-4 w-4" />
                  初心者大歓迎
                </div>
                <h2 className="text-2xl font-black">今すぐ、あなたの最初のアプリを作ろう 🚀</h2>
                <p className="mt-1.5 text-sm text-white/70 max-w-md">
                  AIにアイデアを伝えてコードを生成 → プレイグラウンドに貼るだけ。サーバーもDBも設定不要です。
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  href="/playground"
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-emerald-700 shadow-md transition-all hover:bg-emerald-50 hover:shadow-lg active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  無料で作ってみる
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/search"
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
                >
                  <Search className="h-4 w-4" />
                  アプリを探す
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── フッター ─── */}
      <footer className="mt-4 border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <JisappLogo href="/" />
          <p className="text-xs text-gray-400">© 2026 ジサップ — AIコードを貼るだけの開発スタジオ</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="/mypage" className="hover:text-emerald-600">マイページ</Link>
            <Link href="/playground" className="hover:text-emerald-600">アプリを作る</Link>
          </div>
        </div>
      </footer>

      {/* ─── アプリ詳細モーダル ─── */}
      {selectedApp && (
        <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
}
