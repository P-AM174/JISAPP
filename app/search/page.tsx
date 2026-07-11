"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Search,
  Sparkles,
  Star,
  ArrowRight,
  User,
  Plus,
  SlidersHorizontal,
  X,
  Calendar,
  BarChart3,
  Camera,
  Code2,
  FileText,
  Mail,
  Music,
  ShoppingCart,
  Globe,
  BadgeCheck,
} from "lucide-react";

// ─── 型 ───
type AppItem = {
  id: number;
  name: string;
  description: string;
  creator: string;
  price: number;
  rating: number;
  reviews: number;
  tag: string;
  gradient: string;
  category: string;
  Icon: React.ComponentType<{ className?: string }>;
  isListing?: boolean;
};

type SortMethod = "default" | "new" | "price" | "rating" | "popular";
type PriceFilter = "all" | "free" | "budget";

// ─── 固定アプリデータ ───
const STATIC_APPS: AppItem[] = [
  { id: 1,  name: "AIスケジュール最適化",       description: "会議・作業・移動の時間をAIが自動で最適配置。カレンダー連携だけで1日のスケジュールが劇的に効率化。残業ゼロを目指すビジネスパーソンに最適です。", creator: "TechStudio",   price: 2980, rating: 4.8, reviews: 234,  tag: "NEW",      gradient: "from-emerald-600 via-green-600 to-teal-700",   category: "生産性",     Icon: Calendar   },
  { id: 2,  name: "マーケットレポーター",        description: "株式・暗号資産・為替のリアルタイムデータを美しいダッシュボードで可視化。カスタムアラート機能で見逃しゼロ。",                                       creator: "DataWave",     price: 1980, rating: 4.6, reviews: 189,  tag: "人気",     gradient: "from-rose-500 via-pink-600 to-red-600",          category: "分析",       Icon: BarChart3  },
  { id: 3,  name: "SNSコンテンツAI",            description: "投稿文・画像キャプション・ハッシュタグをワンクリックで生成。Instagram・X・TikTokに対応。エンゲージメント率が平均2.3倍に向上。",                   creator: "CreativeLab", price: 2980, rating: 4.9, reviews: 412,  tag: "急上昇",   gradient: "from-amber-500 via-orange-500 to-red-500",        category: "マーケ",     Icon: Camera     },
  { id: 4,  name: "コード品質チェッカー",        description: "AIがコードを自動レビューし、バグ・セキュリティリスク・改善点を具体的に指摘。開発速度を2倍に。",                                                     creator: "DevTools",     price: 2480, rating: 4.7, reviews: 301,  tag: "NEW",      gradient: "from-emerald-500 via-teal-600 to-cyan-700",       category: "開発",       Icon: Code2      },
  { id: 5,  name: "タスク管理Pro",              description: "シンプルで使いやすいタスク管理。優先度・期日・担当者を一覧で把握。無料で全機能が使えます。",                                                         creator: "SimpleApps",  price: 0,    rating: 4.5, reviews: 892,  tag: "無料",     gradient: "from-green-500 via-emerald-600 to-teal-600",      category: "生産性",     Icon: FileText   },
  { id: 6,  name: "メール文章アシスト",          description: "ビジネスメールを丁寧な文体に自動変換。敬語の使い方が不安な方でも安心してプロ品質のメールを送れます。",                                               creator: "MailGenius",   price: 0,    rating: 4.4, reviews: 654,  tag: "無料",     gradient: "from-emerald-500 via-green-600 to-teal-600",      category: "ビジネス",   Icon: Mail       },
  { id: 7,  name: "音楽プレイリスト生成",        description: "気分やシーンに合わせたBGMをAIが自動選曲。集中・リラックス・テンションアップなど多彩なムードに対応。",                                               creator: "MusicAI",      price: 0,    rating: 4.6, reviews: 1203, tag: "無料",     gradient: "from-green-500 via-emerald-600 to-teal-700",      category: "エンタメ",   Icon: Music      },
  { id: 8,  name: "EC商品説明ジェネレーター",   description: "商品名と特徴を入れるだけで魅力的な説明文を自動生成。メルカリ・BASE・Shopifyに対応。",                                                             creator: "ShopTools",    price: 0,    rating: 4.3, reviews: 445,  tag: "無料",     gradient: "from-orange-500 via-amber-500 to-yellow-500",     category: "EC",         Icon: ShoppingCart},
  { id: 9,  name: "ワンクリック議事録作成GAS",  description: "Google Meetの会話をAIが自動で議事録に整形。会議終了後1分でSlack送信まで完全自動化。",                                                             creator: "GASマスター",  price: 980,  rating: 4.7, reviews: 156,  tag: "人気No.1", gradient: "from-emerald-500 via-green-600 to-teal-600",      category: "業務効率化", Icon: FileText   },
  { id: 10, name: "自動シフト調整ツール",        description: "シフト希望をフォームで収集し、AIが最適なシフト表を自動作成。飲食・小売の店長に大人気。",                                                           creator: "ShiftPro",     price: 500,  rating: 4.6, reviews: 203,  tag: "コスパ最強",gradient: "from-teal-500 via-emerald-600 to-green-700",      category: "シフト管理", Icon: Calendar   },
  { id: 11, name: "かんたん請求書メーカー",      description: "フリーランス向けの超シンプル請求書作成ツール。入力3ステップでPDF出力まで1分以内。",                                                               creator: "FreelanceKit", price: 780,  rating: 4.5, reviews: 98,   tag: "初心者向け",gradient: "from-green-500 via-teal-600 to-emerald-700",      category: "フリーランス",Icon: BarChart3  },
  { id: 12, name: "SNS予約投稿スケジューラー",  description: "X・Instagram・TikTokの投稿を一括管理。最適な投稿時間をAIが提案して完全自動予約。",                                                               creator: "SocialAI",     price: 980,  rating: 4.8, reviews: 312,  tag: "急上昇",   gradient: "from-emerald-400 via-teal-500 to-cyan-600",       category: "SNS運用",    Icon: Globe      },
  { id: 13, name: "タイピング忍者",             description: "迫りくる敵をタイピングで倒す和風シューティング。ローマ字・かな両対応でタイピング速度がぐんぐん上がる。",                                                 creator: "NinjaKeys",    price: 0,    rating: 4.7, reviews: 1482, tag: "無料",     gradient: "from-slate-700 via-slate-800 to-gray-900",         category: "ゲーム",     Icon: Globe      },
  { id: 14, name: "パズルブロック∞",            description: "シンプルなのに止まらない！ブロックを積んで消すカジュアルパズル。ハイスコアをSNSでシェアしよう。",                                                         creator: "PixelPuzzle",  price: 0,    rating: 4.5, reviews: 983,  tag: "人気",     gradient: "from-violet-600 via-purple-700 to-indigo-800",     category: "ゲーム",     Icon: Globe      },
  { id: 15, name: "宇宙船バトル",               description: "ブラウザで動く本格縦スクロールシューティング。個人開発とは思えないクオリティと爽快感。",                                                               creator: "SpaceDev",     price: 300,  rating: 4.8, reviews: 641,  tag: "注目",     gradient: "from-blue-900 via-indigo-900 to-slate-900",        category: "ゲーム",     Icon: Globe      },
  { id: 16, name: "言葉当てゲーム",             description: "毎日更新される5文字の言葉を6回以内に当てるワードゲーム。日本語版Wordleをさらに遊びやすく改良。",                                                         creator: "WordCraft",    price: 0,    rating: 4.6, reviews: 2103, tag: "毎日更新", gradient: "from-amber-600 via-orange-600 to-red-700",         category: "ゲーム",     Icon: Globe      },
  { id: 17, name: "迷路チャレンジ",             description: "AIが自動生成する無限迷路。キーボードまたはスワイプで操作。難易度が自動調整されるので初心者から上級者まで楽しめる。",                                         creator: "MazeRunner",   price: 0,    rating: 4.4, reviews: 556,  tag: "無料",     gradient: "from-teal-700 via-emerald-800 to-green-900",       category: "ゲーム",     Icon: Globe      },
  { id: 18, name: "リズムタップ",               description: "音楽に合わせてタイミングよくタップするリズムゲーム。自分の好きな曲をURLで読み込めるユニークな仕様。",                                                     creator: "BeatStudio",   price: 500,  rating: 4.9, reviews: 789,  tag: "NEW",      gradient: "from-rose-700 via-pink-800 to-fuchsia-900",        category: "ゲーム",     Icon: Globe      },
];

const CATEGORIES = ["すべて","生産性","業務効率化","開発","マーケ","分析","ビジネス","EC","SNS運用","シフト管理","フリーランス","エンタメ","ゲーム"];
const SORT_OPTIONS: { value: SortMethod; label: string }[] = [
  { value: "default", label: "おすすめ順" },
  { value: "new",     label: "新着順" },
  { value: "price",   label: "価格が安い順" },
  { value: "rating",  label: "評価が高い順" },
  { value: "popular", label: "人気順" },
];

// ─── アプリカード ───
function AppCard({ app }: { app: AppItem }) {
  const { Icon } = app;
  const priceLabel = "FREE";
  const isFree   = true;
  const isBudget = false;
  const href     = app.isListing ? "#" : `/apps/${app.id}`;

  return (
    <Link href={href} className="group block">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/60 hover:ring-emerald-200">
        {/* グラデーションビジュアル */}
        <div className={`relative flex items-center justify-center bg-gradient-to-br ${app.gradient} px-5 py-6`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <span className="absolute top-3 right-3 rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
            {app.tag}
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-emerald-700">
            {priceLabel}
          </span>
          {app.isListing && (
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              <BadgeCheck className="h-3 w-3" /> 自分の出品
            </span>
          )}
        </div>
        {/* コンテンツ */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">{app.category}</span>
            {app.rating > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-gray-700">{app.rating}</span>
                <span className="text-xs text-gray-400">({app.reviews})</span>
              </div>
            ) : <span className="text-[10px] text-gray-400">審査中</span>}
          </div>
          <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">{app.name}</h3>
          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">{app.description}</p>
          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2.5">
            <span className="text-xs text-gray-400">by {app.creator}</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
              詳細を見る <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── 検索ページ本体（useSearchParams 使用のため Suspense でラップ） ───
function SearchPageInner() {
  const searchParams = useSearchParams();

  // URL パラメータから初期値
  const initSort     = (searchParams.get("sort")     as SortMethod)  ?? "default";
  const initFilter   = (searchParams.get("filter")   as PriceFilter) ?? "all";
  const initCategory = searchParams.get("category")  ?? "すべて";
  const initQuery    = searchParams.get("q")         ?? "";

  const [query,          setQuery]          = useState(initQuery);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES.includes(initCategory) ? initCategory : "すべて");
  const [sortMethod,     setSortMethod]     = useState<SortMethod>(SORT_OPTIONS.some(o => o.value === initSort) ? initSort : "default");
  const [priceFilter,    setPriceFilter]    = useState<PriceFilter>(["all","free","budget"].includes(initFilter) ? initFilter : "all");
  const [minPrice,       setMinPrice]       = useState("");
  const [maxPrice,       setMaxPrice]       = useState("");
  const [listingApps,    setListingApps]    = useState<AppItem[]>([]);
  const [mounted,        setMounted]        = useState(false);

  // LocalStorage から出品データ読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jisapp_listings");
      if (!raw) return;
      const allListings: Array<{ id: string; name: string; description?: string; priceNum?: number; category?: string; status?: string; creator?: string; rating?: number; reviews?: number; tag?: string; gradient?: string }> = JSON.parse(raw);
      // pending（運営審査待ち）は検索結果から除外
      const listings = allListings.filter((l) => l.status !== "pending");
      const converted: AppItem[] = listings.map((l, idx) => ({
        id:          typeof l.id === "number" ? l.id : 100000 + idx,
        name:        l.name ?? "無題のアプリ",
        description: l.description ?? "",
        creator:     (l.creator as string) ?? "あなた",
        price:       l.priceNum ?? 0,
        rating:      (l.rating as number) ?? 5.0,
        reviews:     (l.reviews as number) ?? 0,
        tag:         (l.tag as string) ?? "NEW",
        gradient:    (l.gradient as string) ?? "from-emerald-500 via-green-500 to-teal-600",
        category:    l.category ?? "その他",
        Icon:        Sparkles,
        isListing:   true,
      }));
      setListingApps(converted);
    } catch { /* noop */ }
    setMounted(true);
  }, []);

  const allApps = useMemo(() => [...STATIC_APPS, ...listingApps], [listingApps]);

  // フィルタ → ソート
  const filtered = useMemo(() => {
    const q    = query.trim().toLowerCase();
    const minP = minPrice === "" ? null : Number(minPrice);
    const maxP = maxPrice === "" ? null : Number(maxPrice);

    const result = allApps.filter((app) => {
      const matchCat   = activeCategory === "すべて" || app.category === activeCategory;
      const matchQuick =
        priceFilter === "all"    ? true :
        priceFilter === "free"   ? app.price === 0 :
        /* budget */               (app.price === 0 || (app.price > 0 && app.price <= 1000));
      // カスタム価格範囲（入力がある場合のみ適用）
      const matchMin   = minP === null ? true : app.price >= minP;
      const matchMax   = maxP === null ? true : app.price <= maxP;
      const matchQ     = !q
        || app.name.toLowerCase().includes(q)
        || app.description.toLowerCase().includes(q)
        || app.creator.toLowerCase().includes(q)
        || app.category.toLowerCase().includes(q);
      return matchCat && matchQuick && matchMin && matchMax && matchQ;
    });

    switch (sortMethod) {
      case "new":     return [...result].sort((a, b) => b.id - a.id);
      case "price":   return [...result].sort((a, b) => {
        if (a.price === 0 && b.price === 0) return 0;
        if (a.price === 0) return -1;
        if (b.price === 0) return 1;
        return a.price - b.price;
      });
      case "rating":  return [...result].sort((a, b) => b.rating - a.rating);
      case "popular": return [...result].sort((a, b) => (b.reviews * b.rating) - (a.reviews * a.rating));
      default:        return result;
    }
  }, [allApps, query, activeCategory, priceFilter, minPrice, maxPrice, sortMethod]);

  const hasFilter = !!(query || activeCategory !== "すべて" || priceFilter !== "all" || sortMethod !== "default" || minPrice || maxPrice);
  const resetAll  = () => { setQuery(""); setActiveCategory("すべて"); setPriceFilter("all"); setSortMethod("default"); setMinPrice(""); setMaxPrice(""); };

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />

          {/* 検索バー */}
          <div className="flex flex-1 items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="アプリ名、説明文、クリエイター名から検索..."
                className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setQuery(query)}
              className="shrink-0 flex items-center gap-1.5 h-9 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.97]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">検索</span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/create" className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-700">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">出品する</span>
            </Link>
            <Link href="/mypage" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600">
              <User className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">

          {/* ─── サイドバー（デスクトップ） ─── */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20 space-y-5">

              {/* カテゴリ */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">カテゴリ</h3>
                <div className="space-y-0.5">
                  {CATEGORIES.map((cat) => {
                    const count = cat === "すべて" ? allApps.length : allApps.filter(a => a.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-all ${
                          activeCategory === cat
                            ? "bg-emerald-600 font-bold text-white"
                            : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[11px] ${activeCategory === cat ? "text-emerald-200" : "text-gray-400"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 価格帯 */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">価格帯</h3>
                <div className="space-y-1">
                  {([
                    { value: "all",    label: "すべて" },
                    { value: "free",   label: "無料のみ" },
                    { value: "budget", label: "1,000円以下" },
                  ] as { value: PriceFilter; label: string }[]).map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition-all hover:bg-emerald-50">
                      <input
                        type="radio"
                        name="price"
                        checked={priceFilter === opt.value}
                        onChange={() => setPriceFilter(opt.value)}
                        className="h-3.5 w-3.5 accent-emerald-600"
                      />
                      <span className={`text-sm ${priceFilter === opt.value ? "font-bold text-emerald-700" : "text-gray-600"}`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
                {/* カスタム価格範囲 */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-2 text-[11px] font-semibold text-gray-400">金額を指定</p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="¥ 下限"
                      className="h-9 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                    />
                    <span className="shrink-0 text-xs text-gray-400">〜</span>
                    <input
                      type="number"
                      min={0}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="¥ 上限"
                      className="h-9 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </div>
                </div>
              </div>

              {/* 並び替え */}
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">並び替え</h3>
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortMethod(opt.value)}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition-all ${
                        sortMethod === opt.value
                          ? "bg-emerald-50 font-bold text-emerald-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-emerald-700"
                      }`}
                    >
                      {sortMethod === opt.value && <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ─── メインコンテンツ ─── */}
          <div className="min-w-0 flex-1">

            {/* モバイル用フィルタバー */}
            <div className="mb-4 lg:hidden">
              {/* カテゴリタブ */}
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeCategory === cat ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* 価格クイックバッジ + ソート */}
              <div className="flex flex-wrap gap-2">
                {([
                  { value: "all", label: "すべて" }, { value: "free", label: "無料" }, { value: "budget", label: "1,000円以下" },
                ] as { value: PriceFilter; label: string }[]).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setPriceFilter(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      priceFilter === opt.value ? "bg-amber-500 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"
                    }`}>
                    {opt.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={sortMethod}
                    onChange={(e) => setSortMethod(e.target.value as SortMethod)}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 outline-none focus:border-emerald-400"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* カスタム価格範囲（モバイル） */}
              <div className="mt-2 flex items-center gap-2">
                <span className="shrink-0 text-xs text-gray-500">金額指定：</span>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="¥ 下限"
                  className="h-9 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
                <span className="shrink-0 text-xs text-gray-400">〜</span>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="¥ 上限"
                  className="h-9 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            </div>

            {/* 結果ステータスバー */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {mounted ? (
                  <>
                    <span><span className="font-semibold text-emerald-700">{filtered.length}件</span> 表示中</span>
                    {activeCategory !== "すべて" && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {activeCategory}<button onClick={() => setActiveCategory("すべて")}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {priceFilter !== "all" && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                        {priceFilter === "free" ? "無料のみ" : "1,000円以下"}
                        <button onClick={() => setPriceFilter("all")}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {(minPrice || maxPrice) && (
                      <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                        {minPrice ? `¥${Number(minPrice).toLocaleString()}` : "¥0"}〜{maxPrice ? `¥${Number(maxPrice).toLocaleString()}` : "上限なし"}
                        <button onClick={() => { setMinPrice(""); setMaxPrice(""); }}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {query && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        「{query}」<button onClick={() => setQuery("")}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                  </>
                ) : <span className="text-gray-400">読み込み中...</span>}
              </div>
              {hasFilter && (
                <button onClick={resetAll} className="text-xs text-gray-400 underline underline-offset-2 hover:text-emerald-600">
                  すべてリセット
                </button>
              )}
            </div>

            {/* グリッド */}
            {mounted && filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((app) => <AppCard key={app.id} app={app} />)}
              </div>
            ) : mounted ? (
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-700">お探しのアプリは見つかりませんでした</p>
                  <p className="mt-1 text-sm text-gray-400">キーワードを変えるか、絞り込みをリセットしてください。</p>
                </div>
                <button onClick={resetAll} className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700">
                  すべて表示する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4]">
        <div className="flex items-center gap-3 text-emerald-600">
          <Sparkles className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">読み込み中...</span>
        </div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
