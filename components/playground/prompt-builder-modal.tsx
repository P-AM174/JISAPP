"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, FileText, Sparkles, X } from "lucide-react";
import {
  buildPromptFromTemplate,
  PROMPT_RULES_SHORT,
} from "@/lib/playground/prompt-template";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  /** コピー後「戻る」で呼ぶ（未指定時は onClose）。ガイド経由なら両方閉じる想定 */
  onReturnToEditor?: () => void;
  /** コピー後の戻りボタン文言 */
  returnAfterCopyLabel?: string;
  /** 開いたときの初期タブ */
  initialTab?: "template" | "rules";
};

const APP_EXAMPLES = ["日記アプリ", "家計簿", "TODOリスト", "タイマー", "おこづかい帳"];

export function PromptBuilderModal({
  open,
  onClose,
  onReturnToEditor,
  returnAfterCopyLabel = "エディタに戻る",
  initialTab = "template",
}: Props) {
  const [tab, setTab] = useState<"template" | "rules">(initialTab);
  const [appName, setAppName] = useState("");
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState<"template" | "rules" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setCopied(null);
    setError("");
  }, [open, initialTab]);

  if (!open) return null;

  const preview = buildPromptFromTemplate(
    appName.trim() || "（アプリ名）",
    details
  );

  const handleReturnToEditor = () => {
    (onReturnToEditor ?? onClose)();
  };

  const handleCopyTemplate = async () => {
    const name = appName.trim();
    if (!name) {
      setError("作りたいアプリ名を入力してください");
      return;
    }
    setError("");
    try {
      await navigator.clipboard.writeText(buildPromptFromTemplate(name, details));
      setCopied("template");
    } catch {
      setError("コピーに失敗しました。もう一度お試しください");
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

  return (
    <div
      className="fixed inset-0 z-[460] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-sky-100 bg-gradient-to-br from-sky-500 to-blue-600 px-5 py-4 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black">AIに送るプロンプト</h2>
            <p className="mt-0.5 text-xs text-sky-100">
              テンプレート作成、または必須ルールだけコピー
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
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
                tab === "template"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              テンプレートから作成
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
                tab === "rules"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              必須ルールだけ
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
          {tab === "template" ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  作りたいアプリ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => {
                    setAppName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="例：日記アプリ、家計簿、TODOリスト"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {APP_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setAppName(ex);
                        if (error) setError("");
                      }}
                      className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  仕様・デザイン・つけたい機能{" "}
                  <span className="font-medium text-gray-400">（任意）</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  placeholder={
                    "例：\n・パステルカラーでかわいい見た目\n・日付ごとにメモを残せる\n・写真は不要\n・スマホで使いやすく"
                  }
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  空欄でもOK。あとからAIに追加で頼めます。
                </p>
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
              )}

              {/* 入力欄の直下に置き、キーボードやプレビューで隠れないようにする */}
              <button
                type="button"
                onClick={() => void handleCopyTemplate()}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.99]",
                  copied === "template" ? "bg-emerald-600" : "bg-sky-600 hover:bg-sky-500"
                )}
              >
                {copied === "template" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    コピーしました！AIに貼り付けて送ってください
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    完成したプロンプトをコピー
                  </>
                )}
              </button>

              {copied === "template" && (
                <button
                  type="button"
                  onClick={handleReturnToEditor}
                  className="flex w-full items-center justify-center rounded-xl border-2 border-emerald-600 bg-white py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-50 active:scale-[0.99]"
                >
                  {returnAfterCopyLabel}
                </button>
              )}

              <div>
                <p className="mb-1.5 text-xs font-bold text-gray-700">プレビュー（AIに送る文）</p>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 font-mono text-[10px] leading-relaxed text-slate-600">
                  {preview}
                </pre>
              </div>
            </>
          ) : (
            <>
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

              <ol className="space-y-1.5 rounded-xl bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-900">
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
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.99]",
                  copied === "rules" ? "bg-emerald-600" : "bg-amber-600 hover:bg-amber-500"
                )}
              >
                {copied === "rules" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    コピーしました！要望文の末尾に貼ってください
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    必須ルールだけコピー
                  </>
                )}
              </button>

              {copied === "rules" && (
                <button
                  type="button"
                  onClick={handleReturnToEditor}
                  className="flex w-full items-center justify-center rounded-xl border-2 border-emerald-600 bg-white py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-50 active:scale-[0.99]"
                >
                  {returnAfterCopyLabel}
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {copied ? (
            <button
              type="button"
              onClick={handleReturnToEditor}
              className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.99]"
            >
              {returnAfterCopyLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 text-center text-xs text-gray-400 hover:text-gray-600"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
