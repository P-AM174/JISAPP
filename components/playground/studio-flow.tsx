"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardPaste,
  Code2,
  Copy,
  Database,
  FileText,
  Play,
  RotateCcw,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_AIS, copyText, type StudioAi } from "@/lib/playground/ai-launch";
import {
  PROMPT_STORAGE_SHARED,
  PROMPT_STORAGE_ZISUP,
  buildSharedConvertMessage,
} from "@/lib/playground/prompt-template";
import { STORAGE_FIX_MESSAGE } from "@/lib/playground/code-cleanup";

export type StudioStage = "choose" | "idea" | "paste" | "ready";

const STAGES: { id: StudioStage; label: string }[] = [
  { id: "idea", label: "AIに作ってもらう" },
  { id: "paste", label: "貼って動かす" },
  { id: "ready", label: "公開する" },
];

// ─── 進行表示 ───

export function StageIndicator({
  stage,
  compact = false,
}: {
  stage: StudioStage;
  compact?: boolean;
}) {
  // 始め方を選ぶ画面はステップ1として扱う
  const current = Math.max(0, STAGES.findIndex((s) => s.id === stage));

  if (compact) {
    return (
      <div className="flex gap-1" aria-label={`ステップ ${current + 1} / 3：${STAGES[current].label}`}>
        {STAGES.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= current ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-slate-200/80"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <ol className="flex items-center gap-1.5">
      {STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id} className="flex items-center gap-1.5">
            {i > 0 && <span className={cn("h-px w-5 lg:w-8", done || active ? "bg-emerald-300" : "bg-slate-200")} />}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold transition-colors",
                active ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : done ? "text-emerald-700" : "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                  active ? "bg-emerald-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ─── AIを開くボタン（プロンプトをコピーしてから開く） ───

export function LaunchAiLink({
  ai,
  onLaunch,
  className,
  children,
}: {
  ai: StudioAi;
  /** false を返すと遷移を止める（未入力など） */
  onLaunch: () => boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const classes = cn(
    "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] touch-manipulation",
    className
  );

  if (!ai.url) {
    return (
      <button type="button" onClick={() => onLaunch()} className={classes}>
        {children ?? (
          <>
            <Copy className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            指示文をコピーする
          </>
        )}
      </button>
    );
  }

  return (
    <a
      href={ai.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!onLaunch()) e.preventDefault();
      }}
      className={classes}
    >
      {children ?? (
        <>
          {ai.name}で作る
          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2.25} />
        </>
      )}
    </a>
  );
}

/** 主ボタンの下の一言 */
export function launchCaption(ai: StudioAi): string {
  return ai.url
    ? `指示文をコピーして${ai.name}を開きます`
    : "コピーした指示文を、使っているAIに貼り付けてください";
}

// ─── データ保存の指定（コードを直接貼る人向け） ───

function StorageRequirementNote({
  className,
  withCopy = false,
}: {
  className?: string;
  withCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={cn("rounded-xl bg-sky-50/70 px-3.5 py-3 ring-1 ring-sky-100", className)}>
      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <Database className="h-3.5 w-3.5 shrink-0 text-sky-600" />
        データを保存するアプリの場合
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        保存と読み込みに{" "}
        <code className="rounded bg-white px-1 py-0.5 text-[11px] text-slate-800 ring-1 ring-slate-200">window.Zisup.saveData</code>
        {" / "}
        <code className="rounded bg-white px-1 py-0.5 text-[11px] text-slate-800 ring-1 ring-slate-200">loadData</code>{" "}
        を使う指定が必要です。localStorage のままだと、同じ端末のブラウザにしか残りません。
      </p>
      {withCopy && (
        <button
          type="button"
          onClick={() => {
            void copyText(STORAGE_FIX_MESSAGE).then((ok) => {
              if (!ok) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2500);
            });
          }}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "コピーしました。AIに送ってください" : "AIに書き換えを頼む文をコピー"}
        </button>
      )}
    </div>
  );
}

// ─── 窓のタイトルバー（コードエディタ／プレビュー） ───

export function PaneTitleBar({
  icon,
  title,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 bg-slate-900 px-3 text-white">
      <span className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
      </span>
      <span className="ml-2 flex items-center gap-1.5 text-xs font-bold tracking-wide">
        <span className="text-emerald-300">{icon}</span>
        {title}
      </span>
      {sub && <span className="font-mono text-[11px] text-slate-400">{sub}</span>}
      <span className="ml-auto flex items-center gap-1">{children}</span>
    </div>
  );
}

// ─── 空のエディタ：エディタの見た目のまま、上に始め方を重ねる ───

export type IdeaOptions = {
  details: string;
  useJisappDesign: boolean;
  needSave: boolean;
  /** グループのメンバー全員でデータを共有する */
  shared: boolean;
};

const PRIMARY_BUTTON =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] touch-manipulation";

/** 空のエディタに薄く見せるコードの影（幅は％） */
const GHOST_LINES: { w: number; indent: number; tone: string }[] = [
  { w: 34, indent: 0, tone: "bg-sky-100" },
  { w: 22, indent: 0, tone: "bg-slate-100" },
  { w: 30, indent: 1, tone: "bg-slate-100" },
  { w: 52, indent: 2, tone: "bg-emerald-100" },
  { w: 44, indent: 2, tone: "bg-slate-100" },
  { w: 18, indent: 1, tone: "bg-slate-100" },
  { w: 26, indent: 1, tone: "bg-sky-100" },
  { w: 60, indent: 2, tone: "bg-amber-100" },
  { w: 38, indent: 3, tone: "bg-slate-100" },
  { w: 48, indent: 3, tone: "bg-emerald-100" },
  { w: 20, indent: 2, tone: "bg-slate-100" },
  { w: 16, indent: 1, tone: "bg-sky-100" },
  { w: 28, indent: 1, tone: "bg-slate-100" },
  { w: 56, indent: 2, tone: "bg-emerald-100" },
  { w: 42, indent: 2, tone: "bg-slate-100" },
  { w: 22, indent: 1, tone: "bg-slate-100" },
  { w: 14, indent: 0, tone: "bg-sky-100" },
];

export function EditorStart({
  waitingForAi,
  returned,
  ai,
  idea,
  pasteFailed,
  onOpenTemplate,
  onOpenSharedTemplate,
  onReopenCopied,
  onRelaunch,
  onPasteFromClipboard,
  onManualPaste,
  onRunSample,
}: {
  /** プロンプトをコピーしてAIに送ったあと（コードを待っている） */
  waitingForAi: boolean;
  /** AI のタブから戻ってきた直後 */
  returned: boolean;
  ai: StudioAi | null;
  idea: string;
  pasteFailed: boolean;
  onOpenTemplate: () => void;
  /** メンバーとデータを共有するアプリを作る（テンプレートを共有の設定で開く） */
  onOpenSharedTemplate: () => void;
  onReopenCopied: () => void;
  onRelaunch: () => boolean;
  onPasteFromClipboard: () => void;
  onManualPaste: (text: string) => void;
  onRunSample: () => void;
}) {
  const [draft, setDraft] = useState("");
  /** 案内をたたんで、エディタに直接貼る */
  const [directMode, setDirectMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showCard = !directMode;

  const startDirect = () => {
    setDirectMode(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  // 自動で貼り付けできなかったときは、案内をたたんでエディタに直接貼ってもらう
  useEffect(() => {
    if (pasteFailed) startDirect();
  }, [pasteFailed]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* 行番号 */}
        <div
          aria-hidden
          className="w-10 shrink-0 select-none overflow-hidden border-r border-slate-100 bg-slate-50/90 pr-2 pt-3 text-right font-mono text-[11px] leading-5 text-slate-300"
        >
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* コードの影（ここにコードが入ることを見せる。直接貼るときは邪魔になるので消す） */}
        {!draft && showCard && (
          <div aria-hidden className="pointer-events-none absolute left-12 right-6 top-3">
            {GHOST_LINES.map((line, i) => (
              <div key={i} className="flex h-5 items-center" style={{ paddingLeft: `${line.indent * 16}px` }}>
                <span className={cn("h-2.5 rounded-full", line.tone)} style={{ width: `${line.w}%` }} />
              </div>
            ))}
          </div>
        )}

        {/* エディタ本体（ここに直接貼り付けもできる） */}
        <label htmlFor="studio-paste-zone" className="sr-only">
          コードエディタ（AIのコードを貼り付け）
        </label>
        <textarea
          id="studio-paste-zone"
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
            if (v.trim().length > 20) onManualPaste(v);
          }}
          autoFocus={pasteFailed}
          spellCheck={false}
          placeholder={showCard ? "" : "ここにAIのコードを貼り付け（スマホは長押し →「ペースト」／PCは Ctrl+V）"}
          className="absolute inset-y-0 left-10 right-0 resize-none bg-transparent px-3 pt-3 font-mono text-xs leading-5 text-slate-700 outline-none placeholder:font-sans placeholder:text-sm placeholder:text-slate-400"
        />

        {/* 始め方の案内（エディタの上に重ねる） */}
        {showCard ? (
          <div className="pointer-events-none absolute inset-0 overflow-y-auto overscroll-contain">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <div className="pointer-events-auto relative w-full max-w-md rounded-2xl bg-white/95 p-5 shadow-2xl shadow-emerald-900/10 ring-1 ring-slate-900/5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={startDirect}
                  aria-label="案内を閉じる"
                  title="閉じてエディタに直接貼る"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
                {waitingForAi ? (
                  <>
                    <p className="text-xs font-bold tracking-wide text-teal-700">
                      {returned ? "おかえりなさい" : `${ai?.url ? ai.name : "AI"}の返事を待っています`}
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold leading-snug tracking-tight text-slate-900 [word-break:auto-phrase]">
                      AIのコードを、このエディタに貼り付けてください
                    </h2>
                    <ol className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-600">
                      <li className="flex gap-2.5">
                        <StepDot n={1} />
                        <span>{ai?.url ? ai.name : "AI"}の返事にあるコードを、最初から最後まで全部コピー</span>
                      </li>
                      <li className="flex gap-2.5">
                        <StepDot n={2} />
                        <span>下の「コードを貼り付けて動かす」を押す</span>
                      </li>
                    </ol>
                    {idea.trim() && (
                      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        作るもの：<span className="font-semibold text-slate-700">{idea}</span>
                      </p>
                    )}
                    {/* スマホは画面下に同じボタンがあるので、PCだけ出す */}
                    <button type="button" onClick={onPasteFromClipboard} className={cn(PRIMARY_BUTTON, "mt-4 hidden md:flex")}>
                      <ClipboardPaste className="h-4 w-4" strokeWidth={2.25} />
                      コードを貼り付けて動かす
                    </button>
                    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500">
                      {ai?.url && (
                        <LaunchAiLink
                          ai={ai}
                          onLaunch={onRelaunch}
                          className="bg-none bg-transparent p-0 text-xs font-semibold text-slate-500 shadow-none hover:bg-transparent hover:text-slate-800"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          もう一度{ai.name}を開く
                        </LaunchAiLink>
                      )}
                      <button type="button" onClick={onReopenCopied} className="flex items-center gap-1 hover:text-slate-800">
                        <Copy className="h-3.5 w-3.5" />
                        プロンプトをもう一度コピー
                      </button>
                      <button type="button" onClick={startDirect} className="flex items-center gap-1 hover:text-slate-800">
                        <Code2 className="h-3.5 w-3.5" />
                        エディタに直接貼る
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-teal-700">
                      <Code2 className="h-3.5 w-3.5" />
                      コードエディタ
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold leading-snug tracking-tight text-slate-900 [word-break:auto-phrase]">
                      ここにAIが出力したコードをペーストすると、アプリが動きます
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                      コードは、いつも使っている生成AI（ChatGPT・Gemini・Claude など）が書きます。まずはAIに送るプロンプトを作りましょう。
                    </p>

                    <ol className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                      {["書く", "AIが作る", "ここに貼る"].map((t, i) => (
                        <li key={t} className="flex items-center gap-1.5">
                          {i > 0 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />}
                          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                              {i + 1}
                            </span>
                            {t}
                          </span>
                        </li>
                      ))}
                    </ol>

                    <div className="relative mt-5">
                      <span className="absolute -top-2.5 left-3 z-10 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 shadow-sm ring-1 ring-amber-200">
                        まずはここから
                      </span>
                      <button type="button" onClick={onOpenTemplate} className={PRIMARY_BUTTON}>
                        <FileText className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                        プロンプトをテンプレートから作る
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenSharedTemplate}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-sky-800 ring-1 ring-sky-200 transition hover:bg-sky-50 touch-manipulation"
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      グループで共有するアプリを作る
                    </button>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-400">コードを持っている人は</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={onPasteFromClipboard}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50 touch-manipulation"
                        >
                          <ClipboardPaste className="h-3.5 w-3.5" />
                          貼り付けて動かす
                        </button>
                        <button
                          type="button"
                          onClick={startDirect}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 touch-manipulation"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          エディタに直接貼る
                        </button>
                      </div>
                      <details className="group mt-2">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] font-semibold text-sky-700 [&::-webkit-details-marker]:hidden">
                          <Database className="h-3 w-3" />
                          データを保存するアプリの場合
                          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                        </summary>
                        <StorageRequirementNote className="mt-2" withCopy />
                      </details>
                      <CopyTextLink
                        text={buildSharedConvertMessage()}
                        label="持っているコードを共有対応にする依頼文をコピー"
                        doneLabel="コピーしました。最後に今のコードを貼って、AIに送ってください"
                        className="mt-1.5 text-[11px] font-semibold text-sky-700 hover:text-sky-900"
                      />
                    </div>

                    <div className="mt-3 flex flex-col items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={onRunSample}
                        className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800"
                      >
                        <Play className="h-3.5 w-3.5" />
                        まずはサンプルを動かしてみる
                      </button>
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                        <CopyTextLink text={PROMPT_STORAGE_ZISUP} label="保存方式のルールをコピー" />
                        <CopyTextLink text={PROMPT_STORAGE_SHARED} label="共有のルールをコピー" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl bg-slate-900/90 px-3.5 py-2.5 text-xs text-white shadow-lg backdrop-blur">
            <ClipboardPaste className="h-4 w-4 shrink-0 text-emerald-300" />
            <span className="min-w-0 flex-1">
              {pasteFailed ? "自動で貼り付けできませんでした。エディタを長押しして「ペースト」してください" : "エディタにコードを貼り付けてください"}
            </span>
            <button
              type="button"
              onClick={() => setDirectMode(false)}
              className="shrink-0 rounded-lg bg-white/10 px-2 py-1 font-semibold hover:bg-white/20"
            >
              案内に戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── テンプレートからプロンプトを作るモーダル ───

export function PromptTemplateModal({
  open,
  step,
  onClose,
  idea,
  onIdeaChange,
  ideaError,
  options,
  onOptionsChange,
  onCreate,
  promptText,
  copyOk,
  onRecopy,
  onLaunch,
  onEdit,
}: {
  open: boolean;
  step: "form" | "copied";
  onClose: () => void;
  idea: string;
  onIdeaChange: (v: string) => void;
  ideaError: string;
  options: IdeaOptions;
  onOptionsChange: (next: IdeaOptions) => void;
  /** プロンプトを作ってコピーする */
  onCreate: () => void;
  promptText: string;
  /** コピーできたか（できなかったときは手でコピーしてもらう） */
  copyOk: boolean;
  onRecopy: () => void;
  /** AI を開く（開いたら貼り付け待ちになる） */
  onLaunch: (ai: StudioAi) => boolean;
  onEdit: () => void;
}) {
  // 特定のAIに決めず、いつも使っている生成AIに貼ってもらう
  const ai = STUDIO_AIS.find((a) => a.id === "other") ?? STUDIO_AIS[STUDIO_AIS.length - 1];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[450] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={step === "form" ? "プロンプトを作成" : "プロンプトをコピーしました"}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#fbfdfc] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden className="h-[3px] shrink-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
        <div className="flex shrink-0 items-center gap-3 px-5 pb-2 pt-4">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-1.5 w-6 rounded-full bg-emerald-500" />
            <span className={cn("h-1.5 w-6 rounded-full", step === "copied" ? "bg-emerald-500" : "bg-slate-200")} />
          </div>
          <span className="text-xs font-semibold text-slate-400">{step === "form" ? "1 / 2 作りたいものを書く" : "2 / 2 AIに送る"}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "form" ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">プロンプトを作成</h2>
              <p className="mt-1 text-sm text-slate-500">生成AIに送るプロンプトを、テンプレートから作ります。</p>

              <p className="mt-5 text-sm font-bold text-slate-800">だれが使うアプリ？</p>
              <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="だれが使うアプリ">
                {([
                  { shared: false, title: "自分だけで使う", desc: "記録やツールなど", icon: <User className="h-4 w-4" /> },
                  { shared: true, title: "グループで共有", desc: "出欠表・連絡板・当番表など", icon: <Users className="h-4 w-4" /> },
                ] as const).map((opt) => {
                  const selected = options.shared === opt.shared;
                  return (
                    <button
                      key={opt.title}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onOptionsChange({ ...options, shared: opt.shared })}
                      className={cn(
                        "rounded-xl px-3 py-2.5 text-left transition-all touch-manipulation",
                        selected
                          ? opt.shared
                            ? "bg-sky-50 ring-2 ring-sky-500"
                            : "bg-emerald-50 ring-2 ring-emerald-600"
                          : "bg-white ring-1 ring-slate-200 hover:ring-slate-300"
                      )}
                    >
                      <span className={cn("flex items-center gap-1.5 text-sm font-bold", selected ? (opt.shared ? "text-sky-800" : "text-emerald-800") : "text-slate-700")}>
                        {opt.icon}
                        {opt.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
              {options.shared && (
                <p className="mt-2 rounded-xl bg-sky-50/80 px-3 py-2.5 text-xs leading-relaxed text-sky-900 ring-1 ring-sky-100">
                  メンバーみんなで同じデータを見たり書き込んだりできるアプリにします。公開したあと、アプリのページで「グループを作る」→ 招待リンクをメンバーに送ると使えます（グループを作る人だけログインが必要です）。
                </p>
              )}

              <label htmlFor="studio-idea" className="mt-5 block text-sm font-bold text-slate-800">
                何を作りますか。
              </label>
              <textarea
                id="studio-idea"
                value={idea}
                onChange={(e) => onIdeaChange(e.target.value)}
                rows={2}
                maxLength={200}
                autoFocus
                placeholder={options.shared ? "例：サークルの出欠表（練習日ごとに出欠を入れる）" : "例：4人の割り勘を一瞬で出すアプリ"}
                className={cn(
                  "mt-2 w-full resize-none rounded-2xl border bg-white px-4 py-3.5 text-base leading-relaxed text-slate-900 shadow-sm shadow-emerald-900/5 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
                  ideaError ? "border-rose-300" : "border-slate-200"
                )}
              />
              {ideaError && <p className="mt-1.5 text-xs font-semibold text-rose-600">{ideaError}</p>}

              <div className="mt-4 space-y-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200">
                <div>
                  <label htmlFor="studio-details" className="text-xs font-semibold text-slate-600">
                    こだわり・機能の希望<span className="ml-1 font-normal text-slate-400">（任意）</span>
                  </label>
                  <textarea
                    id="studio-details"
                    value={options.details}
                    onChange={(e) => onOptionsChange({ ...options, details: e.target.value })}
                    rows={2}
                    placeholder="例：人数と金額を入れたら大きく表示。端数は幹事が払う"
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div className="h-px bg-slate-100" />
                <ToggleRow
                  label="ジサップのデザインで作る"
                  description="すりガラス風の、透明感のあるデザイン（配色はアプリに合わせてAIが決めます）"
                  checked={options.useJisappDesign}
                  onChange={(v) => onOptionsChange({ ...options, useJisappDesign: v })}
                />
                <ToggleRow
                  label={options.shared ? "自分だけのデータも保存する" : "データを保存する"}
                  description={options.shared ? "設定など、共有しないデータを残します" : "ログインすると別の端末でも記録が残ります"}
                  checked={options.needSave}
                  onChange={(v) => onOptionsChange({ ...options, needSave: v })}
                />
              </div>

            </div>
            <div className="shrink-0 border-t border-slate-100 bg-white/80 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button type="button" onClick={onCreate} className={PRIMARY_BUTTON}>
                <Copy className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                プロンプトを作ってコピーする
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              <div className="flex flex-col items-center pt-2 text-center">
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full",
                    copyOk ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-600/30" : "bg-amber-100 text-amber-600"
                  )}
                >
                  {copyOk ? <Check className="h-7 w-7" strokeWidth={3} /> : <Copy className="h-6 w-6" />}
                </span>
                <h2 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900">
                  {copyOk ? "プロンプトをコピーしました" : "自動でコピーできませんでした"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {copyOk
                    ? "いつも使っている生成AIのアプリに貼り付けて、送信してください"
                    : "下の枠を長押しして、すべて選択 →「コピー」してください"}
                </p>
              </div>

              {!copyOk && (
                <textarea
                  readOnly
                  value={promptText}
                  rows={6}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-4 block w-full resize-none rounded-xl bg-white px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-slate-600 outline-none ring-2 ring-amber-300"
                />
              )}

              <ol className="mt-5 space-y-3">
                <li className="flex gap-3">
                  <StepDot n={1} />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-slate-700">いつも使っている生成AIのアプリを開く</span>
                    <p className="mt-0.5 text-xs text-slate-500">ChatGPT・Gemini・Claude など、どのAIでも使えます</p>
                    {copyOk && (
                      <div className="mt-2 overflow-hidden rounded-xl bg-white ring-1 ring-emerald-200">
                        <p className="flex items-center gap-1.5 border-b border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          コピーしたプロンプト（この内容をAIに送ります）
                        </p>
                        <textarea
                          readOnly
                          value={promptText}
                          rows={4}
                          aria-label="コピーしたプロンプト"
                          className="block w-full resize-none bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-600 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </li>
                <li className="flex gap-3">
                  <StepDot n={2} />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-slate-700">
                      生成AIのチャット入力欄に、コピーしたプロンプトをペーストして送信する
                    </span>
                    {/* チャット入力欄に、コピーしたプロンプトを貼った様子の絵 */}
                    <div aria-hidden className="mt-2 rounded-2xl bg-slate-100 p-3 pt-9">
                      <div className="relative flex items-end gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-slate-200">
                        <span className="line-clamp-3 min-w-0 flex-1 whitespace-pre-line font-mono text-[10px] leading-snug text-slate-600">
                          {promptText || "メッセージを入力…"}
                        </span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </span>
                        <span className="absolute -top-7 left-6 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                          ペースト
                          <span className="absolute -bottom-1 left-3 h-2 w-2 rotate-45 bg-slate-900" />
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">スマホは入力欄を長押し →「ペースト」／PCは Ctrl+V（Macは ⌘+V）</p>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <StepDot n={3} />
                  <span className="text-sm font-semibold text-slate-700">
                    返ってきたコードを全部コピーして、ジサップに戻って貼り付ける
                  </span>
                </li>
              </ol>
            </div>
            <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white/80 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button type="button" onClick={() => onLaunch(ai)} className={PRIMARY_BUTTON}>
                <ClipboardPaste className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                AIに送ったら、コードを貼り付けへ
              </button>
              <div className="flex items-center justify-center gap-5 text-xs font-semibold text-slate-500">
                <button type="button" onClick={onRecopy} className="flex items-center gap-1 hover:text-slate-800">
                  <Copy className="h-3.5 w-3.5" />
                  もう一度コピー
                </button>
                <button type="button" onClick={onEdit} className="flex items-center gap-1 hover:text-slate-800">
                  <RotateCcw className="h-3.5 w-3.5" />
                  内容を直す
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** 押すと文をコピーする小さなリンク */
function CopyTextLink({
  text,
  label,
  doneLabel,
  className,
}: {
  text: string;
  label: string;
  doneLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void copyText(text).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2500);
        });
      }}
      className={cn("flex items-center gap-1.5 text-left font-medium text-slate-400 hover:text-slate-600", className)}
    >
      {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
      {copied ? doneLabel ?? `${label.replace(/をコピー$/, "")}をコピーしました` : label}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-6 w-10 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-500 peer-checked:after:translate-x-4 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-100"
      />
    </label>
  );
}

function StepDot({ n }: { n: number }) {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
      {n}
    </span>
  );
}

// ─── プレビューが空のとき ───

export function PreviewEmpty({ onRunSample }: { onRunSample: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="relative mb-6">
        <div aria-hidden className="absolute -inset-8 rounded-full bg-gradient-to-br from-emerald-200/50 via-sky-200/40 to-amber-100/40 blur-2xl" />
        <div className="relative h-32 w-[88px] overflow-hidden rounded-[20px] bg-white shadow-xl shadow-emerald-900/10 ring-1 ring-slate-900/5">
          <div className="h-9 bg-gradient-to-br from-emerald-500 to-teal-400" />
          <div className="mx-3 mt-3 h-2 rounded-full bg-slate-100" />
          <div className="mx-3 mt-2 h-2 w-10 rounded-full bg-slate-100" />
          <div className="absolute inset-x-3 bottom-3 h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>
      </div>
      <p className="text-base font-bold text-slate-800">ここでアプリが動きます</p>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
        AIのコードを貼ると、すぐにこの画面で動きます。
      </p>
      <button
        type="button"
        onClick={onRunSample}
        className="mt-5 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50"
      >
        <Play className="h-3.5 w-3.5" />
        サンプルを動かしてみる
      </button>
    </div>
  );
}
