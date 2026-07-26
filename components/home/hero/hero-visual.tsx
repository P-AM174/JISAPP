"use client";

import { Terminal, Sun, MessageSquare, Smartphone, Code2 } from "lucide-react";
import type { HeroVisual } from "@/lib/hero/types";

export function HeroVisual({ type }: { type: HeroVisual | null }) {
  if (!type || type === "none") {
    return (
      <div className="relative flex h-full min-h-[220px] items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute h-24 w-24 rounded-3xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20" />
      </div>
    );
  }

  if (type === "studio") {
    return (
      <div className="relative mx-auto w-full max-w-sm">
        <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/25 shadow-2xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/90" />
            </div>
            <span className="text-[10px] font-bold text-white/70">開発スタジオ</span>
          </div>
          <div className="space-y-2 rounded-2xl bg-black/20 p-3 font-mono text-[10px] leading-relaxed text-emerald-100">
            <p className="text-white/50">&lt;!-- AIが生成したHTML --&gt;</p>
            <p>&lt;button&gt;記録する&lt;/button&gt;</p>
            <p className="text-cyan-200">await Zisup.saveData(...)</p>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/90 py-2 text-xs font-black text-emerald-700">
            <Terminal className="h-3.5 w-3.5" />
            貼るだけで動く
          </div>
        </div>
        <div className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-lg">
          <Code2 className="h-6 w-6" />
        </div>
      </div>
    );
  }

  if (type === "summer") {
    return (
      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center">
        <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-md ring-1 ring-white/25">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300/90 text-amber-900 shadow-lg">
              <Sun className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-black text-white">自由研究ノート</p>
              <p className="text-xs text-white/75">テーマ：生活を便利にするアプリ</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["① アイデア", "② AIでコード", "③ 公開して提出"].map((step, i) => (
              <div key={step} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "requests") {
    return (
      <div className="relative mx-auto w-full max-w-sm space-y-3">
        {[
          { who: "ユーザーA", text: "家計簿アプリ欲しい！" },
          { who: "ユーザーB", text: "作ってみました 🎉" },
        ].map((msg, i) => (
          <div
            key={msg.who}
            className={`rounded-2xl px-4 py-3 backdrop-blur-md ring-1 ring-white/20 ${
              i === 0 ? "ml-0 mr-8 bg-white/15" : "ml-8 mr-0 bg-emerald-400/25"
            }`}
          >
            <p className="text-[10px] font-bold text-white/60">{msg.who}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{msg.text}</p>
          </div>
        ))}
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[200px]">
      <div className="rounded-[2rem] bg-gray-900 p-2 shadow-2xl ring-4 ring-white/20">
        <div className="overflow-hidden rounded-[1.6rem] bg-gradient-to-b from-emerald-500 to-teal-600 p-4">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-black/20" />
          <div className="space-y-2">
            <div className="h-8 rounded-lg bg-white/25" />
            <div className="h-8 rounded-lg bg-white/20" />
            <div className="h-8 rounded-lg bg-white/15" />
          </div>
          <div className="mt-4 flex justify-center">
            <Smartphone className="h-6 w-6 text-white/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
