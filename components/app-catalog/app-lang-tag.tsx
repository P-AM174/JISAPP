"use client";

import { useLocale } from "@/lib/i18n/client";
import { LOCALE_LABELS } from "@/lib/i18n/config";
import { detectTextLang } from "@/lib/i18n/text";
import { cn } from "@/lib/utils";

/**
 * アプリの言語タグ（JA / EN / VI）。英語・ベトナム語ページでだけ出す。
 * 日本語版の見た目は変えない
 */
export function AppLangTag({ title, description, className }: { title: string; description?: string | null; className?: string }) {
  const locale = useLocale();
  if (locale === "ja") return null;
  const lang = detectTextLang(title, description);
  return (
    <span
      title={LOCALE_LABELS[lang]}
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
        lang === locale ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500",
        className
      )}
    >
      {lang}
    </span>
  );
}
