"use client";

import Link from "@/lib/i18n/navigation";
import { ArrowRight, FolderOpen, Terminal } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * 「アプリ開発スタジオへ」のカード（トップページとコラムで同じものを使う）。
 * tone="column" はコラムのページ用：白地に合う淡い緑で、いちばん上のボタンはトップページへ
 */
export function StudioCard({ tone = "home" }: { tone?: "home" | "column" }) {
  const t = useT();
  const col = tone === "column";
  return (
    <div className={cn(
      "relative flex w-full flex-col items-stretch gap-4 overflow-hidden rounded-3xl px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6",
      col
        ? "bg-gradient-to-br from-[#effaf6] to-[#e3f3ef] text-[#1f2a29] ring-1 ring-emerald-100"
        : "bg-gradient-to-r from-violet-600 via-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-300/40"
    )}>
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl", col ? "bg-emerald-200/50" : "bg-white/10")} />
      <div className="relative flex items-center gap-4">
        <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", col ? "bg-emerald-600 text-white shadow-sm" : "bg-white/20 backdrop-blur-sm")}>
          <Terminal className="h-7 w-7" />
        </span>
        <div>
          <p className={cn("text-[11px] font-bold uppercase tracking-wider", col ? "text-emerald-700" : "text-white/75")}>{t("無料 · 登録不要で試せる", "Free · No sign-up needed to try")}</p>
          <p className={cn("text-xl sm:text-2xl", col ? "font-bold" : "font-black")}>{t("アプリ開発スタジオへ", "Open the Studio")}</p>
          <p className={cn("mt-0.5 text-sm", col ? "text-gray-600" : "text-white/85")}>{t("AIのコードを貼るだけで、すぐにアプリが完成", "Paste code from AI and your app is ready")}</p>
        </div>
      </div>
      <div className="relative flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">
        <Link
          href={col ? "/" : "/playground"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base transition-colors active:scale-[0.98]",
            col ? "bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700" : "bg-white font-black text-emerald-700 shadow-lg hover:bg-emerald-50"
          )}
        >
          {col ? t("トップページへ", "Go to the top page") : t("今すぐ作る", "Start making")}
          <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2} />
        </Link>
        <Link
          href="/projects"
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-colors active:scale-[0.98]",
            col ? "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50" : "border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          )}
        >
          <FolderOpen className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="flex flex-col items-start leading-tight">
            <span>{t("自分が作ったアプリを見る", "Apps you made")}</span>
            <span className={cn("text-[10px] font-semibold", col ? "text-emerald-700/70" : "text-white/70")}>{t("マイプロジェクト", "My projects")}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
