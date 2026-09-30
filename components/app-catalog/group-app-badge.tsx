"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

// グループ共有アプリの色は水色（sky）にそろえる（カード・モーダル・運営画面で同じ色）

/** アプリカードのサムネ右上に付ける「グループ」バッジ */
export function GroupAppBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "pointer-events-none absolute right-2 top-8 z-30 inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/70",
        className
      )}
    >
      <Users className="h-3 w-3" strokeWidth={2.5} />
      {t("グループ", "Group")}
    </span>
  );
}

/** アプリの詳細モーダルに出す「グループ共有アプリ」の帯と、説明・使い方 */
export function GroupAppNotice() {
  const t = useT();
  const [open, setOpen] = useState(false);

  const steps = [
    t("アプリを開いて「グループを作る」を押します（作る人はログインが必要です）", "Open the app and tap “Create a group” (the creator needs to log in)"),
    t("表示された招待リンクを、メンバーに送ります", "Send the invite link to your members"),
    t("メンバーはリンクを開いて表示名を入れるだけで参加できます（ログインは不要）", "Members open the link and enter a display name to join (no login needed)"),
    t("みんなで同じデータを見たり書き込んだりできます", "Everyone sees and edits the same data"),
  ];

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
          <Users className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-sky-900">{t("グループ共有アプリ", "Group sharing app")}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-sky-800">
            {t("グループのメンバーと同じデータを使えます", "Use the same data with your group members")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-200 transition-colors hover:bg-sky-100"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        {t("グループ共有アプリとは", "What is a group sharing app?")}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-3.5 text-xs leading-relaxed text-gray-700 ring-1 ring-sky-100">
          <div>
            <p className="mb-1 font-black text-sky-900">{t("どんなアプリ？", "What is it?")}</p>
            <p>
              {t(
                "招待したメンバーだけで、同じデータを見たり書き込んだりできるアプリです。サークルの出欠表や、チームのスコア記録などに使えます。",
                "An app where only the members you invite can see and edit the same data — great for club attendance sheets, team score logs, and more."
              )}
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-black text-sky-900">{t("使い方", "How to use it")}</p>
            <ol className="space-y-1.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-black text-sky-700">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
            {t(
              "招待リンクを知っている人は誰でも参加できます。知らない人に広まったときは、グループ管理からリンクを作り直してください。",
              "Anyone with the invite link can join. If it spreads to people you don't know, remake the link from group settings."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
