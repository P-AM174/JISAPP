"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Sparkles,
  Search,
  Trash2,
  Clipboard,
  Play,
  RefreshCw,
  Code2,
  Eye,
  Terminal,
  Zap,
  Copy,
  CheckCircle2,
  X,
  Settings,
  Save,
  Undo2,
  Redo2,
  Key,
  FolderOpen,
  Rocket,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Send,
  Bot,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { CATEGORIES } from "@/lib/categories";
import { AppRunner } from "@/components/app-runner";
// ─── ショートカット一覧 ───
const SHORTCUTS = [
  { key: "Ctrl + Enter", desc: "アプリを動かす（実行）" },
  { key: "Ctrl + Z",     desc: "元に戻す（Undo）" },
  { key: "Ctrl + Y",     desc: "やり直す（Redo）" },
  { key: "Ctrl + S",     desc: "保存する" },
  { key: "Ctrl + F",     desc: "コード内検索" },
  { key: "Tab",          desc: "インデント（2スペース）" },
];

// ─── トースト ───
function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[500] flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-900/20 transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

// ─── ガイド画面（コードがない状態） ───
function GuideScreen({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* noop */ }
  };

  return (
    <>
      {/* ── 指示文モーダル ── */}
      {showPrompt && (
        <div
          className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowPrompt(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="relative bg-gradient-to-br from-sky-500 to-blue-600 px-6 pb-5 pt-6 text-white">
              <button
                onClick={() => setShowPrompt(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs font-black tracking-widest opacity-80">✦ ジサップ専用の指示文</p>
              <h2 className="mt-1.5 text-lg font-black leading-snug">AIにそのまま送れる指示文をコピーしよう！</h2>
            </div>

            {/* 本文 */}
            <div className="space-y-4 p-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                📌 <span className="font-bold">【ここに作りたいアプリ名を入れる】</span> の部分だけ書き換えて、そのままAIに送るだけ！
              </p>

              <div className="overflow-hidden rounded-2xl border border-sky-200 bg-sky-50">
                <div className="flex items-center justify-between bg-sky-600 px-4 py-2.5">
                  <span className="text-xs font-black text-white">📋 AIへの指示文</span>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all active:scale-95",
                      copied ? "bg-emerald-500 text-white" : "bg-white text-sky-700 hover:bg-sky-50"
                    )}
                  >
                    {copied ? <><CheckCircle2 className="h-3.5 w-3.5" />コピー済み！</> : <><Copy className="h-3.5 w-3.5" />コピーする</>}
                  </button>
                </div>
                <pre className="max-h-44 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {PROMPT_TEMPLATE}
                </pre>
              </div>

              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                ⚠️ コピーしたら <span className="font-black">【ここに作りたいアプリ名を入れる】</span> を「家計簿」「タイマー」など作りたいものに書き換えてからAIに送ってね！
              </div>

              <button
                onClick={() => setShowPrompt(false)}
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-6">

        {/* タイトル */}
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-800">
            AIで生成したコードを
            <span className="text-emerald-500 md:hidden">下にペーストするだけ！</span>
            <span className="hidden text-emerald-500 md:inline">左にペーストするだけ！</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">サーバーもデータベースも設定不要。コードを貼り付けると、ここに動くアプリが表示されます。</p>
        </div>

        {/* ステップ */}
        <div className="w-full max-w-sm space-y-2.5">
          <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-3.5 shadow-sm ring-1 ring-blue-200">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">1</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">AIにアイデアを伝える</p>
              <p className="mt-0.5 text-xs text-gray-500">ChatGPT・Claude・Gemini などに作りたいアプリを送る</p>
              <button
                onClick={() => setShowPrompt(true)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-500 active:scale-95"
              >
                <Copy className="h-4 w-4" />
                👆 ここをタップして指示文をコピー！
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-amber-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-600">2</div>
            <div>
              <p className="text-sm font-bold text-gray-800">AIが出したコードをコピー</p>
              <p className="mt-0.5 text-xs text-gray-500">生成されたHTMLコードをすべてコピーする</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-3.5 shadow-sm ring-1 ring-emerald-200">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white">3</div>
            <div>
              <p className="text-sm font-bold text-emerald-800">
                <span className="md:hidden">下のパネルに貼り付ける</span>
                <span className="hidden md:inline">左のパネルに貼り付ける</span>
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">「クリップボードから貼り付けて実行」ボタンを押すだけ！</p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenDrawer}
          className="text-[11px] text-gray-400 underline decoration-dotted underline-offset-2 hover:text-emerald-600 transition-colors"
        >
          💡 ChatGPT・Claude が作ったHTMLコードなら何でもそのまま動きます
        </button>
      </div>
    </>
  );
}


// ─── ガイドモーダルのステップ定義 ───
// ─── ガイドモーダル（4ステップ） ───

const PROMPT_TEMPLATE = `あなたは優秀なフロントエンドエンジニアです。
ジサップ（Jisapp）という初心者向けのシングルファイル開発環境で動かすための、
おしゃれで使いやすい「【ここに作りたいアプリ名を入れる】」のコードを作成してください。

ジサップの仕様に合わせて、必ず以下の【3つの開発ルール】を厳守して出力してください。

【ジサップ専用の開発ルール】
1. 【完全なHTML1枚（シングルファイル）で完結】
   CSS（Tailwind CSSのCDNを使用）もJavaScriptも、すべて独立させずに
   1つの「index.html」ファイルの中に丸ごと埋め込んでください。

2. 【デザインはTailwind CSSを使用】
   初心者向けに、明るく爽やかで洗練されたモダンなUIデザイン（ライトモード）にしてください。

3. 【データの保存・読み込みはジサップ共通API（非同期）を使用】
   ページを閉じてもデータが安全に保存されるよう、独自にlocalStorage等は使わず、以下の非同期APIを使用してください。
   ・保存: await window.Zisup.saveData('識別名', データ)
   ・読込: await window.Zisup.loadData('識別名')
   ※通信のタイムラグがあるため、必ず async/await を使用してデータの読み込み完了を待つロジック（初期化処理など）を組んでください。`;

function GuideModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [promptCopied, setPromptCopied] = useState(false);
  const total = 4;
  const isFirst = step === 0;
  const isLast  = step === total - 1;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch { /* noop */ }
  };

  // ステップカラー定義
  const STEP_COLORS = [
    { header: "from-sky-500 to-blue-600",       dot: "bg-sky-500"     },
    { header: "from-amber-500 to-orange-500",    dot: "bg-amber-500"   },
    { header: "from-emerald-500 to-green-600",   dot: "bg-emerald-500" },
    { header: "from-violet-500 to-purple-600",   dot: "bg-violet-500"  },
  ];
  const color = STEP_COLORS[step];

  return (
    <div
      className="fixed inset-0 z-[450] flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─ ヘッダー ─ */}
        <div className={`relative shrink-0 bg-gradient-to-br ${color.header} px-7 pb-7 pt-8 text-white`}>
          {/* × 閉じる */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ステップバッジ */}
          <span className="inline-block rounded-full bg-white/25 px-3 py-1 text-[11px] font-black tracking-widest">
            STEP {step + 1} / {total}
          </span>

          {/* タイトル */}
          <h2 className="mt-3 text-lg font-black leading-snug">
            {step === 0 && "💡 生成AI（ChatGPT・Gemini・Claude）でコードを出力しよう！"}
            {step === 1 && "🛠️ ジサップで動かして、AIと調整しよう！"}
            {step === 2 && "💾 完成したら、名前をつけて保存しよう！"}
            {step === 3 && "🚀 世界にひとつだけのアプリを出品しよう！"}
          </h2>

          {/* ステップドット */}
          <div className="mt-4 flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "rounded-full transition-all",
                  i === step ? "h-2 w-7 bg-white" : "h-2 w-2 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </div>

        {/* ─ 本文（スクロール可） ─ */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-[#334155]">

          {/* ══ STEP 1 ══ */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-base font-bold leading-relaxed text-[#334155]">
                プログラミング知識ゼロでOK！<br />
                下の指示文をそのままAIに送ろう
              </p>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-sky-200 bg-sky-600 px-4 py-2.5">
                  <span className="text-xs font-black text-white">✦ ジサップ専用プロンプト</span>
                  <button
                    onClick={copyPrompt}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition-all active:scale-95",
                      promptCopied
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-sky-700 hover:bg-sky-50"
                    )}
                  >
                    {promptCopied
                      ? <><CheckCircle2 className="h-3.5 w-3.5" />コピー済み！</>
                      : <><Copy className="h-3.5 w-3.5" />コピーする</>}

                  </button>
                </div>
                <pre className="max-h-44 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {PROMPT_TEMPLATE}
                </pre>
              </div>

              <div className="rounded-2xl bg-amber-100 border border-amber-300 px-4 py-3">
                <p className="text-sm font-black text-amber-800">
                  ⚠️ 送る前に必ずここを書き換えてね！
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  <span className="rounded bg-amber-300 px-1.5 py-0.5 font-black">【ここに作りたいアプリ名を入れる】</span>
                  <br />↓<br />
                  「10秒タイマー」「筋トレ記録」「家計簿」など、<br />
                  作りたいアプリの名前に書き換えてから送ってね！
                </p>
              </div>
            </div>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-base font-bold leading-relaxed text-[#334155]">
                🛠️ エラーもデザインも、AIに丸投げでOK！
              </p>

              <div className="space-y-2.5">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3.5">
                  <p className="text-sm font-black text-amber-800 mb-2">困ったらこのまま貼るだけ👇</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-sm">・動かない時</span>
                      <span className="rounded-lg bg-amber-200 px-2 py-0.5 text-sm font-bold text-amber-900">👉「このエラーを直して」</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-sm">・変えたい時</span>
                      <span className="rounded-lg bg-amber-200 px-2 py-0.5 text-sm font-bold text-amber-900">👉「もっと明るい色にして」</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3.5">
                  <p className="text-sm font-black text-sky-800 mb-1.5">慣れてきたら…</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["機能を追加して", "もっとおしゃれにして"].map((t) => (
                      <span key={t} className="rounded-full bg-sky-200 px-3 py-1 text-xs font-bold text-sky-800">💬 「{t}」</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-sky-700 leading-relaxed">AIと会話しながら自分だけのアプリを完成させよう！</p>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 3 ══ */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-base font-bold leading-relaxed text-[#334155]">
                いい感じに動いたら<br />
                <span className="text-emerald-600">「💾 保存する」</span>を押そう！
              </p>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                <p className="text-sm font-black text-emerald-700 mb-1">📂 マイプロジェクトに保存されるよ</p>
                <p className="text-sm leading-relaxed text-emerald-700">
                  ブラウザを閉じても消えない。<br />いつでも続きから再開できる！
                </p>
              </div>
            </div>
          )}

          {/* ══ STEP 4 ══ */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-base font-bold leading-relaxed text-[#334155]">
                いよいよクリエイターデビュー！<br />
                マーケットに出品しよう🎉
              </p>

              <div className="space-y-2">
                {[
                  { num: "①", text: "「マイプロジェクト」ページへ移動" },
                  { num: "②", text: "カードの「🚀 出品する」を押す" },
                  { num: "③", text: "紹介文とアイコン絵文字を決めて完了！" },
                ].map(item => (
                  <div key={item.num} className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500 text-sm font-black text-white">
                      {item.num}
                    </span>
                    <p className="text-sm font-semibold text-violet-800">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 px-4 py-3 text-sm font-bold text-violet-800 text-center">
                🌎 世界中の人があなたのアプリを使える！
              </div>
            </div>
          )}
        </div>

        {/* ─ フッターナビ ─ */}
        <div className="shrink-0 flex items-center gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          {/* 戻るボタン（1ページ目は非表示） */}
          {!isFirst ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </button>
          ) : (
            <div className="w-[88px]" /> // 戻るボタンと同幅のスペーサー
          )}

          {/* 次へ / 閉じるボタン */}
          {isLast ? (
            <button
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.97]"
            >
              <Rocket className="h-4 w-4" />
              閉じる（さっそく作ってみる！）
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#334155] py-2.5 text-sm font-black text-white hover:bg-slate-600 transition-all active:scale-[0.97]"
            >
              次へ
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── チャットウィジェット ───
type ChatMessage = { role: "user" | "assistant"; content: string };

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "こんにちは！ジサップへようこそ！🎉\n「APIキーの設定って何？」とか「AIにどう質問すれば面白いアプリが作れる？」など、使い方のコツを何でも聞いてね！",
};

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 120);
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/playground-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content ?? "うまく答えられませんでした😅" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "通信エラーが発生しました。もう一度試してね🙏" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* チャットウィンドウ */}
      <div
        className={cn(
          "fixed bottom-20 right-5 z-[600] flex w-[340px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 transition-all duration-300",
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
        style={{ maxHeight: "520px" }}
      >
        {/* ヘッダー */}
        <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">ジサップ AIアシスタント</p>
            <p className="text-[10px] text-emerald-100">使い方・プロンプト相談なんでも</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* メッセージ一覧 */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 px-4 py-4" style={{ minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Bot className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 shadow-sm ring-1 ring-gray-100 rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* ローディング */}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Bot className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 入力エリア */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
          <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-1.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="使い方を質問する..."
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all",
                input.trim() && !loading
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-90"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">
            使い方・プロンプトのコツを相談できます
          </p>
        </div>
      </div>

      {/* フローティングボタン */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-[600] flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-bold text-white shadow-2xl transition-all duration-300 active:scale-95",
          open
            ? "bg-gray-700 shadow-gray-900/30 hover:bg-gray-800"
            : "bg-gradient-to-r from-emerald-600 to-green-500 shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105"
        )}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span>ジサップの使い方を質問する</span>
          </>
        )}
      </button>
    </>
  );
}

// ─── ツールバーボタン（アイコン＋テキスト） ───
function ToolBtn({
  icon,
  label,
  onClick,
  disabled = false,
  danger = false,
  active = false,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
  title?: string;
}) {
  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-0.5 px-1.5 py-1 opacity-30 cursor-not-allowed">
        <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
        <span className="text-[9px] text-gray-400 whitespace-nowrap">{label}</span>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 transition-all active:scale-95",
        danger
          ? "text-gray-500 hover:bg-rose-50 hover:text-rose-500"
          : active
          ? "bg-emerald-100 text-emerald-700"
          : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
      <span className="text-[9px] whitespace-nowrap">{label}</span>
    </button>
  );
}

// ─── メインページ ───
export default function PlaygroundPage() {
  const { data: session } = useSession();

  // ── コード状態（デフォルト空：ガイドを表示するため） ──
  const [code, setCode]           = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  // ── Undo / Redo（2スタック） ──
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const applyCode = useCallback((newCode: string) => {
    setUndoStack((u) => [...u.slice(-99), code]);
    setRedoStack([]);
    setCode(newCode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, code]);
    setUndoStack((u) => u.slice(0, -1));
    setCode(prev);
  }, [undoStack, code]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, code]);
    setRedoStack((r) => r.slice(0, -1));
    setCode(next);
  }, [redoStack, code]);

  // ── 検索 ──
  const [searchQuery, setSearchQuery]   = useState("");
  const [showSearch, setShowSearch]     = useState(false);
  const [matchCount, setMatchCount]     = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  // ── UI状態 ──
  const [autoRun, setAutoRun]           = useState(true);
  const [copied, setCopied]             = useState(false);
  const [activePane, setActivePane]     = useState<"editor" | "preview">("editor");
  const [iframeKey, setIframeKey]       = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [apiKey, setApiKey]             = useState("");
  const [apiKeyInput, setApiKeyInput]   = useState("");
  const [toast, setToast]               = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const [publishing, setPublishing]     = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishTitle, setPublishTitle]       = useState("");
  const [publishDesc, setPublishDesc]         = useState("");
  const [publishCategory, setPublishCategory] = useState("");
  const [publishListed, setPublishListed]     = useState(true);
  const [publishedUrl, setPublishedUrl]       = useState<string | null>(null);
  const [urlCopied, setUrlCopied]             = useState(false);

  // 保存モーダル
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle]         = useState("");

  // 離脱確認モーダル
  const [showLeaveModal, setShowLeaveModal]   = useState(false);
  const [lastSavedCode, setLastSavedCode]     = useState("");
  const [leaveAfterSave, setLeaveAfterSave]   = useState(false);

  // 下部ドロワー
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef  = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorFocused, setEditorFocused] = useState(false);

  const router = useRouter();

  const handlePublish = async () => {
    const title = publishTitle.trim() || "プレイグラウンドアプリ";
    if (!code.trim() || publishing) return;
    if (publishListed && !publishCategory) {
      setToast({ msg: "カテゴリを選択してください", show: true });
      setTimeout(() => setToast({ msg: "", show: false }), 3000);
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/apps/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: publishDesc.trim() || null,
          html_code: code,
          category: publishCategory || null,
          is_listed: publishListed,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "出品に失敗しました");
      const appUrl = `${window.location.origin}/apps/${json.id}`;
      setPublishedUrl(appUrl);
      // コードとタイトルをlocalStorageに保存（マイプロジェクトに反映）
      try {
        localStorage.setItem("jisapp_playground_code", code);
        localStorage.setItem("jisapp_playground_title", title);
        const map = JSON.parse(localStorage.getItem("jisapp_published_map") ?? "{}");
        map["saved_playground"] = {
          appId: json.id,
          url: appUrl,
          title,
          description: publishDesc.trim(),
          category: publishCategory || null,
          is_listed: publishListed,
        };
        localStorage.setItem("jisapp_published_map", JSON.stringify(map));
      } catch { /* noop */ }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "出品に失敗しました";
      setToast({ msg, show: true });
      setTimeout(() => setToast({ msg: "", show: false }), 3000);
    } finally {
      setPublishing(false);
    }
  };

  // 行番号とスクロール同期
  const syncLineNumbers = () => { /* 行番号は非表示のためno-op */ };

  // ── ?load=1 のときだけ localStorage から前回のコードを復元 ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("load") !== "1") return;
    try {
      const saved = localStorage.getItem("jisapp_playground_code") ?? "";
      if (saved.trim()) {
        setCode(saved);
        setPreviewHtml(saved);
        setLastSavedCode(saved);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try {
      const key = localStorage.getItem("jisapp_api_key") ?? "";
      setApiKey(key);
      setApiKeyInput(key);
    } catch { /* noop */ }
  }, []);

  // ── 自動実行（コードがある場合のみ） ──
  useEffect(() => {
    if (!autoRun || !code.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewHtml(code);
      setIframeKey((k) => k + 1);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [code, autoRun]);

  // ── 検索マッチ数 ──
  useEffect(() => {
    if (!searchQuery.trim()) { setMatchCount(0); setCurrentMatch(0); return; }
    const q = searchQuery.toLowerCase();
    const src = code.toLowerCase();
    let count = 0, idx = 0;
    while ((idx = src.indexOf(q, idx)) !== -1) { count++; idx += q.length; }
    setMatchCount(count);
    setCurrentMatch(count > 0 ? 1 : 0);
  }, [searchQuery, code]);

  // ── 検索ジャンプ ──
  const jumpToMatch = useCallback(
    (direction: "next" | "prev") => {
      if (!searchQuery.trim() || matchCount === 0 || !drawerTextareaRef.current) return;
      const q = searchQuery.toLowerCase();
      const src = code.toLowerCase();
      const positions: number[] = [];
      let idx = 0;
      while ((idx = src.indexOf(q, idx)) !== -1) { positions.push(idx); idx += q.length; }
      const nextIdx =
        direction === "next"
          ? currentMatch % matchCount
          : (currentMatch - 2 + matchCount) % matchCount;
      setCurrentMatch(nextIdx + 1);
      const pos = positions[nextIdx];
      const ta = drawerTextareaRef.current;
      ta.focus();
      ta.setSelectionRange(pos, pos + searchQuery.length);
      ta.scrollTop = Math.max(0, (code.substring(0, pos).split("\n").length - 1) * 20 - 100);
    },
    [searchQuery, matchCount, currentMatch, code]
  );

  // ── ツールハンドラ ──
  const handleClear = () => {
    applyCode("");
    setPreviewHtml("");
    drawerTextareaRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) applyCode(text);
      drawerTextareaRef.current?.focus();
    } catch {
      alert("クリップボードへのアクセスを許可してください（ブラウザの設定）");
    }
  };

  const handleRun = useCallback(() => {
    if (!code.trim()) return;
    setPreviewHtml(code);
    setIframeKey((k) => k + 1);
  }, [code]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  // 保存モーダルを開く（コードがある場合のみ）
  const handleSave = () => {
    if (!code.trim()) return;
    // 既存タイトルがあれば引き継ぐ
    try {
      const prev = localStorage.getItem("jisapp_playground_title") ?? "";
      setSaveTitle(prev);
    } catch { /* noop */ }
    setShowSaveModal(true);
  };

  // 実際の保存処理（モーダルの「保存する」から呼び出す）
  const handleSaveConfirm = async () => {
    const title = saveTitle.trim();
    if (!title) return;

    // タイトルと本文を localStorage に保存
    try {
      localStorage.setItem("jisapp_playground_code", code);
      localStorage.setItem("jisapp_playground_title", title);
    } catch { /* noop */ }

    setShowSaveModal(false);
    setLastSavedCode(code);   // 保存済みコードを記録

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.user?.email) {
        headers["x-user-id"] = session.user.email;
      }
      const res = await fetch("/api/playground", {
        method: "PUT",
        headers,
        body: JSON.stringify({ html_code: code, css_code: "", js_code: "" }),
      });
      if (!res.ok) {
        showToast("ローカルに保存しました（サーバー保存は失敗）");
      } else {
        showToast(`「${title}」を保存しました ✓`);
      }
    } catch {
      showToast("ローカルに保存しました（オフライン）");
    }

    // 「保存してから戻る」フローの場合は離脱
    if (leaveAfterSave) {
      setLeaveAfterSave(false);
      setTimeout(() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }, 600);
    }
  };

  const handleSaveApiKey = () => {
    try {
      localStorage.setItem("jisapp_api_key", apiKeyInput);
      setApiKey(apiKeyInput);
      setShowSettings(false);
      showToast("APIキーを保存しました ✓");
    } catch { /* noop */ }
  };

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  // ── キーボードショートカット ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleRun(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      setShowSearch(true);
      setTimeout(() => searchRef.current?.focus(), 50);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const next  = code.substring(0, start) + "  " + code.substring(end);
      applyCode(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
  };

  const lineCount = code.split("\n").length;
  const charCount = code.length;
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const showGuide = !previewHtml.trim();
  const isDirty = code.trim() !== "" && code !== lastSavedCode;


  const handleBack = () => {
    if (isDirty) {
      setShowLeaveModal(true);
    } else {
      if (window.history.length > 1) router.back();
      else router.push("/");
    }
  };

  const confirmLeave = () => {
    setShowLeaveModal(false);
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">

      {/* ══ トースト ══ */}
      <Toast message={toast.msg} show={toast.show} />

      {/* ══ 使い方ガイドモーダル ══ */}
      {showGuideModal && <GuideModal onClose={() => setShowGuideModal(false)} />}


      {/* ══ 設定モーダル ══ */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                <Key className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">AI APIキー設定</h2>
                <p className="text-xs text-gray-500">ブラウザに安全に保存されます</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="ml-auto rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  OpenAI / Groq APIキー
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-... または gsk_..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                  ※ このキーはあなたのブラウザのLocalStorageにのみ保存されます。外部サーバーへは送信されません。
                </p>
              </div>
              {apiKey && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">
                    APIキー設定済み（{apiKey.slice(0, 8)}…）
                  </span>
                </div>
              )}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                >
                  <Save className="h-4 w-4" />
                  設定を保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ヘッダー ══════════ */}
      <header className="flex shrink-0 items-center gap-1 border-b border-emerald-200 bg-white px-2 py-2 shadow-sm sm:gap-2 sm:px-3">

        <button
          type="button"
          onClick={handleBack}
          className="relative flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">戻る</span>
          {isDirty && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400" title="未保存の変更があります" />
          )}
        </button>

        <div className="mx-1 h-4 w-px bg-gray-200" />

        {/* ロゴ */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
            <Terminal className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-black text-gray-900 whitespace-nowrap hidden sm:block">
            コードプレイグラウンド
          </span>
          <span className="text-sm font-black text-gray-900 whitespace-nowrap sm:hidden">
            プレイグラウンド
          </span>
        </div>

        {/* 初心者ガイドボタン（タイトル右） */}
        <button
          onClick={() => setShowGuideModal(true)}
          className="ml-1 flex shrink-0 items-center gap-1 rounded-xl bg-amber-100 px-2 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-200 active:scale-95 sm:ml-2 sm:gap-1.5 sm:px-3"
        >
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:block">初心者ガイド</span>
        </button>

        {/* 右ツール群 */}
        <div className="ml-auto flex items-center gap-1">

          {/* 自動実行トグル（PCのみ） */}
          <button
            onClick={() => setAutoRun((v) => !v)}
            className={cn(
              "hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
              autoRun
                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            <Zap className="h-3 w-3" />
            {autoRun ? "自動実行 ON" : "自動実行 OFF"}
          </button>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            title="コードを保存 (Ctrl+S)"
            className="flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-gray-500 transition-all hover:bg-gray-100 hover:text-emerald-600 sm:px-2"
          >
            <Save className="h-4 w-4" />
            <span className="hidden text-[9px] font-semibold sm:block">保存する</span>
          </button>

          {/* マイプロジェクトボタン（モバイルでは非表示） */}
          <Link
            href="/projects"
            title="マイプロジェクト"
            className="hidden sm:flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-gray-500 transition-all hover:bg-gray-100 hover:text-violet-600"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="text-[9px] font-semibold">プロジェクト</span>
          </Link>

          <div className="mx-0.5 h-6 w-px bg-gray-200 sm:mx-1" />

          {/* ▶ アプリを動かすボタン（メイン） */}
          <button
            onClick={handleRun}
            disabled={!code.trim()}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black shadow-md transition-all active:scale-[0.97] sm:gap-2 sm:px-4",
              code.trim()
                ? "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            <Play className="h-4 w-4 shrink-0" />
            <span className="hidden sm:block">アプリを動かす</span>
            <span className="sm:hidden">実行</span>
          </button>
        </div>
      </header>

      {/* ══════════ メインコンテンツ（レスポンシブ分割） ══════════ */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">

        {/* ── コードパネル（モバイル：下部常時表示 / PC：左ペイン） ── */}
        <div className="order-2 flex h-[200px] shrink-0 flex-col border-t-2 border-t-emerald-400 bg-white md:order-1 md:h-auto md:w-[42%] md:border-r-2 md:border-r-emerald-400 md:border-t-0">

          {/* パネルヘッダー */}
          <div className="flex shrink-0 items-center justify-between border-b border-emerald-100 bg-emerald-50 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <Clipboard className="h-3.5 w-3.5 text-emerald-500" />
              <span className="md:hidden">⬇ ここにコードを貼り付ける</span>
              <span className="hidden md:inline">⬅ ここにコードを貼り付ける</span>
            </span>
            <div className="flex items-center gap-0.5">
              <button onClick={undo} disabled={!canUndo} title="元に戻す" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleClear} title="全削除" className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ワンクリック貼り付けボタン */}
          <button
            onClick={async () => { await handlePaste(); setTimeout(handleRun, 100); }}
            className="flex shrink-0 items-center justify-center gap-2 border-b border-emerald-100 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 active:scale-[0.99]"
          >
            <Clipboard className="h-4 w-4" />
            クリップボードから貼り付けて実行
          </button>

          {/* テキストエリア */}
          <textarea
            ref={drawerTextareaRef}
            value={code}
            onChange={(e) => applyCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"ここにコードを貼り付けてください\n（AIが生成したHTMLをそのまま貼り付けるだけでOK）"}
            spellCheck={false}
            className="flex-1 min-h-0 resize-none bg-white p-3 font-mono text-xs leading-5 text-gray-800 outline-none placeholder:text-gray-400 focus:outline-none"
          />

          {/* フッター */}
          <div className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-1.5">
            <span className="text-[10px] text-gray-400">
              {code.trim() ? `${code.split("\n").length}行 · ${code.length.toLocaleString()}文字` : "コードを貼り付けて開始"}
            </span>
            <button
              onClick={handleRun}
              disabled={!code.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="h-3.5 w-3.5" />
              プレビュー表示
            </button>
          </div>
        </div>

        {/* ── プレビューパネル（モバイル：上部 / PC：右ペイン） ── */}
        <div className="order-1 flex min-h-0 flex-1 flex-col bg-white md:order-2">

          {/* ブラウザクローム */}
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2">
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-md bg-white px-3 py-1 ring-1 ring-gray-200">
              <span className={cn("h-2 w-2 shrink-0 rounded-full transition-colors", showGuide ? "bg-gray-300" : "animate-pulse bg-emerald-400")} />
              <span className="truncate text-[11px] text-gray-400">
                {showGuide ? "コードを貼り付けると表示されます" : "プレビュー"}
              </span>
            </div>
            <button
              onClick={() => { if (code.trim()) { setPreviewHtml(code); setIframeKey((k) => k + 1); } }}
              title="再読み込み"
              className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-emerald-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* プレビュー or ガイド */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute inset-0 overflow-y-auto">
              {showGuide ? (
                <GuideScreen
                  onOpenDrawer={() => drawerTextareaRef.current?.focus()}
                />
              ) : (
                <AppRunner key={iframeKey} srcDoc={previewHtml} title="プレビュー" className="h-full" />
              )}
            </div>
          </div>

          {/* 公開リンク（コードあるとき） */}
          {!showGuide && (
            <div className="flex shrink-0 items-center justify-end border-t border-gray-100 bg-gray-50 px-3 py-1.5">
              <button
                onClick={() => setShowPublishModal(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Rocket className="h-3 w-3" />
                このアプリを公開する →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* チャットウィジェット（非表示中） */}
      {/* <ChatWidget /> */}

      {/* ── 離脱確認モーダル ── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                <Save className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-base font-black text-gray-900">保存されていない変更があります</h3>
              <p className="mt-2 text-sm text-gray-500">このまま戻るとコードが失われます。</p>
            </div>
            <div className="flex flex-col gap-2 border-t border-gray-100 p-4">
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setLeaveAfterSave(true);
                  try {
                    const prev = localStorage.getItem("jisapp_playground_title") ?? "";
                    setSaveTitle(prev);
                  } catch { /* noop */ }
                  setShowSaveModal(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                保存してから戻る
              </button>
              <button
                onClick={confirmLeave}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 active:scale-[0.98]"
              >
                保存せずに戻る
              </button>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 保存モーダル ── */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
                  <Save className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-black text-gray-900">プロジェクトを保存</span>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  プロジェクト名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveConfirm(); }}
                  placeholder="例：タスク管理アプリ、計算機..."
                  maxLength={60}
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <p className="mt-1.5 text-[11px] text-gray-400">マイプロジェクトページに表示される名前です</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveConfirm}
                  disabled={!saveTitle.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  保存する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 出品モーダル ── */}
      {showPublishModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !publishedUrl) {
              setShowPublishModal(false);
              setPublishListed(true);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">

            {/* ── 成功後の URL 表示 ── */}
            {publishedUrl ? (
              <>
                <div className="bg-emerald-50 px-6 py-5 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-300">
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-base font-black text-emerald-900">{publishListed ? "出品しました！" : "URLを発行しました！"}</p>
                  <p className="mt-1 text-xs text-emerald-700">{publishListed ? "マーケットに公開されました" : "URLを知っている人だけがアクセスできます"}</p>
                </div>
                <div className="p-6 space-y-4">
                  {/* URL 表示＆コピー */}
                  <div>
                    <p className="mb-2 text-xs font-bold text-gray-600">アプリの URL</p>
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <span className="flex-1 truncate font-mono text-xs text-emerald-800">{publishedUrl}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(publishedUrl);
                          setUrlCopied(true);
                          setTimeout(() => setUrlCopied(false), 2000);
                        }}
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        {urlCopied ? "コピー済み ✓" : "コピー"}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    URLを知っている人なら誰でもアクセス・使用できます
                  </p>
                  {/* アクションボタン */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowPublishModal(false);
                        setPublishedUrl(null);
                        setPublishTitle("");
                        setPublishDesc("");
                        setPublishCategory("");
                        setPublishListed(true);
                      }}
                      className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      編集を続ける
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const relative = new URL(publishedUrl).pathname;
                          router.push(relative);
                        } catch {
                          router.push(publishedUrl);
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700"
                    >
                      アプリを開く
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* ── 出品フォーム ── */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
                      <Rocket className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-base font-black text-gray-900">アプリを公開する</span>
                  </div>
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4 p-6">
                  {/* 公開モード切り替え */}
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-bold">
                    <button
                      type="button"
                      onClick={() => setPublishListed(false)}
                      className={cn(
                        "flex-1 py-2.5 transition-colors",
                        !publishListed ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      🔗 URLのみ発行
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublishListed(true)}
                      className={cn(
                        "flex-1 py-2.5 transition-colors border-l border-gray-200",
                        publishListed ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      🚀 マーケットに出品
                    </button>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700">
                      アプリ名 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={publishTitle}
                      onChange={(e) => setPublishTitle(e.target.value)}
                      placeholder="例：タスク管理ツール、計算機アプリ..."
                      maxLength={60}
                      autoFocus
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700">
                      説明（任意）
                    </label>
                    <textarea
                      value={publishDesc}
                      onChange={(e) => setPublishDesc(e.target.value)}
                      placeholder="このアプリで何ができるか簡単に説明してください..."
                      rows={3}
                      maxLength={200}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  {/* カテゴリ選択（出品時のみ必須） */}
                  {publishListed && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">
                        カテゴリ <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((cat) => {
                          const selected = publishCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setPublishCategory(selected ? "" : cat.id)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                                selected
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                              )}
                            >
                              {cat.emoji} {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                    {publishListed
                      ? "マーケットに公開されます。URLを知らない人もアプリを見つけられます。"
                      : "URLを知っている人だけがアクセスできます。マーケットには掲載されません。"}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowPublishModal(false)}
                      className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={publishing || !publishTitle.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      {publishing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {publishListed ? "出品中…" : "発行中…"}
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4" />
                          {publishListed ? "出品する" : "URLを発行する"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
