"use client";

import { ArrowUp, Check, Square, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { rich } from "@/lib/i18n/rich";
import { cn } from "@/lib/utils";

/**
 * AI が「書き終わった」ことを確かめる目印。
 * デモで一番多かった失敗：AI が書いている途中にコピーを押す → コピーできておらず、
 * 前にコピーしたもの（ジサップのプロンプト）を貼ってしまう。そのため、コピーの前に必ずこれを確かめてもらう
 */
export function DoneSigns({ compact = false, className }: { compact?: boolean; className?: string }) {
  const t = useT();
  const bubble = (done: boolean) => (
    <div className={cn("flex-1 rounded-xl p-2 ring-1", done ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200")}>
      <p className={cn("mb-1.5 flex items-center gap-1 text-[10px] font-black", done ? "text-emerald-700" : "text-rose-600")}>
        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
        {done ? t("書き終わった → コピーOK", "Finished → copy now") : t("書いている途中 → まだ", "Still writing → wait")}
      </p>
      <div className="rounded-lg bg-slate-900 px-2 py-1.5 font-mono text-[9px] leading-tight text-sky-300">
        <p>&lt;!DOCTYPE html&gt;</p>
        <p className="text-slate-500">…</p>
        {done ? <p>&lt;/html&gt;</p> : <p className="text-slate-400">function draw(){"{"}<span className="animate-pulse">▍</span></p>}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
        <span className="flex-1 text-[9px] text-slate-300">{t("メッセージ", "Message")}</span>
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-white", done ? "bg-slate-900" : "bg-rose-500")}>
          {done ? <ArrowUp className="h-3 w-3" /> : <Square className="h-2.5 w-2.5 fill-current" />}
        </span>
      </div>
    </div>
  );
  return (
    <div className={cn("rounded-2xl bg-white p-3 ring-1 ring-amber-200", className)}>
      <p className="text-[13px] font-black leading-snug text-slate-900">
        {rich(t("コピーする前に、AIが<b>最後まで書き終わった</b>か確かめる", "Before copying, make sure the AI has <b>completely finished</b>"), {
          b: (c) => <span className="text-rose-600 underline decoration-rose-300 decoration-2 underline-offset-2">{c}</span>,
        })}
      </p>
      {!compact && <div className="mt-2 flex gap-2">{bubble(false)}{bubble(true)}</div>}
      <ul className="mt-2 space-y-1 text-[12px] leading-snug text-slate-700">
        <li className="flex gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />{t("AIの文字が動かなくなった", "The AI's text has stopped moving")}</li>
        <li className="flex gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />{t("送信ボタンが「■（停止）」から元の「↑」に戻った", "The send button is back to “↑” (not “■” stop)")}</li>
        <li className="flex gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
          <span>{rich(t("コードの最後が {tag} で終わっている", "The code ends with {tag}"), {}, { tag: <code className="rounded bg-slate-100 px-1 text-[11px]">&lt;/html&gt;</code> })}</span>
        </li>
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-slate-500">
        {t("書いている途中にコピーを押すと、コピーできていません。そのまま貼ると、前にコピーしたもの（プロンプトなど）が貼られます。", "If you press copy while it's still writing, nothing is copied, and you'll paste whatever you copied before (like the prompt).")}
      </p>
    </div>
  );
}
