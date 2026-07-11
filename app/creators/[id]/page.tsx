"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  ChevronLeft,
  Star,
  Users,
  ArrowRight,
  BadgeCheck,
  Calendar,
  BarChart3,
  Camera,
  Code2,
  FileText,
  Mail,
  Music,
  ShoppingCart,
  Globe,
  Package,
  MessageSquare,
  Send,
  X,
  CheckCircle2,
  Lock,
} from "lucide-react";

// ─── クリエイターデータ ───
const CREATORS = [
  {
    id: 1,
    name: "田中 拓也",
    handle: "@takuya_dev",
    avatar: "TT",
    badge: "🏆 トップクリエイター",
    specialty: "生産性・AI",
    color: "from-emerald-500 to-teal-600",
    apps: 24,
    followers: 3420,
    sales: 1289,
    rating: 4.9,
    bio: "元SIerエンジニア。個人開発歴8年。AIと生産性ツールを組み合わせた「時間を創る」アプリ作りが得意です。GASとNotion APIの組み合わせが大好きで、毎月1〜2本ペースで出品中。",
    skills: ["Google Apps Script", "OpenAI API", "Notion API", "JavaScript", "生産性設計"],
    appIds: [1, 4, 5],
  },
  {
    id: 2,
    name: "山田 彩花",
    handle: "@ayaka_design",
    avatar: "YA",
    badge: "⭐ 殿堂入り",
    specialty: "デザイン・UI",
    color: "from-green-500 to-emerald-600",
    apps: 18,
    followers: 2890,
    sales: 956,
    rating: 4.8,
    bio: "フリーランスのWebデザイナー。使いやすさと見た目の美しさを両立したアプリ作りをモットーにしています。ユーザー目線のUX設計と、Figmaを使ったプロトタイプ開発が強みです。",
    skills: ["Figma", "HTML/CSS", "React", "UXデザイン", "Notion テンプレート"],
    appIds: [6, 7],
  },
  {
    id: 3,
    name: "佐々木 健",
    handle: "@ken_techlab",
    avatar: "SK",
    badge: "🔥 急上昇中",
    specialty: "データ分析",
    color: "from-teal-500 to-cyan-600",
    apps: 31,
    followers: 5120,
    sales: 2340,
    rating: 4.9,
    bio: "データサイエンティスト兼フルスタックエンジニア。Pythonとスプレッドシートを組み合わせたデータ自動化ツールを多数開発。「難しいことをシンプルに」をコンセプトに個人開発を楽しんでいます。",
    skills: ["Python", "Google Sheets", "GAS", "データ可視化", "BigQuery"],
    appIds: [2, 9, 10],
  },
  {
    id: 4,
    name: "中村 美咲",
    handle: "@misaki_apps",
    avatar: "NM",
    badge: "✨ 新鋭",
    specialty: "マーケ・SNS",
    color: "from-emerald-400 to-green-600",
    apps: 15,
    followers: 1980,
    sales: 612,
    rating: 4.7,
    bio: "SNSマーケター出身のアプリクリエイター。マーケティング現場で感じた「あったらいいな」を次々と形にしています。Instagram・X・TikTok向けのコンテンツ自動化が得意分野です。",
    skills: ["SNS運用", "コンテンツ設計", "AI文章生成", "EC最適化", "Instagram API"],
    appIds: [3, 8, 11, 12],
  },
];

// ─── 静的アプリデータ ───
const STATIC_APPS = [
  { id: 1,  name: "AIスケジュール最適化",      price: 2980, rating: 4.8, reviews: 234,  tag: "NEW",       gradient: "from-emerald-600 via-green-600 to-teal-700",  category: "生産性",     Icon: Calendar    },
  { id: 2,  name: "マーケットレポーター",       price: 1980, rating: 4.6, reviews: 189,  tag: "人気",      gradient: "from-rose-500 via-pink-600 to-red-600",        category: "分析",       Icon: BarChart3   },
  { id: 3,  name: "SNSコンテンツAI",           price: 2980, rating: 4.9, reviews: 412,  tag: "急上昇",    gradient: "from-amber-500 via-orange-500 to-red-500",     category: "マーケ",     Icon: Camera      },
  { id: 4,  name: "コード品質チェッカー",       price: 2480, rating: 4.7, reviews: 301,  tag: "NEW",       gradient: "from-emerald-500 via-teal-600 to-cyan-700",    category: "開発",       Icon: Code2       },
  { id: 5,  name: "タスク管理Pro",             price: 0,    rating: 4.5, reviews: 892,  tag: "無料",      gradient: "from-green-500 via-emerald-600 to-teal-600",   category: "生産性",     Icon: FileText    },
  { id: 6,  name: "メール文章アシスト",         price: 0,    rating: 4.4, reviews: 654,  tag: "無料",      gradient: "from-emerald-500 via-green-600 to-teal-600",   category: "ビジネス",   Icon: Mail        },
  { id: 7,  name: "音楽プレイリスト生成",       price: 0,    rating: 4.6, reviews: 1203, tag: "無料",      gradient: "from-green-500 via-emerald-600 to-teal-700",   category: "エンタメ",   Icon: Music       },
  { id: 8,  name: "EC商品説明ジェネレーター",  price: 0,    rating: 4.3, reviews: 445,  tag: "無料",      gradient: "from-orange-500 via-amber-500 to-yellow-500",  category: "EC",         Icon: ShoppingCart},
  { id: 9,  name: "ワンクリック議事録作成GAS", price: 980,  rating: 4.7, reviews: 156,  tag: "人気No.1",  gradient: "from-emerald-500 via-green-600 to-teal-600",   category: "業務効率化", Icon: FileText    },
  { id: 10, name: "自動シフト調整ツール",       price: 500,  rating: 4.6, reviews: 203,  tag: "コスパ最強",gradient: "from-teal-500 via-emerald-600 to-green-700",   category: "シフト管理", Icon: Calendar    },
  { id: 11, name: "かんたん請求書メーカー",     price: 780,  rating: 4.5, reviews: 98,   tag: "初心者向け",gradient: "from-green-500 via-teal-600 to-emerald-700",   category: "フリーランス",Icon: BarChart3   },
  { id: 12, name: "SNS予約投稿スケジューラー", price: 980,  rating: 4.8, reviews: 312,  tag: "急上昇",    gradient: "from-emerald-400 via-teal-500 to-cyan-600",    category: "SNS運用",    Icon: Globe       },
];

// ─── レビューデータ ───
type Review = {
  id: number;
  appId: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

const ALL_REVIEWS: Review[] = [
  // app 1: AIスケジュール最適化
  { id: 1,  appId: 1,  userName: "鈴木 康介",   rating: 5, comment: "スケジュールを任せるだけで残業が激減しました。毎朝の計画立ては今やこのアプリ頼りです！",         date: "2026/05/28" },
  { id: 2,  appId: 1,  userName: "林 由美子",   rating: 5, comment: "Googleカレンダーと連携が超スムーズ。シンプルなのに高機能で感動しました。",                       date: "2026/05/20" },
  { id: 3,  appId: 1,  userName: "上田 健太",   rating: 4, comment: "移動時間の自動確保が便利。もう少し細かい設定ができるとさらに良いです。",                           date: "2026/05/10" },
  // app 4: コード品質チェッカー
  { id: 4,  appId: 4,  userName: "野村 翔太",   rating: 5, comment: "コードレビューにかかる時間が半分以下になりました。新人エンジニアにも使わせています。",               date: "2026/05/25" },
  { id: 5,  appId: 4,  userName: "山本 さくら", rating: 4, comment: "セキュリティリスクの指摘が的確です。もう少しフロントエンドの対応が厚いと嬉しい。",                   date: "2026/05/15" },
  // app 5: タスク管理Pro
  { id: 6,  appId: 5,  userName: "中田 奈緒",   rating: 5, comment: "無料なのにここまで使えるのか…と正直驚きました。チーム全員で毎日使っています。",                     date: "2026/05/22" },
  { id: 7,  appId: 5,  userName: "西村 誠",     rating: 5, comment: "優先度管理が直感的で最高です。Todoistからこちらのアプリにすべてのタスクを移しました。",             date: "2026/05/18" },
  { id: 8,  appId: 5,  userName: "橋本 舞",     rating: 4, comment: "シンプルで気に入っています。スマホアプリ版もあればさらに良かったです。",                           date: "2026/05/08" },
  // app 2: マーケットレポーター
  { id: 9,  appId: 2,  userName: "藤田 裕介",   rating: 5, comment: "リアルタイムのチャートがめちゃくちゃ見やすいです。毎朝の市場チェックに欠かせません。",               date: "2026/05/27" },
  { id: 10, appId: 2,  userName: "岡田 智子",   rating: 4, comment: "カスタムアラートが非常に便利です。為替に対応してくれたので嬉しいです。",                           date: "2026/05/19" },
  // app 9: ワンクリック議事録
  { id: 11, appId: 9,  userName: "松田 一郎",   rating: 5, comment: "会議終了後1分でSlackに飛ぶのは感動ものです。議事録担当から解放されました。",                       date: "2026/05/26" },
  { id: 12, appId: 9,  userName: "村上 美咲",   rating: 5, comment: "精度が高くて驚きました。多少のノイズも拾ってくれるのでほぼ修正なしで使えます。",                     date: "2026/05/21" },
  // app 10: 自動シフト調整
  { id: 13, appId: 10, userName: "石川 大輝",   rating: 5, comment: "シフト作りに毎週4時間かかっていたのが20分に。スタッフからの希望収集も自動化できて最高。",           date: "2026/05/24" },
  { id: 14, appId: 10, userName: "坂本 里奈",   rating: 4, comment: "小さな飲食店でも十分使えます。もう少しカスタマイズ性があると完璧です。",                           date: "2026/05/16" },
  // app 3: SNSコンテンツAI
  { id: 15, appId: 3,  userName: "伊藤 蓮",     rating: 5, comment: "ハッシュタグ生成が神精度です。エンゲージメントが3倍になりました。",                               date: "2026/05/29" },
  { id: 16, appId: 3,  userName: "斎藤 麻衣",   rating: 5, comment: "TikTok用のキャプションを毎日生成してもらっています。本当に助かっています。",                       date: "2026/05/23" },
  { id: 17, appId: 3,  userName: "田村 晴香",   rating: 4, comment: "Instagram向けが特に使いやすいです。X向けにも少し特化してほしい。",                                 date: "2026/05/17" },
  // app 8: EC商品説明
  { id: 18, appId: 8,  userName: "高橋 勇太",   rating: 4, comment: "メルカリの商品説明が圧倒的に楽になりました。売れ行きも上がった気がします。",                         date: "2026/05/30" },
  // app 11: 請求書メーカー
  { id: 19, appId: 11, userName: "小林 恵子",   rating: 5, comment: "フリーランスになりたての頃に出会いたかったです。これ一本で請求書が全部片付きます。",                 date: "2026/05/25" },
  { id: 20, appId: 11, userName: "渡辺 直樹",   rating: 5, comment: "PDF出力まで1分以内は本当でした。freeeより直感的で使いやすいです。",                               date: "2026/05/14" },
  // app 12: SNS予約投稿
  { id: 21, appId: 12, userName: "加藤 涼",     rating: 5, comment: "X・Instagram・TikTokを一括管理できるのが神です。最適投稿時間の提案も精度が高い。",                 date: "2026/05/28" },
  { id: 22, appId: 12, userName: "木村 沙織",   rating: 4, comment: "インサイトが見やすくなりました。もっとアカウント数を増やせると嬉しいです。",                         date: "2026/05/20" },
  // app 6: メール文章アシスト
  { id: 23, appId: 6,  userName: "吉田 浩二",   rating: 5, comment: "敬語が苦手な自分にとって救世主です。取引先へのメールが毎回スムーズに書けます。",                     date: "2026/05/27" },
  { id: 24, appId: 6,  userName: "清水 朋子",   rating: 5, comment: "英語メールへの変換も精度が高くて驚きました。無料でここまで使えるのは凄い。",                         date: "2026/05/19" },
  // app 7: 音楽プレイリスト生成
  { id: 25, appId: 7,  userName: "前田 悠",     rating: 5, comment: "集中モードのプレイリストが本当にピッタリです。仕事中ずっと流してます。",                             date: "2026/05/26" },
  { id: 26, appId: 7,  userName: "中島 萌",     rating: 4, comment: "リラックスモードのBGMの選択が絶妙です。Spotifyより好みに合っている気がします。",                     date: "2026/05/18" },
];

// ─── 直接見積もりモーダル ───
function EstimateModal({ creatorName, creatorId, onClose }: { creatorName: string; creatorId: number; onClose: () => void }) {
  const router = useRouter();
  const [requirement, setRequirement] = useState("");
  const [budget,      setBudget]      = useState("");
  const [senderName,  setSenderName]  = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState("");

  const chatId = `creator_${creatorId}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement.trim()) { setError("要件を入力してください。"); return; }
    const consultation = {
      id:           `c_${Date.now()}`,
      creatorName,
      requirement:  requirement.trim(),
      budget:       budget.trim() || "応相談",
      senderName:   senderName.trim() || "匿名ユーザー",
      createdAt:    new Date().toLocaleDateString("ja-JP"),
    };
    try {
      const raw = localStorage.getItem("jisapp_consultations");
      const prev = raw ? JSON.parse(raw) : [];
      localStorage.setItem("jisapp_consultations", JSON.stringify([consultation, ...prev]));

      // チャットルーム情報を事前作成
      const chatRoom = {
        id: chatId,
        title: `${creatorName} への個別相談`,
        budget: budget.trim() || "応相談",
        deadline: "応相談",
        status: "相談中",
        creatorName,
        clientName: senderName.trim() || "あなた",
      };
      localStorage.setItem(`jisapp_chatroom_${chatId}`, JSON.stringify(chatRoom));

      // 最初のメッセージとして要件を送信
      const initMsg = [{
        id:         `msg_init_${Date.now()}`,
        text:       `【見積もり相談】\n${requirement.trim()}${budget.trim() ? `\n\n予算：${budget.trim()}` : ""}`,
        sender:     "user",
        senderName: senderName.trim() || "あなた",
        timestamp:  new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      }];
      localStorage.setItem(`jisapp_chat_${chatId}`, JSON.stringify(initMsg));
    } catch { /* noop */ }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-black text-gray-900">
            {creatorName} さんに相談する
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <p className="text-lg font-black text-gray-900">相談を送信しました！</p>
            <p className="text-sm text-gray-500">
              {creatorName} さんとのチャットルームが作成されました。
            </p>
            <button
              onClick={() => { onClose(); router.push(`/chat/${chatId}`); }}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              チャットルームを開く
            </button>
            <button onClick={onClose}
              className="text-sm text-gray-400 underline hover:text-gray-600">
              あとで確認する
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-700">
              💬 <span className="font-semibold">{creatorName}</span> さんへの見積もり相談フォームです。
              要件と予算感を共有してください。
            </div>
            {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                作ってほしいものの要件・詳細 <span className="text-rose-500">*</span>
              </label>
              <textarea value={requirement} onChange={e => setRequirement(e.target.value)} rows={5}
                placeholder="例：スプレッドシートで管理している顧客データから、自動でPDFの請求書を生成してメール送信するGASを作ってほしいです。"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">予算感（円）</label>
              <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                placeholder="例：30,000〜50,000円"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">お名前（任意）</label>
              <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
                placeholder="匿名ユーザー"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                キャンセル
              </button>
              <button type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                <Send className="h-3.5 w-3.5" /> 相談を送る
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── スキルバッジ ───
function SkillBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      {label}
    </span>
  );
}

// ─── アプリカード ───
function AppCard({ app }: { app: typeof STATIC_APPS[number] }) {
  const { Icon } = app;
  const priceLabel = app.price === 0 ? "無料" : `¥${app.price.toLocaleString()}`;
  const isFree   = app.price === 0;
  const isBudget = app.price > 0 && app.price <= 1000;

  return (
    <Link href={`/apps/${app.id}`} className="group block">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/60 hover:ring-emerald-200">
        <div className={`relative flex items-center justify-center bg-gradient-to-br ${app.gradient} px-5 py-6`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <span className="absolute top-2.5 right-2.5 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {app.tag}
          </span>
          <span className={`absolute bottom-2.5 left-2.5 rounded-full px-2 py-0.5 text-xs font-black ${
            isFree ? "bg-white/30 text-white backdrop-blur-sm" :
            isBudget ? "bg-white text-emerald-700" : "bg-white/90 text-gray-800"
          }`}>
            {priceLabel}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">{app.category}</span>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-gray-700">{app.rating}</span>
              <span className="text-[10px] text-gray-400">({app.reviews})</span>
            </div>
          </div>
          <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">{app.name}</h3>
          <div className="mt-auto flex items-center justify-end pt-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
              詳細を見る <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CreatorDetailPage() {
  const params = useParams();
  const creatorId = Number(params.id);
  const { data: session } = useSession();
  const [showEstimate,   setShowEstimate]   = useState(false);
  const [isFollowing,    setIsFollowing]    = useState(false);
  const [showAuthModal,  setShowAuthModal]  = useState(false);

  const creator = useMemo(() => CREATORS.find((c) => c.id === creatorId), [creatorId]);

  // フォロー状態をLocalStorageから復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jisapp_followed_creators");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      setIsFollowing(ids.includes(creatorId));
    } catch { /* noop */ }
  }, [creatorId]);

  const toggleFollow = () => {
    try {
      const raw = localStorage.getItem("jisapp_followed_creators");
      const ids: number[] = raw ? JSON.parse(raw) : [];
      const next = isFollowing ? ids.filter((id) => id !== creatorId) : [...ids, creatorId];
      localStorage.setItem("jisapp_followed_creators", JSON.stringify(next));
      setIsFollowing(!isFollowing);
    } catch { /* noop */ }
  };
  const creatorApps = useMemo(
    () => creator ? STATIC_APPS.filter((a) => creator.appIds.includes(a.id)) : [],
    [creator]
  );

  const creatorReviews = useMemo(() => {
    if (!creator) return [];
    return ALL_REVIEWS
      .filter((r) => creator.appIds.includes(r.appId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [creator]);

  if (!creator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f6f4]">
        <p className="text-gray-500">クリエイターが見つかりませんでした。</p>
        <Link href="/" className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
          トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {showEstimate && creator && (
        <EstimateModal creatorName={creator.name} creatorId={creator.id} onClose={() => setShowEstimate(false)} />
      )}

      {/* ── 未ログイン案内モーダル ── */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAuthModal(false)}
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
              クリエイターへの依頼・相談には<br />ログインが必要です。
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/creators/${creatorId}`)}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all"
              >
                ログイン・新規登録へ
              </Link>
              <button
                onClick={() => setShowAuthModal(false)}
                className="rounded-2xl border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700 truncate">{creator.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">

        {/* ─── プロフィールカード ─── */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          {/* グラデーションヘッダー */}
          <div className={`bg-gradient-to-br ${creator.color} px-6 pb-8 pt-10`}>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/25 text-2xl font-black text-white shadow-lg backdrop-blur-sm ring-4 ring-white/30">
                {creator.avatar}
              </div>
              <div className="text-center sm:text-left">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {creator.badge}
                </div>
                <h1 className="text-xl font-black text-white sm:text-2xl">{creator.name}</h1>
                <p className="text-sm font-semibold text-white/80">{creator.handle}</p>
              </div>
            </div>
          </div>

          {/* スタッツ */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: "出品数",     value: creator.apps,                    unit: "本" },
              { label: "フォロワー", value: creator.followers.toLocaleString(), unit: "人" },
              { label: "累計販売",   value: creator.sales.toLocaleString(),   unit: "件" },
            ].map((s) => (
              <div key={s.label} className="py-4 text-center">
                <p className="text-lg font-black text-gray-900">{s.value}<span className="text-xs font-semibold text-gray-400">{s.unit}</span></p>
                <p className="text-[11px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 評価バー */}
          <div className="flex items-center justify-center gap-2 border-b border-gray-100 py-3">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-black text-gray-900">{creator.rating}</span>
            <span className="text-xs text-gray-400">/ クリエイター評価</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
              <BadgeCheck className="h-3 w-3" /> 認証済み
            </span>
          </div>

          {/* 自己紹介 */}
          <div className="px-6 py-5">
            <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">自己紹介</h2>
            <p className="text-sm leading-relaxed text-gray-700">{creator.bio}</p>
          </div>

          {/* スキル */}
          <div className="px-6 pb-5">
            <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400">得意スキル</h2>
            <div className="flex flex-wrap gap-2">
              {creator.skills.map((skill) => <SkillBadge key={skill} label={skill} />)}
            </div>
          </div>

          {/* フォロー＋直接依頼ボタン */}
          <div className="border-t border-gray-100 px-6 py-5">
            <button
              onClick={toggleFollow}
              className={`mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                isFollowing
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              <Users className={`h-4 w-4 ${isFollowing ? "text-emerald-600" : ""}`} />
              {isFollowing ? "フォロー中" : "フォローする"}
            </button>
          </div>

          {/* 直接依頼ボタン */}
          <div className="px-6 pb-5">
            <button
              onClick={() => {
                if (!session) { setShowAuthModal(true); return; }
                setShowEstimate(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
              このクリエイターに直接開発を依頼する（見積もり相談）
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-400">
              要件と予算を送るだけ。通常1〜2営業日以内に返信があります。
            </p>
          </div>
        </section>

        {/* ─── 出品アプリ一覧 ─── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">このクリエイターの出品作品</h2>
                <p className="text-xs text-gray-400">{creatorApps.length}件のアプリ</p>
              </div>
            </div>
            <Link href="/search" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              すべて探す <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {creatorApps.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {creatorApps.map((app) => <AppCard key={app.id} app={app} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <Package className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">出品中のアプリはまだありません</p>
            </div>
          )}
        </section>

        {/* ─── 購入者レビュー一覧 ─── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <MessageSquare className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">購入者からのレビュー・評価</h2>
              <p className="text-xs text-gray-400">{creatorReviews.length}件のレビュー</p>
            </div>
          </div>

          {creatorReviews.length > 0 ? (
            <div className="space-y-3">
              {creatorReviews.map((review) => {
                const app = STATIC_APPS.find((a) => a.id === review.appId);
                return (
                  <div key={review.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      {/* 左：ユーザー情報 + 星 */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                          {review.userName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{review.userName}</p>
                          <div className="mt-0.5 flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
                              />
                            ))}
                            <span className="ml-1 text-xs font-semibold text-gray-500">{review.rating}.0</span>
                          </div>
                        </div>
                      </div>

                      {/* 右：アプリ名リンク + 日付 */}
                      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                        {app && (
                          <Link
                            href={`/apps/${app.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            📦 {app.name}
                          </Link>
                        )}
                        <span className="text-[11px] text-gray-400">{review.date}</span>
                      </div>
                    </div>

                    {/* コメント */}
                    <p className="mt-2.5 text-sm leading-relaxed text-gray-600 sm:pl-12">
                      {review.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <MessageSquare className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">まだレビューがありません</p>
              <p className="text-xs text-gray-400">アプリが購入されるとレビューが表示されます</p>
            </div>
          )}
        </section>

        {/* ─── フッター戻るボタン ─── */}
        <div className="flex justify-center pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
            トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
