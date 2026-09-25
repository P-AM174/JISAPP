"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, Copy, FileText, Send, X } from "lucide-react";
import { buildPromptFromTemplate, PROMPT_RULES_SHORT } from "@/lib/playground/prompt-template";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onReturnToEditor?: () => void;
  initialTab?: "template" | "rules";
};

type ChatStep = 0 | 1 | 2 | 3 | "result";

const APP_EXAMPLES = ["日記アプリ", "家計簿", "TODOリスト", "タイマー", "おこづかい帳"];

const QUESTIONS = [
  "作りたいアプリは何ですか。",
  "そのアプリの詳細や仕様、デザイン、機能、こだわりについて教えてください。ない場合は「なし」と送ってください。",
  "ジサップのオリジナルデザインで作りますか？\n透明感のあるグラデーションとすりガラス風の見た目を指定します。自分でデザインを決めたいときは「いいえ」です。",
  "データの保存機能は必要ですか？\n「はい」は、ログインすると別の端末でも記録が残ります。「いいえ」は、同じスマホ・パソコンのブラウザの中だけ残します。",
] as const;

export function PromptBuilderModal({
  open,
  onClose,
  onReturnToEditor,
  initialTab = "template",
}: Props) {
  const [tab, setTab] = useState<"template" | "rules">(initialTab);
  const [step, setStep] = useState<ChatStep>(0);
  const [appName, setAppName] = useState("");
  const [details, setDetails] = useState("");
  const [useJisappDesign, setUseJisappDesign] = useState(true);
  const [needSave, setNeedSave] = useState(true);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState<"template" | "rules" | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setStep(0);
    setAppName("");
    setDetails("");
    setUseJisappDesign(true);
    setNeedSave(true);
    setDraft("");
    setCopied(null);
    setError("");
  }, [open, initialTab]);

  useEffect(() => {
    if (!open || tab !== "template" || step === "result") return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, tab, step, appName, details, useJisappDesign, needSave]);

  if (!open || !mounted) return null;

  const answers: [string, string, string, string] = [
    appName,
    details,
    useJisappDesign ? "はい" : "いいえ",
    needSave ? "はい" : "いいえ",
  ];

  const visibleCount = step === "result" ? 4 : step;

  const finishedPrompt = buildPromptFromTemplate(appName.trim(), details, {
    useJisappDesign,
    storage: needSave ? "zisup" : "local",
  });

  const goBack = () => {
    setError("");
    setCopied(null);
    if (step === "result") {
      setStep(3);
      return;
    }
    if (step === 0) return;
    const prev = (step - 1) as 0 | 1 | 2 | 3;
    if (prev === 0) setDraft(appName);
    if (prev === 1) setDraft(details === "なし" ? "" : details);
    setStep(prev);
  };

  const submitAppName = (value: string) => {
    const name = value.trim();
    if (!name) {
      setError("作りたいアプリを入力してください");
      return;
    }
    setError("");
    setAppName(name);
    setDraft("");
    setStep(1);
  };

  const submitDetails = (value: string) => {
    const text = value.trim() || "なし";
    setError("");
    setDetails(text);
    setDraft("");
    setStep(2);
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(finishedPrompt);
      setCopied("template");
    } catch {
      setError("コピーできませんでした。下の文を長押ししてコピーしてください");
    }
  };

  const handleCopyRules = async () => {
    setError("");
    try {
      await navigator.clipboard.writeText(PROMPT_RULES_SHORT);
      setCopied("rules");
    } catch {
      setError("コピーに失敗しました。もう一度お試しください");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-emerald-100 bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-4 text-white sm:px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <FileText className="h-5 w-5 shrink-0" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-base font-black">AIに送るプロンプト</h2>
            <p className="mt-0.5 text-xs text-emerald-50">
              チャットで作成、または必須ルールだけコピー
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-black/10 transition-colors hover:bg-slate-100 active:scale-95"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-2">
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-gray-200">
            <button
              type="button"
              onClick={() => {
                setTab("template");
                setCopied(null);
                setError("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold transition-colors",
                tab === "template" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              チャットからプロンプトを作成
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("rules");
                setCopied(null);
                setError("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold transition-colors",
                tab === "rules" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              必須ルールだけ
            </button>
          </div>
        </div>

        {tab === "template" && step !== "result" ? (
          <>
            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              {QUESTIONS.map((question, index) => {
                if (index > visibleCount) return null;
                const answered = index < visibleCount;
                return (
                  <div key={question} className="space-y-2">
                    <div className="flex justify-start">
                      <p className="max-w-[90%] whitespace-pre-line rounded-2xl rounded-tl-md bg-emerald-50 px-3 py-2.5 text-sm leading-relaxed text-gray-800">
                        {question}
                      </p>
                    </div>
                    {answered && (
                      <div className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-md bg-emerald-600 px-3 py-2.5 text-sm leading-relaxed text-white">
                          {answers[index]}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {error && <p className="mb-2 text-xs font-semibold text-rose-600">{error}</p>}

              {typeof step === "number" && step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  ひとつ前に戻る
                </button>
              )}

              {step === 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {APP_EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => submitAppName(ex)}
                        className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitAppName(draft);
                    }}
                  >
                    <input
                      ref={(el) => {
                        inputRef.current = el;
                      }}
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="例：日記アプリ"
                      autoComplete="off"
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"
                      aria-label="送信"
                    >
                      <Send className="h-4 w-4 shrink-0" strokeWidth={2} />
                    </button>
                  </form>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => submitDetails("なし")}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-200"
                  >
                    なし
                  </button>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitDetails(draft);
                    }}
                  >
                    <textarea
                      ref={(el) => {
                        inputRef.current = el;
                      }}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      placeholder="仕様・デザイン・こだわり"
                      className="min-w-0 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-emerald-600 text-white"
                      aria-label="送信"
                    >
                      <Send className="h-4 w-4 shrink-0" strokeWidth={2} />
                    </button>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseJisappDesign(true);
                      setStep(3);
                    }}
                    className="rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
                  >
                    はい
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseJisappDesign(false);
                      setStep(3);
                    }}
                    className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700"
                  >
                    いいえ
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNeedSave(true);
                      setStep("result");
                    }}
                    className="rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
                  >
                    はい
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNeedSave(false);
                      setStep("result");
                    }}
                    className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700"
                  >
                    いいえ
                  </button>
                </div>
              )}
            </div>
          </>
        ) : tab === "template" ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              質問に戻る
            </button>

            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-sm font-black text-emerald-950">以下のプロンプトをコピーしてAIに送ってください</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                ChatGPT・Claude・Gemini などに貼り付けて送信します。返ってきたコードを、開発スタジオに貼り付けてください。
              </p>
            </div>

            <ul className="space-y-1 text-xs text-gray-500">
              <li>アプリ: {appName}</li>
              <li>詳細: {details || "なし"}</li>
              <li>オリジナルデザイン: {useJisappDesign ? "使う" : "使わない"}</li>
              <li>保存: {needSave ? "ジサップの保存機能" : "この端末の localStorage"}</li>
            </ul>

            <button
              type="button"
              onClick={() => void handleCopyTemplate()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white shadow-sm active:scale-[0.99]",
                copied === "template" ? "bg-teal-600" : "bg-emerald-600 hover:bg-emerald-500"
              )}
            >
              {copied === "template" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  コピーしました
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" strokeWidth={2} />
                  プロンプトをコピー
                </>
              )}
            </button>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <textarea
              readOnly
              value={finishedPrompt}
              rows={12}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-[11px] leading-relaxed text-gray-700 outline-none"
            />

            <button
              type="button"
              onClick={() => (onReturnToEditor ?? onClose)()}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              エディタに戻る
            </button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-black text-amber-900">自分でプロンプトを書く人向け</p>
              <p className="mt-1.5 text-xs leading-relaxed text-amber-800">
                作りたいアプリの説明は自分で書いてOKです。その文の
                <span className="font-bold">末尾</span>
                に、下の必須ルールを貼り付けてからAIに送ってください。保存先やAPIキーの扱いが正しくなります。
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-gray-700">必須ルール（短縮版）</p>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-700">
                {PROMPT_RULES_SHORT}
              </pre>
            </div>

            <ol className="space-y-1.5 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900">
              <li>1. 自分の要望文をAIに書く（または貼る）</li>
              <li>2. 「必須ルールだけコピー」を押す</li>
              <li>3. 要望文のあとに貼り付けて送信</li>
            </ol>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
            )}

            <button
              type="button"
              onClick={() => void handleCopyRules()}
              disabled={copied === "rules"}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.99]",
                copied === "rules" ? "bg-emerald-600" : "bg-amber-600 hover:bg-amber-500"
              )}
            >
              {copied === "rules" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                  コピーしました
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 shrink-0" strokeWidth={2} />
                  必須ルールだけコピー
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
