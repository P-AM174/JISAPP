"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "@/lib/i18n/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/back-button";
import { JisappLogo, JisappLogoIcon } from "@/components/jisapp-logo";
import {
  Plus,
  X,
  Search,
  SlidersHorizontal,
  MessageSquare,
  Tag,
  FileText,
  Terminal,
  ArrowRight,
} from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, type Locale, format, plural, pick } from "@/lib/i18n/config";
import { showGames } from "@/lib/features";

type AppRequest = {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  createdAt: string;
  responses: number;
};

const CATEGORIES = ["すべて", "ゲーム", "便利ツール", "学習・教育", "エンタメ", "生産性", "その他"];

/** リクエストのカテゴリは日本語のまま保存するので、表示だけ訳す */
const CATEGORY_EN: Record<string, string> = {
  すべて: "All",
  ゲーム: "Games",
  便利ツール: "Handy tools",
  "学習・教育": "Learning",
  エンタメ: "Entertainment",
  生産性: "Productivity",
  その他: "Other",
};

function categoryLabel(value: string, locale: Locale) {
  return pick(locale, value, CATEGORY_EN[value] ?? value);
}

function formatDate(iso: string, locale: Locale = "ja") {
  try {
    return new Date(iso).toLocaleDateString(intlLocale(locale));
  } catch {
    return iso;
  }
}

function RequestCard({ req }: { req: AppRequest }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Link href={`/requests/${req.id}`} className="group block">
      <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
            {categoryLabel(req.category, locale)}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
            <MessageSquare className="h-3 w-3" /> {format(t("{n}件の返信", plural(locale, req.responses, "{n} reply", "{n} replies")), { n: req.responses })}
          </span>
        </div>
        <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">
          {req.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">{req.content}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" /> {req.authorName}
          </span>
          <span className="ml-auto">{formatDate(req.createdAt, locale)}</span>
        </div>
      </div>
    </Link>
  );
}

function PostModal({
  onClose,
  onSubmit,
  defaultAuthorName,
}: {
  onClose: () => void;
  onSubmit: (r: AppRequest) => void;
  defaultAuthorName: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("便利ツール");
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = useT();
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError(t("タイトルと内容は必須です。", "A title and details are required."));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          authorName: authorName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("投稿に失敗しました", "Couldn't post"));
      onSubmit(data.request);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("投稿に失敗しました", "Couldn't post"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-black text-gray-900">{t("欲しいアプリをリクエスト", "Request an app")}</h2>
          <button type="button" onClick={onClose} aria-label={t("閉じる", "Close")} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>}

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <p className="mb-0.5 font-bold">{t("リクエストのコツ", "Tip")}</p>
            <p>{t("「どんなことができるアプリか」をなるべく具体的に書くと、他のユーザーがAIで作りやすくなります。", "The more specific you are about what the app should do, the easier it is for others to build it with AI.")}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">{t("カテゴリ", "Category")} <span className="text-rose-500">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            >
              {CATEGORIES.filter((c) => c !== "すべて" && (c !== "ゲーム" || showGames(locale))).map((c) => (
                <option key={c} value={c}>{categoryLabel(c, locale)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">
              {t("アプリのタイトル", "App title")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("例：タイピング練習ゲームが欲しい", "e.g. I want a typing practice game")}
              maxLength={80}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">
              {t("どんなアプリが欲しいか", "What should it do?")} <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder={t("どんな機能が欲しいか、どんなときに使いたいかを書いてください。", "Describe the features you want and when you'd use it.")}
              maxLength={500}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
            <p className="mt-1 text-right text-[10px] text-gray-400">{content.length}/500</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">{t("ニックネーム（任意）", "Nickname (optional)")}</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t("匿名ユーザー", "Anonymous")}
              maxLength={30}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              {t("キャンセル", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? t("投稿中…", "Posting…") : t("リクエストを投稿", "Post request")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<AppRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("すべて");
  const [sortNew, setSortNew] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const t = useT();
  const locale = useLocale();

  const isLoggedIn = status === "authenticated";

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/requests");
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/requests")}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("読み込みに失敗しました", "Couldn't load"));
      setRequests(data.requests ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t("読み込みに失敗しました", "Couldn't load"));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    if (status === "loading") return;
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/requests")}`);
      return;
    }
    loadRequests();
  }, [status, isLoggedIn, loadRequests, router]);

  const handlePost = (req: AppRequest) => {
    setRequests((prev) => [req, ...prev]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = requests.filter((r) => {
      const matchCat = activeTab === "すべて" || r.category === activeTab;
      const matchQ = !q || r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    if (sortNew) {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list = [...list].sort((a, b) => b.responses - a.responses);
    }
    return list;
  }, [requests, query, activeTab, sortNew]);

  if (status === "loading" || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4] text-sm text-gray-500">
        {t("読み込み中…", "Loading…")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {showModal && (
        <PostModal
          onClose={() => setShowModal(false)}
          onSubmit={handlePost}
          defaultAuthorName={session?.user?.name ?? ""}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <BackButton hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">{t("アプリリクエスト", "App requests")}</span>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" /> {t("リクエストを投稿", "Post a request")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            <JisappLogoIcon className="h-3.5 w-3.5" /> {t("ログインユーザー限定の依頼掲示板", "A request board for signed-in users")}
          </div>
          <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">{t("こんなアプリが欲しい", "Apps people want")}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("アイデアをリクエストすると、他のジサップユーザーがAIを使って作って返信してくれます。", "Post an idea and other Jisapp users may build it with AI and reply.")}
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> {t("リクエストを投稿する", "Post a request")}
            </button>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-7 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
            >
              <Terminal className="h-4 w-4" /> {t("自分で作ってみる", "Make it yourself")}
            </Link>
          </div>
        </div>

        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("キーワードで検索...", "Search by keyword...")}
              className="h-10 w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.filter((c) => c !== "ゲーム" || showGames(locale)).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveTab(cat)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === cat ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300"
                  }`}
                >
                  {categoryLabel(cat, locale)}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={sortNew ? "new" : "popular"}
                onChange={(e) => setSortNew(e.target.value === "new")}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-emerald-400"
              >
                <option value="new">{t("新着順", "Newest")}</option>
                <option value="popular">{t("返信が多い順", "Most replies")}</option>
              </select>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{loadError}</span>
            <button type="button" onClick={loadRequests} className="font-bold underline">
              {t("再試行", "Retry")}
            </button>
          </div>
        )}

        <p className="mb-4 text-xs text-gray-500">
          {loading ? (
            t("読み込み中...", "Loading...")
          ) : (
            t(
              <><span className="font-semibold text-emerald-700">{filtered.length}件</span> のリクエスト</>,
              <><span className="font-semibold text-emerald-700">{filtered.length}</span> {filtered.length === 1 ? "request" : "requests"}</>
            )
          )}
        </p>

        {!loading && filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
            <FileText className="h-8 w-8 text-gray-300" />
            <p className="font-bold text-gray-600">{t("該当するリクエストが見つかりませんでした", "No requests found")}</p>
            <p className="text-sm text-gray-400">{t("最初にリクエストしてみましょう", "Be the first to post one")}</p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-1 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {t("リクエストを投稿する", "Post a request")}
            </button>
          </div>
        ) : null}

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-center text-white shadow-lg">
          <h2 className="text-lg font-black">{t("自分でも作れます", "You can make it yourself too")}</h2>
          <p className="mt-2 text-sm text-white/80">
            {t("AIにアイデアを伝えてコードを生成してもらい、開発スタジオに貼るだけ。プログラミング知識ゼロでも、あなたのアイデアをアプリにできます。", "Tell an AI your idea, get the code, and paste it into the Studio. Even with zero coding knowledge, you can turn your idea into an app.")}
          </p>
          <Link
            href="/playground"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-black text-emerald-700 shadow-md hover:bg-emerald-50 transition-colors"
          >
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
            {t("開発スタジオで試してみる", "Try it in the Studio")}
          </Link>
        </div>
      </main>
    </div>
  );
}
