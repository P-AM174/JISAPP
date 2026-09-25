"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardPaste,
  Copy,
  Database,
  FileText,
  Play,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_AIS, copyText, type StudioAi } from "@/lib/playground/ai-launch";
import { PROMPT_RULES_SHORT } from "@/lib/playground/prompt-template";
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

// ─── 最初の画面：始め方を選ぶ ───

function BackToChoose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 self-start text-xs font-semibold text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      始め方を選ぶ
    </button>
  );
}

export function ChoosePanel({
  onChoosePrompt,
  onChooseCode,
  onRunSample,
}: {
  onChoosePrompt: () => void;
  onChooseCode: () => void;
  onRunSample: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8 pt-7 sm:px-7 sm:pt-10">
        <p className="text-xs font-bold tracking-wide text-teal-700">開発スタジオ</p>
        <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-slate-900 [word-break:auto-phrase] sm:text-3xl">
          どちらから始めますか？
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          ジサップは、AIが書いたコードを貼るだけでアプリが動く場所です。サーバーやデータベースの準備はいりません。
        </p>

        <button
          type="button"
          onClick={onChoosePrompt}
          className="group relative mt-6 overflow-hidden rounded-2xl bg-white p-5 text-left shadow-lg shadow-emerald-900/5 ring-2 ring-emerald-500 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/10 touch-manipulation"
        >
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-200/60 to-sky-200/50 blur-2xl" />
          <span className="relative flex items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-600/30">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">はじめての方におすすめ</span>
              <span className="block text-base font-bold text-slate-900">プロンプトから作る</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-emerald-700 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="relative mt-3 block text-sm leading-relaxed text-slate-600">
            作りたいものを書くと、ジサップで動く指示文（プロンプト）を作ってAIを開きます。AIが返したコードを貼れば完成です。
          </span>
          <span className="relative mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-emerald-700/70">
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">作りたいものを書く</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">AIに送る</span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">コードを貼る</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onChooseCode}
          className="group mt-3 rounded-2xl bg-white/90 p-5 text-left shadow-sm shadow-sky-900/5 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-sky-300 touch-manipulation"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700">
              <ClipboardPaste className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-100">コードを持っている方</span>
              <span className="block text-base font-bold text-slate-900">コードを貼り付ける</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-sky-500 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-3 block text-sm leading-relaxed text-slate-600">
            ChatGPT・Claude・Gemini などで作ったHTMLコードを貼ると、その場ですぐに動きます。
          </span>
          <StorageRequirementNote className="mt-3" />
        </button>

        <button
          type="button"
          onClick={onRunSample}
          className="mt-5 flex items-center gap-1.5 self-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <Play className="h-3.5 w-3.5" />
          まずはサンプルを動かしてみる
        </button>
      </div>
    </div>
  );
}

/** データ保存機能を使うときの指定（コードを直接貼る人向け） */
function StorageRequirementNote({
  className,
  withCopy = false,
}: {
  className?: string;
  withCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <span className={cn("block rounded-xl bg-sky-50/70 px-3.5 py-3 ring-1 ring-sky-100", className)}>
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <Database className="h-3.5 w-3.5 shrink-0 text-sky-600" />
        データを保存するアプリの場合
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-slate-600">
        保存と読み込みに{" "}
        <code className="rounded bg-white px-1 py-0.5 text-[11px] text-slate-800 ring-1 ring-slate-200">window.Zisup.saveData</code>
        {" / "}
        <code className="rounded bg-white px-1 py-0.5 text-[11px] text-slate-800 ring-1 ring-slate-200">loadData</code>{" "}
        を使う指定が必要です。localStorage のままだと、同じ端末のブラウザにしか残りません。
      </span>
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
    </span>
  );
}

// ─── ステップ1：作りたいものを書く ───

export type IdeaOptions = {
  details: string;
  useJisappDesign: boolean;
  needSave: boolean;
};

export function StartPanel({
  idea,
  onIdeaChange,
  ideaError,
  aiId,
  onAiChange,
  options,
  onOptionsChange,
  primaryAction,
  onBackToChoose,
  onRunSample,
}: {
  idea: string;
  onIdeaChange: (v: string) => void;
  ideaError: string;
  aiId: StudioAi["id"];
  onAiChange: (id: StudioAi["id"]) => void;
  options: IdeaOptions;
  onOptionsChange: (next: IdeaOptions) => void;
  /** PC ではパネル内に主ボタンを置く（スマホは下部バーに置く） */
  primaryAction: React.ReactNode;
  onBackToChoose: () => void;
  onRunSample: () => void;
}) {
  const [rulesCopied, setRulesCopied] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-6 pt-5 sm:px-7 sm:pt-8">
        <BackToChoose onClick={onBackToChoose} />
        <p className="mt-4 text-xs font-bold tracking-wide text-teal-700">コードはAIが書きます</p>
        <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-slate-900 [word-break:auto-phrase] sm:text-3xl">
          プロンプトを作成
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          作りたいものを書くと、ジサップ用の指示文（プロンプト）をコピーしてAIを開きます。返ってきたコードをここに貼れば、そのまま動きます。
        </p>

        <label htmlFor="studio-idea" className="mt-6 block text-sm font-bold text-slate-800">
          何を作りますか。
        </label>
        <textarea
          id="studio-idea"
          value={idea}
          onChange={(e) => onIdeaChange(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="例：4人の割り勘を一瞬で出すアプリ"
          className={cn(
            "mt-2 w-full resize-none rounded-2xl border bg-white px-4 py-3.5 text-base leading-relaxed text-slate-900 shadow-sm shadow-emerald-900/5 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
            ideaError ? "border-rose-300" : "border-slate-200"
          )}
        />
        {ideaError && <p className="mt-1.5 text-xs font-semibold text-rose-600">{ideaError}</p>}

        <div className="mt-4 space-y-4 rounded-2xl bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200">
          <div>
            <label htmlFor="studio-details" className="text-xs font-semibold text-slate-600">
              こだわり・機能の希望<span className="ml-1 font-normal text-slate-400">（任意）</span>
            </label>
            <textarea
              id="studio-details"
              value={options.details}
              onChange={(e) => onOptionsChange({ ...options, details: e.target.value })}
              rows={3}
              placeholder="例：人数と金額を入れたら大きく表示。端数は幹事が払う"
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div className="h-px bg-slate-100" />
          <ToggleRow
            label="ジサップのデザインで作る"
            description="透明感のあるグラデーションとすりガラス風"
            checked={options.useJisappDesign}
            onChange={(v) => onOptionsChange({ ...options, useJisappDesign: v })}
          />
          <ToggleRow
            label="データを保存する"
            description="ログインすると別の端末でも記録が残ります"
            checked={options.needSave}
            onChange={(v) => onOptionsChange({ ...options, needSave: v })}
          />
        </div>

        <p className="mt-6 text-sm font-bold text-slate-800">使うAI</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="使うAI">
          {STUDIO_AIS.map((ai) => {
            const selected = ai.id === aiId;
            return (
              <button
                key={ai.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onAiChange(ai.id)}
                className={cn(
                  "rounded-xl px-1 py-2.5 text-[13px] font-semibold transition-all touch-manipulation sm:text-sm",
                  selected
                    ? "bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"
                )}
              >
                {ai.name}
              </button>
            );
          })}
        </div>

        <div className="mt-6 hidden md:block">{primaryAction}</div>
        <p className="mt-2 hidden text-center text-xs text-slate-400 md:block">
          {launchCaption(STUDIO_AIS.find((ai) => ai.id === aiId) ?? STUDIO_AIS[0])}
        </p>

        <button
          type="button"
          onClick={onRunSample}
          className="mt-8 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-slate-200 transition hover:ring-emerald-300 touch-manipulation"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600">
            <Play className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-800">サンプルを動かす</span>
            <span className="block text-xs text-slate-500">完成形を先に触ってみる</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            void copyText(PROMPT_RULES_SHORT).then((ok) => {
              if (!ok) return;
              setRulesCopied(true);
              window.setTimeout(() => setRulesCopied(false), 2500);
            });
          }}
          className="mt-5 flex items-center gap-1.5 self-center text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          {rulesCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {rulesCopied ? "必須ルールをコピーしました。自分の指示文の最後に貼ってください" : "自分で指示文を書く人は、必須ルールだけコピー"}
        </button>
      </div>
    </div>
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

// ─── ステップ2：AIのコードを貼る ───

export function PastePanel({
  idea,
  ai,
  returned,
  onPasteFromClipboard,
  onManualPaste,
  onRelaunch,
  onBack,
  pasteFailed,
}: {
  idea: string;
  ai: StudioAi | null;
  /** AI のタブから戻ってきた直後 */
  returned: boolean;
  onPasteFromClipboard: () => void;
  onManualPaste: (text: string) => void;
  onRelaunch: () => boolean;
  onBack: () => void;
  /** クリップボードを読めなかった */
  pasteFailed: boolean;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-6 pt-7 sm:px-7 sm:pt-10">
        <p className="text-xs font-bold tracking-wide text-teal-700">
          {returned ? "おかえりなさい" : ai ? `${ai.url ? ai.name : "AI"}の返事を待っています` : "コードを貼り付けます"}
        </p>
        <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-slate-900 [word-break:auto-phrase] sm:text-3xl">
          コードを貼り付けましょう
        </h1>
        <ol className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
          {ai && (
            <li className="flex gap-2.5">
              <StepDot n={1} />
              <span>{ai.url ? ai.name : "使っているAI"}に指示文を貼り付けて送信する（コピー済みです）</span>
            </li>
          )}
          <li className="flex gap-2.5">
            <StepDot n={ai ? 2 : 1} />
            <span>{ai ? "返ってきたコードを" : "AIで作ったコードを"}、最初から最後まで全部コピーする</span>
          </li>
          <li className="flex gap-2.5">
            <StepDot n={ai ? 3 : 2} />
            <span>下のボタンを押して貼り付ける</span>
          </li>
        </ol>

        <button
          type="button"
          onClick={onPasteFromClipboard}
          className="mt-6 hidden items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] md:flex"
        >
          <ClipboardPaste className="h-4 w-4" strokeWidth={2.25} />
          コードを貼り付けて動かす
        </button>

        <label
          htmlFor="studio-paste-zone"
          className={cn(
            "mt-4 block text-xs font-medium",
            pasteFailed ? "text-amber-700" : "text-slate-500"
          )}
        >
          {pasteFailed
            ? "このブラウザでは自動で貼り付けできませんでした。下の枠を長押しして「ペースト」してください"
            : "うまく貼れないときは、下の枠を長押し（PCはクリックして Ctrl+V）"}
        </label>
        <textarea
          id="studio-paste-zone"
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
            if (v.trim().length > 20) onManualPaste(v);
          }}
          autoFocus={pasteFailed}
          rows={4}
          placeholder="ここにコードを貼り付け"
          className={cn(
            "mt-1.5 w-full flex-1 resize-none rounded-2xl border-2 border-dashed bg-white/80 px-4 py-3 font-mono text-xs text-slate-700 outline-none transition placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white md:min-h-[140px] md:flex-none",
            pasteFailed ? "border-amber-300" : "border-slate-200"
          )}
        />

        {!ai && <StorageRequirementNote className="mt-4" withCopy />}

        {ai && idea.trim() && (
          <p className="mt-4 rounded-xl bg-white px-3.5 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
            作るもの：<span className="font-semibold text-slate-700">{idea}</span>
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
          {ai && (
            <LaunchAiLink
              ai={ai}
              onLaunch={onRelaunch}
              className="bg-transparent p-0 text-xs font-medium text-slate-500 shadow-none hover:bg-transparent hover:text-slate-800"
            >
              {ai.url ? <ArrowUpRight className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {ai.url ? `もう一度${ai.name}を開く` : "もう一度指示文をコピー"}
            </LaunchAiLink>
          )}
          <button type="button" onClick={onBack} className="flex items-center gap-1 hover:text-slate-800">
            <RotateCcw className="h-3.5 w-3.5" />
            {ai ? "作るものを書き直す" : "プロンプトから作る"}
          </button>
        </div>
      </div>
    </div>
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
