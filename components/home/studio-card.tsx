"use client";

import Link from "@/lib/i18n/navigation";
import { ArrowRight, FolderOpen, Terminal } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/**
 * 「アプリ開発スタジオへ」のカード（トップページとコラムで同じものを使う）
 */
export function StudioCard() {
  const t = useT();
  return (
    <div className="relative flex w-full flex-col items-stretch gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-emerald-600 to-teal-600 px-5 py-5 text-white shadow-xl shadow-emerald-300/40 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Terminal className="h-7 w-7" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">{t("無料 · 登録不要で試せる", "Free · No sign-up needed to try")}</p>
          <p className="text-xl font-black sm:text-2xl">{t("アプリ開発スタジオへ", "Open the Studio")}</p>
          <p className="mt-0.5 text-sm text-white/85">{t("AIのコードを貼るだけで、すぐにアプリが完成", "Paste code from AI and your app is ready")}</p>
        </div>
      </div>
      <div className="relative flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">
        <Link
          href="/playground"
          className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-black text-emerald-700 shadow-lg transition-colors hover:bg-emerald-50 active:scale-[0.98]"
        >
          {t("今すぐ作る", "Start making")}
          <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2} />
        </Link>
        <Link
          href="/projects"
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-[0.98]"
        >
          <FolderOpen className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="flex flex-col items-start leading-tight">
            <span>{t("自分が作ったアプリを見る", "Apps you made")}</span>
            <span className="text-[10px] font-semibold text-white/70">{t("マイプロジェクト", "My projects")}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
