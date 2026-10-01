"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, switchLocalePath, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** 言語の切り替え（日本語 / English / Tiếng Việt）。選んだ言語は cookie に覚える */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const { pathname, search, hash } = window.location;
    window.location.assign(`${switchLocalePath(pathname, next)}${search}${hash}`);
  };

  return (
    <div ref={ref} className={cn("relative inline-flex shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("言語を切り替える", "Change language")}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        <span lang={locale}>{LOCALE_LABELS[locale]}</span>
        <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("言語", "Language")}
          className="absolute right-0 top-full z-[60] mt-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {LOCALES.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <button
                type="button"
                lang={l}
                onClick={() => choose(l)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50",
                  l === locale ? "font-bold text-emerald-700" : "text-gray-700"
                )}
              >
                {LOCALE_LABELS[l]}
                {l === locale && <Check className="h-3.5 w-3.5" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
