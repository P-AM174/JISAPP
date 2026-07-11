"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles,
  Plus,
  X,
  Search,
  SlidersHorizontal,
  MessageSquare,
  Tag,
  ArrowRight,
  FileText,
  Terminal,
  Rocket,
} from "lucide-react";

// ─── 型 ───
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

const STATIC_REQUESTS: AppRequest[] = [
  {
    id: "s1",
    title: "タイピング練習アプリが欲しい",
    content: "ランダムな日本語の文章が表示されて、タイピングしてスコアが出るシンプルなゲームが欲しいです。WPM（1分あたりの入力数）と正確率が見えると嬉しいです。",
    category: "ゲーム",
    authorName: "ひまわり",
    createdAt: "2026/07/08",
    responses: 3,
  },
  {
    id: "s2",
    title: "ポモドーロタイマーアプリ",
    content: "25分作業→5分休憩を繰り返すタイマーアプリが欲しいです。通知音があって、セット数も記録できると嬉しいです。シンプルでかわいいデザインが好みです。",
    category: "生産性",
    authorName: "もちこ",
    createdAt: "2026/07/07",
    responses: 5,
  },
  {
    id: "s3",
    title: "かわいい音が出るピアノ",
    content: "スマホで弾けるミニピアノアプリが欲しいです。鍵盤をタップすると音が出て、簡単な曲を弾けるくらいのものでいいです。",
    category: "エンタメ",
    authorName: "おとは",
    createdAt: "2026/07/06",
    responses: 7,
  },
  {
    id: "s4",
    title: "英単語フラッシュカードアプリ",
    content: "英単語と意味をカードに登録して、ランダムに表示してクイズができるアプリが欲しいです。正解・不正解を記録して、苦手単語を優先的に出してほしいです。",
    category: "学習・教育",
    authorName: "あんり",
    createdAt: "2026/07/05",
    responses: 2,
  },
  {
    id: "s5",
    title: "割り勘計算ツール",
    content: "飲み会の割り勘を簡単に計算できるツールが欲しいです。金額と人数を入力したら一人当たりの金額が出て、お釣りも計算できると助かります。",
    category: "便利ツール",
    authorName: "たろう",
    createdAt: "2026/07/04",
    responses: 10,
  },
  {
    id: "s6",
    title: "数学クイズゲーム",
    content: "掛け算・割り算の問題がランダムに出て、制限時間内に答えるゲームが欲しいです。小学生の子供が楽しめるようなデザインにしてほしいです。",
    category: "学習・教育",
    authorName: "さとみ",
    createdAt: "2026/07/03",
    responses: 4,
  },
];

// ─── リクエストカード ───
function RequestCard({ req }: { req: AppRequest }) {
  return (
    <Link href={`/requests/${req.id}`} className="group block">
      <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
            {req.category}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
            <MessageSquare className="h-3 w-3" /> {req.responses}件の返信
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
          <span className="ml-auto">{req.createdAt}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── 投稿モーダル ───
function PostModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (r: AppRequest) => void }) {
  const [title,      setTitle]      = useState("");
  const [content,    setContent]    = useState("");
  const [category,   setCategory]   = useState("便利ツール");
  const [authorName, setAuthorName] = useState("");
  const [error,      setError]      = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError("タイトルと内容は必須です。"); return; }
    const newReq: AppRequest = {
      id:          `u_${Date.now()}`,
      title:       title.trim(),
      content:     content.trim(),
      category,
      authorName:  authorName.trim() || "匿名ユーザー",
      createdAt:   new Date().toLocaleDateString("ja-JP"),
      responses:   0,
    };
    onSubmit(newReq);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-black text-gray-900">欲しいアプリをリクエスト</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>}

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <p className="font-bold mb-0.5">💡 リクエストのコツ</p>
            <p>「どんなことができるアプリか」をなるべく具体的に書くと、他のユーザーがAIで作りやすくなります。</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">カテゴリ <span className="text-rose-500">*</span></label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20">
              {CATEGORIES.filter(c => c !== "すべて").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">
              アプリのタイトル <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="例：タイピング練習ゲームが欲しい"
              maxLength={80}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">
              どんなアプリが欲しいか <span className="text-rose-500">*</span>
            </label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder="どんな機能が欲しいか、どんなときに使いたいかを書いてください。"
              maxLength={500}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
            <p className="mt-1 text-right text-[10px] text-gray-400">{content.length}/500</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">ニックネーム（任意）</label>
            <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
              placeholder="匿名ユーザー"
              maxLength={30}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit"
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
              リクエストを投稿
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── メインページ ───
export default function RequestsPage() {
  const [requests,     setRequests]     = useState<AppRequest[]>(STATIC_REQUESTS);
  const [showModal,    setShowModal]    = useState(false);
  const [query,        setQuery]        = useState("");
  const [activeTab,    setActiveTab]    = useState("すべて");
  const [sortNew,      setSortNew]      = useState(true);
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jisapp_app_requests");
      if (raw) {
        const saved: AppRequest[] = JSON.parse(raw);
        setRequests([...saved, ...STATIC_REQUESTS]);
      }
    } catch { /* noop */ }
    setMounted(true);
  }, []);

  const handlePost = (req: AppRequest) => {
    const userRequests = requests.filter(r => !STATIC_REQUESTS.find(s => s.id === r.id));
    const updated = [req, ...userRequests];
    try {
      localStorage.setItem("jisapp_app_requests", JSON.stringify(updated));
    } catch { /* noop */ }
    setRequests([req, ...requests]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = requests.filter(r => {
      const matchCat = activeTab === "すべて" || r.category === activeTab;
      const matchQ   = !q || r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    if (sortNew) list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else         list = [...list].sort((a, b) => b.responses - a.responses);
    return list;
  }, [requests, query, activeTab, sortNew]);

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {showModal && <PostModal onClose={() => setShowModal(false)} onSubmit={handlePost} />}

      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">アプリリクエスト</span>
          <div className="ml-auto">
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
              <Plus className="h-3.5 w-3.5" /> リクエストを投稿
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ─── ヒーロー ─── */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> ジサップユーザーがAIで作ってくれるかも
          </div>
          <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">こんなアプリが欲しい！</h1>
          <p className="mt-2 text-sm text-gray-500">
            アイデアをリクエストすると、他のジサップユーザーがAIを使って作って返信してくれます。
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> リクエストを投稿する
            </button>
            <Link href="/playground"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-7 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
              <Terminal className="h-4 w-4" /> 自分で作ってみる
            </Link>
          </div>
        </div>

        {/* ─── フィルタバー ─── */}
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="キーワードで検索..."
              className="h-10 w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => setActiveTab(cat)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === cat ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
              <select value={sortNew ? "new" : "popular"} onChange={e => setSortNew(e.target.value === "new")}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-emerald-400">
                <option value="new">新着順</option>
                <option value="popular">返信が多い順</option>
              </select>
            </div>
          </div>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          {mounted ? <><span className="font-semibold text-emerald-700">{filtered.length}件</span> のリクエスト</> : "読み込み中..."}
        </p>

        {/* ─── カードグリッド ─── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(req => <RequestCard key={req.id} req={req} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
            <FileText className="h-8 w-8 text-gray-300" />
            <p className="font-bold text-gray-600">該当するリクエストが見つかりませんでした</p>
            <p className="text-sm text-gray-400">最初にリクエストしてみましょう！</p>
            <button onClick={() => setShowModal(true)}
              className="mt-1 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
              リクエストを投稿する
            </button>
          </div>
        )}

        {/* ─── 自分でも作れる訴求 ─── */}
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-white text-center shadow-lg">
          <div className="mb-2 text-2xl">🛠️</div>
          <h2 className="text-lg font-black">自分でも作れます！</h2>
          <p className="mt-2 text-sm text-white/80">
            AIにアイデアを伝えてコードを生成してもらい、プレイグラウンドに貼るだけ。<br className="hidden sm:block"/>
            プログラミング知識ゼロでも、あなたのアイデアをアプリにできます。
          </p>
          <Link href="/playground"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-black text-emerald-700 shadow-md hover:bg-emerald-50 transition-colors">
            <Rocket className="h-4 w-4" />
            プレイグラウンドで試してみる
          </Link>
        </div>
      </main>
    </div>
  );
}
