"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  Trash2,
  Clipboard,
  Play,
  RefreshCw,
  Code2,
  Eye,
  Zap,
  Copy,
  CheckCircle2,
  X,
  Settings,
  Save,
  Undo2,
  Redo2,
  Key,
  Rocket,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { CATEGORIES } from "@/lib/categories";
import { AppRunner } from "@/components/app-runner";
import { ShareButtonRow, AppUrlCopyField } from "@/components/share-button";
import { JisappLogoIcon } from "@/components/jisapp-logo";
import { SECRETS_STUDIO_GUIDE } from "@/lib/playground/prompt-template";
import { SecretsSettingsModal } from "@/components/secrets/secrets-settings-modal";
import { StudioLoginPromptModal } from "@/components/studio-login-prompt-modal";
import { CodeEditorPanel } from "@/components/playground/code-editor-panel";
import { PromptBuilderModal } from "@/components/playground/prompt-builder-modal";
import { EmbeddedSecretWarningModal } from "@/components/playground/embedded-secret-warning-modal";
import { detectEmbeddedSecrets } from "@/lib/playground/detect-embedded-secrets";
import { supabase } from "@/lib/supabase";
import {
  markStudioLoginPromptShown,
  wasStudioLoginPromptShown,
} from "@/lib/studio/login-prompt";
// ─── ショートカット一覧 ───
const SHORTCUTS = [
  { key: "Ctrl + Enter", desc: "プレビューを更新" },
  { key: "Ctrl + Z",     desc: "元に戻す（Undo）" },
  { key: "Ctrl + Y",     desc: "やり直す（Redo）" },
  { key: "Ctrl + S",     desc: "下書き保存" },
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

// ─── コード未入力時の簡易ガイド ───
function SimpleCodeGuide({
  onPaste,
  onManualInput,
  onOpenGuide,
}: {
  onPaste?: () => void;
  onManualInput?: () => void;
  onOpenGuide?: () => void;
}) {
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false);
  const [promptBuilderTab, setPromptBuilderTab] = useState<"template" | "rules">("template");

  const openPromptBuilder = (tab: "template" | "rules" = "template") => {
    setPromptBuilderTab(tab);
    setPromptBuilderOpen(true);
  };

  const steps: { text: string; buildPrompt?: boolean }[] = [
    { text: "専用プロンプトを AI に送り、作りたいアプリを伝える", buildPrompt: true },
    { text: "出力された HTML コードをすべてコピーする" },
    { text: "下のボタンで、コピーしたコードをここに入れる" },
    { text: "「プレビュー」タブで動作を確認する" },
    { text: "問題なければ「公開/URL発行」から URL を発行する" },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gradient-to-b from-emerald-50/80 to-white px-4 py-5">
      <PromptBuilderModal
        open={promptBuilderOpen}
        onClose={() => setPromptBuilderOpen(false)}
        initialTab={promptBuilderTab}
      />
      <p className="text-xs font-bold tracking-wide text-emerald-700">使い方</p>
      <h2 className="mt-1 text-base font-black text-gray-900">AI が作ったコードを貼り付けて動かす</h2>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        プログラミングの知識は不要です。HTML コードを貼り付けるだけでアプリが動きます。
      </p>
      <ol className="mt-4 space-y-2.5">
        {steps.map((step, i) => (
          <li key={step.text} className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-emerald-100">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-gray-700">{step.text}</span>
            </div>
            {step.buildPrompt && (
              <div className="mt-2.5 space-y-1.5">
                <button
                  type="button"
                  onClick={() => openPromptBuilder("template")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2 text-xs font-bold text-white transition-all hover:bg-sky-500 active:scale-[0.98] touch-manipulation"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  テンプレートから作成
                </button>
                <button
                  type="button"
                  onClick={() => openPromptBuilder("rules")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-[0.98] touch-manipulation"
                >
                  必須ルールだけコピー（自分で書く人向け）
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-col gap-2">
        {onPaste && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
            <p className="text-center text-[11px] font-bold leading-relaxed text-emerald-800">
              ① AIでコードをコピー　→　② このボタン
            </p>
            <button
              type="button"
              onClick={onPaste}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] touch-manipulation"
            >
              <Clipboard className="h-4 w-4" />
              コピーしたコードをここに入れる
            </button>
          </div>
        )}
        {onManualInput && (
          <button
            type="button"
            onClick={onManualInput}
            className="rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 touch-manipulation"
          >
            手動で入力する
          </button>
        )}
        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            className="text-xs font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 touch-manipulation"
          >
            詳しい手順を見る
          </button>
        )}
      </div>
    </div>
  );
}

// ─── プレビュー空状態（案内はエディタ側のみ） ───
function PreviewPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-6 text-center">
      <h2 className="text-xl font-black text-gray-800">
        コードを貼り付けると
        <span className="text-emerald-600">ここに表示されます</span>
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        <span className="md:hidden">「コード」タブに HTML を貼り付けると、このプレビュー画面にアプリが表示されます。</span>
        <span className="hidden md:inline">左のコード画面に HTML を貼り付けると、右側のこの画面にアプリが表示されます。</span>
      </p>
    </div>
  );
}

// ─── ガイドモーダルのステップ定義 ───
// ─── ガイドモーダル（4ステップ） ───

function GuideModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false);
  const [promptBuilderTab, setPromptBuilderTab] = useState<"template" | "rules">("template");
  const total = 4;
  const isFirst = step === 0;
  const isLast  = step === total - 1;

  const openPromptBuilder = (tab: "template" | "rules" = "template") => {
    setPromptBuilderTab(tab);
    setPromptBuilderOpen(true);
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
              <PromptBuilderModal
                open={promptBuilderOpen}
                onClose={() => setPromptBuilderOpen(false)}
                initialTab={promptBuilderTab}
              />
              <p className="text-base font-bold leading-relaxed text-[#334155]">
                プログラミング知識ゼロでOK！<br />
                作りたいアプリを入力して、完成した指示文をAIに送ろう
              </p>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 overflow-hidden shadow-sm">
                <div className="border-b border-sky-200 bg-sky-600 px-4 py-2.5">
                  <span className="text-xs font-black text-white">✦ ジサップ専用プロンプト</span>
                </div>
                <div className="space-y-3 px-4 py-4">
                  <p className="text-sm leading-relaxed text-slate-700">
                    アプリ名や希望の機能を入力すると、ジサップ用のルールが入った指示文が自動でできます。コピーして ChatGPT・Claude・Gemini などに貼り付けて送ってください。
                  </p>
                  <button
                    type="button"
                    onClick={() => openPromptBuilder("template")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-black text-sky-700 shadow-sm ring-1 ring-sky-200 transition-all hover:bg-sky-50 active:scale-[0.99]"
                  >
                    <Sparkles className="h-4 w-4" />
                    テンプレートから作成
                  </button>
                  <button
                    type="button"
                    onClick={() => openPromptBuilder("rules")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200 transition-all hover:bg-amber-100 active:scale-[0.99]"
                  >
                    必須ルールだけコピー（自分で書く人向け）
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-100 border border-amber-300 px-4 py-3">
                <p className="text-sm font-black text-amber-800">
                  💡 自分でプロンプトを書く場合
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  要望は自由に書いてOKです。末尾に「必須ルールだけ」を貼ると、保存先やAPIキーの扱いも正しくなります。テンプレートならアプリ名だけでOKです。
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5">
                <p className="text-sm font-black text-violet-900">🔑 AI・天気APIなどを使う場合</p>
                <p className="mt-1.5 text-sm leading-relaxed text-violet-800">
                  {SECRETS_STUDIO_GUIDE}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-violet-700">
                  プロンプトにも「APIキーをコードに書かない」ルールが入っています。AIがコードを出したら、「プレビュー更新」の横にある「APIキー」から登録してください。
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

                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5">
                  <p className="text-sm font-black text-violet-900 mb-1">🔑 APIキーが必要なアプリ</p>
                  <p className="text-xs leading-relaxed text-violet-800">
                    コードにキーを書かず、「プレビュー更新」の横「APIキー」から登録。AIがコード内で指定した secret 名（例: secret: &apos;WEATHER&apos;）と同じ名前で登録してください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 3 ══ */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-base font-bold leading-relaxed text-[#334155]">
                いい感じに動いたら<br />
                <span className="text-emerald-600">「下書き保存」</span>を押そう！
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
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === "authenticated" && !!session?.user;

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
  const [secretWarningOpen, setSecretWarningOpen] = useState(false);
  const [secretFindings, setSecretFindings] = useState<{ label: string }[]>([]);
  const [matchCount, setMatchCount]     = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  // ── UI状態 ──
  const [autoRun, setAutoRun]           = useState(true);
  const [copied, setCopied]             = useState(false);
  const [activePane, setActivePane]     = useState<"editor" | "preview">("editor");
  const [codeInputStarted, setCodeInputStarted] = useState(false);
  const [iframeKey, setIframeKey]       = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [toast, setToast]               = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const [publishing, setPublishing]     = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishTitle, setPublishTitle]       = useState("");
  const [publishDesc, setPublishDesc]         = useState("");
  const [publishCategory, setPublishCategory] = useState("");
  const [publishListed, setPublishListed]     = useState(true);
  const [publishCodePublic, setPublishCodePublic] = useState(false);
  const [publishedUrl, setPublishedUrl]       = useState<string | null>(null);
  const [urlCopied, setUrlCopied]             = useState(false);
  const [publishContext, setPublishContext]   = useState<{ projectId?: string; appId?: string } | null>(null);
  const [lastPublishWasOverwrite, setLastPublishWasOverwrite] = useState(false);
  const [publishResetUserData, setPublishResetUserData] = useState(false);
  const [publishUpdateNotes, setPublishUpdateNotes] = useState("");

  const isRepublish = !!publishContext?.appId;

  useEffect(() => {
    if (!showPublishModal) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
    };
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    return () => {
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [showPublishModal]);

  const applyPublishMeta = useCallback((meta: {
    title?: string | null;
    description?: string | null;
    category?: string | null;
    is_listed?: boolean;
    code_public?: boolean;
    app_id?: string | null;
    project_id?: string;
  }) => {
    if (meta.title) setPublishTitle(meta.title);
    if (meta.description != null) setPublishDesc(meta.description);
    if (meta.category) setPublishCategory(meta.category);
    if (meta.is_listed != null) setPublishListed(meta.is_listed);
    if (meta.code_public != null) setPublishCodePublic(meta.code_public);
    if (meta.app_id) {
      setPublishContext({ projectId: meta.project_id, appId: meta.app_id });
    } else if (meta.project_id) {
      setPublishContext({ projectId: meta.project_id });
    }
  }, []);

  // 未ログイン時ログイン促進（セッション中1回）
  const [loginPrompt, setLoginPrompt] = useState<{ open: boolean; action: "save" | "publish" }>({
    open: false,
    action: "save",
  });
  const pendingStudioActionRef = useRef<(() => void) | null>(null);

  const runWithLoginPrompt = useCallback(
    (action: "save" | "publish", fn: () => void) => {
      if (isLoggedIn || wasStudioLoginPromptShown()) {
        fn();
        return;
      }
      pendingStudioActionRef.current = fn;
      setLoginPrompt({ open: true, action });
    },
    [isLoggedIn]
  );

  const handleLoginPromptContinue = () => {
    markStudioLoginPromptShown();
    setLoginPrompt((prev) => ({ ...prev, open: false }));
    pendingStudioActionRef.current?.();
    pendingStudioActionRef.current = null;
  };

  const handleLoginPromptClose = () => {
    setLoginPrompt((prev) => ({ ...prev, open: false }));
    pendingStudioActionRef.current = null;
  };

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
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef  = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorFocused, setEditorFocused] = useState(false);

  const router = useRouter();

  const openPublishModal = useCallback(() => {
    setPublishedUrl(null);
    setLastPublishWasOverwrite(false);
    setPublishResetUserData(false);
    setPublishUpdateNotes("");
    if (!isRepublish && !publishTitle.trim()) {
      try {
        const t = localStorage.getItem("jisapp_playground_title");
        if (t) setPublishTitle(t);
      } catch { /* noop */ }
    }
    setShowPublishModal(true);
  }, [isRepublish, publishTitle]);

  const handlePublish = async () => {
    const title = publishTitle.trim() || "開発スタジオアプリ";
    if (!code.trim() || publishing) return;
    if (publishListed && !publishCategory) {
      setToast({ msg: "カテゴリを選択してください", show: true });
      setTimeout(() => setToast({ msg: "", show: false }), 3000);
      return;
    }

    const findings = detectEmbeddedSecrets(code);
    if (findings.length > 0) {
      setSecretFindings(findings);
      setSecretWarningOpen(true);
      return;
    }

    await executePublish();
  };

  const executePublish = async () => {
    const title = publishTitle.trim() || "開発スタジオアプリ";
    if (!code.trim() || publishing) return;
    setPublishing(true);
    try {
      const overwriting = !!publishContext?.appId;
      const res = await fetch("/api/apps/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: publishDesc.trim() || null,
          html_code: code,
          category: publishCategory || null,
          is_listed: publishListed,
          code_public: publishCodePublic,
          app_id: publishContext?.appId,
          project_id: publishContext?.projectId,
          reset_user_data: isRepublish ? publishResetUserData : undefined,
          update_notes: isRepublish ? publishUpdateNotes.trim() || undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? (isRepublish ? "上書きに失敗しました" : "出品に失敗しました"));
      const appUrl = `${window.location.origin}/apps/${json.id}`;
      setPublishedUrl(appUrl);
      setLastPublishWasOverwrite(overwriting);
      setPublishContext((prev) => ({ projectId: prev?.projectId, appId: json.id }));
      // コードとタイトルをlocalStorageに保存（マイプロジェクトに反映）
      try {
        localStorage.setItem("jisapp_playground_code", code);
        localStorage.setItem("jisapp_playground_title", title);
        const map = JSON.parse(localStorage.getItem("jisapp_published_map") ?? "{}");
        const mapKey = publishContext?.projectId ?? "saved_playground";
        map[mapKey] = {
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

  // 行番号とスクロール同期（CodeEditorPanel 内で処理）

  const getActiveTextarea = () =>
    drawerTextareaRef.current ?? mobileTextareaRef.current;

  const jumpToMatch = useCallback(
    (direction: "next" | "prev") => {
      if (!searchQuery.trim() || matchCount === 0) return;
      const q = searchQuery.toLowerCase();
      const src = code.toLowerCase();
      const positions: number[] = [];
      let idx = 0;
      while ((idx = src.indexOf(q, idx)) !== -1) {
        positions.push(idx);
        idx += q.length;
      }
      const nextIdx =
        direction === "next"
          ? currentMatch % matchCount
          : (currentMatch - 2 + matchCount) % matchCount;
      setCurrentMatch(nextIdx + 1);
      const pos = positions[nextIdx];
      const ta = getActiveTextarea();
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(pos, pos + searchQuery.length);
      ta.scrollTop = Math.max(0, (code.substring(0, pos).split("\n").length - 1) * 20 - 100);
      if (lineNumRef.current) {
        lineNumRef.current.style.transform = `translateY(-${ta.scrollTop}px)`;
      }
    },
    [searchQuery, matchCount, currentMatch, code]
  );

  // ── ?project=ID または ?load=1 でコードを復元 ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (projectId) {
      fetch(`/api/my-projects/${projectId}`)
        .then((r) => r.json())
        .then((d) => {
          const project = d.project;
          const html = project?.html_code ?? "";
          if (html.trim()) {
            setCode(html);
            setPreviewHtml(html);
            setLastSavedCode(html);
            if (project?.title) {
              try { localStorage.setItem("jisapp_playground_title", project.title); } catch { /* noop */ }
            }
          }
          if (project) {
            applyPublishMeta({
              title: project.title,
              description: project.description,
              category: project.category,
              is_listed: project.is_listed ?? project.status === "listed",
              app_id: project.app_id,
              project_id: project.id,
            });
            if (project.app_id) {
              supabase
                .from("apps")
                .select("title, description, category, is_listed, code_public")
                .eq("id", project.app_id)
                .maybeSingle()
                .then(({ data }) => {
                  if (data) {
                    applyPublishMeta({
                      title: data.title,
                      description: data.description,
                      category: data.category,
                      is_listed: data.is_listed,
                      code_public: data.code_public,
                      app_id: project.app_id,
                      project_id: project.id,
                    });
                  }
                });
            } else if (project.code_public != null) {
              setPublishCodePublic(Boolean(project.code_public));
            }
          }
        })
        .catch(() => { /* noop */ });
      return;
    }
    if (params.get("load") !== "1") return;
    try {
      const saved = localStorage.getItem("jisapp_playground_code") ?? "";
      if (saved.trim()) {
        setCode(saved);
        setPreviewHtml(saved);
        setLastSavedCode(saved);
      }
      const map = JSON.parse(localStorage.getItem("jisapp_published_map") ?? "{}");
      const existing = map["saved_playground"];
      if (existing?.appId) {
        applyPublishMeta({
          title: existing.title,
          description: existing.description,
          category: existing.category,
          is_listed: existing.is_listed,
          app_id: existing.appId,
        });
        supabase
          .from("apps")
          .select("title, description, category, is_listed, code_public")
          .eq("id", existing.appId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              applyPublishMeta({
                title: data.title,
                description: data.description,
                category: data.category,
                is_listed: data.is_listed,
                code_public: data.code_public,
                app_id: existing.appId,
              });
            }
          });
      }
    } catch { /* noop */ }
  }, [applyPublishMeta]);


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

  // ── ツールハンドラ ──
  const handleClear = () => {
    applyCode("");
    setPreviewHtml("");
    setCodeInputStarted(false);
    mobileTextareaRef.current?.focus();
    drawerTextareaRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        applyCode(text);
        setCodeInputStarted(true);
      }
      mobileTextareaRef.current?.focus();
      drawerTextareaRef.current?.focus();
    } catch {
      alert("クリップボードへのアクセスを許可してください（ブラウザの設定）");
    }
  };

  const ensurePreviewAppId = useCallback(async (): Promise<string | null> => {
    if (publishContext?.appId) return publishContext.appId;
    if (!session?.user) return null;

    let title = "";
    let storedAppId = "";
    try {
      title = localStorage.getItem("jisapp_playground_title") ?? "";
      if (!publishContext?.projectId) {
        storedAppId = localStorage.getItem("jisapp_playground_app_id") ?? "";
      }
    } catch {
      /* noop */
    }

    const res = await fetch("/api/playground/ensure-app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: publishContext?.appId || storedAppId || undefined,
        project_id: publishContext?.projectId,
        html_code: code,
        title: title || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "準備に失敗しました");
    const appId = data.appId as string;
    setPublishContext((prev) => ({ ...prev, appId }));
    try {
      localStorage.setItem("jisapp_playground_app_id", appId);
    } catch {
      /* noop */
    }
    return appId;
  }, [publishContext, session?.user, code]);

  const handleRun = useCallback(async () => {
    if (!code.trim()) return;
    if (session?.user) {
      try {
        await ensurePreviewAppId();
      } catch {
        /* secret 未使用のアプリは appId なしでもプレビュー可能 */
      }
    }
    setPreviewHtml(code);
    setIframeKey((k) => k + 1);
    setActivePane("preview");
  }, [code, session?.user, ensurePreviewAppId]);

  const handlePasteAndRun = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        applyCode(text);
        setPreviewHtml(text);
        setIframeKey((k) => k + 1);
        setCodeInputStarted(true);
        setActivePane("preview");
      } else {
        mobileTextareaRef.current?.focus();
      }
    } catch {
      alert("クリップボードへのアクセスを許可してください");
    }
  };

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
    runWithLoginPrompt("save", () => {
      setSaveTitle("");
      setShowSaveModal(true);
    });
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
        // ログイン済みならマイプロジェクトにも登録
        if (session?.user) {
          await fetch("/api/my-projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, html_code: code, status: "draft" }),
          });
        }
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


  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const openApiKeys = useCallback(async () => {
    const run = async () => {
      if (!session?.user) return;

      if (!publishContext?.appId) {
        setApiKeysLoading(true);
        try {
          await ensurePreviewAppId();
        } catch (e) {
          showToast(e instanceof Error ? e.message : "APIキーの準備に失敗しました");
          return;
        } finally {
          setApiKeysLoading(false);
        }
      }

      setShowSettings(true);
    };

    if (!isLoggedIn) {
      runWithLoginPrompt("save", () => {
        void run();
      });
      return;
    }

    await run();
  }, [session?.user, publishContext?.appId, isLoggedIn, runWithLoginPrompt, ensurePreviewAppId]);

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
  const showCodeEditor = code.trim().length > 0 || codeInputStarted;
  const showGuide = !previewHtml.trim();
  const isDirty = code.trim() !== "" && code !== lastSavedCode;

  const focusCodeEditor = useCallback(() => {
    setCodeInputStarted(true);
    setActivePane("editor");
    requestAnimationFrame(() => {
      mobileTextareaRef.current?.focus();
      drawerTextareaRef.current?.focus();
    });
  }, []);


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
    <div className="flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-gray-50">

      {/* ══ トースト ══ */}
      <Toast message={toast.msg} show={toast.show} />

      {/* ══ 使い方ガイドモーダル ══ */}
      {showGuideModal && <GuideModal onClose={() => setShowGuideModal(false)} />}


      <EmbeddedSecretWarningModal
        open={secretWarningOpen}
        findings={secretFindings}
        onClose={() => setSecretWarningOpen(false)}
        onOpenSecrets={() => {
          setSecretWarningOpen(false);
          setShowPublishModal(false);
          void openApiKeys();
        }}
        onProceed={async () => {
          setSecretWarningOpen(false);
          await executePublish();
        }}
      />

      {/* ══ APIキー管理 ══ */}
      <SecretsSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        appId={publishContext?.appId}
        appTitle={publishTitle || undefined}
        mode="studio"
      />

      {/* ══════════ ヘッダー ══════════ */}
      <header className="relative z-30 flex shrink-0 flex-col border-b border-emerald-200 bg-white shadow-sm sm:flex-row sm:items-center">

        {/* 上段: 戻る・タイトル・ガイド */}
        <div className="flex min-w-0 items-center gap-1 px-2 py-2 sm:gap-2 sm:px-3">
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

          <div className="mx-0.5 h-4 w-px bg-gray-200" />

          <div className="flex min-w-0 items-center gap-1.5">
            <JisappLogoIcon className="h-7 w-7 shrink-0" />
            <span className="truncate text-sm font-black text-gray-900">
              <span className="hidden sm:inline">アプリ開発スタジオ</span>
              <span className="sm:hidden">開発スタジオ</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-xl bg-amber-100 px-2 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-200 active:scale-95 sm:gap-1.5 sm:px-3 touch-manipulation"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="md:hidden">使い方</span>
            <span className="hidden md:inline">初心者ガイド</span>
          </button>
        </div>

        {/* 下段（モバイル）/ 右側（PC）: アクションボタン */}
        <div className="flex items-center gap-1 border-t border-gray-100 px-2 py-1.5 sm:ml-auto sm:border-0 sm:px-3 sm:py-2 sm:gap-1.5">

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

          <div className="hidden md:block mx-0.5 h-6 w-px bg-gray-200" />

          {/* ① 下書き保存 */}
          <button
            type="button"
            onClick={handleSave}
            title="マイプロジェクトに下書き保存（非公開）"
            className="flex flex-1 flex-col items-center rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 text-gray-700 transition-all hover:bg-gray-100 active:scale-[0.98] sm:flex-none sm:min-w-[5.5rem] sm:px-3 touch-manipulation"
          >
            <span className="flex items-center gap-1 text-[11px] font-bold sm:text-xs">
              <Save className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">下書き保存</span>
              <span className="sm:hidden">保存</span>
            </span>
            <span className="mt-0.5 hidden text-[9px] font-medium text-gray-400 lg:block">
              自分だけ・非公開
            </span>
          </button>

          {/* ② プレビュー更新 */}
          <button
            type="button"
            onClick={handleRun}
            disabled={!code.trim()}
            title="右側のプレビューで動作を確認"
            className={cn(
              "flex flex-1 flex-col items-center rounded-xl border-2 px-2 py-1.5 transition-all active:scale-[0.98] sm:flex-none sm:min-w-[5.5rem] sm:px-3 touch-manipulation",
              code.trim()
                ? "border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50"
                : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            )}
          >
            <span className="flex items-center gap-1 text-[11px] font-bold sm:text-xs">
              <Play className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">プレビュー更新</span>
              <span className="sm:hidden">更新</span>
            </span>
            <span className="mt-0.5 hidden text-[9px] font-medium text-emerald-600/80 lg:block">
              右側で動作確認
            </span>
          </button>

          {/* ②b APIキー */}
          <button
            type="button"
            onClick={() => void openApiKeys()}
            disabled={apiKeysLoading}
            title="外部API・AIのキーをコードに書かず登録"
            className={cn(
              "flex flex-1 flex-col items-center rounded-xl border border-violet-200 bg-violet-50 px-2 py-1.5 text-violet-800 transition-all active:scale-[0.98] sm:flex-none sm:min-w-[5.5rem] sm:px-3 touch-manipulation hover:bg-violet-100 disabled:opacity-50",
            )}
          >
            <span className="flex items-center gap-1 text-[11px] font-bold sm:text-xs">
              <Key className="h-3.5 w-3.5 shrink-0" />
              <span>{apiKeysLoading ? "準備中…" : "APIキー"}</span>
            </span>
            <span className="mt-0.5 hidden text-[9px] font-medium text-violet-600/80 lg:block">
              コードに書かない
            </span>
          </button>

          {/* ③ 公開/URL発行 */}
          <button
            type="button"
            onClick={() => runWithLoginPrompt("publish", openPublishModal)}
            disabled={!code.trim()}
            title="URLを発行して共有・出品"
            className={cn(
              "flex flex-1 flex-col items-center rounded-xl px-2 py-1.5 shadow-sm transition-all active:scale-[0.98] sm:flex-none sm:min-w-[5.5rem] sm:px-3 touch-manipulation",
              code.trim()
                ? "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                : "cursor-not-allowed bg-gray-200 text-gray-400 shadow-none"
            )}
          >
            <span className="flex items-center gap-1 text-[10px] font-black sm:text-xs">
              <Rocket className="h-3.5 w-3.5 shrink-0" />
              公開/URL発行
            </span>
            <span className="mt-0.5 hidden text-[9px] font-medium text-emerald-100 lg:block">
              URL発行・共有
            </span>
          </button>
        </div>

        {/* モバイル: コード / プレビュー 切り替え */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-2 md:hidden">
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setActivePane("editor")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition-all touch-manipulation",
                activePane === "editor"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500"
              )}
            >
              <Code2 className="h-4 w-4" />
              コード
            </button>
            <button
              type="button"
              onClick={() => setActivePane("preview")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition-all touch-manipulation",
                activePane === "preview"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500"
              )}
            >
              <Eye className="h-4 w-4" />
              プレビュー
            </button>
          </div>
        </div>

      </header>

      {/* ══════════ メインコンテンツ ══════════ */}

      {/* ── モバイル: 全画面切り替え ── */}
      <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
          {activePane === "preview" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
              <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2">
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-md bg-white px-3 py-1 ring-1 ring-gray-200">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full transition-colors", showGuide ? "bg-gray-300" : "animate-pulse bg-emerald-400")} />
                  <span className="truncate text-[11px] text-gray-400">
                    {showGuide ? (
                      <>
                        <span className="md:hidden">コードタブに貼り付けると表示</span>
                        <span className="hidden md:inline">左のコード画面に貼り付けると表示</span>
                      </>
                    ) : "プレビュー"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { if (code.trim()) { setPreviewHtml(code); setIframeKey((k) => k + 1); } }}
                  title="再読み込み"
                  className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-emerald-600 touch-manipulation"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {showGuide ? (
                  <PreviewPlaceholder />
                ) : (
                  <AppRunner
                    key={iframeKey}
                    srcDoc={previewHtml}
                    title="プレビュー"
                    className="h-full min-h-0"
                    appId={publishContext?.appId ?? "playground"}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
              <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-emerald-100 bg-emerald-50 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Clipboard className="h-3.5 w-3.5 text-emerald-500" />
                  HTMLコードを貼り付ける
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={undo} disabled={!canUndo} title="元に戻す" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors touch-manipulation">
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={handleClear} title="全削除" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors touch-manipulation">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {showCodeEditor && (
                <button
                  type="button"
                  onClick={handlePasteAndRun}
                  className="relative z-10 flex shrink-0 items-center justify-center gap-2 border-b border-emerald-100 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 active:scale-[0.99] touch-manipulation"
                >
                  <Clipboard className="h-4 w-4" />
                  コピーしたコードをここに入れる
                </button>
              )}
              <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
                {showCodeEditor ? (
                  <CodeEditorPanel
                    code={code}
                    onChange={applyCode}
                    onKeyDown={handleKeyDown}
                    placeholder={"ここにHTMLコードを貼り付け\n（AIが生成したコードをそのまま貼り付け）"}
                    textareaRef={mobileTextareaRef}
                    lineNumRef={lineNumRef}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    showSearch={showSearch}
                    onToggleSearch={setShowSearch}
                    matchCount={matchCount}
                    currentMatch={currentMatch}
                    onJumpMatch={jumpToMatch}
                  />
                ) : (
                  <SimpleCodeGuide
                    onPaste={handlePasteAndRun}
                    onManualInput={focusCodeEditor}
                    onOpenGuide={() => setShowGuideModal(true)}
                  />
                )}
              </div>
              <div className="relative z-10 flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <span className="text-[10px] text-gray-400">
                  {code.trim() ? `${code.split("\n").length}行 · ${code.length.toLocaleString()}文字` : "コードを貼り付けて開始"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!code.trim()) {
                      setToast({ msg: "コードを貼り付けてください", show: true });
                      setTimeout(() => setToast({ msg: "", show: false }), 2500);
                      return;
                    }
                    handleRun();
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all touch-manipulation",
                    code.trim()
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  <Play className="h-3.5 w-3.5" />
                  プレビューへ
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ── PC: 左右分割（コード左・プレビュー右） ── */}
      <div className="relative z-0 hidden min-h-0 flex-1 md:flex md:flex-row">

        {/* ── コードパネル（左） ── */}
        <div className="flex min-h-0 w-[42%] shrink-0 flex-col border-r-[3px] border-r-black bg-white">

          {/* パネルヘッダー */}
          <div className="flex shrink-0 items-center justify-between border-b border-emerald-100 bg-emerald-50 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <Clipboard className="h-3.5 w-3.5 text-emerald-500" />
              ここにコードを貼り付ける
            </span>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={undo} disabled={!canUndo} title="元に戻す" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={handleClear} title="全削除" className="rounded p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {showCodeEditor && (
            <button
              type="button"
              onClick={async () => { await handlePaste(); setTimeout(handleRun, 100); }}
              className="flex shrink-0 items-center justify-center gap-2 border-b border-emerald-100 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 active:scale-[0.99]"
            >
              <Clipboard className="h-4 w-4" />
              コピーしたコードをここに入れて実行
            </button>
          )}

          {/* テキストエリア or 簡易ガイド */}
          {showCodeEditor ? (
            <CodeEditorPanel
              code={code}
              onChange={applyCode}
              onKeyDown={handleKeyDown}
              placeholder={"ここにコードを貼り付けてください\n（AIが生成したHTMLをそのまま貼り付けるだけでOK）"}
              textareaRef={drawerTextareaRef}
              lineNumRef={lineNumRef}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showSearch={showSearch}
              onToggleSearch={setShowSearch}
              matchCount={matchCount}
              currentMatch={currentMatch}
              onJumpMatch={jumpToMatch}
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden">
              <SimpleCodeGuide
                onPaste={async () => { await handlePaste(); setTimeout(handleRun, 100); }}
                onManualInput={focusCodeEditor}
                onOpenGuide={() => setShowGuideModal(true)}
              />
            </div>
          )}

          {/* フッター */}
          <div className="flex shrink-0 items-center border-t border-gray-100 bg-gray-50 px-3 py-1.5">
            <span className="text-[10px] text-gray-400">
              {code.trim() ? `${code.split("\n").length}行 · ${code.length.toLocaleString()}文字` : "コードを貼り付けて開始"}
            </span>
          </div>
        </div>

        {/* ── プレビューパネル（右） ── */}
        <div className="flex min-h-0 flex-1 flex-col bg-white">

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
                {showGuide ? "左のコード画面に貼り付けると表示" : "プレビュー"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { if (code.trim()) { setPreviewHtml(code); setIframeKey((k) => k + 1); } }}
              title="再読み込み"
              className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-emerald-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* プレビュー or 空状態 */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute inset-0 overflow-y-auto">
              {showGuide ? (
                <PreviewPlaceholder />
              ) : (
                <AppRunner
                  key={iframeKey}
                  srcDoc={previewHtml}
                  title="プレビュー"
                  className="h-full"
                  appId={publishContext?.appId ?? "playground"}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* チャットウィジェット（非表示中） */}
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overscroll-none"
          onClick={(e) => {
            if (e.target === e.currentTarget && !publishedUrl) {
              setShowPublishModal(false);
              setPublishListed(true);
            }
          }}
        >
          <div
            className="flex w-full max-w-md max-h-[90dvh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* ── 成功後の URL 表示 ── */}
            {publishedUrl ? (
              <>
                <div className="shrink-0 bg-emerald-50 px-6 py-5 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-300">
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-base font-black text-emerald-900">{lastPublishWasOverwrite ? "上書きしました！" : publishListed ? "出品しました！" : "URLを発行しました！"}</p>
                  <p className="mt-1 text-xs text-emerald-700">{lastPublishWasOverwrite ? "同じURLで内容が更新されました" : publishListed ? "マーケットに公開されました" : "URLを知っている人だけがアクセスできます"}</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
                  <ShareButtonRow
                    url={publishedUrl}
                    title={publishTitle}
                    text={`${publishTitle} | ジサップで作った無料アプリ`}
                  />
                  <div>
                    <p className="mb-2 text-xs font-bold text-gray-600">アプリの URL</p>
                    <AppUrlCopyField url={publishedUrl} className="border border-emerald-200 py-2.5" />
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
                        setPublishCodePublic(false);
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
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
                      <Rocket className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-base font-black text-gray-900">{isRepublish ? "アプリを上書き公開" : "アプリを公開する"}</span>
                  </div>
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={publishCodePublic}
                        onChange={(e) => setPublishCodePublic(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-violet-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs leading-relaxed text-violet-900">
                        <span className="font-bold">ソースコードを公開する</span>
                        <br />
                        マイライブラリに追加したユーザーだけが閲覧できます
                      </span>
                    </label>
                  </div>
                  {isRepublish && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">
                        マイライブラリ登録者への更新内容
                        <span className="ml-1 text-[10px] font-normal text-gray-400">（任意・200字まで）</span>
                      </label>
                      <textarea
                        value={publishUpdateNotes}
                        onChange={(e) => setPublishUpdateNotes(e.target.value)}
                        placeholder={
                          publishResetUserData
                            ? "例：UIを大幅に変更しました。保存データは互換性がないため、アップデート時にリセットされます。"
                            : "例：ダークモードを追加しました。保存データはそのまま使えます。"
                        }
                        rows={3}
                        maxLength={200}
                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      />
                      <p className="mt-1 text-right text-[10px] text-gray-400">{publishUpdateNotes.length}/200</p>
                    </div>
                  )}
                  {isRepublish && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                      <p className="mb-3 text-xs font-bold text-amber-900">マイライブラリ登録者の保存データ</p>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="resetUserData"
                          checked={!publishResetUserData}
                          onChange={() => setPublishResetUserData(false)}
                          className="mt-0.5 h-4 w-4 border-amber-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs leading-relaxed text-amber-900">
                          <span className="font-bold">データを引き継ぐ</span>
                          <br />
                          ユーザーはアップデートの確認後、保存データを維持したまま新しいコードを選べます
                        </span>
                      </label>
                      <label className="mt-3 flex cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="resetUserData"
                          checked={publishResetUserData}
                          onChange={() => setPublishResetUserData(true)}
                          className="mt-0.5 h-4 w-4 border-amber-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs leading-relaxed text-amber-900">
                          <span className="font-bold">アップデート時にデータをリセット</span>
                          <br />
                          ユーザーがアップデートを選んだ場合、保存データが消える可能性があることを案内します
                        </span>
                      </label>
                    </div>
                  )}
                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                    {publishListed
                      ? "マーケットに公開されます。URLを知らない人もアプリを見つけられます。"
                      : "URLを知っている人だけがアクセスできます。マーケットには掲載されません。"}
                  </div>
                  {!isLoggedIn && !publishListed && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                      未ログインで URL のみ発行したアプリは、<strong>2か月間誰も開かないと自動削除</strong>されます。ログインするとマイページから管理できます。
                    </div>
                  )}
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
                          {isRepublish ? "上書き中…" : publishListed ? "出品中…" : "発行中…"}
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4" />
                          {isRepublish ? "上書きする" : publishListed ? "出品する" : "URLを発行する"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <StudioLoginPromptModal
        open={loginPrompt.open}
        action={loginPrompt.action}
        onContinue={handleLoginPromptContinue}
        onClose={handleLoginPromptClose}
      />
    </div>
  );
}
