"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n/client";
import { LOCALE_COOKIE, switchLocalePath, type Locale } from "@/lib/i18n/config";

/** 「English / 日本語」の切り替えボタン。選んだ言語は cookie に覚える */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const next: Locale = locale === "en" ? "ja" : "en";

  const handleClick = () => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const { pathname, search, hash } = window.location;
    window.location.assign(`${switchLocalePath(pathname, next)}${search}${hash}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      lang={next}
      aria-label={next === "en" ? "Switch to English" : "日本語に切り替える"}
      className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 ${className}`}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden />
      {next === "en" ? "English" : "日本語"}
    </button>
  );
}
