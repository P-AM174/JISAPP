"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  ChevronLeft,
  MessageSquare,
  Tag,
  Send,
  CheckCircle2,
  X,
  ExternalLink,
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

type Response = {
  id: string;
  requestId: string;
  creatorName: string;
  appUrl?: string;
  message: string;
  createdAt: string;
};

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

export default function RequestDetailPage() {
  const params = useParams();
  const reqId  = params.id as string;

  const [request,   setRequest]   = useState<AppRequest | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [creatorName, setCreatorName] = useState("");
  const [appUrl,    setAppUrl]    = useState("");
  const [message,   setMessage]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    const staticReq = STATIC_REQUESTS.find(r => r.id === reqId);
    if (staticReq) {
      setRequest(staticReq);
    } else {
      try {
        const raw = localStorage.getItem("jisapp_app_requests");
        if (raw) {
          const saved: AppRequest[] = JSON.parse(raw);
          const found = saved.find(r => r.id === reqId);
          if (found) setRequest(found);
        }
      } catch { /* noop */ }
    }

    try {
      const raw = localStorage.getItem(`jisapp_app_responses_${reqId}`);
      if (raw) setResponses(JSON.parse(raw));
    } catch { /* noop */ }
  }, [reqId]);

  const handleResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim() || !message.trim()) { setError("ニックネームとメッセージは必須です。"); return; }

    // appUrl の簡易バリデーション
    if (appUrl.trim() && !appUrl.trim().startsWith("http")) {
      setError("アプリURLは http:// または https:// から入力してください。");
      return;
    }

    const r: Response = {
      id:          `r_${Date.now()}`,
      requestId:   reqId,
      creatorName: creatorName.trim(),
      appUrl:      appUrl.trim() || undefined,
      message:     message.trim(),
      createdAt:   new Date().toLocaleDateString("ja-JP"),
    };
    const updated = [...responses, r];
    setResponses(updated);
    try { localStorage.setItem(`jisapp_app_responses_${reqId}`, JSON.stringify(updated)); } catch { /* noop */ }

    setSubmitted(true);
    setCreatorName(""); setAppUrl(""); setMessage(""); setError("");
  };

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f6f4]">
        <p className="text-gray-500">リクエストが見つかりませんでした。</p>
        <Link href="/requests" className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
          リクエスト一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* ─── ヘッダー ─── */}
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <BackButton label="戻る" fallbackHref="/requests" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="text-sm text-gray-400">/</span>
          <span className="truncate text-sm font-semibold text-gray-700">{request.title}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ─── 左：リクエスト詳細 ─── */}
          <div className="space-y-5 lg:col-span-2">
            {/* リクエストカード */}
            <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">{request.category}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Tag className="h-3 w-3" /> {request.authorName}
                </span>
                <span className="ml-auto text-xs text-gray-400">{request.createdAt}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <MessageSquare className="h-3 w-3" /> {request.responses + responses.length}件の返信
                </span>
              </div>
              <h1 className="text-lg font-black text-gray-900">{request.title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 whitespace-pre-line">{request.content}</p>
            </section>

            {/* 返信一覧 */}
            {responses.length > 0 && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-900">
                  <Rocket className="h-4 w-4 text-emerald-500" />
                  作ってみました！（{responses.length}件）
                </h2>
                <div className="space-y-4">
                  {responses.map(r => (
                    <div key={r.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                            {r.creatorName[0]}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{r.creatorName}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">{r.createdAt}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{r.message}</p>
                      {r.appUrl && (
                        <a
                          href={r.appUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          アプリを見る
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 自分で作る訴求 */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-5 flex items-center gap-4">
              <Terminal className="h-8 w-8 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">このアプリを自分でも作れます！</p>
                <p className="text-xs text-gray-500 mt-0.5">AIにアイデアを伝えてコードを生成してもらい、プレイグラウンドに貼るだけです。</p>
              </div>
              <Link href="/playground"
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
                作ってみる
              </Link>
            </div>
          </div>

          {/* ─── 右：返信フォーム ─── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
                    <Send className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900">作ってみた！と報告する</h2>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-gray-500">
                  プレイグラウンドでアプリを作ったら、URLを貼って共有しよう！
                </p>

                {submitted ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 py-6 text-center px-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <p className="font-bold text-emerald-700">返信を送信しました！</p>
                    <p className="text-xs text-emerald-600">リクエストした方がきっと喜んでくれます🎉</p>
                    <button onClick={() => setSubmitted(false)} className="text-xs text-emerald-600 underline mt-1">
                      別の返信をする
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResponse} className="space-y-3">
                    {error && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2">
                        <X className="h-4 w-4 text-rose-500" />
                        <p className="text-xs font-semibold text-rose-600">{error}</p>
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">ニックネーム <span className="text-rose-500">*</span></label>
                      <input type="text" value={creatorName} onChange={e => setCreatorName(e.target.value)}
                        placeholder="あなたのニックネーム"
                        maxLength={30}
                        className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">
                        作ったアプリのURL
                        <span className="ml-1 text-[10px] font-normal text-gray-400">（任意）</span>
                      </label>
                      <input type="url" value={appUrl} onChange={e => setAppUrl(e.target.value)}
                        placeholder="https://jisapp.com/apps/..."
                        className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                      <p className="mt-1 text-[10px] text-gray-400">プレイグラウンドで公開したURLを貼ってください</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">メッセージ <span className="text-rose-500">*</span></label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                        placeholder="どんなアプリを作ったか一言で教えてください。"
                        maxLength={200}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                    </div>
                    <button type="submit"
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                      返信を送る
                    </button>
                    <Link href="/playground"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                      <Terminal className="h-3.5 w-3.5" />
                      まず作ってみる →
                    </Link>
                  </form>
                )}
              </section>

              <Link href="/requests"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-emerald-600">
                <ChevronLeft className="h-4 w-4" /> リクエスト一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
