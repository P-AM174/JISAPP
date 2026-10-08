"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, LibraryBig, Wand2, X } from "lucide-react";
import { ChatReplyMock, ChatSendMock, StudioMock, Target } from "@/components/playground/remix-guide-modal";
import { cn } from "@/lib/utils";

/** アプリの詳細画面（カードを押したときの画面）の下のボタン。「このアプリをもとに作る」を光らせる */
function DetailMock() {
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
        <span className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500" />
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black text-slate-800">気になったアプリ</p>
          <p className="truncate text-[10px] text-slate-400">ジサップ公式</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-[11px] font-black text-white">
        <ExternalLink className="h-3 w-3" />アプリを開く
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-lg bg-teal-50 py-2 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200">
        <LibraryBig className="h-3 w-3" />マイライブラリに追加
      </div>
      <Target className="w-full">
        <span className="flex w-full flex-col items-center rounded-lg bg-violet-50 py-1.5 text-violet-700 ring-1 ring-violet-200">
          <span className="flex items-center gap-1.5 text-[11px] font-bold"><Wand2 className="h-3 w-3" />このアプリをもとに作る</span>
          <span className="text-[9px] text-violet-500">自分用に作り変えられます。元のアプリは変わりません</span>
        </span>
      </Target>
    </div>
  );
}

const strong = (c: ReactNode) => <strong className="font-black text-slate-900">{c}</strong>;

/**
 * 特集ページ「ショート動画で紹介したアプリ」の、アプリを自分仕様にする方法（スライド式）
 * アプリを開く →「このアプリをもとに作る」→ 全部コピー → AIに変えたいところと送る → AIのコードをコピー → 貼り直す
 */
export function HowToRemixModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps: { title: string; body: ReactNode; figure: ReactNode }[] = [
    {
      title: "気になるアプリの「このアプリをもとに作る」を押す",
      body: <>アプリのカードを押すと詳細が開きます。{strong("「このアプリをもとに作る」")}を押すと、そのアプリのコードが入った開発スタジオが開きます。ログインしなくても使えます。</>,
      figure: <DetailMock />,
    },
    {
      title: "コードを全部コピーする",
      body: <>開発スタジオのコードの右上にある{strong("「全部コピー」")}を押します。</>,
      figure: <StudioMock highlight="copy" />,
    },
    {
      title: "AIに、変えたいところと一緒に送る",
      body: <>ChatGPT などのAIに{strong("コピーしたコードを貼り")}、その下に{strong("変えたいところ")}を書いて送ります。「名前を自分の店にしたい」「色を変えたい」など、ふだんの言葉で大丈夫です。</>,
      figure: <ChatSendMock />,
    },
    {
      title: "AIの返事のコードをコピーする",
      body: (
        <>
          AIがコードを<strong className="font-black text-rose-600 underline decoration-rose-300 decoration-2 underline-offset-2">最後まで書き終わるのを待って</strong>から、{strong("コードの枠の右上の「コピー」")}を押します。
          <span className="mt-1 block text-xs text-slate-500">自分が送った文章の下のコピーボタンではありません。</span>
        </>
      ),
      figure: <ChatReplyMock />,
    },
    {
      title: "ジサップに戻って「貼り直す」",
      body: <>{strong("「貼り直す」")}を押すと、変えたアプリがすぐに動きます。公開すれば、{strong("あなたのアプリ")}として使えます。元のアプリは変わりません。</>,
      figure: <StudioMock highlight="paste" />,
    },
  ];
  const last = step === steps.length - 1;
  const cur = steps[step];

  return (
    <div className="fixed inset-0 z-[470] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="アプリを自分仕様にする方法" className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative shrink-0 bg-gradient-to-br from-rose-500 to-orange-500 px-5 pb-4 pt-5 text-white">
          <button type="button" onClick={onClose} aria-label="閉じる" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30">
            <X className="h-4 w-4" />
          </button>
          <p className="flex items-center gap-1.5 text-xs font-bold text-white/85"><Wand2 className="h-3.5 w-3.5" />アプリを自分仕様にする方法</p>
          <p className="mt-1 pr-8 text-sm font-semibold leading-snug">動画で見たアプリを、自分の使い方に合わせて作り変えられます。<span className="font-black">プログラミングの知識はいりません。</span></p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:min-h-[23rem]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-sm font-black text-white">{step + 1}</span>
            <h2 className="text-base font-black leading-snug text-slate-900">{cur.title}</h2>
          </div>
          <div className="pb-3">{cur.figure}</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{cur.body}</p>
        </div>
        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex justify-center gap-1.5" aria-hidden>
            {steps.map((_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-rose-500" : "w-1.5 bg-slate-200")} />)}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="flex items-center justify-center gap-1 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />戻る
              </button>
            )}
            <button type="button" onClick={() => (last ? onClose() : setStep((s) => s + 1))} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-orange-600">
              {last ? <><CheckCircle2 className="h-4 w-4" />アプリを選ぶ</> : <>次へ<ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
