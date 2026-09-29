"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Database,
  X,
} from "lucide-react";
import {
  buildStorageFixPrompt,
  type StorageChangeFinding,
} from "@/lib/playground/detect-storage-keys";
import { useLocale, useT } from "@/lib/i18n/client";

type Props = {
  open: boolean;
  findings: StorageChangeFinding[];
  onClose: () => void;
  onProceed: () => void;
  /** 「データをリセット」をオンにして公開する */
  onProceedWithReset?: () => void;
};

export function StorageChangeWarningModal({
  open,
  findings,
  onClose,
  onProceed,
  onProceedWithReset,
}: Props) {
  const [view, setView] = useState<"explain" | "fix">("explain");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const t = useT();
  const locale = useLocale();

  // 開き直したときは最初の説明から
  useEffect(() => {
    if (open) {
      setView("explain");
      setCopied(false);
      setCopyError("");
    }
  }, [open]);

  if (!open) return null;

  const warnings = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");
  const fixPrompt = buildStorageFixPrompt(findings, locale);

  const close = () => {
    setView("explain");
    setCopied(false);
    setCopyError("");
    onClose();
  };

  const handleCopy = async () => {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(fixPrompt);
      setCopied(true);
    } catch {
      setCopyError(t("コピーできませんでした。下の文を長押し（PCは選択）してコピーしてください", "Couldn't copy. Long-press (or select) the text below to copy it"));
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h2 className="flex items-start gap-2 text-base font-black text-gray-900">
            {view === "explain" ? (
              <>
                <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2.5} />
                {t("このまま公開すると、保存データが読み込めなくなります", "If you publish as is, saved data won't load")}
              </>
            ) : (
              <>
                {t("AIに直してもらう", "Have the AI fix it")}
              </>
            )}
          </h2>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label={t("閉じる", "Close")}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {view === "explain" ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2.5} />
              <div className="space-y-1.5 text-xs leading-relaxed text-amber-900">
                <p className="font-bold">{t("アプリは、データに名前をつけて保存しています", "The app saves data under names")}</p>
                <p>
                  {t("新しいコードでは、その名前や保存場所が前のバージョンと違っています。前のデータは残っていてもアプリが見つけられないため、利用者の画面では入力した内容がすべて消えた状態で表示されます。", "In the new code, those names or where data is saved differ from the previous version. The old data still exists, but the app can't find it, so people will see everything they entered as gone.")}
                </p>
              </div>
            </div>

            {warnings.length > 0 && (
              <ul className="space-y-3">
                {warnings.map((f) => (
                  <li
                    key={f.title}
                    className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-xs leading-relaxed"
                  >
                    <p className="font-bold text-amber-950">{f.title}</p>
                    <p className="mt-1 text-amber-800">{f.detail}</p>
                  </li>
                ))}
              </ul>
            )}

            {infos.length > 0 && (
              <ul className="space-y-2">
                {infos.map((f) => (
                  <li
                    key={f.title}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs leading-relaxed"
                  >
                    <p className="font-bold text-gray-700">{f.title}</p>
                    <p className="mt-1 text-gray-500">{f.detail}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-600">
              <p className="font-bold text-gray-700">{t("どうすればいいか", "What to do")}</p>
              <p className="mt-1">
                {t("保存に使う名前を前のバージョンと同じに戻せば、これまでのデータをそのまま引き継げます。修正方法が分からない場合は、下のボタンでAIにそのまま送れる指示文をコピーできます。", "Switch the names back to the ones used in the previous version and the existing data carries over. Not sure how? Copy ready-to-send instructions for the AI with the button below.")}
              </p>
            </div>

            <div className="flex flex-col gap-2 pb-1">
              <button
                type="button"
                onClick={() => setView("fix")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99]"
              >
                {t("コードを見直す（AIへの指示をコピー）", "Fix the code (copy instructions for the AI)")}
              </button>
              {onProceedWithReset && (
                <button
                  type="button"
                  onClick={onProceedWithReset}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 py-3 text-xs font-bold leading-relaxed text-amber-900 hover:bg-amber-100"
                >
                  {t("データを初期化する前提で公開する", "Publish and reset saved data")}
                  <span className="mt-0.5 block text-[10px] font-semibold text-amber-700">
                    {t("利用者に「保存データが初期化されます」と知らせて公開します", "People will be told “your saved data will be reset”")}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={onProceed}
                className="w-full py-1 text-center text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                {t("問題ないので、このまま公開する", "It's fine — publish as is")}
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <ol className="space-y-2">
              {[
                t("下の「指示文をコピー」を押す", "Press “Copy instructions” below"),
                t("コードを作成したAI（ChatGPT・Claude・Gemini など）に貼り付けて送る", "Paste them into the AI that wrote the code (ChatGPT, Claude, Gemini, etc.) and send"),
                t("返ってきた新しいコードを開発スタジオに貼り付け直して、もう一度公開する", "Paste the new code it returns into the Studio and publish again"),
              ].map((step, i) => (
                <li
                  key={step}
                  className="flex gap-3 rounded-xl bg-emerald-50/70 px-3 py-2.5 text-xs leading-relaxed text-gray-700"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => void handleCopy()}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white shadow-sm active:scale-[0.99] ${
                copied ? "bg-teal-600" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  {t("コピーしました", "Copied")}
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  {t("指示文をコピー", "Copy instructions")}
                </>
              )}
            </button>

            {copyError && (
              <p className="text-xs font-semibold text-rose-600">{copyError}</p>
            )}

            <div>
              <p className="mb-1.5 text-[11px] font-bold text-gray-500">{t("AIに送る内容", "What you'll send to the AI")}</p>
              <textarea
                readOnly
                value={fixPrompt}
                rows={10}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-[11px] leading-relaxed text-gray-700 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 pb-1">
              <button
                type="button"
                onClick={close}
                className="w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                {t("閉じてコードを直す", "Close and fix the code")}
              </button>
              <button
                type="button"
                onClick={() => setView("explain")}
                className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {t("説明に戻る", "Back to the explanation")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
