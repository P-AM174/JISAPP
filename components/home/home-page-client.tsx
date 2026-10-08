"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "@/lib/i18n/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, format, plural, pick } from "@/lib/i18n/config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession } from "next-auth/react";
import { JisappLogo, JisappLogoIcon } from "@/components/jisapp-logo";
import { OfficialSocialLinks } from "@/components/seo/official-social-links";
import {
  Search,
  Bell,
  User,
  Heart,
  TrendingUp,
  Users,
  Settings2,
  BadgeCheck,
  ArrowRight,
  Code2,
  Globe,
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
  CircleHelp,
  Gamepad2,
  LibraryBig,
  Pin,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Menu,
  X,
  Package,
  FolderOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CATEGORY_MAP, categoryName, visibleCategories } from "@/lib/categories";
import { showGames } from "@/lib/features";
import { sortLibrary, type LibraryEntry } from "@/lib/library/sort";
import { CategoryIcon } from "@/lib/category-icon";
import type { HomeCatalogData } from "@/lib/home/catalog";
import { AppDetailModal } from "@/components/app-catalog/app-detail-modal";
import { CatalogAppCard } from "@/components/app-catalog/catalog-app-card";
import { HeroCarousel } from "@/components/home/hero/hero-carousel";
import type { HeroSlidePublic } from "@/lib/hero/types";
import { MiniPreview } from "@/components/app-catalog/mini-preview";
import type { ModalApp } from "@/components/app-catalog/types";
import { displayCreatorName, getCreatorProfilePath } from "@/components/app-catalog/utils";

import { ContactFormModal } from "@/components/support/contact-form-modal";
import { CreatorAvatarContent } from "@/components/creator-avatar";

/** 依頼のステータスは日本語のまま保存するので、表示だけ訳す */
const REQUEST_STATUS_EN: Record<string, string> = { 完了: "Done", 納品済み: "Delivered", 開発中: "In progress", 相談中: "Discussing" };

type ChatRoom = {
  id: string;
  title: string;
  budget?: string;
  status?: string;
  lastMessage?: string;
};

type UserNotification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

// ─── ヘッダー ───
function SiteHeader({
  query,
  setQuery,
  onOpenContact,
}: {
  query: string;
  setQuery: (v: string) => void;
  onOpenContact: () => void;
}) {
  const router = useRouter();
  const { status } = useSession();
  const t = useT();
  const locale = useLocale();

  // 通知
  const [showNotif, setShowNotif] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
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

  useEffect(() => {
    if (status !== "authenticated") {
      setNotifications([]);
      setHasUnread(false);
      return;
    }
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { notifications: [], unreadCount: 0 }))
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setHasUnread((d.unreadCount ?? 0) > 0);
      })
      .catch(() => {
        setNotifications([]);
        setHasUnread(false);
      });
  }, [status]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setHasUnread(false);
    } catch {
      /* noop */
    }
  };

  const formatNotifTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      if (diff < 60000) return t("たった今", "just now");
      if (diff < 3600000) return format(t("{floor}分前", "{floor}m ago"), { floor: Math.floor(diff / 60000) });
      if (diff < 86400000) return format(t("{floor}時間前", "{floor}h ago"), { floor: Math.floor(diff / 3600000) });
      return d.toLocaleDateString(intlLocale(locale));
    } catch {
      return "";
    }
  };

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

  const statusLabel = (s?: string) => {
    const v = s ?? "相談中";
    const en = REQUEST_STATUS_EN[v];
    return en ? pick(locale, v, en) : v;
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
              aria-label={t("メニューを開く", "Open menu")}
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
                aria-label={t("お知らせ", "Notifications")}
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
                      <span className="text-sm font-black text-gray-900">{t("お知らせ", "Notifications")}</span>
                      {hasUnread && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {notifications.filter((n) => !n.isRead).length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      {t("すべて既読にする", "Mark all as read")}
                    </button>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-gray-400">{t("お知らせはありません", "No notifications yet")}</p>
                    ) : (
                      notifications.map((n, i) => (
                        <Link
                          key={n.id}
                          href={n.href ?? "/mypage"}
                          onClick={() => setShowNotif(false)}
                          className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                            i < notifications.length - 1 ? "border-b border-gray-50" : ""
                          } ${!n.isRead ? "bg-blue-50/30" : ""}`}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                            <Bell className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{n.title}</p>
                            <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">{n.body}</p>
                            <p className="mt-1 text-[10px] text-gray-400">{formatNotifTime(n.createdAt)}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                    <Link
                      href="/mypage"
                      onClick={() => setShowNotif(false)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      {t("すべての通知を見る →", "See all notifications →")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/projects"
              title={t("マイプロジェクト（自分が作ったアプリ）", "My projects (apps you made)")}
              aria-label={t("マイプロジェクト（自分が作ったアプリ）", "My projects (apps you made)")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
            >
              <FolderOpen className="h-4 w-4" />
            </Link>

            <LanguageSwitcher className="hidden sm:inline-flex" />

            <Link
              href="/mypage"
              aria-label={t("マイページ", "My page")}
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
                placeholder={t("アプリを検索...", "Search apps...")}
                className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <button
              type="submit"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-xs font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-200 active:scale-[0.97]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("検索", "Search")}</span>
            </button>
            <Link
              href="/playground"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-4 text-xs font-black text-white shadow-md shadow-emerald-200/50 transition-all hover:from-violet-700 hover:to-emerald-700 active:scale-[0.97] sm:h-10 sm:px-5 sm:text-sm"
            >
              <Terminal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{t("開発スタジオ", "Studio")}</span>
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
            aria-label={t("メニューを閉じる", "Close menu")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* スクロールコンテンツ */}
        <div className="flex-1 overflow-y-auto">

          {/* メインナビ */}
          <nav className="px-3 pt-4 pb-2">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("メインメニュー", "Menu")}</p>
            {([
              { icon: <Search className="h-4 w-4" />,      label: t("アプリを探す", "Browse apps"), href: "/search",    bg: "bg-emerald-50 text-emerald-600" },
              { icon: <Terminal className="h-4 w-4" />,    label: t("アプリ開発スタジオへ", "Open the Studio"), href: "/playground",bg: "bg-violet-600 text-white", highlight: true },
              { icon: <Package className="h-4 w-4" />,     label: t("自分の作ったアプリを見る", "Apps you made"), href: "/projects",  bg: "bg-violet-50 text-violet-600"   },
              { icon: <BookOpen className="h-4 w-4" />,    label: t("マイライブラリ", "My library"), href: "/library",   bg: "bg-teal-50 text-teal-600"       },
              { icon: <Wrench className="h-4 w-4" />,      label: t("開発依頼掲示板", "App requests"), href: "/requests",  bg: "bg-amber-50 text-amber-600"     },
              { icon: <User className="h-4 w-4" />,        label: t("マイページ", "My page"), href: "/mypage",    bg: "bg-blue-50 text-blue-600"       },
            ] as { icon: React.ReactNode; label: string; href: string; bg: string; highlight?: boolean }[]).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.highlight
                    ? "bg-gradient-to-r from-violet-600 to-emerald-600 text-white shadow-md shadow-emerald-200/40 hover:from-violet-700 hover:to-emerald-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.highlight ? "bg-white/20" : item.bg}`}>
                  {item.icon}
                </span>
                {item.label}
                <ChevronRight className={`ml-auto h-3.5 w-3.5 ${item.highlight ? "text-white/80" : "text-gray-300"}`} />
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
              {t("お気に入り", "Favorites")}
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
              {t("フォロー中のクリエイター", "Creators you follow")}
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
            </button>
          </nav>

          <div className="mx-5 h-px bg-gray-100" />

          {/* 進行中のチャット */}
          <div className="px-3 py-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("進行中のチャット", "Active chats")}</p>
              <Link href="/requests" onClick={closeMenu} className="text-[10px] font-semibold text-emerald-600 hover:underline">
                {t("すべて →", "All →")}
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
                          {statusLabel(room.status)}
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
                <p className="text-xs text-gray-400">{t("進行中のチャットはありません", "No active chats")}</p>
                <Link
                  href="/requests"
                  onClick={closeMenu}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  {t("依頼掲示板を見る →", "See app requests →")}
                </Link>
              </div>
            )}
          </div>

          <div className="mx-5 h-px bg-gray-100" />

          {/* クリエイター / カテゴリ */}
          <nav className="px-3 py-3">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("カテゴリ・探索", "Explore")}</p>
            {[
              { label: t("生産性ツール", "Productivity"), href: "/search?category=生産性" },
              { label: t("業務効率化", "Work efficiency"), href: "/search?category=業務効率化" },
              { label: t("SNS運用", "Social media"), href: "/search?category=SNS運用" },
              ...(showGames(locale) ? [{ label: t("個人開発のゲーム", "Indie games"), href: "/search?category=ゲーム" }] : []),
              { label: t("無料アプリ", "Free apps"), href: "/search?filter=free" },
              { label: t("みんなのリクエスト", "Community requests"), href: "/requests" },
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
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("サポート", "Support")}</p>
            <button
              type="button"
              onClick={() => { closeMenu(); onOpenContact(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MessageSquare className="h-4 w-4" />
              </span>
              {t("運営への問い合わせ", "Contact us")}
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-300" />
            </button>
            <Link
              href="/faq"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                <CircleHelp className="h-4 w-4" />
              </span>
              {t("よくある質問", "FAQ")}
            </Link>
            <Link
              href="/playground"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                <HelpCircle className="h-4 w-4" />
              </span>
              {t("使い方・開発スタジオへ", "How to use · Studio")}
            </Link>
            <Link
              href="/terms"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                <BookOpen className="h-4 w-4" />
              </span>
              {t("利用規約・プライバシー", "Terms & privacy")}
            </Link>
            <div className="px-3 pt-3">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>

        {/* ドロワーフッター */}
        <div className="border-t border-gray-100 px-5 py-4">
          <Link
            href="/playground"
            onClick={closeMenu}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-200/40 hover:from-violet-700 hover:to-emerald-700 transition-colors"
          >
            <Terminal className="h-4 w-4" />
            {t("アプリ開発スタジオへ", "Open the Studio")}
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
                <h2 className="text-base font-black text-gray-900">{t("お気に入り", "Favorites")}</h2>
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
                <p className="text-sm text-gray-400">{t("お気に入りがまだありません", "No favorites yet")}</p>
                <Link
                  href="/search"
                  onClick={() => setShowFavModal(false)}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  {t("アプリを探す →", "Browse apps →")}
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
                <h2 className="text-base font-black text-gray-900">{t("フォロー中のクリエイター", "Creators you follow")}</h2>
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
                <p className="text-sm text-gray-400">{t("フォロー中のクリエイターがいません", "You aren't following anyone yet")}</p>
                <Link
                  href="/#creators"
                  onClick={() => setShowFollowModal(false)}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  {t("クリエイターを探す →", "Find creators →")}
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
  const t = useT();
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
          {t("すべて見る", "See all")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function HomeQuickActions() {
  const t = useT();
  return (
    <div className="border-b border-gray-100 bg-gradient-to-b from-violet-50/70 to-white px-4 py-6 shadow-sm">
      <div className="mx-auto max-w-4xl">
        <div className="relative flex w-full flex-col items-stretch gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-emerald-600 to-teal-600 px-5 py-5 text-white shadow-xl shadow-emerald-300/40 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Terminal className="h-7 w-7" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{t("無料 · 登録不要で試せる", "Free · No sign-up needed to try")}</p>
              <p className="text-xl font-black sm:text-2xl">{t("アプリ開発スタジオへ", "Open the Studio")}</p>
              <p className="mt-0.5 text-sm text-white/85">{t("AIのコードを貼るだけで、すぐにアプリが完成", "Paste code from AI and your app is ready")}</p>
            </div>
          </div>
          <div className="relative flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">
            <Link
              href="/playground"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-black text-emerald-700 shadow-lg transition-colors hover:bg-emerald-50 active:scale-[0.98]"
            >
              {t("今すぐ作る", "Start making")}
              <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2} />
            </Link>
            <Link
              href="/projects"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-[0.98]"
            >
              <FolderOpen className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="flex flex-col items-start leading-tight">
                <span>{t("自分が作ったアプリを見る", "Apps you made")}</span>
                <span className="text-[10px] font-semibold text-white/70">{t("マイプロジェクト", "My projects")}</span>
              </span>
            </Link>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:mx-auto sm:max-w-3xl">
          <Link
            href="/requests"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-[0.98]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {t("開発依頼掲示板をみる", "See app requests")}
          </Link>
          <Link
            href="/search"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-bold text-gray-800 transition-all hover:bg-gray-100 active:scale-[0.98]"
          >
            <SearchIcon className="h-4 w-4" />
            {t("みんなが作ったアプリをさがす", "Explore apps from the community")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * トップページのマイライブラリ（1行）。ピン留めを先に、残りは最近開いた順。
 * スマホは横にスクロールして全件、PC は1行に入る分だけ出して「すべて見る」でマイライブラリへ
 */
function HomeLibrarySection() {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    if (status === "loading") return;
    if (!isLoggedIn) {
      setLibrary([]);
      return;
    }
    setLoading(true);
    fetch("/api/library")
      .then((r) => (r.ok ? r.json() : { library: [] }))
      .then((json) => setLibrary(json.library ?? []))
      .catch(() => setLibrary([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, status]);

  const ordered = useMemo(() => sortLibrary(library, "recent"), [library]);

  if (!isLoggedIn || loading || library.length === 0) return null;

  const getGradient = (entry: LibraryEntry) => {
    if (entry.gradient) return entry.gradient;
    if (entry.category) return CATEGORY_MAP[entry.category]?.gradient ?? "from-emerald-500 to-teal-600";
    return "from-emerald-500 to-teal-600";
  };

  return (
    <section className="border-b border-emerald-100/80 bg-emerald-50/50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          icon={<LibraryBig className="h-5 w-5 text-teal-600" />}
          title={t("マイライブラリ", "My library")}
          sub={t("ピン留めと、最近開いたアプリ", "Pinned and recently opened apps")}
          href="/library"
        />
        {/* スマホ：横スクロール。PC：1行目だけ見せ、入りきらない分は隠す（2行目以降の高さを0にする） */}
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:auto-rows-[0] sm:grid-cols-4 sm:grid-rows-[auto] sm:gap-x-3 sm:gap-y-0 sm:overflow-hidden sm:px-0 sm:pb-0 md:grid-cols-5 lg:grid-cols-6">
          {ordered.map((entry) => {
            const gradient = getGradient(entry);
            return (
              <Link
                key={entry.appId}
                href={`/apps/${entry.appId}`}
                className="group relative flex w-36 shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all hover:shadow-md hover:ring-emerald-300 sm:w-auto"
              >
                <MiniPreview
                  id={entry.appId}
                  fallbackGradient={gradient}
                  fallbackCategoryId={entry.category}
                  height={88}
                />
                {entry.pinnedAt && (
                  <span className="absolute left-1.5 top-7 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow" title={t("ピン留め中", "Pinned")}>
                    <Pin className="h-3 w-3" />
                  </span>
                )}
                <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">
                    {entry.name ?? t("アプリ", "App")}
                  </p>
                  {entry.category && (
                    <p className="text-[10px] font-semibold text-gray-400">
                      {categoryName(entry.category, locale)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── メインページ ───
export function HomePageClient({
  initialData,
  heroSlides,
  aboutIntro,
}: {
  initialData: HomeCatalogData;
  heroSlides: HeroSlidePublic[];
  aboutIntro?: React.ReactNode;
}) {
  const [query,           setQuery]           = useState("");
  const [showContact,     setShowContact]     = useState(false);
  // メールなどから https://jisapp.app/?contact=1 で来たら、問い合わせフォームを開く
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("contact") === "1") setShowContact(true);
  }, []);
  const t = useT();
  const locale = useLocale();
  // ベトナム語ページでは、フラグがオンになるまでゲームを出さない（lib/features.ts）
  const gamesVisible = showGames(locale);
  const categories = visibleCategories(locale);
  const { popularCreators } = initialData;
  const withoutGames = <T extends { category?: string | null }>(apps: T[]) =>
    gamesVisible ? apps : apps.filter((a) => a.category !== "games" && a.category !== "ゲーム");
  const playgroundApps = useMemo(() => withoutGames(initialData.playgroundApps), [initialData.playgroundApps, gamesVisible]); // eslint-disable-line react-hooks/exhaustive-deps
  const popularMonth = useMemo(() => withoutGames(initialData.popularMonth), [initialData.popularMonth, gamesVisible]); // eslint-disable-line react-hooks/exhaustive-deps
  const featuredApps = useMemo(() => withoutGames(initialData.featuredApps), [initialData.featuredApps, gamesVisible]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadingPG = false;
  const [pgCategoryFilter, setPgCategoryFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp]         = useState<ModalApp | null>(null);

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

  // アプリが少ないうちは「みんなが作ったアプリ」に全件が出ており、
  // 「新着」「ゲーム」は同じカードの繰り返しになるため出さない
  const NEW_SECTION_LIMIT = 8;
  const mainListShowsEverything =
    pgCategoryFilter === "all" && newApps.length <= NEW_SECTION_LIMIT;
  const showNewSection = !mainListShowsEverything;
  const showGameSection = gamesVisible && gameApps.length > 0 && !mainListShowsEverything;

  // 人気系は数が揃うまで出さない（1〜2件だと寂しく見える）
  const MIN_POPULAR_APPS = 3;
  const MIN_POPULAR_CREATORS = 3;

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <SiteHeader query={query} setQuery={setQuery} onOpenContact={() => setShowContact(true)} />

      <HeroCarousel slides={heroSlides} />
      <HomeQuickActions />
      <HomeLibrarySection />
      <main id="browse" className="mx-auto max-w-6xl space-y-12 px-4 py-10">

        {/* ─── 注目のアプリ（管理者選定） ─── */}
        {featuredApps.length > 0 && (
          <section>
            <SectionHeader
              icon={<BadgeCheck className="h-5 w-5 text-violet-500" strokeWidth={2.5} />}
              title={t("注目のアプリ", "Featured apps")}
              sub={t("運営がピックアップしたおすすめアプリ", "Hand-picked by the Jisapp team")}
              href="/search?sort=featured"
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {featuredApps.map((app) => (
                <CatalogAppCard key={app.id} app={app} compact onSelect={setSelectedApp} />
              ))}
            </div>
          </section>
        )}

        {/* ─── 今月の人気アプリ TOP5 ─── */}
        {popularMonth.length >= MIN_POPULAR_APPS && (
          <section>
            <SectionHeader
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />}
              title={t("今月の人気アプリ", "Popular this month")}
              sub={t("今月最も応援バッジをもらったアプリ", "Apps that got the most cheer badges this month")}
            />
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {popularMonth.map((app, i) => {
                  const cat = app.category ? CATEGORY_MAP[app.category] : null;
                  const gradient = cat?.gradient ?? "from-emerald-500 to-teal-600";
                  const modalApp: ModalApp = {
                    id: app.id,
                    name: app.title,
                    description: app.description ?? "",
                    creator: app.creator_name ?? t("匿名", "Anonymous"),
                    rating: 5.0,
                    reviews: app.stamp_count ?? 0,
                    category: cat ? categoryName(cat, locale) : app.category ?? "",
                    gradient,
                    categoryId: app.category ?? null,
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
                      <MiniPreview id={app.id} fallbackGradient={gradient} fallbackCategoryId={app.category} height={96} />
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                          {app.title}
                        </p>
                        {(app.stamp_count ?? 0) > 0 && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                            <Heart className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                            {app.stamp_count}
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
        {popularCreators.length >= MIN_POPULAR_CREATORS && (
          <section>
            <SectionHeader
              icon={<Users className="h-5 w-5 text-blue-500" strokeWidth={2.5} />}
              title={t("人気クリエイター", "Popular creators")}
              sub={t("たくさんのアプリを作った注目のユーザー", "People who've made lots of apps")}
            />
            <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {popularCreators.map((creator) => {
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
                  <Link
                    key={creator.name}
                    href={getCreatorProfilePath(creator.name)}
                    className="shrink-0 w-36 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200"
                  >
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${colors[colorIdx]} text-2xl font-black text-white shadow-md`}>
                      <CreatorAvatarContent name={creator.name} />
                    </div>
                    <p className="mt-2 text-sm font-black text-gray-900 truncate">{displayCreatorName(creator.name, locale)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{format(t("アプリ {n}本", plural(locale, creator.appCount, "{n} app", "{n} apps")), { n: creator.appCount })}</p>
                    {creator.totalStamps > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600">{creator.totalStamps} {t("バッジ", creator.totalStamps === 1 ? "badge" : "badges")}</span>
                      </div>
                    )}
                    {creator.topApp && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const cat = creator.topApp!.category ? CATEGORY_MAP[creator.topApp!.category] : null;
                          setSelectedApp({
                            id: creator.topApp!.id,
                            name: creator.topApp!.title,
                            description: "",
                            creator: creator.name,
                            rating: 5.0,
                            reviews: 0,
                            category: cat ? categoryName(cat, locale) : creator.topApp!.category ?? "",
                            gradient: cat?.gradient ?? "from-emerald-500 to-teal-600",
                            categoryId: creator.topApp!.category ?? null,
                          });
                        }}
                        className="mt-2 w-full rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors line-clamp-1"
                      >
                        {creator.topApp.title}
                      </button>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── プレイグラウンドアプリ（人気順） ─── */}
        <section>
          <SectionHeader
            icon={<Terminal className="h-5 w-5 text-violet-500" strokeWidth={2.5} />}
            title={t("みんなが作ったアプリ", "Apps from the community")}
            sub={t("応援バッジが多い順 · 開発スタジオで作成・公開", "Most cheered first · made and published in the Studio")}
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
                {t("すべて", "All")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setPgCategoryFilter(pgCategoryFilter === cat.id ? "all" : cat.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                    pgCategoryFilter === cat.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                  )}
                >
                  <CategoryIcon categoryId={cat.id} className="h-3.5 w-3.5 shrink-0" />
                  {categoryName(cat, locale)}
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
              {filteredPlaygroundApps.map((app) => (
                <CatalogAppCard key={app.id} app={app} compact onSelect={setSelectedApp} />
              ))}
            </div>
          ) : playgroundApps.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-gray-500">{t("まだ公開されたアプリがありません", "No apps have been published yet")}</p>
              <p className="mt-2 text-xs text-gray-400">{t("開発スタジオでアプリを作って出品してみましょう！", "Make an app in the Studio and publish it!")}</p>
              <Link href="/playground" className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700">
                {t("開発スタジオへ", "Go to the Studio")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-gray-500">
                {query ? format(t("「{query}」に一致するアプリはありません", "No apps match “{query}”"), { query }) : t("このカテゴリのアプリはまだありません", "No apps in this category yet")}
              </p>
            </div>
          )}
        </section>

        {/* ─── 新着・注目アプリ ─── */}
        {showNewSection && (
        <section>
          <SectionHeader
            icon={<JisappLogoIcon className="h-5 w-5" />}
            title={t("新着アプリ", "New apps")}
            sub={t("最近開発スタジオで公開された新しいアプリ", "Recently published from the Studio")}
            href="/search?sort=new"
          />
          {loadingPG ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : newApps.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {newApps.slice(0, 8).map((app) => (
                <CatalogAppCard key={app.id} app={app} compact onSelect={setSelectedApp} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-gray-500">
                {query ? format(t("「{query}」に一致するアプリはありません", "No apps match “{query}”"), { query }) : t("まだアプリが登録されていません", "No apps yet")}
              </p>
              <p className="mt-2 text-xs text-gray-400">{t("開発スタジオでアプリを作って公開してみましょう！", "Make an app in the Studio and publish it!")}</p>
              <Link href="/playground" className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                {t("開発スタジオへ", "Go to the Studio")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
        )}

        {/* ─── 個人開発ゲーム ─── */}
        {showGameSection && (
          <section>
            <SectionHeader
              icon={<Gamepad2 className="h-5 w-5 text-violet-500" strokeWidth={2.5} />}
              title={t("ゲームアプリ", "Games")}
              sub={t("ジサップで作られた遊べるゲーム集。ブラウザひとつで今すぐプレイ！", "Games made on Jisapp. Play right now in your browser!")}
              href="/search?category=ゲーム"
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {gameApps.map((app) => (
                <CatalogAppCard key={app.id} app={app} compact onSelect={setSelectedApp} />
              ))}
            </div>
          </section>
        )}

        {/* ─── アプリリクエスト ─── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionHeader
              icon={<Heart className="h-5 w-5 text-rose-500" />}
              title={t("こんなアプリが欲しい！リクエスト", "App requests")}
              sub={t("作ってほしいアプリをリクエスト。ジサップユーザーがAIで作ってくれるかも", "Ask for an app you want. Someone on Jisapp might build it with AI")}
              href="/requests"
            />
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-6 ring-1 ring-rose-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <p className="font-bold text-gray-800 text-sm">{t("「こんなゲームが欲しい」「こんなツールがあったら便利」", "“I want a game like this” · “A tool like this would help”")}</p>
                <p className="mt-1 text-xs text-gray-500">{t("リクエストを投稿すると、他のジサップユーザーがAIで作って返信してくれます。", "Post a request and other Jisapp users may build it with AI and reply.")}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href="/requests"
                  className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-600 transition-colors">
                  {t("リクエストを見る", "See requests")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 他の開発環境との違い ─── */}
        <section className="py-2">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{t("他の開発環境とここが違う", "What makes Jisapp different")}</h2>
            <p className="mt-2 text-sm text-gray-500">{t("むずかしい設定は一切なし。初心者が詰まるポイントをすべて取り除きました。", "No tricky setup. We removed every step where beginners get stuck.")}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: "72rem", margin: "0 auto" }}>
            {([
              {
                Icon: Settings2,
                title: t("サーバー設定ゼロ", "Zero server setup"),
                desc: t("VPS・クラウド・ドメイン取得など、一切不要。コードを貼った瞬間から動くアプリが手に入ります。Vercel や Heroku すら使いません。", "No VPS, cloud account or domain needed. Your app runs the moment you paste the code — no Vercel or Heroku either."),
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                Icon: ShieldCheck,
                title: t("データベース設定不要", "No database setup"),
                desc: t("MySQL・PostgreSQL・Firebaseなどのセットアップ知識は必要なし。ローカルストレージやAPIで完結するアプリならそのまま動きます。", "No need to know MySQL, PostgreSQL or Firebase. Apps that use local storage or APIs just work."),
                bg: "bg-teal-50",
                iconColor: "text-teal-600",
              },
              {
                Icon: Code2,
                title: t("AIが作ったコードをそのまま貼る", "Paste AI code as-is"),
                desc: t("ChatGPT・Claude・Gemini が出力したコードを、npm install も環境構築も一切せずにそのまま開発スタジオに貼るだけで完成。", "Paste code from ChatGPT, Claude or Gemini straight into the Studio — no npm install, no dev environment."),
                bg: "bg-cyan-50",
                iconColor: "text-cyan-600",
              },
              {
                Icon: Globe,
                title: t("スマホ・タブレットから開発できる", "Build from your phone or tablet"),
                desc: t("専用アプリのインストール不要。ブラウザさえあればどこからでも開発・公開が可能。電車の中でもカフェでもアプリが作れます。", "Nothing to install. All you need is a browser — make and publish apps on the train or at a café."),
                bg: "bg-violet-50",
                iconColor: "text-violet-600",
              },
              {
                Icon: Lock,
                title: t("安全な実行環境", "A safe place to run apps"),
                desc: t("アプリはブラウザの sandbox 内で動作します。外部API（HTTPS）も window.Jisapp.fetch 経由で利用でき、作る側も使う側も安心して利用できます。", "Apps run inside a browser sandbox. External HTTPS APIs go through window.Jisapp.fetch, so makers and users can feel at ease."),
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                Icon: UserPlus,
                title: t("作ったアプリをそのまま公開・シェア", "Publish and share what you make"),
                desc: t("完成したアプリはURLで誰でも使えます。マーケットに公開してみんなに使ってもらおう。", "Anyone can use your app from its URL. List it in the market so everyone can try it."),
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
                  {t("初心者大歓迎", "Beginners welcome")}
                </div>
                <h2 className="text-2xl font-black">
                  {t("今すぐ、あなたの最初のアプリを作ろう", "Make your first app today")}
                </h2>
                <p className="mt-1.5 text-sm text-white/70 max-w-md">
                  {t("AIにアイデアを伝えてコードを生成 → 開発スタジオに貼るだけ。サーバーもDBも設定不要です。", "Tell AI your idea to get the code → paste it into the Studio. No server or database needed.")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  href="/playground"
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-emerald-700 shadow-md transition-all hover:bg-emerald-50 hover:shadow-lg active:scale-[0.98]"
                >
                  <JisappLogoIcon className="h-4 w-4" />
                  {t("アプリ開発スタジオへ", "Open the Studio")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/search"
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
                >
                  <Search className="h-4 w-4" />
                  {t("アプリを探す", "Browse apps")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 3ステップ ─── */}
      <div className="bg-white px-4 py-12 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 text-center text-sm font-bold uppercase tracking-widest text-emerald-600">How it works</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: <JisappLogoIcon className="h-6 w-6" />,
                title: t("AIにアイデアを伝える", "Tell AI your idea"),
                desc: t("ChatGPT・Claude・Geminiなど、使い慣れたAIに「こんなアプリを作って」と送るだけ。コードが自動で生成されます。", "Just ask ChatGPT, Claude, Gemini or any AI you like: “make me an app that…”. It writes the code for you."),
                color: "bg-emerald-50 border-emerald-100",
              },
              {
                step: "02",
                icon: <Code2 className="h-6 w-6 text-teal-600" />,
                title: t("コードをコピーして貼る", "Copy and paste the code"),
                desc: t("生成されたコードをコピーして、ジサップの開発スタジオに貼り付けるだけ。サーバーもDBも設定不要です。", "Copy the code and paste it into the Jisapp Studio. No server or database to set up."),
                color: "bg-teal-50 border-teal-100",
              },
              {
                step: "03",
                icon: <Globe className="h-6 w-6 text-cyan-600" />,
                title: t("即公開・シェア", "Publish & share instantly"),
                desc: t("コードを貼り付けたらすぐ公開。URLを発行してSNSやメッセージで友だちに共有できます。", "Publish right after pasting. Get a URL and share it with friends on social media or in messages."),
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
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-emerald-600 px-8 py-4 text-base font-black text-white shadow-lg shadow-emerald-200/50 transition-all hover:from-violet-700 hover:to-emerald-700 hover:shadow-xl active:scale-95"
            >
              <Terminal className="h-5 w-5" />
              {t("アプリ開発スタジオへ", "Open the Studio")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-200 bg-white px-8 py-4 text-base font-black text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 active:scale-95"
            >
              <FolderOpen className="h-5 w-5" />
              <span className="flex flex-col items-start leading-tight">
                <span>{t("自分が作ったアプリを見る", "Apps you made")}</span>
                <span className="text-[11px] font-semibold text-emerald-600/70">{t("マイプロジェクト", "My projects")}</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
      {aboutIntro}

      {/* ─── フッター ─── */}
      <footer className="mt-4 border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <JisappLogo href="/" />
          <OfficialSocialLinks />
          <p className="text-xs text-gray-400">{t("© 2026 ジサップ — AIコードを貼るだけの開発スタジオ", "© 2026 Jisapp — the studio where AI code becomes apps")}</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
            <button type="button" onClick={() => setShowContact(true)} className="hover:text-emerald-600">{t("運営への問い合わせ", "Contact us")}</button>
            <Link href="/mypage" className="hover:text-emerald-600">{t("マイページ", "My page")}</Link>
            <Link href="/faq" className="hover:text-emerald-600">{t("よくある質問", "FAQ")}</Link>
            <Link href="/playground" className="hover:text-emerald-600">{t("アプリ開発スタジオへ", "Studio")}</Link>
            <Link href="/terms" className="hover:text-emerald-600">{t("利用規約", "Terms")}</Link>
            <LanguageSwitcher />
          </div>
          <nav aria-label={t("カテゴリ一覧", "Categories")} className="flex flex-wrap justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-100 hover:text-emerald-600 hover:ring-emerald-200"
              >
                <CategoryIcon categoryId={cat.id} className="h-3.5 w-3.5 shrink-0" />
                {categoryName(cat, locale)}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      {/* ─── アプリ詳細モーダル ─── */}
      {selectedApp && (
        <AppDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}

      <ContactFormModal open={showContact} onClose={() => setShowContact(false)} />
    </div>
  );
}
