"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  ClipboardPaste,
  Code2,
  Copy,
  Database,
  Download,
  Eye,
  FolderOpen,
  Globe,
  HelpCircle,
  Key,
  KeyRound,
  Lightbulb,
  Link2,
  MessageCircle,
  Monitor,
  MoreHorizontal,
  Play,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "@/lib/category-icon";
import { AppRunner } from "@/components/app-runner";
import { ShareButtonRow, AppUrlCopyField } from "@/components/share-button";
import { JisappLogoIcon } from "@/components/jisapp-logo";
import {
  SECRETS_STUDIO_GUIDE,
  buildPromptFromTemplate,
  buildSharedConvertMessage,
} from "@/lib/playground/prompt-template";
import { SecretsSettingsModal } from "@/components/secrets/secrets-settings-modal";
import { StudioLoginPromptModal } from "@/components/studio-login-prompt-modal";
import { CodeEditorPanel } from "@/components/playground/code-editor-panel";
import { PromptBuilderModal } from "@/components/playground/prompt-builder-modal";
import { EmbeddedSecretWarningModal } from "@/components/playground/embedded-secret-warning-modal";
import { StorageChangeWarningModal } from "@/components/playground/storage-change-warning-modal";
import {
  EditorStart,
  PaneTitleBar,
  PreviewEmpty,
  PromptTemplateModal,
  StageIndicator,
  type IdeaOptions,
  type StudioStage,
} from "@/components/playground/studio-flow";
import { detectEmbeddedSecrets } from "@/lib/playground/detect-embedded-secrets";
import {
  compareStorageUsage,
  hasStorageWarnings,
  type StorageChangeFinding,
} from "@/lib/playground/detect-storage-keys";
import {
  TRUNCATED_RETRY_MESSAGE,
  detectCodeIssue,
  normalizePastedCode,
  usesStudioSecrets,
  usesLocalStorageOnly,
  STORAGE_FIX_MESSAGE,
} from "@/lib/playground/code-cleanup";
import { copyText, copyTextNow, findStudioAi, type StudioAi } from "@/lib/playground/ai-launch";
import { SAMPLE_APP_HTML } from "@/lib/playground/sample-app";
import { usesSharedData } from "@/lib/groups/client";
import { supabase } from "@/lib/supabase";
import {
  markStudioLoginPromptShown,
  wasStudioLoginPromptShown,
} from "@/lib/studio/login-prompt";

/** 作りたいもの・選んだAI・進み具合を覚えておく（AIアプリから戻ってきても続きから） */
const FLOW_STORAGE_KEY = "jisapp_studio_flow";

type StoredFlow = {
  idea?: string;
  aiId?: StudioAi["id"];
  awaitingCode?: boolean;
  options?: IdeaOptions;
};

const DEFAULT_IDEA_OPTIONS: IdeaOptions = {
  details: "",
  useJisappDesign: true,
  needSave: true,
  shared: false,
};

// ─── トースト ───
function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-4 bottom-24 z-[500] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-2xl bg-slate-900/95 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 md:inset-x-auto md:bottom-6 md:right-6",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      <span className="min-w-0">{message}</span>
    </div>
  );
}

// ─── メニュー項目 ───
function MenuItem({
  icon,
  label,
  onClick,
  disabled = false,
  danger = false,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100"
      )}
    >
      <span className={cn("shrink-0", danger ? "text-rose-500" : "text-slate-400")}>{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </button>
  );
}

// ─── アイコンだけのボタン ───
function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors disabled:opacity-30 touch-manipulation",
        danger ? "hover:bg-rose-50 hover:text-rose-500" : "hover:bg-slate-100 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}


// ─── ガイドモーダルのステップ定義 ───
// ─── ガイドモーダル（4ステップ） ───

function GuideModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false);
  const [promptBuilderTab, setPromptBuilderTab] = useState<"template" | "rules">("template");
  const [promptBuilderKey, setPromptBuilderKey] = useState(0);
  const total = 4;
  const isFirst = step === 0;
  const isLast  = step === total - 1;

  const openPromptBuilder = (tab: "template" | "rules" = "template") => {
    setPromptBuilderTab(tab);
    setPromptBuilderKey((k) => k + 1);
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
            {step === 0 && (
              <span className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} />
                生成AI（ChatGPT・Gemini・Claude）でコードを出力しよう！
              </span>
            )}
            {step === 1 && (
              <span className="flex items-start gap-2">
                <Wrench className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} />
                ジサップで動かして、AIと調整しよう！
              </span>
            )}
            {step === 2 && (
              <span className="flex items-start gap-2">
                <Save className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} />
                完成したら、名前をつけて保存しよう！
              </span>
            )}
            {step === 3 && (
              <span className="flex items-start gap-2">
                <Upload className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} />
                世界にひとつだけのアプリを出品しよう！
              </span>
            )}
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
                key={promptBuilderKey}
                open={promptBuilderOpen}
                onClose={() => setPromptBuilderOpen(false)}
                onReturnToEditor={() => {
                  setPromptBuilderOpen(false);
                  onClose();
                }}
                initialTab={promptBuilderTab}
              />
              <p className="text-base font-bold leading-relaxed text-[#334155]">
                プログラミング知識ゼロでOK！<br />
                作りたいアプリを入力して、完成した指示文をAIに送ろう
              </p>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 overflow-hidden shadow-sm">
                <div className="border-b border-sky-200 bg-sky-600 px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-white">
                    ジサップ専用プロンプト
                  </span>
                </div>
                <div className="space-y-3 px-4 py-4">
                  <p className="text-sm leading-relaxed text-slate-700">
                    チャットの質問に答えると、ジサップ用のルールが入った指示文ができます。コピーして ChatGPT・Claude・Gemini などに貼り付けて送ってください。
                  </p>
                  <button
                    type="button"
                    onClick={() => openPromptBuilder("template")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-black text-sky-700 shadow-sm ring-1 ring-sky-200 transition-all hover:bg-sky-50 active:scale-[0.99]"
                  >
                    チャットからプロンプトを作成
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
                <p className="flex items-center gap-1.5 text-sm font-black text-amber-800">
                  <Lightbulb className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  自分でプロンプトを書く場合
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  要望は自由に書いてOKです。末尾に「必須ルールだけ」を貼ると、保存先やAPIキーの扱いも正しくなります。チャットなら質問に答えるだけで指示文ができます。
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-sm font-black text-violet-900">
                  <KeyRound className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  AI・天気APIなどを使う場合
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-violet-800">
                  {SECRETS_STUDIO_GUIDE}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-violet-700">
                  プロンプトにも「APIキーをコードに書かない」ルールが入っています。AIがコードを出したら、右上の「…」メニューの「APIキーの登録」から登録してください。
                </p>
              </div>
            </div>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-base font-bold leading-relaxed text-[#334155]">
                <Wrench className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                エラーもデザインも、AIに丸投げでOK！
              </p>

              <div className="space-y-2.5">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3.5">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-amber-800">
                    困ったらこのまま貼るだけ
                    <ArrowDown className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-sm">・動かない時</span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-200 px-2 py-0.5 text-sm font-bold text-amber-900">
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        「このエラーを直して」
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-sm">・変えたい時</span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-200 px-2 py-0.5 text-sm font-bold text-amber-900">
                        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        「もっと明るい色にして」
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3.5">
                  <p className="text-sm font-black text-sky-800 mb-1.5">慣れてきたら…</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["機能を追加して", "もっとおしゃれにして"].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-sky-200 px-3 py-1 text-xs font-bold text-sky-800">
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        「{t}」
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-sky-700 leading-relaxed">AIと会話しながら自分だけのアプリを完成させよう！</p>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5">
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-black text-violet-900">
                    <KeyRound className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    APIキーが必要なアプリ
                  </p>
                  <p className="text-xs leading-relaxed text-violet-800">
                    コードにキーを書かず、右上の「…」メニューの「APIキーの登録」から登録。AIがコード内で指定した secret 名（例: secret: &apos;WEATHER&apos;）と同じ名前で登録してください。
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
                <span className="text-emerald-600">「下書き保存」</span>を押そう！（右上の「…」メニューにもあります）
              </p>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-black text-emerald-700">
                  <FolderOpen className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  マイプロジェクトに保存されるよ
                </p>
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
                <span className="inline-flex items-center gap-1.5">
                  マーケットに出品しよう
                  <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                </span>
              </p>

              <div className="space-y-2">
                {[
                  { num: "①", text: "「マイプロジェクト」ページへ移動" },
                  { num: "②", text: "カードの「出品する」を押す" },
                  { num: "③", text: "紹介文とアイコンを決めて完了！" },
                ].map(item => (
                  <div key={item.num} className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500 text-sm font-black text-white">
                      {item.num}
                    </span>
                    <p className="text-sm font-semibold text-violet-800">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 px-4 py-3 text-sm font-bold text-violet-800 text-center">
                <Globe className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                世界中の人があなたのアプリを使える！
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
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
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
  const [storageWarningOpen, setStorageWarningOpen] = useState(false);
  const [storageFindings, setStorageFindings] = useState<StorageChangeFinding[]>([]);
  const storageWarningAckRef = useRef(false);
  const secretWarningAckRef = useRef(false);
  const [matchCount, setMatchCount]     = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  // ── UI状態 ──
  const [autoRun, setAutoRun]           = useState(true);
  const [copied, setCopied]             = useState(false);
  const [activePane, setActivePane]     = useState<"editor" | "preview">("editor");
  const [iframeKey, setIframeKey]       = useState(0);
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

  // ── 作る流れ（作りたいもの → AI → 貼り付け） ──
  const [idea, setIdea]                   = useState("");
  const [ideaError, setIdeaError]         = useState("");
  const [aiId, setAiId]                   = useState<StudioAi["id"]>("chatgpt");
  const [ideaOptions, setIdeaOptions]     = useState<IdeaOptions>(DEFAULT_IDEA_OPTIONS);
  const [awaitingCode, setAwaitingCode]   = useState(false);
  const [launchedAi, setLaunchedAi]       = useState<StudioAi | null>(null);
  const [returned, setReturned]           = useState(false);
  const [pasteFailed, setPasteFailed]     = useState(false);
  const [flowRestored, setFlowRestored]   = useState(false);
  // テンプレートからプロンプトを作るモーダル
  const [templateOpen, setTemplateOpen]   = useState(false);
  const [templateStep, setTemplateStep]   = useState<"form" | "copied">("form");
  const [promptText, setPromptText]       = useState("");
  const [promptCopied, setPromptCopied]   = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [menuOpen, setMenuOpen]           = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const leftForAiRef = useRef(false);

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
  /** ロゴから離れるときは、履歴を戻らずトップページへ行く */
  const leaveToHomeRef = useRef(false);

  const drawerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** ?project= / ?load=1 で既存アプリを開いたときだけ true（新規は前回アプリを引き継がない） */
  const isRestoredSessionRef = useRef(false);

  const router = useRouter();

  const openPublishModal = useCallback(() => {
    setPublishedUrl(null);
    setLastPublishWasOverwrite(false);
    setPublishResetUserData(false);
    setPublishUpdateNotes("");
    storageWarningAckRef.current = false;
    secretWarningAckRef.current = false;
    // 再公開以外は前回タイトルを入れず空欄から（新規作成のたびに残らないように）
    if (!isRepublish) {
      setPublishTitle("");
    }
    setShowPublishModal(true);
  }, [isRepublish]);

  const handlePublish = async () => {
    const title = publishTitle.trim() || "開発スタジオアプリ";
    if (!code.trim() || publishing) return;
    if (publishListed && !publishCategory) {
      setToast({ msg: "カテゴリを選択してください", show: true });
      setTimeout(() => setToast({ msg: "", show: false }), 3000);
      return;
    }

    if (!secretWarningAckRef.current) {
      const findings = detectEmbeddedSecrets(code);
      if (findings.length > 0) {
        setSecretFindings(findings);
        setSecretWarningOpen(true);
        return;
      }
    }

    // 上書き公開時: 保存先（識別名・保存方法）の変化を公開前に指摘
    if (isRepublish && publishContext?.appId && !storageWarningAckRef.current) {
      try {
        const res = await fetch(`/api/apps/${publishContext.appId}/owner-code`);
        if (res.ok) {
          const data = (await res.json()) as { html_code?: string };
          const prevCode = data.html_code ?? "";
          const storageDiff = compareStorageUsage(prevCode, code);
          if (hasStorageWarnings(storageDiff)) {
            setStorageFindings(storageDiff);
            setStorageWarningOpen(true);
            return;
          }
        }
      } catch {
        /* 比較に失敗しても公開は止めない */
      }
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

  // 表示中のエディタを返す（モバイル/PC 両方 DOM にあるため matchMedia で判定）
  const getActiveTextarea = useCallback(() => {
    if (typeof window === "undefined") return null;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) {
      return drawerTextareaRef.current ?? mobileTextareaRef.current;
    }
    return mobileTextareaRef.current ?? drawerTextareaRef.current;
  }, []);

  const selectMatchAt = useCallback(
    (matchIndex: number, focusEditor = false) => {
      if (!searchQuery.trim()) return;
      const q = searchQuery.toLowerCase();
      const src = code.toLowerCase();
      const positions: number[] = [];
      let idx = 0;
      while ((idx = src.indexOf(q, idx)) !== -1) {
        positions.push(idx);
        idx += q.length;
      }
      if (positions.length === 0) return;
      const safeIndex = ((matchIndex % positions.length) + positions.length) % positions.length;
      const pos = positions[safeIndex];
      const ta = getActiveTextarea();
      if (!ta) return;

      // 検索欄に入力中は focus を奪わない（奪うと続きの文字がコードに入ってしまう）
      setCurrentMatch(safeIndex + 1);
      if (focusEditor) ta.focus();
      ta.setSelectionRange(pos, pos + searchQuery.length);

      const style = window.getComputedStyle(ta);
      const lineHeight = parseFloat(style.lineHeight) || 20;
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const lineIndex = code.slice(0, pos).split("\n").length - 1;
      ta.scrollTop = Math.max(0, paddingTop + lineIndex * lineHeight - ta.clientHeight / 3);
    },
    [searchQuery, code, getActiveTextarea]
  );

  const jumpToMatch = useCallback(
    (direction: "next" | "prev") => {
      if (!searchQuery.trim() || matchCount === 0) return;
      const nextIdx =
        direction === "next"
          ? currentMatch % matchCount
          : (currentMatch - 2 + matchCount) % matchCount;
      // 検索欄以外から呼ばれたとき（▲▼クリック）はエディタ側を選択表示する
      const typingInSearch = document.activeElement instanceof HTMLInputElement;
      selectMatchAt(nextIdx, !typingInSearch);
    },
    [searchQuery, matchCount, currentMatch, selectMatchAt]
  );

  // ── ?project=ID または ?load=1 でコードを復元 ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    const isRestore = !!projectId || params.get("load") === "1";
    isRestoredSessionRef.current = isRestore;
    if (!isRestore) {
      // 新規セッション：前回アプリのAPIキーを引き継がないよう紐付けを破棄
      try { localStorage.removeItem("jisapp_playground_app_id"); } catch { /* noop */ }
    }
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
    if (!searchQuery.trim()) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const src = code.toLowerCase();
    let count = 0;
    let idx = 0;
    while ((idx = src.indexOf(q, idx)) !== -1) {
      count++;
      idx += q.length;
    }
    setMatchCount(count);
    setCurrentMatch((prev) => {
      if (count === 0) return 0;
      if (prev >= 1 && prev <= count) return prev;
      return 1;
    });
  }, [searchQuery, code]);

  // 検索語が変わったときだけ先頭マッチへ移動（入力中のコード編集では飛ばない）
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const t = window.setTimeout(() => selectMatchAt(0), 0);
    return () => window.clearTimeout(t);
    // selectMatchAt は code 変更でも変わるが、ここでは query 変更時のみ実行したい
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchQuery only
  }, [searchQuery]);

  // ── ツールハンドラ ──
  const handleClear = () => {
    applyCode("");
    setPreviewHtml("");
    setAwaitingCode(true);
    setPasteFailed(false);
  };

  /** AI から受け取ったコードを整えて、そのまま動かす */
  const applyIncomingCode = useCallback((raw: string) => {
    const next = normalizePastedCode(raw);
    if (!next) return;
    applyCode(next);
    setPreviewHtml(next);
    setIframeKey((k) => k + 1);
    setActivePane("preview");
    setAwaitingCode(false);
    setPasteFailed(false);
    setReturned(false);
  }, [applyCode]);

  const handlePasteFromClipboard = async () => {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      text = "";
    }
    if (text.trim()) {
      applyIncomingCode(text);
      return;
    }
    // SNS のアプリ内ブラウザなどで読めないときは、手で貼る枠に切り替える
    if (code.trim()) {
      setActivePane("editor");
      showToast("コード欄を長押しして「ペースト」してください");
      requestAnimationFrame(() => getActiveTextarea()?.select());
      return;
    }
    setPasteFailed(true);
    requestAnimationFrame(() => {
      const zone = [...document.querySelectorAll<HTMLTextAreaElement>("#studio-paste-zone")].find(
        (el) => el.getClientRects().length > 0
      );
      zone?.scrollIntoView({ block: "center", behavior: "smooth" });
      zone?.focus();
    });
  };

  const buildPrompt = () =>
    buildPromptFromTemplate(idea.trim(), ideaOptions.details, {
      useJisappDesign: ideaOptions.useJisappDesign,
      storage: ideaOptions.needSave ? "zisup" : "local",
      shared: ideaOptions.shared,
    });

  /** コピーを試し、できたかどうかを「コピーしました」画面に反映する */
  const copyPromptAndShow = async (prompt: string) => {
    setPromptText(prompt);
    const ok = copyTextNow(prompt) || (await copyText(prompt));
    setPromptCopied(ok);
    leftForAiRef.current = true;
    setTemplateStep("copied");
    setTemplateOpen(true);
    return ok;
  };

  const openTemplateWith = (shared: boolean) => {
    setIdeaOptions((o) => ({ ...o, shared }));
    setTemplateStep("form");
    setTemplateOpen(true);
  };

  /** 「プロンプトをテンプレートから作る」：「自分だけで使う」から始める */
  const openTemplate = () => openTemplateWith(false);

  /** サークルなど、メンバーとデータを共有するアプリを作る */
  const openSharedTemplate = () => openTemplateWith(true);

  /** テンプレートからプロンプトを作ってコピーする。コピーしたことを先にはっきり見せる */
  const createPrompt = () => {
    if (!idea.trim()) {
      setIdeaError("作りたいものを書いてください");
      return;
    }
    void copyPromptAndShow(buildPrompt());
  };

  const recopyPrompt = () => {
    const prompt = promptText || (idea.trim() ? buildPrompt() : "");
    if (!prompt) {
      openTemplate();
      return;
    }
    void copyPromptAndShow(prompt).then((ok) => {
      if (ok) showToast("プロンプトをもう一度コピーしました");
    });
  };

  /**
   * AIに送ったあと、貼り付け待ちにする。
   * ここでプロンプトをコピーし直すと、AIからコピーしてきたコードを上書きしてしまうのでしない。
   */
  const launchAi = (ai: StudioAi): boolean => {
    setLaunchedAi(ai);
    setAwaitingCode(true);
    setPasteFailed(false);
    setReturned(false);
    setTemplateOpen(false);
    return true;
  };

  const runSample = () => {
    applyIncomingCode(SAMPLE_APP_HTML);
    showToast("サンプルを動かしました");
  };

  const startOver = () => {
    applyCode("");
    setPreviewHtml("");
    setTemplateOpen(false);
    setAwaitingCode(false);
    setPasteFailed(false);
    setReturned(false);
    setLaunchedAi(null);
    setActivePane("editor");
  };

  /** 空のエディタに直接貼られたときも、AIの説明文や囲みを取り除く */
  const handleEditorChange = (value: string) => {
    if (!code.trim() && value.trim().length > 20) {
      applyIncomingCode(value);
      return;
    }
    applyCode(value);
  };

  const ensurePreviewAppId = useCallback(async (): Promise<string | null> => {
    if (publishContext?.appId) return publishContext.appId;
    if (!session?.user) return null;

    let title = "";
    let storedAppId = "";
    try {
      if (isRestoredSessionRef.current) {
        title = localStorage.getItem("jisapp_playground_title") ?? "";
        if (!publishContext?.projectId) {
          storedAppId = localStorage.getItem("jisapp_playground_app_id") ?? "";
        }
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

  const handleCopyCode = async () => {
    if (!code.trim()) return;
    // SNS のアプリ内ブラウザでも通るよう、クリック中に同期的にコピーする
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("コードを全部コピーしました");
    } else {
      showToast("コピーできませんでした。「ファイル保存」を使ってください");
    }
  };

  const buildCodeFileName = () => {
    let base = publishTitle.trim();
    if (!base) {
      try { base = localStorage.getItem("jisapp_playground_title") ?? ""; } catch { /* noop */ }
    }
    const safeBase = (base || "jisapp-code")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 40);
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("");
    return `${safeBase}-${stamp}.txt`;
  };

  // iPhone は download 属性が使えないことがあるため、共有シート → ダウンロード → コピー の順に試す
  const handleSaveCodeFile = async () => {
    if (!code.trim()) return;
    const fileName = buildCodeFileName();

    if (typeof File !== "undefined" && navigator.canShare) {
      const file = new File([code], fileName, { type: "text/plain" });
      if (navigator.canShare({ files: [file] })) {
        try {
          // title を渡すと iPhone の「ファイルに保存」で題名だけのファイルが余分に作られる
          await navigator.share({ files: [file] });
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
      }
    }

    const anchor = document.createElement("a");
    if ("download" in anchor) {
      const url = URL.createObjectURL(
        new Blob([code], { type: "text/plain;charset=utf-8" })
      );
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`${fileName} を保存しました`);
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      showToast("このブラウザでは保存できないため、コードをコピーしました。メモアプリに貼り付けてください");
    } catch {
      showToast("保存できませんでした。コードを選択してコピーしてください");
    }
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
        showToast(`「${title}」を保存しました`);
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
      setTimeout(leaveStudio, 600);
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
  const isDirty = code.trim() !== "" && code !== lastSavedCode && code.trim() !== SAMPLE_APP_HTML.trim();

  const stage: StudioStage = code.trim() ? "ready" : awaitingCode ? "paste" : "idea";
  const localOnly = usesLocalStorageOnly(code);
  const codeIssue = detectCodeIssue(code);
  const needsKeys = usesStudioSecrets(code);
  const sharesData = usesSharedData(code);
  const isSample = code.trim() === SAMPLE_APP_HTML.trim();

  // 作りたいもの・AI・進み具合を復元（URLの ?idea= / ?sample=1 を優先）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("project") || params.get("load") === "1") {
      setFlowRestored(true);
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem(FLOW_STORAGE_KEY) ?? "{}") as StoredFlow;
      if (stored.aiId) setAiId(findStudioAi(stored.aiId).id);
      if (stored.options) setIdeaOptions({ ...DEFAULT_IDEA_OPTIONS, ...stored.options });
      // 開き直したときはエディタの最初の画面から。入力内容とAIの選択だけ引き継ぐ
    } catch { /* noop */ }
    const ideaParam = params.get("idea");
    if (ideaParam) {
      // SNS の投稿などから来たときは、作りたいものが入った状態でテンプレートを開く
      setIdea(ideaParam.slice(0, 200));
      setTemplateStep("form");
      setTemplateOpen(true);
    }
    if (params.get("sample") === "1") {
      applyIncomingCode(SAMPLE_APP_HTML);
    }
    setFlowRestored(true);
    // 初回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!flowRestored) return;
    try {
      const data: StoredFlow = {
        idea,
        aiId,
        awaitingCode: awaitingCode && !code.trim(),
        options: ideaOptions,
      };
      localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(data));
    } catch { /* noop */ }
  }, [flowRestored, idea, aiId, awaitingCode, ideaOptions, code]);

  // AI のアプリ・タブから戻ってきたら「おかえりなさい」を出す
  const waitingOnCopiedRef = useRef(false);
  useEffect(() => {
    waitingOnCopiedRef.current = templateOpen && templateStep === "copied";
  }, [templateOpen, templateStep]);
  useEffect(() => {
    // 画面が一度隠れて（AIのアプリ・タブに移って）、また表示されたときだけ「戻ってきた」とみなす。
    // ウィンドウのフォーカスだけでは判定しない（ページをクリックしただけで画面が進んでしまうため）
    let hiddenSinceCopy = false;
    const onVisible = () => {
      if (document.visibilityState === "hidden") {
        if (leftForAiRef.current) hiddenSinceCopy = true;
        return;
      }
      if (hiddenSinceCopy && leftForAiRef.current) {
        hiddenSinceCopy = false;
        leftForAiRef.current = false;
        if (waitingOnCopiedRef.current) {
          // コピーしました画面のまま AI に行って戻ってきた → そのまま貼り付け待ちへ
          setLaunchedAi(findStudioAi("other"));
          setAwaitingCode(true);
          setPasteFailed(false);
          setTemplateOpen(false);
        }
        setReturned(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // メニューの外を押したら閉じる
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function leaveStudio() {
    if (leaveToHomeRef.current) {
      leaveToHomeRef.current = false;
      router.push("/");
      return;
    }
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  /** 未保存の変更があれば確認してから離れる */
  const requestLeave = (toHome: boolean) => {
    leaveToHomeRef.current = toHome;
    if (isDirty) {
      setShowLeaveModal(true);
    } else {
      leaveStudio();
    }
  };

  const handleBack = () => requestLeave(false);

  const confirmLeave = () => {
    setShowLeaveModal(false);
    leaveStudio();
  };

  // コードの下に出す注意（途中で切れている・サンプル・APIキー）
  const renderNotices = () => (
    <>
      {codeIssue === "truncated" && (
        <div className="flex shrink-0 items-start gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">コードが途中で切れているようです</p>
            <p className="mt-0.5 text-amber-800">AIに続きを頼んで、最初から最後まで全部を貼り直してください。</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void copyText(TRUNCATED_RETRY_MESSAGE).then((ok) => showToast(ok ? "AIに送る文をコピーしました" : "コピーできませんでした"));
            }}
            className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
          >
            依頼文をコピー
          </button>
        </div>
      )}
      {codeIssue === "not_html" && (
        <div className="flex shrink-0 items-start gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            <span className="font-semibold">HTMLのコードではないようです。</span>
            AIの返事のうち、<code className="rounded bg-amber-100 px-1">&lt;!DOCTYPE html&gt;</code> から始まる部分をコピーしてください。
          </p>
        </div>
      )}
      {needsKeys && (
        <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
          <Key className="h-4 w-4 shrink-0 text-slate-400" />
          <p className="min-w-0 flex-1">このアプリは外部サービスのAPIキーを使います</p>
          <button
            type="button"
            onClick={() => void openApiKeys()}
            className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            {apiKeysLoading ? "準備中…" : "キーを登録"}
          </button>
        </div>
      )}
      {sharesData && (
        <div className="flex shrink-0 items-start gap-2.5 border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-xs leading-relaxed text-emerald-900">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="min-w-0 flex-1">
            <span className="font-semibold">グループ共有を使うアプリです。</span>
            スタジオでは、この端末だけのテスト用データで動きます。公開したあと、アプリのページで「グループを作る」と、招待したメンバーと共有できます。
          </p>
        </div>
      )}
      {localOnly && !isSample && (
        <div className="flex shrink-0 items-start gap-2.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="min-w-0 flex-1 leading-relaxed">
            このアプリは localStorage で保存しているため、データは同じ端末のブラウザにしか残りません。別の端末でも残すには{" "}
            <code className="rounded bg-white px-1 ring-1 ring-slate-200">window.Zisup.saveData</code> / <code className="rounded bg-white px-1 ring-1 ring-slate-200">loadData</code> を使います。
          </p>
          <button
            type="button"
            onClick={() => {
              void copyText(STORAGE_FIX_MESSAGE).then((ok) => showToast(ok ? "AIに送る書き換え依頼をコピーしました" : "コピーできませんでした"));
            }}
            className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            依頼文をコピー
          </button>
        </div>
      )}
      {isSample && (
        <div className="flex shrink-0 items-center gap-2.5 border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-900">
          <Zap className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="min-w-0 flex-1">これはAIが作ったサンプルです。あなたのアプリも同じように作れます</p>
          <button
            type="button"
            onClick={startOver}
            className="hidden shrink-0 md:block rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700"
          >
            自分で作る
          </button>
        </div>
      )}
    </>
  );

  const renderEditor = (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    variant: "mobile" | "desktop"
  ) => (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center gap-1 border-b border-slate-200/80 px-2 py-1.5 sm:px-3">
        <button
          type="button"
          onClick={() => void handlePasteFromClipboard()}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100 touch-manipulation"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          貼り直す
        </button>
        <span className="ml-2 hidden text-[11px] text-slate-400 xl:inline">
          {lineCount}行 · {charCount.toLocaleString()}文字
        </span>
        <div className="ml-auto flex items-center">
          {/* スマホは幅が足りないため、コピー・保存を優先して元に戻す/やり直すを隠す */}
          <span className="hidden items-center sm:flex">
            <IconButton label="元に戻す" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </IconButton>
            <IconButton label="やり直す" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </IconButton>
            <span className="mx-1 h-4 w-px bg-slate-200" />
          </span>
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            title="コードを全部コピー（AIに修正を頼むときに）"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 touch-manipulation"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span className="md:hidden lg:inline">{copied ? "コピー済み" : "全部コピー"}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleSaveCodeFile()}
            title="コードをテキストファイルで保存"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 touch-manipulation"
          >
            <Download className="h-4 w-4" />
            <span className="md:hidden lg:inline">ファイル保存</span>
          </button>
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <IconButton label="コードを消す" onClick={handleClear} danger>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      {renderNotices()}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <CodeEditorPanel
          code={code}
          onChange={handleEditorChange}
          onKeyDown={handleKeyDown}
          placeholder={"ここにAIのコードを貼り付け"}
          textareaRef={textareaRef}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={showSearch}
          onToggleSearch={setShowSearch}
          matchCount={matchCount}
          currentMatch={currentMatch}
          onJumpMatch={jumpToMatch}
        />
      </div>
      {variant === "desktop" && (
        <div className="flex shrink-0 items-center gap-3 border-t border-slate-200/80 px-3 py-2">
          <button
            type="button"
            onClick={() => setAutoRun((v) => !v)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700"
            title="コードを書き換えると自動でプレビューを更新します"
          >
            <span
              className={cn(
                "relative h-4 w-7 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform",
                autoRun ? "bg-emerald-500 after:translate-x-3" : "bg-slate-300"
              )}
            />
            自動で反映
          </button>
          <button
            type="button"
            onClick={() => void handleRun()}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            <Play className="h-3.5 w-3.5" />
            動かす
            <kbd className="ml-1 rounded bg-white/15 px-1 font-sans text-[10px] text-white/80">Ctrl+Enter</kbd>
          </button>
        </div>
      )}
    </div>
  );

  const renderPreview = (variant: "mobile" | "desktop") => (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white px-3 py-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", showGuide ? "bg-slate-300" : "bg-emerald-500")} />
        <span className="truncate text-xs font-semibold text-slate-600">
          {showGuide ? "プレビュー" : isSample ? "サンプル：反射神経タップ" : "あなたのアプリ"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {variant === "desktop" && (
            <div className="mr-1 flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="表示する幅">
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                aria-pressed={previewDevice === "mobile"}
                title="スマホの幅で表示"
                className={cn(
                  "rounded-md p-1.5 transition",
                  previewDevice === "mobile" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                aria-pressed={previewDevice === "desktop"}
                title="PCの幅で表示"
                className={cn(
                  "rounded-md p-1.5 transition",
                  previewDevice === "desktop" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <IconButton
            label="再読み込み"
            onClick={() => {
              if (code.trim()) {
                setPreviewHtml(code);
                setIframeKey((k) => k + 1);
              }
            }}
            disabled={!code.trim()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
      {variant === "mobile" && renderNotices()}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white/40 to-sky-50/70">
        {showGuide ? (
          <PreviewEmpty onRunSample={runSample} />
        ) : variant === "desktop" && previewDevice === "mobile" ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="h-full max-h-[780px] w-full max-w-[390px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/10">
              <AppRunner
                key={iframeKey}
                srcDoc={previewHtml}
                title="プレビュー"
                className="h-full"
                appId={publishContext?.appId ?? "playground"}
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-white">
            <AppRunner
              key={iframeKey}
              srcDoc={previewHtml}
              title="プレビュー"
              className="h-full min-h-0"
              appId={publishContext?.appId ?? "playground"}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden overscroll-none text-slate-900"
      style={{
        backgroundColor: "#f7faf9",
        backgroundImage:
          "radial-gradient(900px 520px at 0% 0%, rgba(167, 230, 205, 0.38), transparent 62%), radial-gradient(760px 480px at 100% 8%, rgba(186, 225, 253, 0.42), transparent 60%), radial-gradient(820px 520px at 55% 110%, rgba(254, 236, 196, 0.38), transparent 62%)",
      }}
    >

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
          secretWarningAckRef.current = true;
          setSecretWarningOpen(false);
          await handlePublish();
        }}
      />

      <StorageChangeWarningModal
        open={storageWarningOpen}
        findings={storageFindings}
        onClose={() => setStorageWarningOpen(false)}
        onProceed={async () => {
          storageWarningAckRef.current = true;
          setStorageWarningOpen(false);
          await handlePublish();
        }}
        onProceedWithReset={async () => {
          storageWarningAckRef.current = true;
          setPublishResetUserData(true);
          setStorageWarningOpen(false);
          await handlePublish();
        }}
      />

      {/* ══ APIキー管理 ══ */}
      <PromptTemplateModal
        open={templateOpen}
        step={templateStep}
        onClose={() => setTemplateOpen(false)}
        idea={idea}
        onIdeaChange={(v) => { setIdea(v); setIdeaError(""); }}
        ideaError={ideaError}
        options={ideaOptions}
        onOptionsChange={setIdeaOptions}
        onCreate={createPrompt}
        promptText={promptText}
        copyOk={promptCopied}
        onRecopy={recopyPrompt}
        onLaunch={launchAi}
        onEdit={() => setTemplateStep("form")}
      />

      <SecretsSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        appId={publishContext?.appId}
        appTitle={publishTitle || undefined}
        mode="studio"
      />

      {/* ══════════ ヘッダー ══════════ */}
      <header className="relative z-30 shrink-0 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div aria-hidden className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
        <div className="flex h-14 items-center gap-1.5 px-2 sm:gap-2 sm:px-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="戻る"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
            {isDirty && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" title="未保存の変更があります" />
            )}
          </button>

          <Link
            href="/"
            onClick={(e) => {
              // 通常のクリックは未保存の確認を挟む（新しいタブで開く操作はそのまま）
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              requestLeave(true);
            }}
            aria-label="ジサップのトップページへ"
            className="flex min-w-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
          >
            <JisappLogoIcon className="h-7 w-7 shrink-0" />
            <span className="truncate text-[15px] font-bold tracking-tight text-slate-900">開発<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">スタジオ</span></span>
          </Link>

          <div className="hidden flex-1 justify-center lg:flex">
            <StageIndicator stage={stage} />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {stage === "ready" && (
              <button
                type="button"
                onClick={handleSave}
                className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:flex"
              >
                <Save className="h-4 w-4" />
                下書き保存
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!code.trim()) {
                  showToast("先にAIのコードを貼り付けてください");
                  return;
                }
                runWithLoginPrompt("publish", openPublishModal);
              }}
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition md:flex",
                code.trim()
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              <Upload className="h-4 w-4" strokeWidth={2.25} />
              公開する
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="メニュー"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800",
                  menuOpen && "bg-slate-100 text-slate-800"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 z-50 w-64 rounded-2xl bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/10"
                >
                  <MenuItem
                    icon={<Save className="h-4 w-4" />}
                    label="下書き保存"
                    hint="自分だけ"
                    disabled={!code.trim()}
                    onClick={() => { setMenuOpen(false); handleSave(); }}
                  />
                  <MenuItem
                    icon={<Key className="h-4 w-4" />}
                    label="APIキーの登録"
                    onClick={() => { setMenuOpen(false); void openApiKeys(); }}
                  />
                  <MenuItem
                    icon={<Copy className="h-4 w-4" />}
                    label="コードを全部コピー"
                    disabled={!code.trim()}
                    onClick={() => { setMenuOpen(false); void handleCopyCode(); }}
                  />
                  <MenuItem
                    icon={<Download className="h-4 w-4" />}
                    label="コードをファイルで保存"
                    disabled={!code.trim()}
                    onClick={() => { setMenuOpen(false); void handleSaveCodeFile(); }}
                  />
                  {code.trim() && !sharesData && (
                    <MenuItem
                      icon={<Users className="h-4 w-4" />}
                      label="グループで共有できるようにする"
                      onClick={() => {
                        setMenuOpen(false);
                        void copyText(buildSharedConvertMessage(code)).then((ok) =>
                          showToast(
                            ok
                              ? "依頼文をコピーしました（今のコード入り）。AIに送って、返ってきたコードを貼り直してください"
                              : "コピーできませんでした"
                          )
                        );
                      }}
                    />
                  )}
                  <MenuItem
                    icon={<FolderOpen className="h-4 w-4" />}
                    label="マイプロジェクト"
                    onClick={() => { setMenuOpen(false); router.push("/projects"); }}
                  />
                  <div className="my-1 h-px bg-slate-100" />
                  <MenuItem
                    icon={<HelpCircle className="h-4 w-4" />}
                    label="使い方ガイド"
                    onClick={() => { setMenuOpen(false); setShowGuideModal(true); }}
                  />
                  <MenuItem
                    icon={<RotateCcw className="h-4 w-4" />}
                    label="最初からやり直す"
                    danger
                    onClick={() => { setMenuOpen(false); startOver(); }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 pb-2 lg:hidden">
          <StageIndicator stage={stage} compact />
        </div>

        {/* スマホ: コードエディタ / プレビュー 切り替え（何の画面か伝わるよう最初から出す） */}
        {(
          <div className="px-3 pb-2.5 md:hidden">
            <div className="flex rounded-xl bg-slate-100 p-1" role="tablist">
              {([
                { id: "editor", label: "コードエディタ", icon: <Code2 className="h-3.5 w-3.5" /> },
                { id: "preview", label: "プレビュー", icon: <Play className="h-3.5 w-3.5" /> },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activePane === tab.id}
                  onClick={() => setActivePane(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all touch-manipulation",
                    activePane === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ══════════ メインコンテンツ ══════════ */}

      {/* ── スマホ ── */}
      <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        {activePane === "preview" && stage !== "ready" && renderPreview("mobile")}
        {activePane === "editor" && stage !== "ready" && (
          <EditorStart
            waitingForAi={stage === "paste"}
            returned={returned}
            ai={launchedAi}
            idea={idea}
            pasteFailed={pasteFailed}
            onOpenTemplate={openTemplate}
            onOpenSharedTemplate={openSharedTemplate}
            onReopenCopied={recopyPrompt}
            onRelaunch={() => (launchedAi ? launchAi(launchedAi) : false)}
            onPasteFromClipboard={() => void handlePasteFromClipboard()}
            onManualPaste={applyIncomingCode}
            onRunSample={runSample}
          />
        )}
        {stage === "ready" && (activePane === "preview" ? renderPreview("mobile") : renderEditor(mobileTextareaRef, "mobile"))}
      </div>

      {/* スマホ: 下部の主ボタン（今やることを1つだけ） */}
      <div className={cn("relative z-20 shrink-0 border-t border-white/80 bg-white/85 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden", stage === "idea" && "hidden")}>
        {stage === "paste" && (
          <button
            type="button"
            onClick={() => void handlePasteFromClipboard()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] touch-manipulation",
              returned && "animate-[pulse_1.6s_ease-in-out_2]"
            )}
          >
            <ClipboardPaste className="h-4 w-4" strokeWidth={2.25} />
            コードを貼り付けて動かす
          </button>
        )}
        {stage === "ready" && activePane === "editor" && (
          <button
            type="button"
            onClick={() => void handleRun()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-[15px] font-bold text-white transition-all active:scale-[0.98] touch-manipulation"
          >
            <Play className="h-4 w-4" />
            動かしてみる
          </button>
        )}
        {stage === "ready" && activePane === "preview" && isSample && (
          <button
            type="button"
            onClick={startOver}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] touch-manipulation"
          >
            自分のアプリを作る
          </button>
        )}
        {stage === "ready" && activePane === "preview" && !isSample && (
          <>
            <button
              type="button"
              onClick={() => runWithLoginPrompt("publish", openPublishModal)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] touch-manipulation"
            >
              <Upload className="h-4 w-4" strokeWidth={2.25} />
              公開してURLをもらう
            </button>
            <p className="mt-1.5 text-center text-[11px] text-slate-400">直したいところはAIに頼んで、コードを貼り直すだけ</p>
          </>
        )}
      </div>

      {/* ── PC: 左右分割（左：作る・コード / 右：プレビュー） ── */}
      <div className="relative z-0 hidden min-h-0 flex-1 md:flex md:flex-row">
        <section
          aria-label={stage === "ready" ? "コード" : "作る"}
          className="flex min-h-0 w-[44%] max-w-[640px] shrink-0 flex-col border-r border-slate-200 bg-white"
        >
          <PaneTitleBar icon={<Code2 className="h-3.5 w-3.5" />} title="コードエディタ" sub="index.html" />
          {stage !== "ready" && (
            <EditorStart
              waitingForAi={stage === "paste"}
              returned={returned}
              ai={launchedAi}
              idea={idea}
              pasteFailed={pasteFailed}
              onOpenTemplate={openTemplate}
              onOpenSharedTemplate={openSharedTemplate}
              onReopenCopied={recopyPrompt}
              onRelaunch={() => (launchedAi ? launchAi(launchedAi) : false)}
              onPasteFromClipboard={() => void handlePasteFromClipboard()}
              onManualPaste={applyIncomingCode}
              onRunSample={runSample}
            />
          )}
          {stage === "ready" && renderEditor(drawerTextareaRef, "desktop")}
        </section>

        <section aria-label="プレビュー" className="flex min-h-0 flex-1 flex-col">
          <PaneTitleBar icon={<Eye className="h-3.5 w-3.5" />} title="プレビュー" sub="ここでアプリが動きます" />
          {renderPreview("desktop")}
        </section>
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
                  setSaveTitle("");
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
                  autoComplete="off"
                  name="jisapp_save_project_title"
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
                  {sharesData && (
                    <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-sky-900">
                        <Users className="h-4 w-4 shrink-0" />
                        次は、メンバーを招待しましょう
                      </p>
                      <ol className="mt-2 space-y-1 text-xs leading-relaxed text-sky-900">
                        <li>1. 下のボタンでアプリのページを開く</li>
                        <li>2. 上の帯の「グループを作る」を押す（ログインが必要です）</li>
                        <li>3. 出てきた招待リンクを、LINEなどでメンバーに送る</li>
                      </ol>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            router.push(new URL(publishedUrl).pathname);
                          } catch {
                            router.push(publishedUrl);
                          }
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 py-2.5 text-sm font-bold text-white shadow-sm hover:from-sky-700 hover:to-teal-700"
                      >
                        アプリを開いてグループを作る
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`「${publishTitle || "アプリ"}」をAIと作って公開しました
#ジサップ #個人開発`)}&url=${encodeURIComponent(publishedUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Xでシェアする
                  </a>
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
                      <Upload className="h-4 w-4 shrink-0 text-white" strokeWidth={2} />
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
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Link2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        URLのみ発行
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublishListed(true)}
                      className={cn(
                        "flex-1 py-2.5 transition-colors border-l border-gray-200",
                        publishListed ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Upload className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        マーケットに出品
                      </span>
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
                      autoComplete="off"
                      name="jisapp_publish_app_title"
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
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                                selected
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                              )}
                            >
                              <CategoryIcon categoryId={cat.id} className="h-3.5 w-3.5 shrink-0" />
                              {cat.name}
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
                          <Upload className="h-4 w-4 shrink-0" strokeWidth={2} />
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
