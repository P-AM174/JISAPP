"use client";

import { Plus } from "lucide-react";
import Link from "@/lib/i18n/navigation";
import { useT } from "@/lib/i18n/client";

/** 記事を読んでいる間、右下に浮かぶ「アプリを作る」 */
export function MakeAppFab() {
  const t = useT();
  return (
    <Link href="/playground" className="fixed bottom-5 right-4 z-40 flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 active:scale-95">
      <Plus className="h-4 w-4" strokeWidth={2.6} />{t("アプリを作る", "Make an app")}
    </Link>
  );
}
