"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardPaste, Copy, Download, MousePointerClick, Send, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { rich } from "@/lib/i18n/rich";
import { cn } from "@/lib/utils";

/** 「次回から表示しない」を選んだかどうか */
export const REMIX_GUIDE_HIDDEN_KEY = "jisapp_remix_guide_hidden";

export function isRemixGuideHidden(): boolean {
  try {
    return localStorage.getItem(REMIX_GUIDE_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** 押してほしいボタンを目立たせる（光る枠と指のマーク） */
function Target({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className="absolute -inset-1 animate-pulse rounded-lg ring-[3px] ring-amber-400" aria-hidden />
      {children}
      <MousePointerClick className="absolute -bottom-5 -right-4 h-6 w-6 fill-white text-slate-800 drop-shadow" aria-hidden />
    </span>
  );
}

/** 開発スタジオのエディタの上の部分（本物と同じ並び・名前） */
function StudioMock({ highlight }: { highlight: "copy" | "paste" }) {
  const t = useT();
  const paste = (
    <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
      <ClipboardPaste className="h-3 w-3" />
      {t("貼り直す", "Paste again")}
    </span>
  );
  const copy = (
    <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
      <Copy className="h-3 w-3" />
      {t("全部コピー", "Copy all")}
    </span>
  );
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-1 border-b border-slate-200/80 px-2 py-1.5">
        {highlight === "paste" ? <Target>{paste}</Target> : paste}
        <span className="ml-auto flex items-center gap-1.5">
          {highlight === "copy" ? <Target>{copy}</Target> : copy}
          <Download className="h-3.5 w-3.5 text-slate-300" />
          <Trash2 className="h-3.5 w-3.5 text-slate-300" />
        </span>
      </div>
      <div className="space-y-1 px-3 py-2.5 font-mono text-[10px] leading-tight text-slate-400">
        <p>
          <span className="text-sky-600">&lt;!DOCTYPE html&gt;</span>
        </p>
        <p>
          <span className="text-sky-600">&lt;html&gt;</span>
        </p>
        <p className="pl-2">
          <span className="text-sky-600">&lt;head&gt;</span> …
        </p>
        <p className="h-1.5 w-2/3 rounded bg-slate-100" />
        <p className="h-1.5 w-1/2 rounded bg-slate-100" />
      </div>
    </div>
  );
}

/** AIのチャットに、コードと変えたいところを送るところ */
function ChatSendMock() {
  const t = useT();
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200">
        <p className="mb-1.5 truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500">
          &lt;!DOCTYPE html&gt;&lt;html&gt;&lt;head&gt;…
        </p>
        <p className="mb-1 text-[10px] font-semibold text-slate-400">{t("↑ コピーしたコードを貼る", "↑ Paste the code you copied")}</p>
        <p className="font-semibold text-slate-800">{t("このコードを、次のように変えてください。", "Please change this code like this:")}</p>
        <p>{t("・色を青っぽくしたい", "・Make the colours bluish")}</p>
        <p>{t("・メモを書く欄を足したい", "・Add a field for notes")}</p>
        <p className="mt-1 text-slate-500">{t("変えたあとのコードを、最初から最後まで全部書いてください。", "Write the whole updated code from start to finish.")}</p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
        <span className="flex-1 text-[10px] text-slate-300">{t("メッセージを送る", "Send a message")}</span>
        <Target>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
            <Send className="h-3 w-3" />
          </span>
        </Target>
      </div>
    </div>
  );
}

/** AIの返事のコードの枠。右上の「コピー」を押す */
function ChatReplyMock() {
  const t = useT();
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="flex items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] text-slate-600">{t("変更したコードです。", "Here's the updated code.")}</p>
          <div className="overflow-hidden rounded-lg bg-slate-900">
            <div className="flex items-center justify-between bg-slate-800 px-2.5 py-1">
              <span className="font-mono text-[10px] text-slate-400">html</span>
              <Target>
                <span className="flex items-center gap-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Copy className="h-3 w-3" />
                  {t("コピー", "Copy")}
                </span>
              </Target>
            </div>
            <div className="space-y-1 px-2.5 py-2 font-mono text-[10px] leading-tight text-sky-300">
              <p>&lt;!DOCTYPE html&gt;</p>
              <p className="text-slate-500">…</p>
              <p>&lt;/html&gt;</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 「このアプリをもとに作る」で開発スタジオを開いたときの説明。
 * 全部コピー → AIに変えたいところと一緒に送る → AIの返事のコードをコピー → 貼り直す
 */
export function RemixGuideModal({ sourceTitle, onClose }: { sourceTitle: string; onClose: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const strong = (c: ReactNode) => <strong className="font-black text-slate-900">{c}</strong>;
  const warn = (c: ReactNode) => <strong className="font-black text-rose-600 underline decoration-rose-300 decoration-2 underline-offset-2">{c}</strong>;

  const steps: { title: string; body: ReactNode; figure: ReactNode }[] = [
    {
      title: t("コードを全部コピーする", "Copy all the code"),
      body: rich(t("コードの右上の<b>「全部コピー」</b>を押すと、このアプリのコードがまるごとコピーされます。", "Press <b>“Copy all”</b> at the top right of the code to copy the whole app."), { b: strong }),
      figure: <StudioMock highlight="copy" />,
    },
    {
      title: t("AIに、変えたいところと一緒に送る", "Send it to the AI with your changes"),
      body: rich(t("ChatGPT などのAIのチャットに<b>コピーしたコードを貼り</b>、その下に<b>変えたいところ</b>を書いて送ります。", "In an AI chat such as ChatGPT, <b>paste the code you copied</b> and write <b>what you want to change</b> below it, then send."), { b: strong }),
      figure: <ChatSendMock />,
    },
    {
      title: t("AIの返事のコードをコピーする", "Copy the code from the AI's reply"),
      body: (
        <>
          {rich(t("AIがコードを<b>最後まで書き終わるのを待って</b>から、", "<b>Wait until the AI has finished writing</b> the code, then "), { b: warn })}
          {rich(t("<b>コードの枠の右上の「コピー」</b>を押します。", "press <b>“Copy” at the top right of the code box</b>."), { b: strong })}
          <span className="mt-1 block text-xs text-slate-500">{t("自分が送った文章の下のコピーボタンではありません。", "Not the copy button under the message you sent.")}</span>
        </>
      ),
      figure: <ChatReplyMock />,
    },
    {
      title: t("ジサップに戻って「貼り直す」", "Come back to Jisapp and press “Paste again”"),
      body: rich(t("ジサップに戻って<b>「貼り直す」</b>を押すと、変えたアプリがすぐに動きます。うまくいったら公開しましょう。", "Come back to Jisapp and press <b>“Paste again”</b>. Your changed app runs right away. When you're happy with it, publish it."), { b: strong }),
      figure: <StudioMock highlight="paste" />,
    },
  ];
  const last = step === steps.length - 1;
  const current = steps[step];

  const close = () => {
    if (dontShow) {
      try {
        localStorage.setItem(REMIX_GUIDE_HIDDEN_KEY, "1");
      } catch {
        /* noop */
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[470] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("このアプリの変え方", "How to change this app")}
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 pb-4 pt-5 text-white">
          <button
            type="button"
            onClick={close}
            aria-label={t("閉じる", "Close")}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="flex items-center gap-1.5 text-xs font-bold text-white/85">
            <Wand2 className="h-3.5 w-3.5" />
            {t("このアプリの変え方", "How to change this app")}
          </p>
          <p className="mt-1 pr-8 text-sm font-semibold leading-snug">
            {rich(t("「{title}」をもとに、自分用のアプリを作れます。<b>元のアプリは変わりません。</b>", "You can make your own app based on “{title}”. <b>The original app stays as it is.</b>"), { b: (c) => <span className="font-black">{c}</span> }, { title: sourceTitle })}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:min-h-[22rem]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-black text-white">{step + 1}</span>
            <h2 className="text-base font-black leading-snug text-slate-900">{current.title}</h2>
          </div>
          <div className="pb-3">{current.figure}</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{current.body}</p>
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex justify-center gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-violet-600" : "w-1.5 bg-slate-200")} />
            ))}
          </div>
          {last && (
            <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-violet-600" />
              {t("次回から表示しない", "Don't show this again")}
            </label>
          )}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center justify-center gap-1 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("戻る", "Back")}
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setStep((s) => s + 1))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-600/25 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {last ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t("わかった、はじめる", "Got it, let's start")}
                </>
              ) : (
                <>
                  {t("次へ", "Next")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
